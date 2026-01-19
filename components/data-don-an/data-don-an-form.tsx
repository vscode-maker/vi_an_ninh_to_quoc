
'use client';

import React, { useState } from 'react';
import { Form } from '@/app/ui/compat/antd-form-compat';
import { Input } from '@/app/ui/components/input';
import { Button } from '@/app/ui/components/button';
import { DatePicker } from '@/app/ui/components/date-picker';
import { Select } from '@/app/ui/components/select';
import { Card } from '@/app/ui/components/card';
import { useRouter } from 'next/navigation';
import { createDataDonAn, updateDataDonAn } from '@/lib/actions/data-don-an';
import dayjs from 'dayjs';
import { TextArea } from '@/app/ui/components/textarea'; // Assuming we have or will treat TextArea as Input multiline or separate

// Simple Toast fallback since we removed 'message' from antd
const toast = (msg: string, type: 'success' | 'error' = 'success') => {
    alert(`${type === 'success' ? '✅' : '❌'} ${msg}`);
};

interface Props {
    initialData?: any;
    isEdit?: boolean;
}

export default function DataDonAnForm({ initialData, isEdit = false }: Props) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // Helper to safety parse dates
    const parseDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = dayjs(dateStr);
        return d.isValid() ? d.format('YYYY-MM-DD') : '';
    };

    const initialValues = initialData ? {
        ...initialData,
        ngayXayRa: parseDate(initialData.ngayXayRa),
        ngayTiepNhan: parseDate(initialData.ngayTiepNhan),
    } : {};

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const payload = {
                ...values,
                // Dates from native input are usually YYYY-MM-DD strings already
                ngayXayRa: values.ngayXayRa || null,
                ngayTiepNhan: values.ngayTiepNhan || null,
            };

            if (isEdit && initialData?.id) {
                await updateDataDonAn(initialData.id, payload);
                toast('Cập nhật thành công');
            } else {
                await createDataDonAn(payload);
                toast('Thêm mới thành công');
            }
            router.push('/dashboard/data-don-an');
            router.refresh();
        } catch (error) {
            toast('Có lỗi xảy ra: ' + (error as Error).message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title={isEdit ? "Cập nhật Đơn án" : "Thêm mới Đơn án"}>
            <Form
                form={form}
                initialValues={initialValues}
                onFinish={onFinish}
                className="space-y-4"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item name="noiDung" label="Nội dung chính">
                        <TextArea rows={4} />
                    </Form.Item>
                    <Form.Item name="trichYeu" label="Trích yếu">
                        <TextArea rows={4} />
                    </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Form.Item name="phanLoai" label="Phân loại">
                        <Input />
                    </Form.Item>
                    <Form.Item name="trangThai" label="Trạng thái">
                        <Select
                            options={[
                                { label: 'Đang thụ lý', value: 'Đang thụ lý' },
                                { label: 'Đã giải quyết', value: 'Đã giải quyết' },
                                { label: 'Tạm đình chỉ', value: 'Tạm đình chỉ' }
                            ]}
                        />
                    </Form.Item>
                    <Form.Item name="donViThuLyChinh" label="Đơn vị thụ lý">
                        <Input />
                    </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Form.Item name="ngayXayRa" label="Ngày xảy ra">
                        <DatePicker />
                    </Form.Item>
                    <Form.Item name="ngayTiepNhan" label="Ngày tiếp nhận">
                        <DatePicker />
                    </Form.Item>
                    <Form.Item name="noiXayRa" label="Nơi xảy ra">
                        <Input />
                    </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item name="hinhThucGiaiQuyet" label="Hình thức giải quyết">
                        <Input />
                    </Form.Item>
                    <Form.Item name="ghiChu" label="Ghi chú">
                        <Input />
                    </Form.Item>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <Button type="submit" loading={loading}>
                        {isEdit ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                    <Button variant="secondary" onClick={() => router.back()} type="button">
                        Hủy bỏ
                    </Button>
                </div>
            </Form>
        </Card>
    );
}
