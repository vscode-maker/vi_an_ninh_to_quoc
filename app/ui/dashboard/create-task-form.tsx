'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Select, Button, Row, Col, Typography, message, Upload, Card } from 'antd';
import { UploadOutlined, PlusOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import { createTask, getExecutionUnits, getZaloGroups } from '@/lib/task-actions';

const { Option, OptGroup } = Select;
const { Text, Title } = Typography;
const { TextArea } = Input;

interface CreateTaskFormProps {
    onSuccess: () => void;
}

const CreateTaskForm = React.memo(function CreateTaskForm({ onSuccess }: CreateTaskFormProps) {
    const [form] = Form.useForm();
    const requestType = Form.useWatch('requestType', form);
    const [executionUnits, setExecutionUnits] = useState<string[]>([]);
    const [zaloGroups, setZaloGroups] = useState<{ groupId: string; name: string }[]>([]);
    const [fileList, setFileList] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [units, groups] = await Promise.all([
                    getExecutionUnits(),
                    getZaloGroups()
                ]);
                setExecutionUnits(units);
                setZaloGroups(groups);
            } catch (error) {
                console.error("Failed to fetch form data", error);
            }
        };
        fetchData();
    }, []);

    const onFinish = async (values: any) => {
        const formData = new FormData();

        // Basic fields
        Object.keys(values).forEach(key => {
            if (key !== 'files' && key !== 'relatedPeople' && values[key] !== undefined && values[key] !== null) {
                if (key === 'deadline' && values[key]) {
                    formData.append(key, values[key].toISOString());
                } else {
                    formData.append(key, values[key]);
                }
            }
        });

        // Add hardcoded status if not present
        if (!values.status) {
            formData.append('status', 'Chưa thực hiện');
        }

        // Related People (More Info)
        if (values.relatedPeople && values.relatedPeople.length > 0) {
            formData.append('moreInfo', JSON.stringify(values.relatedPeople));
        }

        // Files
        fileList.forEach((file: any) => {
            if (file.originFileObj) {
                formData.append('files', file.originFileObj);
            }
        });

        const result = await createTask(null, formData);
        if (result.success) {
            message.success(result.message);
            onSuccess();
        } else {
            message.error(result.message);
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
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ requestType: 'Sao kê', status: 'Chưa thực hiện' }}>

            {/* 1. Loại Yêu Cầu */}
            <div style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                <Title level={5} style={{ color: '#52c41a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    1. Loại Yêu Cầu
                </Title>
                <Form.Item name="requestType" label="Chọn loại yêu cầu" rules={[{ required: true }]}>
                    <Select placeholder="-- Chọn loại yêu cầu --" size="large">
                        <OptGroup label="🏦 Bank">
                            <Option key="bank_saoke" value="Sao kê">Sao kê</Option>
                            <Option value="Cung cấp thông tin">Cung cấp thông tin</Option>
                            <Option value="Cung cấp IP">Cung cấp IP</Option>
                            <Option value="Cung cấp hình ảnh">Cung cấp hình ảnh</Option>
                        </OptGroup>
                        <OptGroup label="📱 Số điện thoại">
                            <Option value="Rút list">Rút list</Option>
                            <Option value="Quét Imei">Quét Imei</Option>
                            <Option value="Giám sát">Giám sát</Option>
                            <Option value="Định vị">Định vị</Option>
                        </OptGroup>
                        <OptGroup label="💬 Zalo">
                            <Option value="Cung cấp thông tin Zalo">Cung cấp thông tin Zalo</Option>
                            <Option value="Cung cấp IP Zalo">Cung cấp IP Zalo</Option>
                        </OptGroup>
                        <OptGroup label="📄 Công văn">
                            <Option value="Công văn">Công văn</Option>
                            <Option value="Uỷ thác điều tra">Uỷ thác điều tra</Option>
                        </OptGroup>
                        <OptGroup label="🔍 Xác minh">
                            <Option value="Xác minh phương tiện">Xác minh phương tiện</Option>
                            <Option value="Xác minh đối tượng">Xác minh đối tượng</Option>
                            <Option value="Vẽ sơ đồ đường dây">Vẽ sơ đồ đường dây</Option>
                            <Option value="Khác">Khác</Option>
                        </OptGroup>
                    </Select>
                </Form.Item>
            </div>

            {/* 2. Thông Tin Chung */}
            <div style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                <Title level={5} style={{ color: '#52c41a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    2. Thông Tin Chung
                </Title>

                <Form.Item name="groupId" label="Nhóm" rules={[{ required: true, message: 'Vui lòng chọn nhóm' }]}>
                    <Select placeholder="-- Chọn nhóm --" showSearch optionFilterProp="children" size="large">
                        {zaloGroups.map(group => (
                            <Option key={group.groupId} value={group.groupId}>{group.name}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="targetName" label="Họ Tên Đối Tượng" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                            <Input placeholder="Nhập tên đối tượng" size="large" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="deadline" label="Thời Hạn">
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="dd/mm/yyyy" size="large" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="executionUnit" label="Đơn vị Thực Hiện">
                    <Select placeholder="Chọn đơn vị thực hiện..." showSearch optionFilterProp="children" size="large">
                        {executionUnits.map((unit) => (
                            <Option key={unit} value={unit}>{unit}</Option>
                        ))}
                    </Select>
                </Form.Item>
            </div>

            {/* 3. Chi Tiết Yêu Cầu */}
            <div style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                <Title level={5} style={{ color: '#52c41a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    3. Chi Tiết Yêu Cầu
                </Title>

                {['Sao kê', 'Cung cấp thông tin', 'Cung cấp IP', 'Cung cấp hình ảnh'].includes(requestType) && (
                    <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                        <Text strong style={{ display: 'block', marginBottom: 12 }}>Thông tin ngân hàng:</Text>
                        <Row gutter={16}>
                            <Col span={8}><Form.Item name="accountNumber" label="Số tài khoản"><Input /></Form.Item></Col>
                            <Col span={8}><Form.Item name="bankName" label="Ngân hàng"><Input /></Form.Item></Col>
                            <Col span={8}><Form.Item name="accountName" label="Tên chủ TK"><Input /></Form.Item></Col>
                        </Row>
                    </div>
                )}

                {['Rút list', 'Định vị', 'Quét Imei', 'Giám sát'].includes(requestType) && (
                    <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                        <Text strong style={{ display: 'block', marginBottom: 12 }}>Thông tin thuê bao:</Text>
                        <Row gutter={16}>
                            <Col span={12}><Form.Item name="phoneNumber" label="Số điện thoại"><Input /></Form.Item></Col>
                            <Col span={12}><Form.Item name="carrier" label="Nhà mạng"><Input /></Form.Item></Col>
                        </Row>
                    </div>
                )}

                {['Cung cấp thông tin Zalo', 'Cung cấp IP Zalo'].includes(requestType) && (
                    <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                        <Text strong style={{ display: 'block', marginBottom: 12 }}>Thông tin Zalo:</Text>
                        <Row gutter={16}>
                            <Col span={12}><Form.Item name="phoneNumber" label="Số điện thoại Zalo"><Input /></Form.Item></Col>
                            <Col span={12}><Form.Item name="carrier" label="Nhà mạng"><Input /></Form.Item></Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}><Form.Item name="qrCode" label="Mã QR/ID Zalo"><Input placeholder="Nhập mã QR hoặc ID Zalo" /></Form.Item></Col>
                            <Col span={12}><Form.Item name="socialAccountName" label="Tên tài khoản MXH"><Input placeholder="Tên hiển thị trên Zalo" /></Form.Item></Col>
                        </Row>
                    </div>
                )}

                {['Công văn', 'Uỷ thác điều tra'].includes(requestType) && (
                    <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                        <Form.Item name="documentInfo" label="Thông tin văn bản/Quyết định">
                            <Input.TextArea rows={2} placeholder="Số công văn, ngày tháng, nội dung tóm tắt..." />
                        </Form.Item>
                    </div>
                )}
            </div>

            {/* 4. Nội Dung & Đính Kèm */}
            <div style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                <Title level={5} style={{ color: '#52c41a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    4. Nội Dung & Đính Kèm
                </Title>

                <Form.Item name="content" label="Nội dung chi tiết/Ghi chú">
                    <TextArea rows={4} placeholder="Nhập nội dung chi tiết..." />
                </Form.Item>

                <Form.Item label="File đính kèm">
                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />}>Chọn file</Button>
                    </Upload>
                </Form.Item>

                {/* Related People Section */}
                <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8, marginTop: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 16 }}><UserOutlined /> Thông tin đối tượng liên quan (Optional)</Text>
                    <Form.List name="relatedPeople">
                        {(fields, { add, remove }) => (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Card
                                        key={key}
                                        size="small"
                                        title={`Đối tượng #${name + 1}`}
                                        extra={<CloseOutlined onClick={() => remove(name)} />}
                                    >
                                        <Row gutter={16}>
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
                                            <Col span={8}>
                                                <Form.Item {...restField} name={[name, 'ngay_sinh']} label="Ngày sinh">
                                                    <Input placeholder="DD/MM/YYYY" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item {...restField} name={[name, 'gioi_tinh']} label="Giới tính">
                                                    <Select placeholder="Chọn">
                                                        <Option value="Nam">Nam</Option>
                                                        <Option value="Nữ">Nữ</Option>
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item {...restField} name={[name, 'cccd_cmnd']} label="CCCD/CMND">
                                                    <Input placeholder="Số CCCD" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={24}>
                                                <Form.Item {...restField} name={[name, 'ho_khau_thuong_tru']} label="HKTT">
                                                    <Input placeholder="Hộ khẩu thường trú" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={24}>
                                                <Form.Item {...restField} name={[name, 'cho_o_hien_nay']} label="Chỗ ở hiện nay">
                                                    <Input placeholder="Chỗ ở hiện nay" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={24}>
                                                <Form.Item {...restField} name={[name, 'link_facebook']} label="Link Facebook">
                                                    <Input placeholder="https://facebook.com/..." />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Card>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Thêm thông tin đối tượng
                                </Button>
                            </div>
                        )}
                    </Form.List>
                </div>
            </div>

            {/* 5. Trạng Thái */}
            <div style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                <Title level={5} style={{ color: '#52c41a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    5. Trạng Thái
                </Title>
                <Form.Item name="status" label="Trạng Thái" rules={[{ required: true }]}>
                    <Select size="large">
                        <Option value="Chưa thực hiện">Chưa thực hiện</Option>
                        <Option value="Đang thực hiện">Đang thực hiện</Option>
                        <Option value="Hoàn thành">Hoàn thành</Option>
                        <Option value="Chờ kết quả">Chờ kết quả</Option>
                    </Select>
                </Form.Item>
            </div>

            <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: 16, textAlign: 'right' }}>
                <Button style={{ marginRight: 8 }} onClick={onSuccess}>
                    Hủy
                </Button>
                <Button type="primary" htmlType="submit" style={{ background: '#52c41a', borderColor: '#52c41a', minWidth: 100 }}>
                    Lưu Công Việc
                </Button>
            </div>
        </Form>
    )
});

export default CreateTaskForm;
