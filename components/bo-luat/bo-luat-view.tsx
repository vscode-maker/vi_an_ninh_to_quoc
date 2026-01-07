
'use client';

import React from 'react';
import BoLuatTable from './bo-luat-table';
import ClientSearch from '@/app/dashboard/data-don-an/client-search';
import { Typography } from 'antd';

interface Props {
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    search: string;
}

export default function BoLuatView({ data, total, page, pageSize, search }: Props) {
    return (
        <div style={{ padding: '24px' }}>
            <Typography.Title level={2}>Tra cứu Bộ Luật</Typography.Title>

            <div style={{ marginBottom: 16 }}>
                <ClientSearch initialSearch={search} />
            </div>

            <BoLuatTable
                data={data}
                total={total}
                page={page}
                pageSize={pageSize}
            />
        </div>
    );
}
