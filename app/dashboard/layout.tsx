'use client';

import DashboardHeader from '@/app/ui/dashboard/dashboard-header';
import SideNav from '@/app/ui/dashboard/sidenav';
import React from 'react';

import { Suspense } from 'react';
import Loading from './loading';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const [isMobile, setIsMobile] = React.useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    React.useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 992;
            setIsMobile(mobile);
            if (!mobile) {
                setMobileMenuOpen(false); // Close mobile menu when switching to desktop
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
            {/* Desktop Sidebar - always visible */}
            {!isMobile && <SideNav isMobile={false} />}

            {/* Mobile Sidebar - overlay */}
            {isMobile && (
                <SideNav
                    isMobile={true}
                    mobileOpen={mobileMenuOpen}
                    setMobileOpen={setMobileMenuOpen}
                />
            )}

            {/* Header */}
            <DashboardHeader
                isMobile={isMobile}
                onMobileMenuOpen={() => setMobileMenuOpen(true)}
            />

            {/* Main Content */}
            <main
                style={{
                    marginLeft: isMobile ? 0 : 256,
                    marginTop: 64,
                    minHeight: 'calc(100vh - 64px)',
                    padding: '32px', // Increased padding for minimalist look
                    transition: 'margin-left 0.3s ease',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)'
                }}
            >
                <Suspense fallback={<Loading />} key={pathname}>
                    {children}
                </Suspense>
            </main>
        </div>
    );
}
