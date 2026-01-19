'use client';

import { useActionState, useEffect, useState } from 'react';
import { authenticate } from '@/lib/actions';
import { Button } from '@/app/ui/components/button';
import { Input } from '@/app/ui/components/input';
import { Card } from '@/app/ui/components/card';
import { User, Lock, AlertCircle } from 'lucide-react';

export default function LoginForm() {
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#f0f2f5',
            position: 'relative'
        }}>
            <Card
                className="w-[400px] border-none !p-0 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
                bodyStyle={{ padding: 0 }}
            >
                {/* Green Header */}
                <div style={{
                    background: '#2e7d32',
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
                        <img src="/images/logo.png" alt="Logo" width={50} height={50} style={{ objectFit: 'contain' }} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase' }}>ĐĂNG NHẬP</h2>
                    <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: 13 }}>Hệ thống quản lý công việc PC01</p>
                </div>

                {/* Form Body */}
                <div style={{ padding: '32px 24px' }}>
                    <form action={dispatch} className="flex flex-col gap-5">
                        <div className="space-y-1">
                            <label className="block text-sm font-semibold mb-1">Số Hiệu</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <User size={16} />
                                </span>
                                <Input
                                    name="soHieu"
                                    placeholder="Nhập số hiệu..."
                                    className="pl-10"
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-semibold mb-1">Mật Khẩu</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Lock size={16} />
                                </span>
                                <Input
                                    type="password"
                                    name="password"
                                    placeholder="Nhập mật khẩu..."
                                    className="pl-10"
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        {errorMessage && (
                            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                                <AlertCircle size={16} />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <div className="mt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                loading={isPending}
                                className="w-full h-12 text-lg font-bold shadow-lg"
                                style={{
                                    background: '#2e7d32',
                                    borderColor: '#2e7d32',
                                }}
                            >
                                Đăng Nhập
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>

            <div style={{ marginTop: 24, color: '#666', fontSize: 12 }}>
                © 2025 PC01 - Văn phòng Cơ quan Cảnh sát điều tra
            </div>
        </div>
    );
}
