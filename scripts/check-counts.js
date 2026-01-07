
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const models = [
        'dataDonAn', 'bienPhapNganChan', 'boLuat', 'hanhViToiDanh',
        'nguoiThamGiaToTung', 'quaTrinhDieuTra', 'thongTinCongVan',
        'thongTinPhanCong', 'thongTinPhuongTien', 'thongTinTaiKhoan',
        'thongTinThanhVienTrongHo', 'thongTinThietHai', 'thongTinTienAnTienSu',
        'thongTinTruyNa', 'thongTinVatChung'
    ];

    console.log('--- Database Counts ---');
    for (const model of models) {
        try {
            const count = await prisma[model].count();
            console.log(`${model}: ${count}`);
        } catch (e) {
            console.log(`${model}: Error - ${e.message}`);
        }
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
