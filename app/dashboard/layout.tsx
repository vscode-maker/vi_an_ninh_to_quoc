'use client';

import { Layout, theme, Button } from 'antd';
import { MenuUnfoldOutlined } from '@ant-design/icons';
import DashboardHeader from '@/app/ui/dashboard/dashboard-header';
import SideNav from '@/app/ui/dashboard/sidenav';
import React from 'react';

const { Content } = Layout;

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const [collapsed, setCollapsed] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 992;
            setIsMobile(mobile);
            if (mobile) {
                setCollapsed(true);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* Global Header */}
            <DashboardHeader collapsed={collapsed} setCollapsed={setCollapsed} />

            <Layout hasSider style={{ marginTop: 64 }}> {/* Offset for fixed header */}
                <SideNav collapsed={collapsed} setCollapsed={setCollapsed} isMobile={isMobile} />

                <Layout
                    className="site-layout"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        marginLeft: isMobile ? 0 : (collapsed ? 80 : 260),
                        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: '#f0f2f5'
                    }}
                >
                    <Content style={{ margin: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        {children}
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    );
}

