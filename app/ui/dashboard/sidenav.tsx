'use client';

import React from 'react';
import Image from 'next/image';
import { Layout, Menu, Divider, Typography } from 'antd';
import {
    HomeOutlined,
    ProjectOutlined,
    SettingOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    TeamOutlined,
    SafetyCertificateOutlined,
    UserOutlined,
    MessageOutlined,
    FileTextOutlined,
    SolutionOutlined,
    BookOutlined,
    AppstoreOutlined
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

const { Sider } = Layout;
const { Text } = Typography;

interface SideNavProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    isMobile?: boolean;
}

export default function SideNav({ collapsed, setCollapsed, isMobile = false }: SideNavProps) {
    const pathname = usePathname();
    const router = useRouter();

    // Menu items configuration

    const menuItems = [
        {
            key: '/dashboard/cong-dan',
            icon: <TeamOutlined />,
            label: 'Công dân',
        },
        {
            key: '/dashboard/cong-viec',
            icon: <ProjectOutlined />,
            label: 'Công việc',
        },
        {
            key: '/dashboard/data-don-an',
            icon: <SolutionOutlined />,
            label: 'Quản lý Đơn án',
        },
        {
            key: 'danh-muc', // SubMenu key
            icon: <AppstoreOutlined />,
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
            icon: <BookOutlined />,
            label: 'Tra cứu Bộ Luật',
        },
        {
            key: '/dashboard/nhan-vien',
            icon: <UserOutlined />,
            label: 'Nhân viên',
        },
        {
            key: '/dashboard/zalo',
            icon: <MessageOutlined />, // or WechatOutlined if available in generic
            label: 'Nhóm Zalo',
        },
        {
            key: '/dashboard/tai-lieu',
            icon: <FileTextOutlined />,
            label: 'Tài liệu',
        },
        {
            key: '/dashboard/phan-quyen',
            icon: <SafetyCertificateOutlined />,
            label: 'Phân quyền',
        },
        {
            key: '/dashboard/cai-dat',
            icon: <SettingOutlined />,
            label: 'Cài đặt',
        },
    ];

    const { data: session } = useSession();

    // Permission Mapping
    const PERMISSION_MAPPING: { [key: string]: string } = {
        '/dashboard/cong-dan': 'VIEW_CITIZEN',
        '/dashboard/cong-viec': 'VIEW_TASK',
        '/dashboard/nhan-vien': 'VIEW_EMPLOYEE',
        '/dashboard/zalo': 'VIEW_ZALO',
        '/dashboard/tai-lieu': 'VIEW_FILE',
        '/dashboard/phan-quyen': 'VIEW_USER',
        '/dashboard/cai-dat': 'VIEW_SETTING',
        // New Modules
        '/dashboard/data-don-an': 'VIEW_DATA_DON_AN',
        '/dashboard/bo-luat': 'VIEW_BO_LUAT',
        // Generic Modules - Map specific routes
        '/dashboard/danh-muc/nguoi-tham-gia': 'VIEW_NGUOI_THAM_GIA',
        '/dashboard/danh-muc/phuong-tien': 'VIEW_PHUONG_TIEN',
        '/dashboard/danh-muc/vat-chung': 'VIEW_VAT_CHUNG',
        '/dashboard/danh-muc/truy-na': 'VIEW_TRUY_NA',
        '/dashboard/danh-muc/tien-an': 'VIEW_TIEN_AN',
        '/dashboard/danh-muc/bien-phap': 'VIEW_BIEN_PHAP',
        '/dashboard/danh-muc/thong-tin-chat': 'VIEW_THONG_TIN_CHAT',
        // Add default mapping for parent 'danh-muc' if needed, or leave blank? 
        // Parent menu visibility depends on children usually or explicit check manually?
        // Sidenav logic: generic 'danh-muc' key -> 'VIEW_DANH_MUC' (Deleted).
        // Strategy: Parent shows if any child shows (Ant Design behavior usually requires logic, but here we filter item list).
        // Let's remove 'danh-muc' mapping and let logic handle it, OR map to a common permission if we had one.
        // Actually, the filter logic iterates children? No, it filters top level.
        // If top level has children, we need to filter children first.

        // Wait, current logic:
        // const requiredPerm = PERMISSION_MAPPING[item.key];
        // If item has children, we should check recursive access.

        // I need to update the filter logic in Step 3550. For now, add mappings.
    };

    const checkAccess = (key: string) => {
        const user = session?.user as any;
        if (user?.role === 'admin' || user?.permissions?.includes('MANAGE_SYSTEM')) return true;
        const requiredPerm = PERMISSION_MAPPING[key];
        if (!requiredPerm) return true; // Public or no specific lock
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

    const handleMenuClick = (key: string) => {
        router.push(key);
        // On mobile, close sidebar after navigation
        if (window.innerWidth < 992) {
            setCollapsed(true);
        }
    };

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/login' });
    };

    return (
        <>
            {/* Backdrop for mobile - click to close */}
            {!collapsed && (
                <div
                    className="sidebar-backdrop"
                    onClick={() => setCollapsed(true)}
                />
            )}

            <Sider
                className="custom-sidebar-white"
                trigger={null}
                theme="light"
                collapsible
                collapsed={collapsed}
                collapsedWidth={isMobile ? 0 : 55}
                width={260}
                style={{
                    position: 'fixed',
                    left: 0,
                    top: 55,
                    bottom: 0,
                    height: 'calc(100vh - 55px)',
                    zIndex: 1000,
                    // Mobile overlay behavior
                    boxShadow: isMobile && !collapsed ? '4px 0 24px rgba(0, 0, 0, 0.15)' : '4px 0 16px rgba(0, 0, 0, 0.04)', // Light vertical shadow
                    background: '#ffffff', // White background
                    backdropFilter: 'none',
                    borderRight: 'none', // Shadow handles separation
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                }}
            >
                {/* Branding Section */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '12px 0' : '16px 24px',
                    gap: 12,
                    height: 64, // Fixed height for branding area
                    transition: 'all 0.3s'
                }}>
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            flexShrink: 0,
                            position: 'relative'
                        }}
                    >
                        <Image
                            src="/images/logo.png"
                            alt="Logo"
                            fill
                            style={{ objectFit: 'contain' }}
                        />
                    </div>

                    {!collapsed && (
                        <Text strong style={{
                            fontSize: 18,
                            color: '#1b5e20', // Main Green
                            whiteSpace: 'nowrap',
                            opacity: collapsed ? 0 : 1,
                            transition: 'opacity 0.2s'
                        }}>
                            PC01 SYSTEM
                        </Text>
                    )}
                </div>

                <Divider style={{ margin: '0 16px 12px 16px', minWidth: 'unset', width: 'auto' }} />



                {/* Navigation Menu */}
                <Menu
                    mode="inline"
                    selectedKeys={[pathname]}
                    className="modern-sidebar-menu"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '12px 8px',
                        flex: 1,
                    }}
                    items={filteredMenuItems.map((item) => {
                        // Helper to format item for Ant Menu
                        const formatItem = (i: any): any => ({
                            key: i.key,
                            icon: i.icon ? <span style={{ fontSize: 20 }}>{i.icon}</span> : null,
                            label: collapsed ? null : <span style={{ color: '#000000', fontWeight: 500 }}>{i.label}</span>,
                            title: '',
                            onClick: i.children ? undefined : () => handleMenuClick(i.key),
                            children: i.children ? i.children.map(formatItem) : undefined
                        });
                        return formatItem(item);
                    })}
                />

                {/* Logout Button */}
                <div
                    style={{
                        padding: collapsed ? '16px 0' : '16px',
                        marginTop: 'auto', // Push to bottom
                    }}
                >
                    <button
                        onClick={handleLogout}
                        title=""
                        style={{
                            width: collapsed ? 40 : '100%',
                            height: collapsed ? 40 : 'auto',
                            padding: collapsed ? 0 : '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center', // Always center for consistency, or flex-start if expanded
                            gap: 12,
                            background: 'transparent',
                            border: '1px solid rgba(0, 0, 0, 0.05)',
                            borderRadius: collapsed ? '50%' : 10,
                            margin: collapsed ? '0 auto' : 0,
                            color: '#000000',
                            cursor: 'pointer',
                            fontSize: 14,
                            transition: 'all 0.2s ease',
                        }}
                        className="logout-btn"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ffebee';
                            e.currentTarget.style.color = '#d32f2f';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#000000';
                        }}
                    >
                        <LogoutOutlined style={{ fontSize: 20 }} />
                        {!collapsed && <span>Đăng xuất</span>}
                    </button>
                </div>
            </Sider>
        </>
    );
}
