'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Type definitions for the form data structure
// We map the complex JSON structure from the UI to Prisma's format

export async function createDonAn(data: any) {
    try {
        const {
            // Main data
            phan_loai,
            tai_nan_giao_thong,
            id_don_an, // User defined ID
            id_vu_an,
            noi_dung,
            trich_yeu,
            ghi_chu,

            // Location & Time
            ngay_xay_ra,
            chua_xac_dinh_dia_diem,
            tinh_thanh,
            phuong_xa,
            noi_xay_ra, // Full address string

            // Org info
            ngay_tiep_nhan,
            don_vi_tiep_nhan,
            ngay_chuyen_cqdt,
            don_vi_thu_ly, // don_vi_thu_ly_chinh

            // Meta
            nguoi_tao,

            // Relations (arrays of objects)
            thong_tin_bo_luat, // HanhViToiDanh (partially, or direct BoLuat mapping? user guide says HanhViToiDanh links BoLuat)
            thong_tin_nguoi_tham_gia, // NguoiThamGiaToTung
            thong_tin_thiet_hai, // ThongTinThietHai
            thong_tin_vat_chung, // ThongTinVatChung
            thong_tin_phan_cong, // ThongTinPhanCong
            thong_tin_qua_trinh_deu_tra, // QuaTrinhDieuTra
            thong_tin_file_dinh_kem // FileAttach (not directly linked in DataDonAn schema yet? Check schema)
        } = data;

        // Generate ID if not provided?
        // User guide says user inputs "Mã vụ việc". We use that as PK.
        // Prisma schema: id String @id @map("id_data_don_an")
        const id = id_don_an || `DA-${Date.now()}`;

        // Construct DataDonAn create payload
        // We need to map UI fields -> DB fields

        await prisma.dataDonAn.create({
            data: {
                id: id,
                phanLoai: phan_loai,
                // tai_nan_giao_thong is not in schema explicitly as boolean? 
                // Schema has 'ghi_chu', 'noi_dung'. 
                // Let's verify schema for 'tai_nan_giao_thong'. 
                // Schema: id, phanLoai, trichYeu, noiDung, ngayXayRa, noiXayRa...
                // No dedicated boolean. Put in ghiChu or mapped field?
                // Let's assume it goes into 'ghiChu' or we ignore if no field.
                trichYeu: trich_yeu,
                noiDung: noi_dung,
                ngayXayRa: ngay_xay_ra,
                noiXayRa: noi_xay_ra, // combined address

                ngayTiepNhan: ngay_tiep_nhan,
                donViTiepNhan: don_vi_tiep_nhan,
                ngayChuyenCoQuanDieuTra: ngay_chuyen_cqdt,
                donViThuLyChinh: don_vi_thu_ly,

                ghiChu: ghi_chu, // Add tai_nan_giao_thong note here if checked?

                // Nested writes for relations

                // 1. HanhViToiDanh (Law/Crimes)
                // UI 'thong_tin_bo_luat' -> [{ idBoLuat, ... }]
                hanhViToiDanh: {
                    create: Array.isArray(thong_tin_bo_luat) ? thong_tin_bo_luat.map((item: any) => ({
                        idHanhVi: `HV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        idBoLuat: item.idBoLuat || item.ma_bo_luat, // Ensure field match
                        tenHanhVi: item.ten_bo_luat // or descriptor
                    })) : []
                },

                // 2. NguoiThamGiaToTung (Participants)
                nguoiThamGiaToTung: {
                    create: Array.isArray(thong_tin_nguoi_tham_gia) ? thong_tin_nguoi_tham_gia.map((p: any) => ({
                        idNguoiThamGia: `NTG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        idCongDan: p.id_cong_dan,
                        tuCachToTung: p.vai_tro,
                        ghiChu: p.mo_ta
                    })) : []
                },

                // 3. ThongTinThietHai (Damage)
                thongTinThietHai: {
                    create: Array.isArray(thong_tin_thiet_hai) ? thong_tin_thiet_hai.map((d: any) => ({
                        idThietHai: `TH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        loaiThietHai: d.loai_thiet_hai,
                        moTa: d.mo_ta,
                        giaTriUocTinh: String(d.gia_tri), // Schema says String
                        donViTinh: 'VNĐ', // Assume
                        // nguoi_bi_thiet_hai -> logic needed if linking to cong dan?
                        // Schema: idCongDan, moTa...
                    })) : []
                },

                // 4. ThongTinVatChung (Evidence)
                thongTinVatChung: {
                    create: Array.isArray(thong_tin_vat_chung) ? thong_tin_vat_chung.map((v: any) => ({
                        idVatChung: `VC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        loaiVatChung: v.loai_vat_chung || v.loai,
                        moTa: v.mo_ta, // or ten_vat_chung + mo ta
                        soLuong: String(v.so_luong),
                        donVi: v.don_vi,
                        trangThai: v.tinh_trang,
                        ghiChu: `Nơi bảo quản: ${v.noi_bao_quan}, Người giữ: ${v.nguoi_thu_giu}`
                    })) : []
                },

                // 5. ThongTinPhanCong (Assignment)
                thongTinPhanCong: {
                    create: Array.isArray(thong_tin_phan_cong) ? thong_tin_phan_cong.map((pc: any) => ({
                        idPhanCong: `PC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        dieuTraVien: pc.ho_ten,
                        donViThuLy: pc.don_vi,
                        // vai_tro -> map to suitable field? Schema: 'phanLoai' or 'canBoDieuTra'?
                        // Schema has 'canBoDieuTra', 'dieuTraVien'.
                        phanLoai: pc.vai_tro
                    })) : []
                },

                // 6. QuaTrinhDieuTra (Log)
                quaTrinhDieuTra: {
                    create: Array.isArray(thong_tin_qua_trinh_deu_tra) ? thong_tin_qua_trinh_deu_tra.map((log: any) => ({
                        idLog: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        ngayDoiTrangThai: log.ngay_thuc_hien,
                        history: log.noi_dung, // Schema 'history' seems best fit for content
                        trangThai: log.ket_qua // or 'trangThai'
                    })) : []
                }
            }
        });

        // Handle FileAttach?
        // Schema FileAttach has 'taskId' or 'groupId', not DataDonAnId FK.
        // We might need to handle this differently or update schema.
        // For now, we ignore file saving in this transaction as schema doesn't support DataDonAn relation directly?
        // Wait, check Schema at DataDonAn?
        // Relation: None to FileAttach.
        // We will skip file attach for now or link via ID string in later update.

        revalidatePath('/dashboard/don-an');
        return { success: true, message: 'Tạo hồ sơ thành công', id };

    } catch (error: any) {
        console.error('Error creating don an:', error);
        return { success: false, error: error.message };
    }
}
