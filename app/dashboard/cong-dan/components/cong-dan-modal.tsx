'use client';

import { useState, useEffect } from 'react';
import { createCongDan, updateCongDan } from '@/lib/cong-dan-actions';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Modal } from '@/app/ui/components/modal';
import { Button } from '@/app/ui/components/button';
import { Input } from '@/app/ui/components/input';
import { Checkbox } from '@/app/ui/components/checkbox';
import { Save } from 'lucide-react';

dayjs.extend(customParseFormat);

export default function CongDanModal({ open, onCancel, record }: any) {
    const [loading, setLoading] = useState(false);

    // Helper to format date for input type="date" (YYYY-MM-DD)
    const formatDateForInput = (dateStr: string) => {
        if (!dateStr) return '';
        const d = dayjs(dateStr, 'DD/MM/YYYY');
        return d.isValid() ? d.format('YYYY-MM-DD') : '';
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        // Transform date inputs back to DD/MM/YYYY if needed by backend, 
        // or ensure backend accepts YYYY-MM-DD. 
        // Assuming backend expects DD/MM/YYYY based on previous code.
        const dateFields = ['ngaySinh', 'ngayCap'];
        dateFields.forEach(field => {
            const val = formData.get(field) as string;
            if (val) {
                const d = dayjs(val, 'YYYY-MM-DD');
                if (d.isValid()) {
                    formData.set(field, d.format('DD/MM/YYYY'));
                }
            }
        });

        // Handle Checkbox 'chuHo' manually if not using native behavior? 
        // Native checkbox sends 'on' if checked, nothing if not.
        // We need to ensure we send 'true' or 'false' if backend expects boolean/string.
        // But formData from native checkbox usually works if backend handles it.
        // Let's force it for safety if previous code did manual append.
        // Previous code: values.chuHo (boolean)
        const isChuHo = (e.currentTarget.elements.namedItem('chuHo') as HTMLInputElement).checked;
        formData.set('chuHo', isChuHo ? 'true' : 'false');

        if (record?.id) formData.append('id', record.id);

        let result;
        if (record) {
            result = await updateCongDan(record.id, formData);
        } else {
            result = await createCongDan(formData);
        }

        if (result.success) {
            alert(result.message);
            onCancel();
        } else {
            alert(result.message);
        }
        setLoading(false);
    };


    return (
        <Modal
            title={record ? "Cập nhật thông tin công dân" : "Thêm mới công dân"}
            isOpen={open}
            onClose={onCancel}
            width={800}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        name="hoTen"
                        label="Họ và tên"
                        placeholder="Nhập họ tên"
                        required
                        defaultValue={record?.hoTen}
                    />
                    <div className="flex flex-col gap-1.5 ">
                        <label className="text-sm font-medium text-gray-700">Giới tính</label>
                        <select
                            name="gioiTinh"
                            className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                            defaultValue={record?.gioiTinh}
                        >
                            <option value="">Chọn giới tính</option>
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                        </select>
                    </div>
                </div>

                {/* Rest of the form is restored implicitly by removing comments, assuming I provide full replacement content or targeted replacement */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Ngày sinh</label>
                        <input
                            type="date"
                            name="ngaySinh"
                            className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                            defaultValue={formatDateForInput(record?.ngaySinh)}
                        />
                    </div>
                    <Input
                        name="soCCCD"
                        label="Số CCCD"
                        placeholder="12 chữ số"
                        defaultValue={record?.soCCCD}
                    />
                    <Input
                        name="soCMND"
                        label="Số CMND (cũ)"
                        placeholder="9 chữ số"
                        defaultValue={record?.soCMND}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="danToc" label="Dân tộc" defaultValue={record?.danToc} />
                    <Input name="tonGiao" label="Tôn giáo" defaultValue={record?.tonGiao} />
                </div>

                <Input name="queQuan" label="Quê quán" defaultValue={record?.queQuan} />

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Nơi thường trú</label>
                    <textarea
                        name="noiThuongTru"
                        rows={2}
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                        defaultValue={record?.noiThuongTru}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Nơi ở hiện tại</label>
                    <textarea
                        name="noiOHienTai"
                        rows={2}
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                        defaultValue={record?.noiOHienTai}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="soDienThoai" label="Số điện thoại" defaultValue={record?.soDienThoai} />
                    <Input name="ngheNghiep" label="Nghề nghiệp" defaultValue={record?.ngheNghiep} />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                    <textarea
                        name="ghiChu"
                        rows={2}
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                        defaultValue={record?.ghiChu}
                    />
                </div>

                <div className="border-t border-gray-100 pt-4">
                    <h4 className="font-semibold mb-3 text-gray-900">Thông tin bổ sung</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Tình trạng hôn nhân</label>
                            <select
                                name="tinhTrangHonNhan"
                                className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                                defaultValue={record?.tinhTrangHonNhan}
                            >
                                <option value="">Chọn</option>
                                <option value="Độc thân">Độc thân</option>
                                <option value="Đã kết hôn">Đã kết hôn</option>
                                <option value="Ly hôn">Ly hôn</option>
                                <option value="Ly thân">Ly thân</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Ngày cấp (CCCD/CMND)</label>
                            <input
                                type="date"
                                name="ngayCap"
                                className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                                defaultValue={formatDateForInput(record?.ngayCap)}
                            />
                        </div>
                        <Input name="noiCap" label="Nơi cấp" defaultValue={record?.noiCap} />
                    </div>

                    <div className="mb-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Nơi đăng ký khai sinh</label>
                            <textarea
                                name="noiDangKyKhaiSinh"
                                rows={1}
                                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                                defaultValue={record?.noiDangKyKhaiSinh}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="maHoKhau" label="Mã Hộ Khẩu" placeholder="HK..." defaultValue={record?.maHoKhau} />
                        <div className="flex items-end pb-2">
                            <Checkbox
                                name="chuHo"
                                defaultChecked={record?.chuHo}
                                label="Là Chủ hộ"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                    <Button type="button" variant="ghost" onClick={onCancel}>Hủy</Button>
                    <Button type="submit" loading={loading} icon={<Save size={16} />}>
                        {record ? 'Cập nhật' : 'Lưu mới'}
                    </Button>
                </div>
            </form>
        </Modal>
    );

}
