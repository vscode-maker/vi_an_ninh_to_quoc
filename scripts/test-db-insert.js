
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mock the Upload Logic since we can't easily import 'lib/task-actions' which has 'use server' directives and Next.js dependencies in a standalone Node script without compilation.
// Instead, I will replicate the database insertion logic to verify if DB constraints are blocking it.
// The user says "dữ liệu chưa được ghi vào bảng file_attach".

async function main() {
    console.log('Testing FileAttach creation...');

    // 1. Get a valid task
    const task = await prisma.task.findFirst();
    if (!task) {
        console.error('No tasks found to attach file to.');
        return;
    }
    console.log(`Using Task ID: ${task.id}`);

    // 2. Simulate Data
    const mockFileId = `test_file_${Date.now()}`;
    const mockUrl = `https://drive.google.com/file/d/${mockFileId}/view`;

    // 3. Attempt Insert
    try {
        const result = await prisma.fileAttach.create({
            data: {
                fileId: mockFileId,
                taskId: task.id,
                fileName: 'bo_luat.csv', // The file user mentioned
                fileLink: mockUrl,
                fileType: 'text/csv',
                updatedAt: new Date(),
                note: 'Test upload from script'
            }
        });
        console.log('Successfully created FileAttach record:', result);
    } catch (e) {
        console.error('Failed to create FileAttach record:', e);
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
