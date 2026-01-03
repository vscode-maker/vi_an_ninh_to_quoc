import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding FileAttach...');
    const csvPath = path.join(__dirname, 'file_attach.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split(/\r?\n/);

    // Skip header
    const dataLines = lines.slice(1).filter(line => line.trim() !== '');

    let successCount = 0;
    let errorCount = 0;

    for (const line of dataLines) {
        try {
            // Regex to split by comma, respecting quotes
            const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            // Better regex for CSV:
            // const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            // Let's use the split regex
            const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => {
                let val = col.trim();
                if (val.startsWith('"') && val.endsWith('"')) {
                    val = val.slice(1, -1).replace(/""/g, '"');
                }
                return val;
            });

            if (cols.length < 9) continue;

            const [id_unique, name_file, id_file, ghi_chu, id, ngay_update, link_file, loai_file, thong_tin_them] = cols;

            if (!id_file) {
                console.log('Skipping row missing id_file:', line.substring(0, 50));
                continue;
            }

            // Parse Date: 26/10/2025 14:00:23
            let updateDate = null;
            if (ngay_update) {
                const parts = ngay_update.split(' ');
                if (parts.length === 2) {
                    const dateParts = parts[0].split('/');
                    const timeParts = parts[1].split(':');
                    // new Date(year, monthIndex, day, hour, minute, second)
                    updateDate = new Date(
                        parseInt(dateParts[2]),
                        parseInt(dateParts[1]) - 1,
                        parseInt(dateParts[0]),
                        parseInt(timeParts[0]),
                        parseInt(timeParts[1]),
                        parseInt(timeParts[2])
                    );
                }
            }

            // Parse thong_tin_them (JSON)
            let moreInfoJson = null;
            if (thong_tin_them) {
                try {
                    moreInfoJson = JSON.parse(thong_tin_them);
                } catch (e) {
                    console.warn(`Invalid JSON in thong_tin_them for ${id_file}`);
                }
            }

            // Check if Task exists (optional)
            const taskExists = id_unique ? await prisma.task.findUnique({ where: { id: id_unique } }) : null;

            await prisma.fileAttach.upsert({
                where: { fileId: id_file },
                update: {
                    taskId: taskExists ? id_unique : null,
                    fileName: name_file,
                    note: ghi_chu,
                    groupId: id,
                    updatedAt: updateDate,
                    fileLink: link_file,
                    fileType: loai_file,
                    moreInfo: moreInfoJson || undefined,
                },
                create: {
                    fileId: id_file,
                    taskId: taskExists ? id_unique : null,
                    fileName: name_file,
                    note: ghi_chu,
                    groupId: id,
                    updatedAt: updateDate,
                    fileLink: link_file,
                    fileType: loai_file,
                    moreInfo: moreInfoJson || undefined,
                }
            });

            successCount++;
        } catch (error) {
            console.error('Error processing line:', line.substring(0, 50), error);
            errorCount++;
        }
    }

    console.log(`Seeding finished. Success: ${successCount}, Errors: ${errorCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
