'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Layout, Input, Button, Modal, Form, Select, DatePicker, message, Row, Col, Typography, Tooltip, Avatar, Dropdown, MenuProps } from 'antd';
import { useRouter } from 'next/navigation';
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { createTask } from '@/lib/task-actions';

const { Header } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input; // This might be an issue if Input is removed from imports. Wait. Inner form uses Input.
// Input is used in CreateTaskForm, so I must NOT remove Input from imports entirely.
// I will keep Input in imports but remove Search related icons.

interface DashboardHeaderProps {
    collapsed: boolean;
    setCollapsed: (value: boolean) => void;
}

export default function DashboardHeader({ collapsed, setCollapsed }: DashboardHeaderProps) {
    const { replace, refresh } = useRouter();
    const { data: session } = useSession();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleSync = () => {
        refresh();
        message.success('Đã làm mới dữ liệu!');
    };

    return (
        <Header style={{
            padding: '0 24px 0 5px', // Adjusted left padding to 5px as requested
            background: 'linear-gradient(180deg, #1b5e20 0%, #2e7d32 100%)', // Green Gradient
            backdropFilter: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 55,
            borderBottom: 'none',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)', // Shadow for depth
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1001, // Above Sidebar (1000) if full width
        }}>
            {/* Left Section: Toggle Only */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Button
                    type="text"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={() => setCollapsed(!collapsed)}
                    style={{ fontSize: '24px', width: 46, height: 46, color: '#fff' }} // White icon
                />
            </div>

            {/* Right Section: User Profile & Logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Text strong style={{ color: '#fff', fontSize: 14 }}>
                            {session?.user?.name || 'User'}
                        </Text>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}>
                            {(session?.user as any)?.position || 'Chưa cập nhật'}
                        </Text>
                    </div>
                    <Avatar
                        size={36}
                        src={session?.user?.image}
                        icon={!session?.user?.image && <UserOutlined />}
                        style={{
                            background: '#fff',
                            color: '#1b5e20', // Green icon
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            cursor: 'pointer'
                        }}
                    />
                </div>
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
