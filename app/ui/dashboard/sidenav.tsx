'use client';

import React from 'react';
import Image from 'next/image';
import { Layout, Menu, Avatar, Typography, Tooltip } from 'antd';
import {
    DashboardOutlined,
    TeamOutlined,
    SettingOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UserOutlined,
    FileTextOutlined,
    ProjectOutlined,
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
    const { data: session } = useSession();

    // Menu items configuration
    const menuItems = [
        {
            key: '/dashboard',
            icon: <ProjectOutlined />,
            label: 'Công việc',
        },
    ];

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
                className="modern-sidebar"
                trigger={null}
                collapsible
                collapsed={collapsed}
                collapsedWidth={isMobile ? 0 : 80}
                width={260}
                style={{
                    position: 'fixed',
                    left: 0,
                    top: 64,
                    bottom: 0,
                    height: 'calc(100vh - 64px)',
                    zIndex: 1000,
                    // Mobile overlay behavior
                    boxShadow: isMobile && !collapsed ? '4px 0 24px rgba(27, 94, 32, 0.5)' : '4px 0 24px rgba(27, 94, 32, 0.15)',
                    background: 'linear-gradient(180deg, #1b5e20 0%, #2e7d32 100%)', // Dark Green Gradient
                    backdropFilter: 'blur(16px)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                }}
            >
                {/* Logo & Toggle Section */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center', // This can be removed or kept, as the inner div handles it
                        padding: collapsed ? '15px 0' : '15px 16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        transition: 'all 0.3s ease',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: collapsed ? 'center' : 'flex-start', width: '100%' }}>
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                background: '#fff', // White background for Green theme contrast
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                flexShrink: 0
                            }}
                        >
                            <Image
                                src="/images/logo.png"
                                alt="Logo"
                                width={32}
                                height={32}
                                style={{ objectFit: 'contain' }}
                            />
                        </div>
                        {!collapsed && (
                            <Text strong style={{ color: '#fff', fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                PC01 System
                            </Text>
                        )}
                    </div>
                </div>



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
                    items={menuItems.map((item) => ({
                        key: item.key,
                        icon: collapsed ? (
                            <Tooltip
                                title={item.label}
                                placement="right"
                                styles={{
                                    root: {
                                        background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                                        color: '#fff',
                                        borderRadius: '6px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                    }
                                }}
                            >
                                <span style={{ fontSize: 18 }}>
                                    {item.icon}
                                </span>
                            </Tooltip>
                        ) : (
                            <span style={{ fontSize: 18 }}>
                                {item.icon}
                            </span>
                        ),
                        label: collapsed ? null : item.label,
                        onClick: () => handleMenuClick(item.key),
                    }))}
                />

                {/* User Profile Section - Moved to Bottom */}
                <div
                    style={{
                        padding: collapsed ? '16px 0' : '16px',
                        display: 'flex',
                        flexDirection: collapsed ? 'column' : 'row',
                        alignItems: 'center',
                        gap: 12,
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        transition: 'all 0.3s ease',
                    }}
                >
                    <Avatar
                        size={collapsed ? 40 : 48}
                        src={session?.user?.image}
                        icon={!session?.user?.image && <UserOutlined />}
                        style={{
                            background: '#fff', // White background
                            color: '#2e7d32', // Green icon
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            transition: 'all 0.3s ease',
                        }}
                    />
                    {!collapsed && (
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <Text
                                strong
                                style={{
                                    color: '#fff',
                                    display: 'block',
                                    fontSize: 14,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {session?.user?.name || 'User'}
                            </Text>
                            <Text
                                style={{
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontSize: 12,
                                    display: 'block',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {(session?.user as any)?.position || 'Chưa cập nhật chức vụ'}
                            </Text>
                        </div>
                    )}
                </div>

                {/* Logout Button */}
                <div
                    style={{
                        padding: collapsed ? '16px 0' : '16px',
                    }}
                >
                    <Tooltip
                        title={collapsed ? 'Đăng xuất' : ''}
                        placement="right"
                        styles={{
                            root: {
                                background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                                color: '#fff',
                                borderRadius: '6px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }
                        }}
                    >
                        <button
                            onClick={handleLogout}
                            style={{
                                width: '100%',
                                padding: collapsed ? '12px 0' : '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                gap: 12,
                                background: 'rgba(0, 0, 0, 0.2)', // Darker background for separation
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: 10,
                                color: 'rgba(255, 255, 255, 0.8)',
                                cursor: 'pointer',
                                fontSize: 14,
                                transition: 'all 0.2s ease',
                            }}
                            className="logout-btn"
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#ffebee'; // Light Red
                                e.currentTarget.style.color = '#d32f2f'; // Red Text
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)';
                                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                            }}
                        >
                            <LogoutOutlined style={{ fontSize: 18 }} />
                            {!collapsed && <span>Đăng xuất</span>}
                        </button>
                    </Tooltip>
                </div>
            </Sider>
        </>
    );
}
