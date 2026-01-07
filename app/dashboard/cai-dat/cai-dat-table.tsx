
'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { createSetting, updateSetting, deleteSetting } from '@/lib/setting-actions';

export default function CaiDatTable({ initialData }: any) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleDelete = async (id: number) => {
        const result = await deleteSetting(id);
        if (result.success) message.success(result.message);
        else message.error(result.message);
    };

    const onFinish = async (values: any) => {
        setLoading(true);
        const formData = new FormData();
        Object.keys(values).forEach(key => { if (values[key]) formData.append(key, values[key]); });

        let result;
        if (editingRecord) {
            result = await updateSetting(editingRecord.id, formData);
        } else {
            result = await createSetting(formData);
        }

        if (result.success) {
            message.success(result.message);
            setIsModalOpen(false);
            form.resetFields();
        } else {
            message.error(result.message);
        }
        setLoading(false);
    };

    const openModal = (record: any = null) => {
        setEditingRecord(record);
        setIsModalOpen(true);
    };

    useEffect(() => {
        if (!isModalOpen) return;
        if (editingRecord) {
            form.setFieldsValue(editingRecord);
        } else {
            form.resetFields();
        }
    }, [isModalOpen, editingRecord, form]);

    const columns = [
        { title: 'Loại (Type)', dataIndex: 'type', key: 'type', width: 200 },
        { title: 'Giá trị (Value)', dataIndex: 'value', key: 'value', ellipsis: true },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            render: (_: any, record: any) => (
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button icon={<EditOutlined />} size="small" onClick={() => openModal(record)} />
                    <Popconfirm title="Xóa cài đặt này?" onConfirm={() => handleDelete(record.id)}>
                        <Button icon={<DeleteOutlined />} size="small" danger />
                    </Popconfirm>
                </div>
            )
        }
    ];

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(null)}>Thêm cấu hình</Button>
            </div>

            <Table dataSource={initialData} columns={columns} rowKey="id" />

            <Modal
                title={editingRecord ? "Cập nhật cấu hình" : "Thêm cấu hình"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnHidden={true}
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="type" label="Loại (Key)" rules={[{ required: true }]}>
                        <Input placeholder="VD: SYSTEM_COLOR, API_KEY..." disabled={!!editingRecord} />
                    </Form.Item>
                    <Form.Item name="value" label="Giá trị" rules={[{ required: true }]}>
                        <Input.TextArea rows={4} />
                    </Form.Item>
                    <div style={{ textAlign: 'right' }}>
                        <Button onClick={() => setIsModalOpen(false)} style={{ marginRight: 8 }}>Hủy</Button>
                        <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>Lưu</Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
