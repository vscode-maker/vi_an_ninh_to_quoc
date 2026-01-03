'use client';

import React, { useState } from 'react';
import { Layout, Input, Button, Modal, Form, Select, DatePicker, message, Row, Col, Typography, Tooltip } from 'antd';
import { SearchOutlined, SyncOutlined, PlusOutlined, MenuFoldOutlined, MenuUnfoldOutlined, CloseOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { createTask } from '@/lib/task-actions';

const { Header } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface DashboardHeaderProps {
    collapsed: boolean;
    setCollapsed: (value: boolean) => void;
}

export default function DashboardHeader({ collapsed, setCollapsed }: DashboardHeaderProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace, refresh } = useRouter();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Search Toggle State
    const [isSearchVisible, setIsSearchVisible] = useState(false);

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('query', term);
        } else {
            params.delete('query');
        }
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    const handleSync = () => {
        refresh();
        message.success('Đã làm mới dữ liệu!');
    };

    return (
        <Header style={{
            padding: '0 24px',
            background: 'linear-gradient(180deg, #1b5e20 0%, #2e7d32 100%)', // Match Sidebar Green
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)', // White border for dark bg
            boxShadow: '0 4px 20px rgba(27, 94, 32, 0.15)', // Green shadow
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1001, // Above Sidebar (1000) if full width
        }}>
            {/* Left Section: Toggle + Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Button
                    type="text"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={() => setCollapsed(!collapsed)}
                    style={{ fontSize: '16px', width: 46, height: 46, color: '#fff' }} // White icon
                />

                <Title level={4} style={{ margin: 0, color: '#fff', whiteSpace: 'nowrap', fontSize: 20 }}>
                    CÔNG VIỆC
                </Title>
            </div>

            {/* Right Section: Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {isSearchVisible ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn 0.3s' }}>
                        <Input
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="Tìm kiếm công việc..."
                            style={{
                                width: 250,
                                borderRadius: 20,
                                background: '#fff', // White input
                                border: 'none',
                                transition: 'width 0.3s ease'
                            }}
                            onChange={(e) => handleSearch(e.target.value)}
                            defaultValue={searchParams.get('query')?.toString()}
                            autoFocus
                        />
                        <Button
                            type="text"
                            shape="circle"
                            icon={<CloseOutlined style={{ color: '#fff' }} />} // White close icon
                            onClick={() => setIsSearchVisible(false)}
                        />
                    </div>
                ) : (
                    <Tooltip title="Tìm kiếm">
                        <Button
                            type="text"
                            shape="circle"
                            icon={<SearchOutlined style={{ fontSize: 18, color: '#fff' }} />} // White search icon
                            onClick={() => setIsSearchVisible(true)}
                        />
                    </Tooltip>
                )}
            </div>

            {/* Global Create Task Modal */}
            <Modal
                title="Thêm mới công việc"
                open={isCreateModalOpen}
                onCancel={() => setIsCreateModalOpen(false)}
                footer={null}
                width={800}
                destroyOnHidden
            >
                <CreateTaskForm onSuccess={() => {
                    setIsCreateModalOpen(false);
                    refresh();
                }} />
            </Modal>
        </Header>
    );
}

// Reuse CreateTaskForm logic here (or extract to separate file, but keeping collocated for speed as per user "move HTML" request)
function CreateTaskForm({ onSuccess }: { onSuccess: () => void }) {
    const [form] = Form.useForm();
    const requestType = Form.useWatch('requestType', form);

    const onFinish = async (values: any) => {
        const formData = new FormData();
        Object.keys(values).forEach(key => {
            if (values[key] !== undefined && values[key] !== null) {
                if (key === 'deadline' && values[key]) {
                    formData.append(key, values[key].toISOString());
                } else {
                    formData.append(key, values[key]);
                }
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

    return (
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ requestType: 'Sao kê' }}>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="targetName" label="Họ tên đối tượng" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="requesterName" label="Người yêu cầu">
                        <Input disabled placeholder="Tự động lấy theo user đang đăng nhập" />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item name="requestType" label="Loại yêu cầu" rules={[{ required: true }]}>
                <Select>
                    <Option value="Sao kê">Sao kê (Ngân hàng)</Option>
                    <Option value="Xác minh số điện thoại">Xác minh SĐT</Option>
                    <Option value="Zalo">Zalo</Option>
                    <Option value="Công văn">Công văn</Option>
                </Select>
            </Form.Item>

            {/* Dynamic Fields */}
            {(requestType === 'Sao kê' || !requestType) && (
                <Row gutter={16}>
                    <Col span={8}><Form.Item name="accountNumber" label="Số tài khoản"><Input /></Form.Item></Col>
                    <Col span={8}><Form.Item name="bankName" label="Ngân hàng"><Input /></Form.Item></Col>
                    <Col span={8}><Form.Item name="accountName" label="Tên chủ TK"><Input /></Form.Item></Col>
                </Row>
            )}
            {requestType === 'Xác minh số điện thoại' && (
                <Row gutter={16}>
                    <Col span={12}><Form.Item name="phoneNumber" label="Số điện thoại"><Input /></Form.Item></Col>
                    <Col span={12}><Form.Item name="carrier" label="Nhà mạng"><Input /></Form.Item></Col>
                </Row>
            )}

            <Form.Item name="deadline" label="Hạn chót">
                <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="content" label="Nội dung">
                <TextArea rows={4} />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>Tạo mới</Button>
        </Form>
    )
}
