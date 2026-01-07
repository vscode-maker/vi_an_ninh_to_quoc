
'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { createGroupZalo, updateGroupZalo, deleteGroupZalo } from '@/lib/group-zalo-actions';

export default function ZaloTable({ initialData }: any) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleDelete = async (id: string) => {
        const result = await deleteGroupZalo(id);
        if (result.success) message.success(result.message);
        else message.error(result.message);
    };

    const onFinish = async (values: any) => {
        setLoading(true);
        const formData = new FormData();
        Object.keys(values).forEach(key => { if (values[key]) formData.append(key, values[key]); });

        let result;
        if (editingRecord) {
            result = await updateGroupZalo(editingRecord.groupId, formData);
        } else {
            result = await createGroupZalo(formData);
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
        { title: 'ID Nhóm', dataIndex: 'groupId', key: 'groupId' },
        { title: 'Tên Nhóm', dataIndex: 'name', key: 'name' },
        {
            title: 'Link Nhóm',
            dataIndex: 'groupLink',
            key: 'groupLink',
            render: (text: string) => text ? <a href={text} target="_blank" rel="noreferrer">Tham gia</a> : '-'
        },
        { title: 'Mô tả', dataIndex: 'groupDescription', key: 'groupDescription' },
        { title: 'Trạng thái', dataIndex: 'status', render: (st: string) => <Tag color="success">{st}</Tag> },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: any) => (
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button icon={<EditOutlined />} size="small" onClick={() => openModal(record)} />
                    <Popconfirm title="Xóa nhóm này?" onConfirm={() => handleDelete(record.groupId)}>
                        <Button icon={<DeleteOutlined />} size="small" danger />
                    </Popconfirm>
                </div>
            )
        }
    ];

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(null)}>Thêm nhóm Zalo</Button>
            </div>

            <Table dataSource={initialData} columns={columns} rowKey="groupId" />

            <Modal
                title={editingRecord ? "Cập nhật nhóm" : "Thêm nhóm Zalo"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnHidden={true}
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    {!editingRecord && (
                        <Form.Item name="groupId" label="ID Nhóm (Tùy chọn)">
                            <Input placeholder="Để trống sẽ tự sinh" />
                        </Form.Item>
                    )}
                    <Form.Item name="name" label="Tên nhóm" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="groupLink" label="Link tham gia">
                        <Input />
                    </Form.Item>
                    <Form.Item name="groupDescription" label="Mô tả">
                        <Input.TextArea />
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
