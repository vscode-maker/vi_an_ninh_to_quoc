import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const csvFilePath = path.join(__dirname, 'setting.csv');
    // Check if file exists
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

    console.log(`Found ${records.length} records in setting.csv`);

    let count = 0;
    for (const record of records as any[]) {
        const { type, value } = record;

        if (!type) {
            console.warn('Skipping record without type:', record);
            continue;
        }

        // Insert new setting
        await prisma.setting.create({
            data: {
                type: type,
                value: value || '', // Allow empty value? CSV shows value column.
            }
        });

        count++;
        // Log every 10 records to avoid spam
        if (count % 10 === 0) {
            console.log(`Imported ${count} records...`);
        }
    }

    console.log(`Seeding finished. Successfully imported ${count} settings.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
