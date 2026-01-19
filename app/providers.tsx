// 'use client'; // Already there
import { SessionProvider } from "next-auth/react";
// import { App } from "antd"; // Removed

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            {children}
        </SessionProvider>
    );
}

