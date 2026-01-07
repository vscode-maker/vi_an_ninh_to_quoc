
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

const DATA_DIR = path.join(__dirname, '../data_import');

// Global cache for valid DataDonAn IDs to prevent FK errors
let validDataDonAnIds = new Set();

// Map CSV filename to Prisma Model Name
const FILES_TO_MODELS = [
    { file: 'data_don_an .csv', model: 'dataDonAn' },
    { file: 'bien_phap_ngan_chan.csv', model: 'bienPhapNganChan' },
    { file: 'bo_luat.csv', model: 'boLuat' },
    { file: 'hanh_vi_toi_danh.csv', model: 'hanhViToiDanh' },
    { file: 'nguoi_tham_gia_to_tung.csv', model: 'nguoiThamGiaToTung' },
    { file: 'qua_trinh_dieu_tra.csv', model: 'quaTrinhDieuTra' },
    { file: 'thong_tin_cong_van.csv', model: 'thongTinCongVan' },
    { file: 'thong_tin_phan_cong.csv', model: 'thongTinPhanCong' },
    { file: 'thong_tin_phuong_tien.csv', model: 'thongTinPhuongTien' },
    { file: 'thong_tin_tai_khoan.csv', model: 'thongTinTaiKhoan' },
    { file: 'thong_tin_thanh_vien_trong_ho.csv', model: 'thongTinThanhVienTrongHo' },
    { file: 'thong_tin_thiet_hai.csv', model: 'thongTinThietHai' },
    { file: 'thong_tin_tien_an_tien_su.csv', model: 'thongTinTienAnTienSu' },
    { file: 'thong_tin_truy_na.csv', model: 'thongTinTruyNa' },
    { file: 'thong_tin_vat_chung.csv', model: 'thongTinVatChung' },
];

function snakeToCamel(str) {
    return str.replace(/_([a-z0-9])/g, (g) => g[1].toUpperCase());
}

async function main() {
    // 1. First, populate the cache from DB in case partial seeding already happened
    try {
        const existingids = await prisma.dataDonAn.findMany({ select: { id: true } });
        existingids.forEach(r => validDataDonAnIds.add(r.id));
        console.log(`Initialized Cache: Found ${validDataDonAnIds.size} existing DataDonAn IDs in DB.`);
    } catch (e) {
        console.warn("Could not fetch existing IDs (maybe table empty?), proceeding...", e.message);
    }

    for (const { file, model } of FILES_TO_MODELS) {
        const filePath = path.join(DATA_DIR, file);
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${file}`);
            continue;
        }

        console.log(`Processing ${file} -> ${model}...`);
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            // Handle BOM
            const content = fileContent.charCodeAt(0) === 0xFEFF ? fileContent.slice(1) : fileContent;

            const records = parse(content, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });

            if (records.length === 0) {
                console.log(`  No records found in ${file}.`);
                continue;
            }

            const dataToInsert = records.map((record) => {
                const newRecord = {};
                for (const [key, value] of Object.entries(record)) {
                    // Special Mappings based on CSV -> Schema logic

                    // 1. DataDonAn ID
                    // CSV: id_data_don_an -> Schema: id (for DataDonAn model)
                    if (key === 'id_data_don_an' && model === 'dataDonAn') {
                        newRecord['id'] = value;
                        continue;
                    }

                    // 2. Relations: id_data_don_an OR id_don_an -> dataDonAnId
                    if (key === 'id_data_don_an' || key === 'id_don_an') {
                        if (model !== 'dataDonAn') {
                            newRecord['dataDonAnId'] = value;
                            continue;
                        }
                    }

                    // 3. ThongTinCongVan relation
                    if (key === 'id_ref' && model === 'thongTinCongVan') {
                        newRecord['dataDonAnId'] = value;
                        continue;
                    }

                    // 4. Specific ID overrides map to 'id' or specific field
                    if (model === 'bienPhapNganChan' && key === 'id_bien_phap_ngan_chan') { newRecord['id'] = value; continue; }
                    if (model === 'boLuat' && key === 'id_bo_luat') { newRecord['idBoLuat'] = value; continue; }
                    if (model === 'hanhViToiDanh' && key === 'id_hanh_vi') { newRecord['idHanhVi'] = value; continue; }
                    if (model === 'nguoiThamGiaToTung' && key === 'id_nguoi_tham_gia_to_tung') { newRecord['idNguoiThamGia'] = value; continue; }
                    if (model === 'quaTrinhDieuTra' && key === 'id_log') { newRecord['idLog'] = value; continue; }
                    if (model === 'thongTinCongVan' && key === 'id_van_ban') { newRecord['idVanBan'] = value; continue; }
                    if (model === 'thongTinPhanCong' && key === 'id_phan_cong') { newRecord['idPhanCong'] = value; continue; }
                    if (model === 'thongTinPhuongTien' && key === 'id_phuong_tien') { newRecord['idPhuongTien'] = value; continue; }
                    if (model === 'thongTinTaiKhoan' && key === 'id_tai_khoan') { newRecord['idTaiKhoan'] = value; continue; }
                    if (model === 'thongTinThanhVienTrongHo' && key === 'id_thanh_vien') { newRecord['idThanhVien'] = value; continue; }
                    if (model === 'thongTinThietHai' && key === 'id_thiet_hai') { newRecord['idThietHai'] = value; continue; }
                    if (model === 'thongTinTienAnTienSu' && key === 'id_tien_an') { newRecord['idTienAn'] = value; continue; }
                    if (model === 'thongTinTruyNa' && key === 'id_truy_na') { newRecord['idTruyNa'] = value; continue; }
                    if (model === 'thongTinVatChung' && key === 'id_vat_chung') { newRecord['idVatChung'] = value; continue; }

                    // Fallback to camelCase
                    const camelKey = snakeToCamel(key);
                    newRecord[camelKey] = value === '' ? null : value;
                }
                return newRecord;
            });

            // Filtering / Processing Logic
            let finalData = dataToInsert;

            if (model === 'dataDonAn') {
                // Insert DataDonAn
                // Note: We use skipDuplicates to handle re-runs safe.
                try {
                    const result = await prisma[model].createMany({
                        data: dataToInsert,
                        skipDuplicates: true,
                    });
                    console.log(`  Success! Inserted ${result.count} dataDonAn records.`);
                } catch (e) {
                    console.error(`  Error inserting ${model}:`, e.message);
                }
                // Refresh valid IDs cache from DB
                const allIds = await prisma.dataDonAn.findMany({ select: { id: true } });
                validDataDonAnIds = new Set(allIds.map(i => i.id));
                console.log(`  Updated Cache: ${validDataDonAnIds.size} valid DataDonAn IDs.`);
                continue;
            }

            // For other models, filter orphans
            if (finalData.length > 0 && ('dataDonAnId' in finalData[0])) {
                finalData = finalData.filter(r => {
                    // Check if record has dataDonAnId and if it is valid
                    if (r.dataDonAnId && !validDataDonAnIds.has(r.dataDonAnId)) {
                        return false;
                    }
                    return true;
                });
                if (finalData.length < dataToInsert.length) {
                    console.log(`  [Filter] Removed ${dataToInsert.length - finalData.length} orphaned records in ${model}.`);
                }
            }

            // Batch Insert
            if (prisma[model]) {
                const result = await prisma[model].createMany({
                    data: finalData,
                    skipDuplicates: true,
                });
                console.log(`  Success! Inserted ${result.count} records.`);
            } else {
                console.error(`  Model prisma.${model} does not exist! Check spelling.`);
            }

        } catch (e) {
            console.error(`  Error processing ${model}:`, e.message);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
