import React from 'react';
import { Form, FormItem } from '@/app/ui/compat/antd-form-compat';
import { Input } from '@/app/ui/components/input';
import { Select } from '@/app/ui/components/select';
import { Checkbox } from '@/app/ui/components/checkbox';
// We need a Radio component, using standard HTML for now or custom
import { Radio } from '@/app/ui/compat/radio-compat';

interface TabBasicInfoProps {
    form: any;
}

const TabBasicInfo: React.FC<TabBasicInfoProps> = ({ form }) => {
    return (
        <div className="max-w-3xl">
            {/* Row 1: Classification */}
            <div className="mb-5">
                <FormItem
                    name="phan_loai"
                    label={<span className="text-sm font-medium text-slate-600">Phân loại hồ sơ <span className="text-red-500">*</span></span>}
                    rules={[{ required: true, message: 'Vui lòng chọn phân loại' }]}
                    className="mb-0"
                >
                    {/* Fallback Radio Group Implementation or Custom Component needed. 
                       Using a simple div with label for now to simulate. */}
                    <div className="flex flex-wrap gap-4 mt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="phan_loai" value="vu_viec" className="text-blue-500" />
                            <span className="text-sm text-slate-700 font-medium">Vụ việc ban đầu</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="phan_loai" value="vu_viec_phan_cong" className="text-amber-500" />
                            <span className="text-sm text-slate-700 font-medium">Vụ việc phân công</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="phan_loai" value="vu_an" className="text-red-500" />
                            <span className="text-sm text-slate-700 font-medium">Vụ án</span>
                        </label>
                    </div>
                </FormItem>
            </div>

            {/* Row 2: Traffic Accident */}
            <div className="mb-5">
                <div className="bg-amber-50 rounded-lg p-3">
                    <FormItem name="tai_nan_giao_thong" valuePropName="checked" className="mb-0">
                        <Checkbox label="Vụ việc tai nạn giao thông" />
                    </FormItem>
                </div>
                <p className="text-sm text-slate-500 mt-1.5 ml-1">
                    Đánh dấu nếu đây là vụ việc liên quan đến tai nạn giao thông
                </p>
            </div>

            {/* Row 3: Status and Resolution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <FormItem name="trang_thai" label="Trạng thái">
                    <Select options={[
                        { label: 'Đang xử lý', value: 'dang_xu_ly' },
                        { label: 'Tạm đình chỉ', value: 'tam_dinh_chi' },
                        { label: 'Đã kết thúc', value: 'da_ket_thuc' }
                    ]} />
                </FormItem>
                <FormItem name="hinh_thuc_giai_quyet" label="Hình thức giải quyết">
                    <Select options={[
                        { label: 'Khởi tố', value: 'khoi_to' },
                        { label: 'Không khởi tố', value: 'khong_khoi_to' },
                        { label: 'Tạm đình chỉ', value: 'tam_dinh_chi' },
                        { label: 'Đình chỉ', value: 'dinh_chi' }
                    ]} />
                </FormItem>
            </div>

            {/* Row 4: Content Section */}
            <div className="bg-slate-50 rounded-lg p-4 mb-5">
                <label className="block text-sm font-medium text-slate-600 mb-3">
                    Nội dung vụ việc
                </label>

                <FormItem
                    name="noi_dung"
                    rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
                    className="mb-3"
                >
                    <textarea
                        className="w-full rounded-md border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Mô tả chi tiết nội dung vụ việc..."
                    />
                </FormItem>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem
                        name="trich_yeu"
                        label={<span className="text-sm text-slate-600">Trích yếu <span className="text-red-500">*</span></span>}
                        rules={[{ required: true, message: 'Vui lòng nhập trích yếu' }]}
                    >
                        <Input placeholder="Tóm tắt ngắn gọn..." />
                    </FormItem>
                    <FormItem
                        name="ghi_chu"
                        label="Ghi chú"
                    >
                        <Input placeholder="Thông tin bổ sung..." />
                    </FormItem>
                </div>
            </div>

            {/* Row 5: Archive and Warning */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem name="so_luu_tru" label="Số lưu trữ">
                    <Input placeholder="Số lưu trữ hồ sơ..." />
                </FormItem>
                <FormItem name="canh_bao_tien_do" label="Cảnh báo tiến độ">
                    <Select options={[
                        { label: 'Bình thường', value: 'binh_thuong' },
                        { label: 'Sắp hết hạn', value: 'sap_het_han' },
                        { label: 'Quá hạn', value: 'qua_han' }
                    ]} />
                </FormItem>
            </div>
        </div>
    );
};

export default TabBasicInfo;
