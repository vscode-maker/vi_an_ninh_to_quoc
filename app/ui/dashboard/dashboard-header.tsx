'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Layout, Input, Button, Modal, Form, Select, DatePicker, message, Row, Col, Typography, Tooltip, Avatar, Dropdown, MenuProps } from 'antd';
import { useRouter } from 'next/navigation';
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, LoadingOutlined, UploadOutlined, KeyOutlined, CameraOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { createTask } from '@/lib/task-actions';
import { updateAvatarAction, updatePasswordAction } from '@/lib/user-actions';
import { Upload, Spin } from 'antd';

const { Header } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface DashboardHeaderProps {
    collapsed: boolean;
    setCollapsed: (value: boolean) => void;
}

export default function DashboardHeader({ collapsed, setCollapsed }: DashboardHeaderProps) {
    const { replace, refresh } = useRouter();
    const { data: session } = useSession();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // New State for Profile Updates
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // ... existing handleSync

    // Avatar Menu Handlers
    const handleAvatarMenuClick: MenuProps['onClick'] = (e) => {
        if (e.key === 'change-avatar') setIsAvatarModalOpen(true);
        if (e.key === 'change-password') setIsPasswordModalOpen(true);
        if (e.key === 'logout') {
            // Let the Logout button in Sidebar handle this, or duplicate logic?
            // User didn't ask to execute logout here, just options.
            // But usually a dropdown has logout. 
            // Current Requirement: "Change Avatar" and "Change Password".
            // Sidebar has logout. I won't move logout here unless asked.
        }
    };

    const userMenuProps: MenuProps = {
        items: [
            {
                key: 'change-avatar',
                label: 'Đổi ảnh đại diện',
                icon: <CameraOutlined />,
            },
            {
                key: 'change-password',
                label: 'Đổi mật khẩu',
                icon: <KeyOutlined />,
            },
        ],
        onClick: handleAvatarMenuClick,
    };

    // Avatar Upload Handler
    const handleUpdateAvatar = async () => {
        if (!avatarFile) {
            message.error('Vui lòng chọn ảnh!');
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append('file', avatarFile);

        const result = await updateAvatarAction(formData);
        if (result.success) {
            message.success(result.message);
            setIsAvatarModalOpen(false);
            setAvatarFile(null);
            // Force session update usually requires reload or tricky re-fetch
            window.location.reload(); // Simplest way to refresh session image
        } else {
            message.error(result.message);
        }
        setUploading(false);
    };

    // Password Update Handler
    const handleUpdatePassword = async (values: any) => {
        setChangingPassword(true);
        const formData = new FormData();
        formData.append('currentPassword', values.currentPassword);
        formData.append('newPassword', values.newPassword);
        formData.append('confirmPassword', values.confirmPassword);

        const result = await updatePasswordAction(null, formData);
        if (result.success) {
            message.success(result.message);
            setIsPasswordModalOpen(false);
        } else {
            message.error(result.message);
        }
        setChangingPassword(false);
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
                <Text strong style={{ color: '#fff', fontSize: 20, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                    VÌ AN NINH TỔ QUỐC
                </Text>
            </div>

            {/* Right Section: User Profile & Logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="user-info-details" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Text strong style={{ color: '#fff', fontSize: 14 }}>
                            {session?.user?.name || 'User'}
                        </Text>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}>
                            {(session?.user as any)?.position || 'Chưa cập nhật'}
                        </Text>
                    </div>

                    <Dropdown menu={userMenuProps} placement="bottomRight" arrow>
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
                    </Dropdown>
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

            {/* Avatar Update Modal */}
            <Modal
                title="Thay đổi ảnh đại diện"
                open={isAvatarModalOpen}
                onCancel={() => {
                    setIsAvatarModalOpen(false);
                    setAvatarFile(null);
                }}
                onOk={handleUpdateAvatar}
                confirmLoading={uploading}
                okText="Lưu thay đổi"
                cancelText="Hủy"
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                    <div style={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid #eee',
                        position: 'relative'
                    }}>
                        {avatarFile ? (
                            <img src={URL.createObjectURL(avatarFile)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <img src={session?.user?.image || "/images/logo.png"} alt="Current" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                    </div>
                    <Upload
                        beforeUpload={(file) => {
                            setAvatarFile(file);
                            return false; // Prevent auto upload
                        }}
                        showUploadList={false}
                        maxCount={1}
                    >
                        <Button icon={<UploadOutlined />}>Chọn ảnh mới</Button>
                    </Upload>
                    <Text type="secondary" style={{ fontSize: 12 }}>Hỗ trợ: JPG, PNG, GIF</Text>
                </div>
            </Modal>

            {/* Password Update Modal */}
            <Modal
                title="Đổi mật khẩu"
                open={isPasswordModalOpen}
                onCancel={() => setIsPasswordModalOpen(false)}
                footer={null}
            >
                <Form layout="vertical" onFinish={handleUpdatePassword}>
                    <Form.Item
                        name="currentPassword"
                        label="Mật khẩu hiện tại"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu cũ" />
                    </Form.Item>
                    <Form.Item
                        name="newPassword"
                        label="Mật khẩu mới"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }, { min: 6, message: 'Tối thiểu 6 ký tự' }]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu mới" />
                    </Form.Item>
                    <Form.Item
                        name="confirmPassword"
                        label="Xác nhận mật khẩu mới"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Mật khẩu không khớp!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder="Nhập lại mật khẩu mới" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block loading={changingPassword}>
                        Cập nhật mật khẩu
                    </Button>
                </Form>
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
