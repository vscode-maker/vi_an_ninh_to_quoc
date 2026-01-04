import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: "VANTQ - Hệ thống Quản lý PC01",
  description: "Hệ thống quản lý công việc và tiến độ PC01",
  openGraph: {
    title: "VANTQ - Hệ thống Quản lý PC01",
    description: "Theo dõi và cập nhật trạng thái công việc",
    url: '/',
    siteName: 'VANTQ System',
    images: [
      {
        url: '/images/logo.png',
        width: 800,
        height: 600,
        alt: 'Logo VANTQ',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
};

import { auth } from "@/auth";
import { Providers } from "./providers";

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#2e7d32',
                borderRadius: 8,
              },
            }}
          >
            <Providers session={session}>
              {children}
            </Providers>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}

