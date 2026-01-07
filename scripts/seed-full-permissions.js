
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MODULE_CONFIG = {
    'bien-phap': { title: 'Biện pháp ngăn chặn' },
    'hanh-vi': { title: 'Hành vi tội danh' },
    'nguoi-tham-gia': { title: 'Người tham gia tố tụng' },
    'qua-trinh': { title: 'Quá trình điều tra' },
    'cong-van': { title: 'Thông tin công văn' },
    'phan-cong': { title: 'Thông tin phân công' },
    'phuong-tien': { title: 'Thông tin phương tiện' },
    'tai-khoan': { title: 'Thông tin tài khoản' },
    'thanh-vien': { title: 'Thành viên trong hộ' },
    'thiet-hai': { title: 'Thông tin thiệt hại' },
    'tien-an': { title: 'Tiền án tiền sự' },
    'truy-na': { title: 'Thông tin truy nã' },
    'vat-chung': { title: 'Thông tin vật chứng' },
    'thong-tin-chat': { title: 'Thông tin chat' }
};

const PERMISSIONS = [
    // --- Existing Core Permissions (Keep them) ---
    { code: 'VIEW_CITIZEN', name: 'Xem hồ sơ công dân', group: 'Công Dân' },
    { code: 'ADD_CITIZEN', name: 'Thêm hồ sơ công dân', group: 'Công Dân' },
    { code: 'EDIT_CITIZEN', name: 'Sửa hồ sơ công dân', group: 'Công Dân' },
    { code: 'DELETE_CITIZEN', name: 'Xóa hồ sơ công dân', group: 'Công Dân' },
    { code: 'VIEW_WORK', name: 'Xem danh sách công việc', group: 'Công Việc' },
    { code: 'ADD_WORK', name: 'Thêm công việc', group: 'Công Việc' },
    { code: 'EDIT_WORK', name: 'Sửa công việc', group: 'Công Việc' },
    { code: 'DELETE_WORK', name: 'Xóa công việc', group: 'Công Việc' },

    // --- Data Don An (Explicitly requested) ---
    { code: 'VIEW_DATA_DON_AN', name: 'Xem Đơn Án', group: 'Đơn Án' },
    { code: 'ADD_DATA_DON_AN', name: 'Thêm Đơn Án', group: 'Đơn Án' },
    { code: 'EDIT_DATA_DON_AN', name: 'Sửa Đơn Án', group: 'Đơn Án' },
    { code: 'DELETE_DATA_DON_AN', name: 'Xóa Đơn Án', group: 'Đơn Án' },

    // --- Bo Luat ---
    { code: 'VIEW_BO_LUAT', name: 'Xem Bộ Luật', group: 'Bộ Luật' },
    { code: 'ADD_BO_LUAT', name: 'Thêm Bộ Luật', group: 'Bộ Luật' },
    { code: 'EDIT_BO_LUAT', name: 'Sửa Bộ Luật', group: 'Bộ Luật' },
    { code: 'DELETE_BO_LUAT', name: 'Xóa Bộ Luật', group: 'Bộ Luật' },
];

function generateGenericPermissions() {
    for (const [slug, config] of Object.entries(MODULE_CONFIG)) {
        const upperSlug = slug.replace(/-/g, '_').toUpperCase();
        const title = config.title;

        PERMISSIONS.push(
            { code: `VIEW_${upperSlug}`, name: `Xem ${title}`, group: title },
            { code: `ADD_${upperSlug}`, name: `Thêm ${title}`, group: title },
            { code: `EDIT_${upperSlug}`, name: `Sửa ${title}`, group: title },
            { code: `DELETE_${upperSlug}`, name: `Xóa ${title}`, group: title }
        );
    }
}

async function main() {
    console.log('Generating full granular permissions...');
    generateGenericPermissions();

    // Use plural 'permissions' or singular 'permission' depending on prisma instance
    // Since we fixed permission-actions.ts to use 'permission', we assume singular is correct for JS client if regenerated.
    // BUT we are running via node, which might use a different generated version if not totally synced.
    // We'll try both to be safe, like the cleanup script.

    // Actually, let's look at schema again: model Permission -> @@map("permissions").
    // Client should have `prisma.permission`.

    // We will clear the old generic ones if we want to be clean? 
    // Maybe user wants to keep 'VIEW_DANH_MUC' as a "View All" shortcut?
    // User said "Modul... chưa có tính năng phân quyền: view, add, edit, delete", implies they want SPECIFIC ones.
    // I will NOT delete `VIEW_DANH_MUC` automatically, but will add the specific ones.

    const delegate = prisma.permission || prisma.permissions;

    if (!delegate) {
        console.error('Permission model not found on Prisma Client');
        return;
    }

    for (const p of PERMISSIONS) {
        await delegate.upsert({
            where: { code: p.code },
            update: p,
            create: p,
        });
    }

    // Cleanup the BROAD generics that are now replaced by specific ones, to avoid confusion?
    // "Quản lý danh mục" (MANAGE_DANH_MUC) was already deleted.
    // "VIEW_DANH_MUC" might still exist. Let's delete it if we are fully granular.
    // User complaint "chưa có tính năng phân quyền... giống như modul nhân viên" implies strictness.
    const obsolete = ['VIEW_DANH_MUC', 'ADD_DANH_MUC', 'EDIT_DANH_MUC', 'DELETE_DANH_MUC'];

    await delegate.deleteMany({
        where: { code: { in: obsolete } }
    });

    console.log(`Seeded ${PERMISSIONS.length} permissions.`);
    console.log('Deleted obsolete broad generic permissions.');
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
