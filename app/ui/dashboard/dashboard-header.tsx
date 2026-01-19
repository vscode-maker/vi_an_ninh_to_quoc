'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChevronRight, Menu, Camera, Key, Upload as UploadIcon, LogOut } from 'lucide-react';
import { updateAvatarAction, updatePasswordAction } from '@/lib/user-actions';
import { Modal } from '@/app/ui/components/modal';
import { Button } from '@/app/ui/components/button';
import { Input } from '@/app/ui/components/input';
import { Dropdown, DropdownItem } from '@/app/ui/components/dropdown';
// Remove import { signOut } from 'next-auth/react'; // If needed, or handle logout via action

interface DashboardHeaderProps {
    isMobile: boolean;
    onMobileMenuOpen: () => void;
}

export default function DashboardHeader({ isMobile, onMobileMenuOpen }: DashboardHeaderProps) {
    const { replace, refresh } = useRouter();
    const pathname = usePathname();
    const { data: session } = useSession();

    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Get page title from pathname
    const getPageTitle = () => {
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length > 1) {
            const page = segments[segments.length - 1];
            const titles: { [key: string]: string } = {
                'cong-dan': 'Công dân',
                'cong-viec': 'Công việc',
                'nhan-vien': 'Nhân viên',
                'zalo': 'Nhóm Zalo',
                'tai-lieu': 'Tài liệu',
                'phan-quyen': 'Phân quyền',
                'cai-dat': 'Cài đặt',
                'data-don-an': 'Quản lý Đơn án',
                'bo-luat': 'Tra cứu Bộ Luật',
                'ocr': 'OCR Công dân',
                'danh-muc': 'Danh mục',
            };
            return titles[page] || page.charAt(0).toUpperCase() + page.slice(1).replace(/-/g, ' ');
        }
        return 'Dashboard';
    };

    const handleUpdateAvatar = async () => {
        if (!avatarFile) {
            alert('Vui lòng chọn ảnh!'); // Simple alert for now, or use custom toast later
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append('file', avatarFile);

        const result = await updateAvatarAction(formData);
        if (result.success) {
            setIsAvatarModalOpen(false);
            setAvatarFile(null);
            window.location.reload();
        } else {
            alert(result.message);
        }
        setUploading(false);
    };

    const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setChangingPassword(true);
        const formData = new FormData(e.currentTarget);

        // Simple client-side validation
        const newPass = formData.get('newPassword') as string;
        const confirmPass = formData.get('confirmPassword') as string;

        if (newPass !== confirmPass) {
            alert('Mật khẩu không khớp!');
            setChangingPassword(false);
            return;
        }

        const result = await updatePasswordAction(null, formData);
        if (result.success) {
            alert(result.message);
            setIsPasswordModalOpen(false);
        } else {
            alert(result.message);
        }
        setChangingPassword(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAvatarFile(e.target.files[0]);
        }
    };

    return (
        <header style={{
            padding: '0 24px',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
            borderBottom: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
            position: 'fixed',
            top: 0,
            left: isMobile ? 0 : 256,
            right: 0,
            zIndex: 999,
        }}>
            {/* Left Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Mobile menu toggle */}
                {isMobile && (
                    <button
                        onClick={onMobileMenuOpen}
                        className="btn-icon"
                        style={{ width: 40, height: 40 }}
                    >
                        <Menu size={20} />
                    </button>
                )}

                {/* Breadcrumb */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Home</span>
                    <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ color: 'var(--color-text-primary)', fontSize: 14, fontWeight: 500 }}>
                        {getPageTitle()}
                    </span>
                </nav>
            </div>

            {/* Right Section: User Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="hidden md:flex flex-col items-end">
                    <span className="font-semibold text-sm text-gray-900">
                        {session?.user?.name || 'User'}
                    </span>
                    <span className="text-xs text-gray-500">
                        {(session?.user as any)?.position || 'Chưa cập nhật'}
                    </span>
                </div>

                <Dropdown
                    align="right"
                    trigger={
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-info) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            overflow: 'hidden'
                        }}>
                            {session?.user?.image ? (
                                <img src={session.user.image} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>
                                    {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                            )}
                        </div>
                    }
                    menu={
                        <>
                            <DropdownItem icon={<Camera size={16} />} onClick={() => setIsAvatarModalOpen(true)}>
                                Đổi ảnh đại diện
                            </DropdownItem>
                            <DropdownItem icon={<Key size={16} />} onClick={() => setIsPasswordModalOpen(true)}>
                                Đổi mật khẩu
                            </DropdownItem>
                        </>
                    }
                />
            </div>

            {/* Avatar Update Modal */}
            <Modal
                title="Thay đổi ảnh đại diện"
                isOpen={isAvatarModalOpen}
                onClose={() => { setIsAvatarModalOpen(false); setAvatarFile(null); }}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => { setIsAvatarModalOpen(false); setAvatarFile(null); }}>
                            Hủy
                        </Button>
                        <Button onClick={handleUpdateAvatar} loading={uploading}>
                            Lưu thay đổi
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col items-center gap-5">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                        {avatarFile ? (
                            <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <img src={session?.user?.image || "/images/logo.png"} alt="Current" className="w-full h-full object-cover" />
                        )}
                    </div>

                    <div className="relative">
                        <input
                            type="file"
                            id="avatar-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="avatar-upload">
                            <Button variant="secondary" icon={<UploadIcon size={16} />} as="span" className="cursor-pointer">
                                Chọn ảnh mới
                            </Button>
                        </label>
                    </div>
                    <p className="text-xs text-gray-500">Hỗ trợ: JPG, PNG, GIF</p>
                </div>
            </Modal>

            {/* Password Update Modal */}
            <Modal
                title="Đổi mật khẩu"
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            >
                <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
                    <Input
                        type="password"
                        name="currentPassword"
                        label="Mật khẩu hiện tại"
                        required
                        placeholder="Nhập mật khẩu cũ"
                    />
                    <Input
                        type="password"
                        name="newPassword"
                        label="Mật khẩu mới"
                        required
                        placeholder="Nhập mật khẩu mới"
                        minLength={6}
                    />
                    <Input
                        type="password"
                        name="confirmPassword"
                        label="Xác nhận mật khẩu mới"
                        required
                        placeholder="Nhập lại mật khẩu mới"
                    />
                    <div className="flex justify-end gap-3 mt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsPasswordModalOpen(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" loading={changingPassword}>
                            Cập nhật mật khẩu
                        </Button>
                    </div>
                </form>
            </Modal>
        </header>
    );
}
