
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS = [
    // --- Data Don An ---
    { code: 'VIEW_DATA_DON_AN', name: 'Xem Đơn Án', group: 'Đơn Án' },
    { code: 'ADD_DATA_DON_AN', name: 'Thêm Đơn Án', group: 'Đơn Án' },
    { code: 'EDIT_DATA_DON_AN', name: 'Sửa Đơn Án', group: 'Đơn Án' },
    { code: 'DELETE_DATA_DON_AN', name: 'Xóa Đơn Án', group: 'Đơn Án' },

    // --- Bo Luat ---
    { code: 'VIEW_BO_LUAT', name: 'Xem Bộ Luật', group: 'Bộ Luật' },
    { code: 'ADD_BO_LUAT', name: 'Thêm Bộ Luật', group: 'Bộ Luật' },
    { code: 'EDIT_BO_LUAT', name: 'Sửa Bộ Luật', group: 'Bộ Luật' },
    { code: 'DELETE_BO_LUAT', name: 'Xóa Bộ Luật', group: 'Bộ Luật' },

    // --- Danh Muc (Shared for sub-modules) ---
    // If strict per-module is needed, we would explode this list. 
    // For now, shared 'Dictionary' permissions.
    { code: 'VIEW_DANH_MUC', name: 'Xem Danh Mục', group: 'Danh Mục' },
    { code: 'ADD_DANH_MUC', name: 'Thêm Danh Mục', group: 'Danh Mục' },
    { code: 'EDIT_DANH_MUC', name: 'Sửa Danh Mục', group: 'Danh Mục' },
    { code: 'DELETE_DANH_MUC', name: 'Xóa Danh Mục', group: 'Danh Mục' },
];

export default async function SeedGranularPage() {
    let message = '';
    try {
        // @ts-ignore
        const delegate = prisma.permissions || prisma.permission; // Handle model name ambiguity
        if (!delegate) throw new Error('Model not found');

        for (const p of PERMISSIONS) {
            await delegate.upsert({
                where: { code: p.code },
                update: p,
                create: p,
            });
        }

        // Remove old MANAGE permissions if they exist to avoid confusion? 
        // Or keep them as legacy. Let's keep for now.

        message = 'Granular Permissions Seeded!';
    } catch (e: any) {
        message = 'Error: ' + e.message;
        console.error(e);
    }

    return (
        <div style={{ padding: 50 }}>
            <h1>Seeding Granular Permissions</h1>
            <pre>{message}</pre>
        </div>
    );
}
