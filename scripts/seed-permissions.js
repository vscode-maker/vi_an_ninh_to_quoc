
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PERMISSIONS = [
    { code: 'VIEW_CITIZEN', name: 'Xem hồ sơ công dân', group: 'Công Dân' },
    { code: 'MANAGE_CITIZEN', name: 'Quản lý công dân (Thêm/Sửa/Xóa)', group: 'Công Dân' },
    { code: 'VIEW_WORK', name: 'Xem danh sách công việc', group: 'Công Việc' },
    { code: 'MANAGE_WORK', name: 'Quản lý công việc', group: 'Công Việc' },
    { code: 'MANAGE_SYSTEM', name: 'Quản trị hệ thống', group: 'Hệ Thống' },
    // New Modules
    { code: 'VIEW_DATA_DON_AN', name: 'Xem quản lý đơn án', group: 'Đơn Án' },
    { code: 'VIEW_BO_LUAT', name: 'Tra cứu Bộ Luật', group: 'Bộ Luật' },
    { code: 'VIEW_DANH_MUC', name: 'Xem danh mục dữ liệu', group: 'Danh Mục' },
];

async function main() {
    console.log('Seeding permissions...');
    for (const p of PERMISSIONS) {
        await prisma.permissions.upsert({
            where: { code: p.code },
            update: p,
            create: p,
        });
    }
    console.log('Done.');
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
