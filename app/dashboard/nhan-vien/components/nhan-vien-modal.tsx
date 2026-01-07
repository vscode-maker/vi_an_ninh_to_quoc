
'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { createUser, updateUser } from '@/lib/user-actions';

export default function NhanVienModal({ open, onCancel, record }: any) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        if (record) {
            form.setFieldsValue(record);
        } else {
            form.resetFields();
        }
    }, [record, form, open]);

    const onFinish = async (values: any) => {
        setLoading(true);
        const formData = new FormData();
        Object.keys(values).forEach(key => {
            if (values[key]) formData.append(key, values[key]);
        });

        let result;
        if (record) {
            result = await updateUser(record.id, formData);
        } else {
            result = await createUser(formData);
        }

        if (result.success) {
            message.success(result.message);
            onCancel();
        } else {
            message.error(result.message);
        }
        setLoading(false);
    };

    return (
        <Modal
            title={record ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
            open={open}
            onCancel={onCancel}
            footer={null}
            destroyOnHidden={true}
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item name="soHieu" label="Số hiệu (ID)" rules={[{ required: true }]}>
                    <Input placeholder="VD: 123456" disabled={!!record} />
                </Form.Item>
                <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true }]}>
                    <Input placeholder="Nhập họ tên" />
                </Form.Item>
                <Form.Item name="password" label={record ? "Mật khẩu mới (Để trống nếu không đổi)" : "Mật khẩu"} rules={[{ required: !record }]}>
                    <Input.Password placeholder="Nhập mật khẩu" />
                </Form.Item>
                <Form.Item name="role" label="Vai trò" initialValue="user">
                    <Select>
                        <Select.Option value="user">User</Select.Option>
                        <Select.Option value="admin">Admin</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item name="position" label="Chức vụ">
                    <Input placeholder="Chức vụ" />
                </Form.Item>

                <div style={{ textAlign: 'right' }}>
                    <Button onClick={onCancel} style={{ marginRight: 8 }}>Hủy</Button>
                    <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                        {record ? 'Cập nhật' : 'Lưu mới'}
                    </Button>
                </div>
            </Form>
        </Modal>
    );
}
