
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const dataDir = path.join(__dirname, '../data_import');

const files = [
    'data_don_an .csv',
    'bien_phap_ngan_chan.csv',
    'bo_luat.csv',
    'hanh_vi_toi_danh.csv',
    'nguoi_tham_gia_to_tung.csv',
    'qua_trinh_dieu_tra.csv',
    'thong_tin_cong_van.csv',
    'thong_tin_phan_cong.csv',
    'thong_tin_phuong_tien.csv',
    'thong_tin_tai_khoan.csv',
    'thong_tin_thanh_vien_trong_ho.csv',
    'thong_tin_thiet_hai.csv',
    'thong_tin_tien_an_tien_su.csv',
    'thong_tin_truy_na.csv',
    'thong_tin_vat_chung.csv'
];

files.forEach(file => {
    try {
        const filePath = path.join(dataDir, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath);
            // Detect BOM and remove
            let stringContent = content.toString().replace(/^\uFEFF/, '');

            const records = parse(stringContent, {
                columns: true,
                skip_empty_lines: true,
                to: 1 // Only read first line provided by header
            });

            if (records.length > 0) {
                // Just get keys from the first record (which uses header)
                // Actually if columns: true, records[0] is keys->values. 
                // Better: just read headers.
                const headers = Object.keys(records[0]);
                console.log(`\n--- ${file} ---`);
                console.log(headers.join(', '));
            }
        } else {
            console.log(`\n!!! Missing: ${file}`);
        }
    } catch (error) {
        console.error(`Error reading ${file}:`, error.message);
    }
});
