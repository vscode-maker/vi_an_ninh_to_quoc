import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0284c7',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: "PC01 SYSTEM - Hệ thống Quản lý PC01",
  description: "Hệ thống quản lý công việc và tiến độ PC01",
  openGraph: {
    title: "PC01 SYSTEM - Hệ thống Quản lý PC01",
    description: "Theo dõi và cập nhật trạng thái công việc",
    url: '/',
    siteName: 'PC01 SYSTEM',
    images: [
      {
        url: '/images/logo.png',
        width: 800,
        height: 600,
        alt: 'Logo PC01',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
};

// import { auth } from "@/auth"; // Remove
import { Providers } from "./providers";

// import { AntdRegistry } from '@ant-design/nextjs-registry';
// import { ConfigProvider } from 'antd';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const session = await auth(); // Remove

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

