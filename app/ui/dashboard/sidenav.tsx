'use client';

import React from 'react';
import Image from 'next/image';
import { Layout, Menu, Divider, Typography } from 'antd';
import {
    ProjectOutlined,
    LogoutOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

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
                            VANTQ
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
                    items={menuItems.map((item) => ({
                        key: item.key,
                        icon: (
                            <span style={{ fontSize: 20 }}>
                                {item.icon}
                            </span>
                        ),
                        label: collapsed ? null : <span style={{ color: '#000000', fontWeight: 500 }}>{item.label}</span>,
                        title: '', // Disable tooltip
                        onClick: () => handleMenuClick(item.key),
                    }))}
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
