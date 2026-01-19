'use client';

import React from 'react';
import BoLuatTable from './bo-luat-table';
import ClientSearch from '@/app/dashboard/data-don-an/client-search';

interface Props {
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    search: string;
}

export default function BoLuatView({ data, total, page, pageSize, search }: Props) {
    return (
        <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Tra cứu Bộ Luật</h2>

            <div className="mb-6">
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
