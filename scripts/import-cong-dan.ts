
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync'; // Try import, if fail will use manual

// Simple manual CSV parser fallback
function parseCSV(content: string) {
    const lines = content.split('\n');
    // Fix duplicate headers in manual parser
    const headers = lines[0].split(',').map(h => h.trim());
    // Rename duplicate 'ho_ten' (index 2) to 'so_cccd_temp' if it exists there
    if (headers[2] === 'ho_ten') headers[2] = 'so_cccd_temp';

    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Handle reported double quotes or simple split
        // This is a basic split, mighty fail on commas inside quotes
        // But the sample data looks simple enough or might have quotes
        // Let's attempt a regex for quoted CSV if needed, or just simple split for now
        // The sample has: "Cục CS QLHC về TTXH, Bộ Công an" -> has commas inside

        const row: any = {};
        let currentVal = '';
        let insideQuote = false;
        let colIndex = 0;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                insideQuote = !insideQuote;
            } else if (char === ',' && !insideQuote) {
                if (colIndex < headers.length) {
                    row[headers[colIndex]] = currentVal.trim();
                }
                colIndex++;
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
        if (colIndex < headers.length) {
            row[headers[colIndex]] = currentVal.trim();
        }

        // Clean up quotes
        Object.keys(row).forEach(k => {
            if (row[k] && typeof row[k] === 'string' && row[k].startsWith('"') && row[k].endsWith('"')) {
                row[k] = row[k].slice(1, -1);
            }
        });

        result.push(row);
    }
    return result;
}

const prisma = new PrismaClient();

async function main() {
    const csvPath = path.join(__dirname, '../data_import/cong_dan.csv');
    console.log(`Reading CSV from ${csvPath}...`);

    if (!fs.existsSync(csvPath)) {
        console.error('File not found!');
        return;
    }

    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const records = parseCSV(fileContent);

    console.log(`Found ${records.length} records. Importing...`);

    for (const record of records) {
        try {
            // Map CSV columns to Prisma fields
            // CSV: id_cong_dan,ho_ten,ho_ten,so_CMND,tinh_trang_hon_nhan,gioi_tinh,ngay_sinh,que_quan,dan_toc,ton_giao,nghe_nghiep,hinh_anh_cong_dan,scan_cccd,ngay_cap,noi_cap,noi_dang_ky_khai_sinh,noi_thuong_tru,noi_o_hien_tai,so_dien_thoai,ghi_chu,nguoi_tao,ngay_tao,nguoi_cap_nhat,ngay_cap_nhat

            // Handle duplicate 'ho_ten' column in header (it appeared twice in user provided view)
            // Just take the first valid one usually.

            // Mapping Logic:
            // Column 1: ho_ten -> hoTen
            // Column 2: so_cccd_temp -> soCCCD (The 12 digit number)
            // Column 3: so_CMND -> soCMND (Often empty in this CSV, but if present use it)

            const cmnd = record['so_CMND'] || null;
            const cccd = record['so_cccd_temp'] || null;

            await prisma.congDan.upsert({
                where: { id: record['id_cong_dan'] || 'UNKNOWN_' + Math.random() },
                update: {
                    hoTen: record['ho_ten'],
                    soCMND: cmnd,
                    soCCCD: cccd,
                    // soCCCD: ??? The sample shows so_CMND column has 12 digits (CCCD format) or 9 digits.
                    // We map so_CMND from CSV to soCMND/soCCCD based on length? Or just dump to soCMND field?
                    // Schema has both. Let's put into soCMND for now, logic can distinguish later.
                    // Actually, the CSV header says "so_CMND".

                    tinhTrangHonNhan: record['tinh_trang_hon_nhan'],
                    gioiTinh: record['gioi_tinh'],
                    ngaySinh: record['ngay_sinh'],
                    queQuan: record['que_quan'],
                    danToc: record['dan_toc'],
                    tonGiao: record['ton_giao'],
                    ngheNghiep: record['nghe_nghiep'],
                    hinhAnh: record['hinh_anh_cong_dan'],
                    scanCCCD: record['scan_cccd'],
                    ngayCap: record['ngay_cap'],
                    noiCap: record['noi_cap'],
                    noiDangKyKhaiSinh: record['noi_dang_ky_khai_sinh'],
                    noiThuongTru: record['noi_thuong_tru'],
                    noiOHienTai: record['noi_o_hien_tai'],
                    soDienThoai: record['so_dien_thoai'],
                    ghiChu: record['ghi_chu'],
                    // nguoiTao: record['nguoi_tao'],
                },
                create: {
                    id: record['id_cong_dan'],
                    hoTen: record['ho_ten'],
                    soCMND: cmnd,
                    soCCCD: cccd,
                    tinhTrangHonNhan: record['tinh_trang_hon_nhan'],
                    gioiTinh: record['gioi_tinh'],
                    ngaySinh: record['ngay_sinh'],
                    queQuan: record['que_quan'],
                    danToc: record['dan_toc'],
                    tonGiao: record['ton_giao'],
                    ngheNghiep: record['nghe_nghiep'],
                    hinhAnh: record['hinh_anh_cong_dan'],
                    scanCCCD: record['scan_cccd'],
                    ngayCap: record['ngay_cap'],
                    noiCap: record['noi_cap'],
                    noiDangKyKhaiSinh: record['noi_dang_ky_khai_sinh'],
                    noiThuongTru: record['noi_thuong_tru'],
                    noiOHienTai: record['noi_o_hien_tai'],
                    soDienThoai: record['so_dien_thoai'],
                    ghiChu: record['ghi_chu'],
                }
            });
            process.stdout.write('.');
        } catch (e) {
            console.error(`Error importing ${record['id_cong_dan']}:`, e);
        }
    }
    console.log('\nImport completed.');
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
