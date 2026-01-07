
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Settings...');

    const settings = [
        { type: 'SYSTEM_TITLE', value: 'Hệ thống Quản lý PC01' },
        { type: 'MAX_UPLOAD_SIZE', value: '10MB' },
        { type: 'CONTACT_EMAIL', value: 'admin@pc01.com' },
        { type: 'MAINTENANCE_MODE', value: 'FALSE' }
    ];

    for (const s of settings) {
        await prisma.setting.create({
            data: s
        });
    }

    console.log('Seeding completed.');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
