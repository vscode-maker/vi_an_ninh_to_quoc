
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') return null;
    try {
        // Expected format: DD/MM/YYYY HH:mm:ss
        const [datePart, timePart] = dateStr.trim().split(' ');
        if (!datePart) return null;

        const [day, month, year] = datePart.split('/').map(Number);

        let hours = 0, minutes = 0, seconds = 0;
        if (timePart) {
            [hours, minutes, seconds] = timePart.split(':').map(Number);
        }

        const date = new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0);
        return isNaN(date.getTime()) ? null : date;
    } catch (e) {
        return null;
    }
}

async function main() {
    const csvFilePath = path.join(__dirname, '../data_import/file_attach.csv');

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

    console.log(`Found ${records.length} records in file_attach.csv`);

    // Fetch all existing Task IDs to validate FK
    const existingTasks = await prisma.task.findMany({ select: { id: true } });
    const validTaskIds = new Set(existingTasks.map(t => t.id));
    console.log(`Found ${validTaskIds.size} valid tasks in DB.`);

    let count = 0;
    for (const record of records) {
        const {
            id_unique,
            name_file,
            id_file,
            ghi_chu,
            id,
            ngay_update,
            link_file,
            loai_file,
            thong_tin_them
        } = record;

        if (!id_file) {
            console.warn('Skipping record without id_file:', record);
            continue;
        }

        // Validate Task ID
        let validTaskId = null;
        if (id_unique && validTaskIds.has(id_unique)) {
            validTaskId = id_unique;
        }

        const data = {
            fileId: id_file,
            taskId: validTaskId,
            fileName: name_file || null,
            note: ghi_chu || null,
            groupId: id || null,
            updatedAt: parseDate(ngay_update),
            fileLink: link_file || null,
            fileType: loai_file || null,
            moreInfo: thong_tin_them ? thong_tin_them : null
        };

        // Try to parse moreInfo if it looks like JSON
        if (data.moreInfo && (data.moreInfo.startsWith('{') || data.moreInfo.startsWith('['))) {
            try {
                data.moreInfo = JSON.parse(data.moreInfo);
            } catch (e) {
                // leave as string
            }
        }


        await prisma.fileAttach.upsert({
            where: { fileId: id_file },
            update: data,
            create: data
        });

        count++;
        if (count % 50 === 0) {
            console.log(`Imported ${count} files...`);
        }
    }

    console.log(`Seeding finished. Successfully imported ${count} files.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
