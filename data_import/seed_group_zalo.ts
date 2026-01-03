import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const csvFilePath = path.join(__dirname, 'group_zalo.csv');

    if (!fs.existsSync(csvFilePath)) {
        console.error(`File not found: ${csvFilePath}`);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    console.log(`Found ${records.length} records in group_zalo.csv`);

    let count = 0;
    for (const record of records) {
        // Map CSV fields to Prisma model
        // CSV: group_id, name, avatar, group_link, group_description, total_member, status
        // Prisma: groupId, name, avatar, groupLink, groupDescription, totalMember, status

        const { group_id, name, avatar, group_link, group_description, total_member, status } = record;

        if (!group_id) {
            console.warn('Skipping record without group_id:', record);
            continue;
        }

        await prisma.groupZalo.upsert({
            where: { groupId: group_id },
            update: {
                name: name,
                avatar: avatar || null,
                groupLink: group_link || null,
                groupDescription: group_description || null,
                totalMember: total_member ? parseInt(total_member, 10) : null,
                status: status || null,
            },
            create: {
                groupId: group_id,
                name: name,
                avatar: avatar || null,
                groupLink: group_link || null,
                groupDescription: group_description || null,
                totalMember: total_member ? parseInt(total_member, 10) : null,
                status: status || null,
            }
        });

        count++;
        if (count % 10 === 0) {
            console.log(`Imported ${count} groups...`);
        }
    }

    console.log(`Seeding finished. Successfully imported ${count} Zalo groups.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
