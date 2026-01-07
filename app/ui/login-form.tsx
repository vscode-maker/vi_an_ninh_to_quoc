'use client';

import { useActionState, startTransition, useEffect, useState } from 'react';
import { authenticate } from '@/lib/actions';
import { Button, Form, Input, Alert, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

export default function LoginForm() {
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const onFinish = (values: any) => {
        const formData = new FormData();
        formData.append('soHieu', values.soHieu);
        formData.append('password', values.password);

        startTransition(() => {
            dispatch(formData);
        });
    };

    if (!isMounted) return null; // Avoid hydration mismatch from extensions

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#f0f2f5', // Clean, corporate light grey/white background
            position: 'relative'
        }}>
            <Card
                style={{ width: 400, border: 'none', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                styles={{ body: { padding: 0 } }}
            >
                {/* Green Header */}
                <div style={{
                    background: '#2e7d32', // Forest Green
                    padding: '32px 24px',
                    textAlign: 'center',
                    color: '#fff'
                }}>
                    <div style={{
                        width: 80,
                        height: 80,
                        background: '#fff',
                        borderRadius: '50%',
                        margin: '0 auto 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        {/* Ensure logo path is correct relative to public */}
                        <img src="/images/logo.png" alt="Logo" width={50} height={50} style={{ objectFit: 'contain' }} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase' }}>ĐĂNG NHẬP</h2>
                    <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: 13 }}>Hệ thống quản lý công việc PC01</p>
                </div>

                {/* Form Body */}
                <div style={{ padding: '32px 24px' }}>
                    <Form
                        name="login_form"
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        layout="vertical"
                        size="large"
                    >
                        <Form.Item
                            label={<span style={{ fontWeight: 600 }}>Số Hiệu</span>}
                            name="soHieu"
                            rules={[{ required: true, message: 'Vui lòng nhập số hiệu!' }]}
                        >
                            <Input
                                prefix={<UserOutlined style={{ color: '#aaa' }} />}
                                placeholder="Nhập số hiệu..."
                                style={{ borderRadius: 8 }}
                                autoComplete="username"
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={{ fontWeight: 600 }}>Mật Khẩu</span>}
                            name="password"
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#aaa' }} />}
                                placeholder="Nhập mật khẩu..."
                                style={{ borderRadius: 8 }}
                                autoComplete="current-password"
                            />
                        </Form.Item>

                        {errorMessage && (
                            <Form.Item>
                                <Alert title={<span style={{ fontWeight: 600 }}>Lỗi đăng nhập</span>} description={errorMessage} type="error" showIcon style={{ borderRadius: 8 }} />
                            </Form.Item>
                        )}

                        <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={isPending}
                                style={{
                                    background: '#2e7d32', // Match header green
                                    borderColor: '#2e7d32',
                                    height: 48,
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                    borderRadius: 8,
                                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)'
                                }}
                            >
                                Đăng Nhập
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </Card>

            <div style={{ marginTop: 24, color: '#666', fontSize: 12 }}>
                © 2025 PC01 - Văn phòng Cơ quan Cảnh sát điều tra
            </div>
        </div>
    );
}
