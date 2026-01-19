
export interface FieldDefinition {
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'datetime';
    required?: boolean;
    hideInForm?: boolean;
    hideInTable?: boolean;
}

export interface ModuleConfig {
    [slug: string]: {
        model: string;
        title: string;
        primaryKey: string;
        groupBy?: string;
        fields: FieldDefinition[];
    };
}

export const MODULE_CONFIG: ModuleConfig = {
    'bien-phap': {
        model: 'bienPhapNganChan',
        title: 'Biện pháp ngăn chặn',
        primaryKey: 'id',
        fields: [
            { name: 'id', label: 'ID', type: 'text', required: true },
            { name: 'bienPhapNganChan', label: 'Biện pháp', type: 'text' },
            { name: 'dataDonAnId', label: 'Mã Đơn án', type: 'text' },
            { name: 'ngayBatDau', label: 'Ngày bắt đầu', type: 'date' }, // Mapped from CSV fields like tuNgay ideally
            { name: 'tuNgay', label: 'Từ ngày', type: 'text' },
            { name: 'denNgay', label: 'Đến ngày', type: 'text' },
            { name: 'donViThucHien', label: 'Đơn vị thực hiện', type: 'text' },
        ]
    },
    'hanh-vi': {
        model: 'hanhViToiDanh',
        title: 'Hành vi tội danh',
        primaryKey: 'idHanhVi',
        fields: [
            { name: 'idHanhVi', label: 'ID Hành vi', type: 'text', required: true },
            { name: 'tenHanhVi', label: 'Tên hành vi', type: 'text' },
            { name: 'idBoLuat', label: 'Mã Bộ luật', type: 'text' },
            { name: 'dataDonAnId', label: 'Mã Đơn án', type: 'text' },
        ]
    },
    'nguoi-tham-gia': {
        model: 'nguoiThamGiaToTung',
        title: 'Người tham gia tố tụng',
        primaryKey: 'idNguoiThamGia',
        fields: [
            { name: 'idNguoiThamGia', label: 'ID', type: 'text', required: true },
            { name: 'tuCachToTung', label: 'Tư cách tố tụng', type: 'text' },
            { name: 'tinhTrang', label: 'Tình trạng', type: 'text' },
            { name: 'ghiChu', label: 'Ghi chú', type: 'textarea' },
        ]
    },
    'qua-trinh': {
        model: 'quaTrinhDieuTra',
        title: 'Quá trình điều tra',
        primaryKey: 'idLog',
        fields: [
            { name: 'idLog', label: 'ID Log', type: 'text', required: true },
            { name: 'trangThai', label: 'Trạng thái', type: 'text' },
            { name: 'ngayDoiTrangThai', label: 'Ngày đổi trạng thái', type: 'text' },
            { name: 'history', label: 'Lịch sử', type: 'textarea' },
            { name: 'dataDonAnId', label: 'Mã Đơn án', type: 'text' },
        ]
    },
    'cong-van': {
        model: 'thongTinCongVan',
        title: 'Thông tin công văn',
        primaryKey: 'idVanBan',
        fields: [
            { name: 'idVanBan', label: 'ID Văn bản', type: 'text', required: true },
            { name: 'tenVanBan', label: 'Tên văn bản', type: 'text' },
            { name: 'soVanBan', label: 'Số văn bản', type: 'text' },
            { name: 'ngayBanHanh', label: 'Ngày ban hành', type: 'text' },
            { name: 'coQuanBanHanh', label: 'Cơ quan ban hành', type: 'text' },
        ]
    },
    'phan-cong': {
        model: 'thongTinPhanCong',
        title: 'Thông tin phân công',
        primaryKey: 'idPhanCong',
        fields: [
            { name: 'idPhanCong', label: 'ID Phân công', type: 'text', required: true },
            { name: 'phanLoai', label: 'Phân loại', type: 'text' },
            { name: 'dieuTraVien', label: 'Điều tra viên', type: 'text' },
            { name: 'donViThuLy', label: 'Đơn vị thụ lý', type: 'text' },
        ]
    },
    'phuong-tien': {
        model: 'thongTinPhuongTien',
        title: 'Thông tin phương tiện',
        primaryKey: 'idPhuongTien',
        fields: [
            { name: 'idPhuongTien', label: 'ID Phương tiện', type: 'text', required: true },
            { name: 'loaiPhuongTien', label: 'Loại phương tiện', type: 'text' },
            { name: 'bienSo', label: 'Biển số', type: 'text' },
            { name: 'soKhung', label: 'Số khung', type: 'text' },
            { name: 'soMay', label: 'Số máy', type: 'text' },
            { name: 'ghiChu', label: 'Ghi chú', type: 'textarea' },
        ]
    },
    'tai-khoan': {
        model: 'thongTinTaiKhoan',
        title: 'Thông tin tài khoản',
        primaryKey: 'idTaiKhoan',
        fields: [
            { name: 'idTaiKhoan', label: 'ID Tài khoản', type: 'text', required: true },
            { name: 'soTaiKhoan', label: 'Số tài khoản', type: 'text' },
            { name: 'nganHang', label: 'Ngân hàng', type: 'text' },
            { name: 'loaiTaiKhoan', label: 'Loại tài khoản', type: 'text' },
            { name: 'ghiChu', label: 'Ghi chú', type: 'textarea' },
        ]
    },

    'thiet-hai': {
        model: 'thongTinThietHai',
        title: 'Thông tin thiệt hại',
        primaryKey: 'idThietHai',
        fields: [
            { name: 'idThietHai', label: 'ID Thiệt hại', type: 'text', required: true },
            { name: 'loaiThietHai', label: 'Loại thiệt hại', type: 'text' },
            { name: 'moTa', label: 'Mô tả', type: 'textarea' },
            { name: 'giaTriUocTinh', label: 'Giá trị ước tính', type: 'text' },
        ]
    },
    'tien-an': {
        model: 'thongTinTienAnTienSu',
        title: 'Tiền án tiền sự',
        primaryKey: 'idTienAn',
        fields: [
            { name: 'idTienAn', label: 'ID Tiền án', type: 'text', required: true },
            { name: 'toiDanh', label: 'Tội danh', type: 'text' },
            { name: 'hinhPhat', label: 'Hình phạt', type: 'text' },
            { name: 'ngayKetAn', label: 'Ngày kết án', type: 'text' },
            { name: 'ghiChu', label: 'Ghi chú', type: 'textarea' },
        ]
    },
    'truy-na': {
        model: 'thongTinTruyNa',
        title: 'Thông tin truy nã',
        primaryKey: 'idTruyNa',
        fields: [
            { name: 'idTruyNa', label: 'ID Truy nã', type: 'text', required: true },
            { name: 'soLenhTruyNa', label: 'Số lệnh', type: 'text' },
            { name: 'toiDanh', label: 'Tội danh', type: 'text' },
            { name: 'ngayBanHanh', label: 'Ngày ban hành', type: 'text' },
            { name: 'trangThai', label: 'Trạng thái', type: 'text' },
        ]
    },
    'vat-chung': {
        model: 'thongTinVatChung',
        title: 'Thông tin vật chứng',
        primaryKey: 'idVatChung',
        fields: [
            { name: 'idVatChung', label: 'ID Vật chứng', type: 'text', required: true },
            { name: 'loaiVatChung', label: 'Loại vật chứng', type: 'text' },
            { name: 'moTa', label: 'Mô tả', type: 'textarea' },
            { name: 'soLuong', label: 'Số lượng', type: 'text' },
        ]
    },
    'thong-tin-chat': {
        model: 'thongTinChat',
        title: 'Thông tin chat',
        primaryKey: 'id',
        groupBy: 'nhom',
        fields: [
            { name: 'id', label: 'ID', type: 'text', required: false, hideInForm: true, hideInTable: true },
            { name: 'thoiGian', label: 'Thời gian', type: 'datetime', required: true },
            { name: 'noiDung', label: 'Nội dung', type: 'textarea', required: true },
            { name: 'nguoiGui', label: 'Người gửi', type: 'text', required: true },
            { name: 'nguoiNhan', label: 'Người nhận', type: 'text', required: true },
            { name: 'nhom', label: 'Nhóm', type: 'text' },
            { name: 'ghiChu', label: 'Ghi chú', type: 'textarea' },
        ]
    }
};
