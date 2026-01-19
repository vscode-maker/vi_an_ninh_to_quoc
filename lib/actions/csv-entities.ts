
'use server';

import prisma from '@/lib/prisma';

// Generic fetch by DataDonAn ID for simple relations
export async function getRelatedEntityByDataDonAnId(modelName: string, dataDonAnId: string) {
    if (!(prisma as any)[modelName]) {
        throw new Error(`Model ${modelName} not found`);
    }


    const validModels = [
        'bienPhapNganChan', 'hanhViToiDanh', 'nguoiThamGiaToTung',
        'quaTrinhDieuTra', 'thongTinCongVan', 'thongTinPhanCong',
        'thongTinPhuongTien', 'thongTinTaiKhoan',
        'thongTinThietHai', 'thongTinTienAnTienSu', 'thongTinTruyNa', 'thongTinVatChung'
    ];

    if (!validModels.includes(modelName)) {
        throw new Error(`Invalid model for relation fetch: ${modelName}`);
    }

    try {
        return await (prisma as any)[modelName].findMany({
            where: { dataDonAnId }
        });
    } catch (e) {
        console.error(`Error fetching ${modelName}:`, e);
        return [];
    }

}

// Bo Luat (Standalone reference)
export async function getBoLuatList(search: string = '', page = 1) {
    const pageSize = 20;
    const where: any = {};
    if (search) {
        where.OR = [
            { toiDanh: { contains: search, mode: 'insensitive' } },
            { noiDung: { contains: search, mode: 'insensitive' } },
            { idBoLuat: { contains: search, mode: 'insensitive' } }
        ];
    }
    const [data, total] = await Promise.all([
        prisma.boLuat.findMany({
            where,
            take: pageSize,
            skip: (page - 1) * pageSize,
            orderBy: { idBoLuat: 'asc' }
        }),
        prisma.boLuat.count({ where })
    ]);
    return { data, total };
}

// Map slugs to Prisma Models
const SLUG_TO_MODEL: { [key: string]: string } = {
    'nguoi-tham-gia': 'nguoiThamGiaToTung',
    'phuong-tien': 'thongTinPhuongTien',
    'tai-khoan': 'thongTinTaiKhoan',
    'vat-chung': 'thongTinVatChung',
    'truy-na': 'thongTinTruyNa',
    'tien-an': 'thongTinTienAnTienSu',
    'thiet-hai': 'thongTinThietHai',
    'bien-phap': 'bienPhapNganChan',
    'cong-van': 'thongTinCongVan',
    'phan-cong': 'thongTinPhanCong',
    'qua-trinh': 'quaTrinhDieuTra',

    'hanh-vi': 'hanhViToiDanh',
    'thong-tin-chat': 'thongTinChat'
};

import { checkPermission } from '@/lib/actions-utils';

export async function getGenericList(slug: string, page: number = 1, search: string = '') {
    const permCode = `VIEW_${slug.replace(/-/g, '_').toUpperCase()}`;
    if (!(await checkPermission(permCode))) {
        throw new Error(`Unauthorized: Requires ${permCode}`);
    }
    const modelName = SLUG_TO_MODEL[slug];
    if (!modelName || !(prisma as any)[modelName]) {
        throw new Error(`Invalid module: ${slug}`);
    }

    const pageSize = 10;
    const skip = (page - 1) * pageSize;
    const where: any = {};


    if (search) {
        if (slug === 'thong-tin-chat') {
            where.OR = [
                { nguoiGui: { contains: search, mode: 'insensitive' } },
                { nguoiNhan: { contains: search, mode: 'insensitive' } },
                { noiDung: { contains: search, mode: 'insensitive' } },
                { nhom: { contains: search, mode: 'insensitive' } }
            ];
        }
        // Future: Add default search for other modules (e.g. by name/code)
    }

    // Dynamic model access
    const delegate = (prisma as any)[modelName];

    // Try to find a valid 'orderBy'. Most have 'id' or mapped @id.
    // If exact ID field unknown, let's try default (no order) or rely on DB natural order.
    // Or reflect schema?

    try {
        const [data, total] = await Promise.all([
            delegate.findMany({
                where,
                take: pageSize,
                skip,
            }),
            delegate.count({ where })
        ]);

        return {
            data,
            total,
            page,
            pageSize,
            modelName
        };
    } catch (e) {
        console.error("Generic fetch error:", e);
        return { data: [], total: 0, page, pageSize, modelName };
    }
}
