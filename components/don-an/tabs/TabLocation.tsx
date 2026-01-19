import React from 'react';
import { FormItem } from '@/app/ui/compat/antd-form-compat';
import { Input } from '@/app/ui/components/input';

interface TabLocationProps {
    form: any;
}

const TabLocation: React.FC<TabLocationProps> = ({ form }) => {
    return (
        <div className="max-w-3xl space-y-5">
            {/* Section 1: Time and Location */}
            <div className="bg-slate-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-slate-600 mb-3">
                    Thời gian & Địa điểm xảy ra
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem
                        name="ngay_xay_ra"
                        label={<span className="text-sm text-slate-600">Ngày xảy ra <span className="text-red-500">*</span></span>}
                        rules={[{ required: true, message: 'Vui lòng chọn ngày xảy ra' }]}
                        className="mb-0"
                    >
                        <Input type="date" />
                    </FormItem>
                    <FormItem
                        name="noi_xay_ra"
                        label={<span className="text-sm text-slate-600">Nơi xảy ra <span className="text-red-500">*</span></span>}
                        rules={[{ required: true, message: 'Vui lòng nhập nơi xảy ra' }]}
                        className="mb-0"
                    >
                        <Input placeholder="Địa chỉ cụ thể nơi xảy ra vụ việc..." />
                    </FormItem>
                </div>
            </div>

            {/* Section 2: Reception Info */}
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-3">
                    Thông tin tiếp nhận
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem
                        name="ngay_tiep_nhan"
                        label={<span className="text-sm text-slate-600">Ngày tiếp nhận <span className="text-red-500">*</span></span>}
                        rules={[{ required: true, message: 'Vui lòng chọn ngày tiếp nhận' }]}
                    >
                        <Input type="date" />
                    </FormItem>
                    <FormItem
                        name="don_vi_tiep_nhan"
                        label={<span className="text-sm text-slate-600">Đơn vị tiếp nhận <span className="text-red-500">*</span></span>}
                        rules={[{ required: true, message: 'Vui lòng nhập đơn vị tiếp nhận' }]}
                    >
                        <Input placeholder="Tên đơn vị tiếp nhận..." />
                    </FormItem>
                </div>
            </div>

            {/* Section 3: Investigation Transfer */}
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-3">
                    Chuyển cơ quan điều tra
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem
                        name="ngay_chuyen_co_quan_dieu_tra"
                        label={<span className="text-sm text-slate-600">Ngày chuyển CQĐT</span>}
                    >
                        <Input type="date" />
                    </FormItem>
                    <FormItem
                        name="don_vi_thu_ly_chinh"
                        label={<span className="text-sm text-slate-600">Đơn vị thụ lý chính</span>}
                    >
                        <Input placeholder="Tên đơn vị thụ lý chính..." />
                    </FormItem>
                </div>
            </div>

            {/* Section 4: Management Units */}
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-3">
                    Đơn vị quản lý
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem
                        name="don_vi_quan_ly"
                        label={<span className="text-sm text-slate-600">Đơn vị quản lý</span>}
                    >
                        <Input placeholder="Tên đơn vị quản lý hồ sơ..." />
                    </FormItem>
                    <FormItem
                        name="don_vi_nhan_ho_so"
                        label={<span className="text-sm text-slate-600">Đơn vị nhận hồ sơ</span>}
                    >
                        <Input placeholder="Tên đơn vị nhận hồ sơ..." />
                    </FormItem>
                </div>
            </div>
        </div>
    );
};

export default TabLocation;
