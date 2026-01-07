-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "so_hieu" TEXT NOT NULL,
    "ho_va_ten" TEXT NOT NULL,
    "gioi_tinh" TEXT,
    "so_dien_thoai" TEXT,
    "don_vi" TEXT,
    "doi" TEXT,
    "to" TEXT,
    "chuc_vu" TEXT,
    "chuc_danh" TEXT,
    "email" TEXT,
    "user_id_zalo" TEXT,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "group_id" TEXT,
    "vai_tro" TEXT NOT NULL,
    "quyen_han" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cong_dan" (
    "id_cong_dan" TEXT NOT NULL,
    "ho_ten" TEXT NOT NULL,
    "so_CMND" TEXT,
    "so_CCCD" TEXT,
    "tinh_trang_hon_nhan" TEXT,
    "gioi_tinh" TEXT,
    "ngay_sinh" TEXT,
    "que_quan" TEXT,
    "dan_toc" TEXT,
    "ton_giao" TEXT,
    "nghe_nghiep" TEXT,
    "hinh_anh_cong_dan" TEXT,
    "scan_cccd" TEXT,
    "ngay_cap" TEXT,
    "noi_cap" TEXT,
    "noi_dang_ky_khai_sinh" TEXT,
    "noi_thuong_tru" TEXT,
    "noi_o_hien_tai" TEXT,
    "so_dien_thoai" TEXT,
    "ghi_chu" TEXT,
    "nguoi_tao" TEXT,
    "ngay_tao" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "nguoi_cap_nhat" TEXT,
    "ngay_cap_nhat" TIMESTAMP(3),

    CONSTRAINT "cong_dan_pkey" PRIMARY KEY ("id_cong_dan")
);

-- CreateTable
CREATE TABLE "cong_viec" (
    "id" TEXT NOT NULL,
    "ngay_gio_ghi_chu" TIMESTAMP(3),
    "ten_nguoi_ghi_chu" TEXT,
    "nhom" TEXT,
    "ho_ten_doi_tuong" TEXT,
    "ten_tai_khoan" TEXT,
    "so_tai_khoan" TEXT,
    "ngan_hang" TEXT,
    "so_dien_thoai" TEXT,
    "nha_mang" TEXT,
    "thong_tin_van_ban" TEXT,
    "don_vi_thuc_hien" TEXT,
    "noi_dung" TEXT,
    "thoi_han" TIMESTAMP(3),
    "canh_bao_tien_do" TEXT,
    "yeu_cau" TEXT,
    "trang_thai" TEXT,
    "ghi_chu" JSONB,
    "dinh_kem" JSONB,
    "group_id" TEXT,
    "qr_code" TEXT,
    "ten_tai_khoan_mxh" TEXT,
    "thong_tin_them" JSONB,
    "id_nguoi_ghi_chu" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cong_viec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_attach" (
    "id_file" TEXT NOT NULL,
    "id_unique" TEXT,
    "name_file" TEXT,
    "ghi_chu" TEXT,
    "id" TEXT,
    "ngay_update" TIMESTAMP(3),
    "link_file" TEXT,
    "loai_file" TEXT,
    "thong_tin_them" JSONB,

    CONSTRAINT "file_attach_pkey" PRIMARY KEY ("id_file")
);

-- CreateTable
CREATE TABLE "setting" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_zalo" (
    "group_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "group_link" TEXT,
    "group_description" TEXT,
    "total_member" INTEGER,
    "status" TEXT,

    CONSTRAINT "group_zalo_pkey" PRIMARY KEY ("group_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_so_hieu_key" ON "users"("so_hieu");

-- CreateIndex
CREATE INDEX "cong_viec_trang_thai_updated_at_idx" ON "cong_viec"("trang_thai", "updated_at");

-- CreateIndex
CREATE INDEX "cong_viec_group_id_trang_thai_idx" ON "cong_viec"("group_id", "trang_thai");

-- AddForeignKey
ALTER TABLE "cong_viec" ADD CONSTRAINT "cong_viec_id_nguoi_ghi_chu_fkey" FOREIGN KEY ("id_nguoi_ghi_chu") REFERENCES "users"("so_hieu") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_attach" ADD CONSTRAINT "file_attach_id_unique_fkey" FOREIGN KEY ("id_unique") REFERENCES "cong_viec"("id") ON DELETE SET NULL ON UPDATE CASCADE;
