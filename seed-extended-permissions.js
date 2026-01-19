
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const permissions = [
    // Module: Công dân
    { code: 'VIEW_CITIZEN', name: 'Xem công dân', group: 'Công dân' },
    { code: 'CREATE_CITIZEN', name: 'Thêm công dân', group: 'Công dân' },
    { code: 'EDIT_CITIZEN', name: 'Sửa công dân', group: 'Công dân' },
    { code: 'DELETE_CITIZEN', name: 'Xóa công dân', group: 'Công dân' },

    // Module: Công việc
    { code: 'VIEW_TASK', name: 'Xem công việc', group: 'Công việc' },
    { code: 'CREATE_TASK', name: 'Thêm công việc', group: 'Công việc' },
    { code: 'EDIT_TASK', name: 'Sửa công việc', group: 'Công việc' },
    { code: 'DELETE_TASK', name: 'Xóa công việc', group: 'Công việc' },

    // Module: Nhân viên (Users) - Replaces 'Hệ thống' group for user management
    { code: 'VIEW_EMPLOYEE', name: 'Xem nhân viên', group: 'Nhân viên' },
    { code: 'CREATE_EMPLOYEE', name: 'Thêm nhân viên', group: 'Nhân viên' },
    { code: 'EDIT_EMPLOYEE', name: 'Sửa nhân viên', group: 'Nhân viên' },
    { code: 'DELETE_EMPLOYEE', name: 'Xóa nhân viên', group: 'Nhân viên' },

    // Module: Nhóm Zalo
    { code: 'VIEW_ZALO', name: 'Xem nhóm Zalo', group: 'Nhóm Zalo' },
    { code: 'CREATE_ZALO', name: 'Thêm nhóm Zalo', group: 'Nhóm Zalo' },
    { code: 'EDIT_ZALO', name: 'Sửa nhóm Zalo', group: 'Nhóm Zalo' },
    { code: 'DELETE_ZALO', name: 'Xóa nhóm Zalo', group: 'Nhóm Zalo' },

    // Module: Tài liệu
    { code: 'VIEW_FILE', name: 'Xem tài liệu', group: 'Tài liệu' },
    { code: 'CREATE_FILE', name: 'Thêm tài liệu', group: 'Tài liệu' },
    { code: 'EDIT_FILE', name: 'Sửa tài liệu', group: 'Tài liệu' },
    { code: 'DELETE_FILE', name: 'Xóa tài liệu', group: 'Tài liệu' },

    // Module: Cài đặt
    { code: 'VIEW_SETTING', name: 'Xem cài đặt', group: 'Cài đặt' },
    { code: 'CREATE_SETTING', name: 'Thêm cài đặt', group: 'Cài đặt' },
    { code: 'EDIT_SETTING', name: 'Sửa cài đặt', group: 'Cài đặt' },
    { code: 'DELETE_SETTING', name: 'Xóa cài đặt', group: 'Cài đặt' },
];

async function main() {
    console.log('Seeding extended permissions...');

    // Optional: cleanup old confusing permissions if needed, but upsert is safer
    // We might want to rename/delete 'VIEW_USER' if we are switching to 'VIEW_EMPLOYEE' 
    // to avoid clean separation? Or just alias them?
    // Let's delete the old 'Hệ thống' user permissions to verify separation
    await prisma.permission.deleteMany({
        where: { code: { in: ['VIEW_USER', 'CREATE_USER', 'EDIT_USER', 'DELETE_USER'] } }
    });
    console.log('Removed legacy user permissions to replace with VIEW_EMPLOYEE...');

    for (const p of permissions) {
        await prisma.permission.upsert({
            where: { code: p.code },
            update: { name: p.name, group: p.group },
            create: { code: p.code, name: p.name, group: p.group }
        });
    }
    console.log('Permissions seeded.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
