
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

const DATA_DIR = path.join(__dirname, '../data_import');

// Map CSV filename to Prisma Model Name
// Note: 'data_don_an .csv' has a space in filename
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

    { file: 'thong_tin_thiet_hai.csv', model: 'thongTinThietHai' },
    { file: 'thong_tin_tien_an_tien_su.csv', model: 'thongTinTienAnTienSu' },
    { file: 'thong_tin_truy_na.csv', model: 'thongTinTruyNa' },
    { file: 'thong_tin_vat_chung.csv', model: 'thongTinVatChung' },
];

function snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

async function main() {
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

            const dataToInsert = records.map((record: any) => {
                const newRecord: any = {};
                for (const [key, value] of Object.entries(record)) {
                    // Special Mappings

                    // 1. Map 'id_data_don_an'
                    if (key === 'id_data_don_an') {
                        if (model === 'dataDonAn') {
                            newRecord['id'] = value; // Primary Key
                        } else {
                            newRecord['dataDonAnId'] = value; // Foreign Key relation
                        }
                        continue;
                    }

                    // 2. Map 'id_ref' in ThongTinCongVan
                    if (key === 'id_ref' && model === 'thongTinCongVan') {
                        newRecord['dataDonAnId'] = value;
                        continue;
                    }

                    // 3. Standard Snake -> Camel
                    // e.g. id_bien_phap_ngan_chan -> idBienPhapNganChan
                    const camelKey = snakeToCamel(key);
                    newRecord[camelKey] = value === '' ? null : value;
                }
                return newRecord;
            });

            // Batch Insert
            // Use createMany with skipDuplicates to handle re-runs
            // @ts-ignore
            const result = await prisma[model].createMany({
                data: dataToInsert,
                skipDuplicates: true,
            });
            console.log(`  Success! Inserted ${result.count} records.`);
        } catch (e: any) {
            console.error(`  Error inserting ${model}:`, e.message);
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
