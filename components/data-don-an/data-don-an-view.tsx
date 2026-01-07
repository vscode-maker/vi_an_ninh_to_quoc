
'use client';

import React from 'react';
import DataDonAnTable from './data-don-an-table';
import ClientSearch from '@/app/dashboard/data-don-an/client-search';
import { Button, Row, Col, Typography } from 'antd';
import Link from 'next/link';
import { PlusOutlined } from '@ant-design/icons';

interface Props {
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    search: string;
}

export default function DataDonAnView({ data, total, page, pageSize, search }: Props) {
    return (
        <div style={{ padding: '24px' }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Typography.Title level={2}>Quản lý Đơn án (DataDonAn)</Typography.Title>
                </Col>
                <Col>
                    <Link href="/dashboard/data-don-an/create">
                        <Button type="primary" icon={<PlusOutlined />}>
                            Thêm mới
                        </Button>
                    </Link>
                </Col>
            </Row>

            <div style={{ marginBottom: 16 }}>
                <ClientSearch initialSearch={search} />
            </div>

            <DataDonAnTable
                data={data}
                total={total}
                page={page}
                pageSize={pageSize}
            />
        </div>
    );
}
