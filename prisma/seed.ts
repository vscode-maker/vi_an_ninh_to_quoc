import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

function parseDate(dateStr: any): Date | undefined | null {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') return null;
    try {
        // Expected formats: "DD/MM/YYYY HH:mm" or "DD/MM/YYYY"
        const trimmed = dateStr.trim();
        const [datePart, timePart] = trimmed.split(' ');

        if (!datePart) return null;

        const parts = datePart.split('/');
        if (parts.length !== 3) return null;

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        let hours = 0;
        let minutes = 0;

        if (timePart) {
            const timeParts = timePart.split(':');
            if (timeParts.length >= 2) {
                hours = parseInt(timeParts[0], 10);
                minutes = parseInt(timeParts[1], 10);
            }
        }

        // Construct Date object
        const date = new Date(year, month - 1, day, hours, minutes);
        if (isNaN(date.getTime())) return null;

        return date;
    } catch (e) {
        return null;
    }
}

async function main() {
    // --- Import Users ---
    const userCsvPath = path.join(__dirname, '../data_import/users.csv');
    if (fs.existsSync(userCsvPath)) {
        console.log('--- Seeding Users ---');
        const userContent = fs.readFileSync(userCsvPath, { encoding: 'utf-8' });
        const userRecords: any[] = parse(userContent, { columns: true, skip_empty_lines: true, trim: true });

        let userCount = 0;
        for (const row of userRecords) {
            const existing = await prisma.user.findUnique({ where: { soHieu: row.so_hieu } });
            if (!existing) {
                await prisma.user.create({
                    data: {
                        id: row.id,
                        soHieu: row.so_hieu,
                        fullName: row.ho_va_ten,
                        gender: row.gioi_tinh || null,
                        phoneNumber: row.so_dien_thoai || null,
                        unit: row.don_vi || null,
                        team: row.doi || null,
                        group: row.to || null,
                        position: row.chuc_vu || null,
                        title: row.chuc_danh || null,
                        email: row.email || null,
                        zaloId: row.user_id_zalo || null,
                        password: row.password || '123456',
                        avatar: row.avatar || null,
                        groupIds: row.group_id || null,
                        role: row.vai_tro || 'user',
                    },
                });
                userCount++;
            }
        }
        console.log(`Users seeded: ${userCount} new records (Total in CSV: ${userRecords.length})`);
    } else {
        console.log('users.csv not found, skipping users.');
    }

    // --- Import Tasks ---
    const taskCsvPath = path.join(__dirname, '../data_import/cong_viec.csv');
    if (fs.existsSync(taskCsvPath)) {
        console.log('--- Seeding Tasks ---');
        const taskContent = fs.readFileSync(taskCsvPath, { encoding: 'utf-8' });
        const taskRecords: any[] = parse(taskContent, { columns: true, skip_empty_lines: true, trim: true });

        let taskCount = 0;
        for (const row of taskRecords) {
            // Use 'id_unique' as primary key 'id'
            const taskId = row.id_unique;
            if (!taskId) continue;

            const existing = await prisma.task.findUnique({ where: { id: taskId } });

            // Parse "ghi_chu" JSON
            let notesJson = undefined;
            try {
                if (row.ghi_chu && row.ghi_chu.trim() !== '') {
                    // Ensure it's valid JSON array/object structure
                    // CSV parse might already escape quotes, but row.ghi_chu is likely a string
                    notesJson = JSON.parse(row.ghi_chu);
                }
            } catch (e) {
                // If parse fails, treat as simple string or fallback
                // console.warn(`Note parse warning for task ${taskId}:`, e);
                // Optionally wrap string in an object or just leave undefined/string if appropriate type
                notesJson = row.ghi_chu;
            }

            const taskData = {
                id: taskId,
                requestDate: parseDate(row.ngay_gio_ghi_chu),
                requesterName: row.ten_nguoi_ghi_chu || null,
                groupName: row.nhom || null,
                targetName: row.ho_ten_doi_tuong || null,
                accountName: row.ten_tai_khoan || null,
                accountNumber: row.so_tai_khoan || null,
                bankName: row.ngan_hang || null,
                phoneNumber: row.so_dien_thoai || null,
                carrier: row.nha_mang || null,
                documentInfo: row.thong_tin_van_ban || null,
                executionUnit: row.don_vi_thuc_hien || null,
                content: row.noi_dung || null,
                deadline: parseDate(row.thoi_han),
                progressWarning: row.canh_bao_tien_do || null,
                requestType: row.yeu_cau || null,
                status: row.trang_thai || null,
                notes: notesJson !== undefined ? notesJson : undefined,
                groupId: row.group_id || null,
            };

            if (!existing) {
                await prisma.task.create({ data: taskData });
                taskCount++;
            } else {
                // Optional: Update if exists?
            }
        }
        console.log(`Tasks seeded: ${taskCount} new records (Total in CSV: ${taskRecords.length})`);
    } else {
        console.log('cong_viec.csv not found, skipping tasks.');
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
