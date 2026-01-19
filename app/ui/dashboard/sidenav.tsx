'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    User as UserIcon
} from 'lucide-react';
import {
    Users,
    FolderOpen,
    Settings,
    LogOut,
    Scan,
    FileText,
    MessageSquare,
    Shield,
    BookOpen,
    ClipboardList,
    Database
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

// const { Text } = Typography; // Removed Antd

interface SideNavProps {
    isMobile?: boolean;
    mobileOpen?: boolean;
    setMobileOpen?: (open: boolean) => void;
}

export default function SideNav({ isMobile = false, mobileOpen = false, setMobileOpen }: SideNavProps) {
    const pathname = usePathname();
    const router = useRouter();

    // Menu items configuration with Lucide icons
    const menuItems = [
        {
            key: '/dashboard/cong-dan',
            icon: <Users size={20} />,
            label: 'Công dân',
        },
        {
            key: '/dashboard/cong-dan/ocr',
            icon: <Scan size={20} />,
            label: 'OCR Công dân',
        },
        {
            key: '/dashboard/cong-viec',
            icon: <ClipboardList size={20} />,
            label: 'Công việc',
        },
        {
            key: '/dashboard/data-don-an',
            icon: <Database size={20} />,
            label: 'Quản lý Đơn án',
        },
        {
            key: 'danh-muc',
            icon: <FolderOpen size={20} />,
            label: 'Danh mục dữ liệu',
            children: [
                { key: '/dashboard/danh-muc/nguoi-tham-gia', label: 'Người tham gia tố tụng' },
                { key: '/dashboard/danh-muc/phuong-tien', label: 'Phương tiện' },
                { key: '/dashboard/danh-muc/vat-chung', label: 'Vật chứng' },
                { key: '/dashboard/danh-muc/truy-na', label: 'Truy nã' },
                { key: '/dashboard/danh-muc/tien-an', label: 'Tiền án tiền sự' },
                { key: '/dashboard/danh-muc/bien-phap', label: 'Biện pháp ngăn chặn' },
                { key: '/dashboard/danh-muc/cong-van', label: 'Thông tin công văn' },
                { key: '/dashboard/danh-muc/phan-cong', label: 'Thông tin phân công' },
                { key: '/dashboard/danh-muc/qua-trinh', label: 'Quá trình điều tra' },
                { key: '/dashboard/danh-muc/thanh-vien', label: 'Thành viên trong hộ' },
                { key: '/dashboard/danh-muc/hanh-vi', label: 'Hành vi tội danh' },
                { key: '/dashboard/danh-muc/tai-khoan', label: 'Thông tin tài khoản' },
                { key: '/dashboard/danh-muc/thiet-hai', label: 'Thông tin thiệt hại' },
                { key: '/dashboard/danh-muc/thong-tin-chat', label: 'Thông tin chat' },
            ]
        },
        {
            key: '/dashboard/bo-luat',
            icon: <BookOpen size={20} />,
            label: 'Tra cứu Bộ Luật',
        },
        {
            key: '/dashboard/nhan-vien',
            icon: <UserIcon size={20} />,
            label: 'Nhân viên',
        },
        {
            key: '/dashboard/zalo',
            icon: <MessageSquare size={20} />,
            label: 'Nhóm Zalo',
        },
        {
            key: '/dashboard/tai-lieu',
            icon: <FileText size={20} />,
            label: 'Tài liệu',
        },
        {
            key: '/dashboard/phan-quyen',
            icon: <Shield size={20} />,
            label: 'Phân quyền',
        },
    ];

    const { data: session } = useSession();

    // Permission Mapping
    const PERMISSION_MAPPING: { [key: string]: string } = {
        '/dashboard/cong-dan': 'VIEW_CITIZEN',
        '/dashboard/cong-dan/ocr': 'CREATE_CITIZEN',
        '/dashboard/cong-viec': 'VIEW_TASK',
        '/dashboard/nhan-vien': 'VIEW_EMPLOYEE',
        '/dashboard/zalo': 'VIEW_ZALO',
        '/dashboard/tai-lieu': 'VIEW_FILE',
        '/dashboard/phan-quyen': 'VIEW_USER',
        '/dashboard/cai-dat': 'VIEW_SETTING',
        '/dashboard/data-don-an': 'VIEW_DATA_DON_AN',
        '/dashboard/bo-luat': 'VIEW_BO_LUAT',
        '/dashboard/danh-muc/nguoi-tham-gia': 'VIEW_NGUOI_THAM_GIA',
        '/dashboard/danh-muc/phuong-tien': 'VIEW_PHUONG_TIEN',
        '/dashboard/danh-muc/vat-chung': 'VIEW_VAT_CHUNG',
        '/dashboard/danh-muc/truy-na': 'VIEW_TRUY_NA',
        '/dashboard/danh-muc/tien-an': 'VIEW_TIEN_AN',
        '/dashboard/danh-muc/bien-phap': 'VIEW_BIEN_PHAP',
        '/dashboard/danh-muc/thong-tin-chat': 'VIEW_THONG_TIN_CHAT',
    };

    const checkAccess = (key: string) => {
        const user = session?.user as any;
        if (user?.role === 'admin' || user?.permissions?.includes('MANAGE_SYSTEM')) return true;
        const requiredPerm = PERMISSION_MAPPING[key];
        if (!requiredPerm) return true;
        return user?.permissions?.includes(requiredPerm);
    };

    const filterItems = (items: any[]): any[] => {
        return items.reduce((acc, item) => {
            if (item.children) {
                const filteredChildren = filterItems(item.children);
                if (filteredChildren.length > 0) {
                    acc.push({ ...item, children: filteredChildren });
                }
            } else {
                if (checkAccess(item.key)) {
                    acc.push(item);
                }
            }
            return acc;
        }, []);
    };

    const filteredMenuItems = filterItems(menuItems);

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/login' });
    };

    const isActive = (key: string) => {
        // Exact match for specific routes that have children routes
        if (key === '/dashboard/cong-dan') {
            return pathname === key;
        }
        // For other routes, check exact match or prefix
        return pathname === key || pathname.startsWith(key + '/');
    };

    const closeMobileMenu = () => {
        if (isMobile && setMobileOpen) {
            setMobileOpen(false);
        }
    };

    // Desktop sidebar - always visible, not collapsible
    if (!isMobile) {
        return (
            <aside
                style={{
                    width: 256,
                    background: '#ffffff',
                    borderRight: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    zIndex: 1000,
                }}
            >
                {/* Logo Section - 64px height like reference */}
                <div style={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    padding: '0 20px',
                    borderBottom: '1px solid var(--color-border)',
                    gap: 5,
                }}>
                    <Image
                        src="/images/logo.png"
                        alt="PC01"
                        width={40}
                        height={40}
                        style={{ objectFit: 'contain' }}
                        priority
                    />
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#0284c7', whiteSpace: 'nowrap' }}>PC01 SYSTEM</span>
                </div>

                {/* Navigation */}
                <nav style={{
                    flex: 1,
                    padding: '16px 12px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                }}>
                    {filteredMenuItems.map((item) => {
                        if (item.children) {
                            return (
                                <details key={item.key} style={{ marginBottom: 4 }}>
                                    <summary
                                        className="nav-link"
                                        style={{
                                            cursor: 'pointer',
                                            listStyle: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                        }}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </summary>
                                    <div style={{ paddingLeft: 32, marginTop: 4 }}>
                                        {item.children.map((child: any) => (
                                            <Link
                                                key={child.key}
                                                href={child.key}
                                                className={isActive(child.key) ? 'nav-link-active' : 'nav-link'}
                                                style={{ fontSize: 13, padding: '8px 12px' }}
                                            >
                                                {child.label}
                                            </Link>
                                        ))}
                                    </div>
                                </details>
                            );
                        }

                        return (
                            <Link
                                key={item.key}
                                href={item.key}
                                className={isActive(item.key) ? 'nav-link-active' : 'nav-link'}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div style={{
                    padding: '12px',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                }}>
                    <Link
                        href="/dashboard/cai-dat"
                        className={isActive('/dashboard/cai-dat') ? 'nav-link-active' : 'nav-link'}
                    >
                        <Settings size={20} />
                        <span>Cài đặt</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="nav-link"
                        style={{
                            width: '100%',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--color-error)',
                            cursor: 'pointer',
                        }}
                    >
                        <LogOut size={20} />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </aside>
        );
    }

    // Mobile sidebar - overlay style
    return (
        <>
            {/* Backdrop */}
            {mobileOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.3)',
                        zIndex: 40,
                    }}
                    onClick={closeMobileMenu}
                />
            )}

            <aside
                style={{
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 280,
                    background: '#ffffff',
                    borderRight: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 50,
                    transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s ease',
                    boxShadow: mobileOpen ? '4px 0 24px rgba(0, 0, 0, 0.15)' : 'none',
                }}
            >
                {/* Logo Section */}
                <div style={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    padding: '0 20px',
                    borderBottom: '1px solid var(--color-border)',
                    gap: 5,
                }}>
                    <Image
                        src="/images/logo.png"
                        alt="PC01"
                        width={40}
                        height={40}
                        style={{ objectFit: 'contain' }}
                        priority
                    />
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#0284c7', whiteSpace: 'nowrap' }}>PC01 SYSTEM</span>
                </div>

                {/* Navigation */}
                <nav style={{
                    flex: 1,
                    padding: '16px 12px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                }}>
                    {filteredMenuItems.map((item) => {
                        if (item.children) {
                            return (
                                <details key={item.key}>
                                    <summary className="nav-link" style={{ cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </summary>
                                    <div style={{ paddingLeft: 32, marginTop: 4 }}>
                                        {item.children.map((child: any) => (
                                            <Link
                                                key={child.key}
                                                href={child.key}
                                                className={isActive(child.key) ? 'nav-link-active' : 'nav-link'}
                                                style={{ fontSize: 13, padding: '8px 12px' }}
                                                onClick={closeMobileMenu}
                                            >
                                                {child.label}
                                            </Link>
                                        ))}
                                    </div>
                                </details>
                            );
                        }

                        return (
                            <Link
                                key={item.key}
                                href={item.key}
                                className={isActive(item.key) ? 'nav-link-active' : 'nav-link'}
                                onClick={closeMobileMenu}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div style={{ padding: '12px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Link href="/dashboard/cai-dat" className={isActive('/dashboard/cai-dat') ? 'nav-link-active' : 'nav-link'} onClick={closeMobileMenu}>
                        <Settings size={20} />
                        <span>Cài đặt</span>
                    </Link>
                    <button onClick={handleLogout} className="nav-link" style={{ width: '100%', border: 'none', background: 'transparent', color: 'var(--color-error)', cursor: 'pointer' }}>
                        <LogOut size={20} />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
