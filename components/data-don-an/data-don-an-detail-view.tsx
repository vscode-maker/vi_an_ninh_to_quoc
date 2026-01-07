
'use client';

import React from 'react';
import { Typography, Breadcrumb, Button } from 'antd';
import Link from 'next/link';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import DataDonAnDetailTabs from '@/components/data-don-an/detail-tabs';

interface Props {
    data: any;
}

export default function DataDonAnDetailView({ data }: Props) {
    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: 16 }}>
                <Breadcrumb items={[
                    { title: <Link href="/dashboard">Dashboard</Link> },
                    { title: <Link href="/dashboard/data-don-an">DataDonAn</Link> },
                    { title: data.id },
                ]} />
            </div>

            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography.Title level={3} style={{ margin: 0 }}>
                    Chi tiết Đơn án: {data.id}
                </Typography.Title>
                <div>
                    <Link href={`/dashboard/data-don-an/${data.id}/edit`}>
                        <Button icon={<EditOutlined />} style={{ marginRight: 8 }}>Chỉnh sửa</Button>
                    </Link>
                    <Link href="/dashboard/data-don-an">
                        <Button icon={<ArrowLeftOutlined />}>Quay lại</Button>
                    </Link>
                </div>
            </div>

            <DataDonAnDetailTabs data={data} />
        </div>
    );
}
