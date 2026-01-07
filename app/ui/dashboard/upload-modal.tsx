'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Button, Row, Col, Card, DatePicker, Select, Upload, message, Typography } from 'antd';
import { PaperClipOutlined, UserOutlined, PlusOutlined, CloseOutlined, InboxOutlined } from '@ant-design/icons';
import type { Task } from '@prisma/client';
import { uploadTaskFiles } from '@/lib/task-actions';

const { Text } = Typography;
const { Option } = Select;

interface UploadFilesModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    task: Task | null;
}

const UploadFilesModal = React.memo(function UploadFilesModal({ visible, onCancel, onSuccess, task }: UploadFilesModalProps) {
    const [fileList, setFileList] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [form] = Form.useForm();

    const [messageApi, contextHolder] = message.useMessage();

    React.useEffect(() => {
        if (visible) {
            form.resetFields();
            setFileList([]);
        }
    }, [visible, form]);

    const handleUpload = async () => {
        const values = form.getFieldsValue();
        const hasFiles = fileList.length > 0;
        const hasRelatedPeople = values.relatedPeople && values.relatedPeople.length > 0;

        if (!task || (!hasFiles && !hasRelatedPeople)) {
            messageApi.warning('Vui lòng chọn ít nhất 1 file hoặc nhập thông tin người liên quan');
            return;
        }

        setUploading(true);
        const formData = new FormData();

        if (values.note) formData.append('note', values.note);

        const relatedPeople = values.relatedPeople;
        if (relatedPeople && relatedPeople.length > 0) {
            formData.append('moreInfo', JSON.stringify({ relatedPeople }));
        }

        fileList.forEach((file: any) => {
            // When using beforeUpload returning false, 'file' is the File object itself
            formData.append('files', file);
        });

        try {
            const result = await uploadTaskFiles(task.id, formData);
            if (result.success) {
                messageApi.success(result.message);
                onSuccess();
            } else {
                messageApi.error(result.message);
            }
        } catch (error) {
            console.error(error);
            messageApi.error('Lỗi tải lên');
        } finally {
            setUploading(false);
        }
    };

    const uploadProps: any = {
        onRemove: (file: any) => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: (file: any) => {
            setFileList(prev => [...prev, file]);
            return false;
        },
        fileList,
        multiple: true,
    };

    return (
        <Modal
            title={`Đính kèm file cho: ${task?.requesterName || 'Công việc'}`}
            open={visible}
            onCancel={onCancel}
            width={700}
            footer={[
                <Button key="cancel" onClick={onCancel}>Hủy</Button>,
                <Button
                    key="upload"
                    type="primary"
                    loading={uploading}
                    onClick={handleUpload}
                    style={{ background: '#1890ff' }}
                >
                    {uploading ? 'Đang tải lên...' : 'Tải lên ngay'}
                </Button>,
            ]}
        >
            {contextHolder}
            <Form form={form} layout="vertical">
                <div style={{ marginBottom: 16 }}>
                    <Text strong><PaperClipOutlined /> Chọn file:</Text>
                    <Upload.Dragger {...uploadProps} style={{ marginTop: 8 }}>
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Kéo thả file vào đây hoặc click để chọn</p>
                    </Upload.Dragger>
                </div>

                <Form.Item name="note" label="Ghi chú file">
                    <Input.TextArea rows={2} placeholder="Nhập ghi chú chung cho các file..." />
                </Form.Item>

                <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 8 }}>
                    <Text strong><UserOutlined /> Thông tin đối tượng liên quan (Optional)</Text>
                    <Form.List name="relatedPeople">
                        {(fields, { add, remove }) => (
                            <div style={{ marginTop: 8 }}>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Card
                                        key={key}
                                        size="small"
                                        style={{ marginBottom: 8 }}
                                        extra={<CloseOutlined onClick={() => remove(name)} />}
                                    >
                                        <Row gutter={12}>
                                            <Col span={12}>
                                                <Form.Item {...restField} name={[name, 'ho_ten']} label="Họ tên">
                                                    <Input placeholder="Họ tên" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item {...restField} name={[name, 'so_dien_thoai']} label="Số điện thoại">
                                                    <Input placeholder="Số điện thoại" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item {...restField} name={[name, 'ngay_sinh']} label="Ngày sinh">
                                                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item {...restField} name={[name, 'gioi_tinh']} label="Giới tính">
                                                    <Select placeholder="Chọn">
                                                        <Option value="Nam">Nam</Option>
                                                        <Option value="Nữ">Nữ</Option>
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item {...restField} name={[name, 'ho_khau_thuong_tru']} label="HKTT">
                                                    <Input placeholder="Hộ khẩu thường trú" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Card>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Thêm người liên quan
                                </Button>
                            </div>
                        )}
                    </Form.List>
                </div>
            </Form>
        </Modal>
    );
});

export default UploadFilesModal;
