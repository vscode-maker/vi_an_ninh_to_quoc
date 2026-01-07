
'use client';

import React, { useState } from 'react';
import { Form, Input, Button, DatePicker, Select, Card, Row, Col, message } from 'antd';
import { useRouter } from 'next/navigation';
import { createDataDonAn, updateDataDonAn } from '@/lib/actions/data-don-an';
import dayjs from 'dayjs';

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
        if (!dateStr) return null;
        // Try parsing assuming ISO or standard format.
        const d = dayjs(dateStr);
        return d.isValid() ? d : null;
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
                // Convert dates back to string if needed, or keep as ISO depending on DB
                // Our DB fields are String based on schema (from CSV).
                // So we format generic string YYYY-MM-DD or DD/MM/YYYY.
                // Seed data uses Strings. Let's try ISO string for consistency or whatever was imported.
                ngayXayRa: values.ngayXayRa ? values.ngayXayRa.toISOString() : null,
                ngayTiepNhan: values.ngayTiepNhan ? values.ngayTiepNhan.toISOString() : null,
            };

            if (isEdit && initialData?.id) {
                await updateDataDonAn(initialData.id, payload);
                message.success('Cập nhật thành công');
            } else {
                await createDataDonAn(payload);
                message.success('Thêm mới thành công');
            }
            router.push('/dashboard/data-don-an');
            router.refresh();
        } catch (error) {
            message.error('Có lỗi xảy ra: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title={isEdit ? "Cập nhật Đơn án" : "Thêm mới Đơn án"}>
            <Form
                form={form}
                layout="vertical"
                initialValues={initialValues}
                onFinish={onFinish}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="noiDung" label="Nội dung chính" rules={[{ required: true }]}>
                            <Input.TextArea rows={4} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="trichYeu" label="Trích yếu">
                            <Input.TextArea rows={4} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="phanLoai" label="Phân loại">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="trangThai" label="Trạng thái">
                            <Select>
                                <Select.Option value="Đang thụ lý">Đang thụ lý</Select.Option>
                                <Select.Option value="Đã giải quyết">Đã giải quyết</Select.Option>
                                <Select.Option value="Tạm đình chỉ">Tạm đình chỉ</Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="donViThuLyChinh" label="Đơn vị thụ lý">
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="ngayXayRa" label="Ngày xảy ra">
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="ngayTiepNhan" label="Ngày tiếp nhận">
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="noiXayRa" label="Nơi xảy ra">
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="hinhThucGiaiQuyet" label="Hình thức giải quyết">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="ghiChu" label="Ghi chú">
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: 8 }}>
                        {isEdit ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                    <Button onClick={() => router.back()}>
                        Hủy bỏ
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
}
