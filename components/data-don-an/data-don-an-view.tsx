'use client';

import React from 'react';
import DataDonAnTable from './data-don-an-table';
import ClientSearch from '@/app/dashboard/data-don-an/client-search';
import { Button } from '@/app/ui/components/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface Props {
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    search: string;
}

export default function DataDonAnView({ data, total, page, pageSize, search }: Props) {
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Quản lý Đơn án (DataDonAn)</h2>
                <Link href="/dashboard/don-an/create">
                    <Button variant="primary" icon={<Plus size={20} />} className="bg-green-600 hover:bg-green-700 border-green-600 text-white">
                        Tạo mới Vụ việc / Vụ án
                    </Button>
                </Link>
            </div>

            <div className="mb-6">
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
