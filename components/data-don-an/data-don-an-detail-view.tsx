'use client';

import React from 'react';
import { Button } from '@/app/ui/components/button';
import Link from 'next/link';
import { ArrowLeft, Edit, ChevronRight } from 'lucide-react';
import DataDonAnDetailTabs from '@/components/data-don-an/detail-tabs';

interface Props {
    data: any;
}

export default function DataDonAnDetailView({ data }: Props) {
    return (
        <div className="p-6">
            <div className="mb-4">
                <nav className="flex items-center text-sm text-gray-500">
                    <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
                    <ChevronRight size={16} className="mx-2" />
                    <Link href="/dashboard/data-don-an" className="hover:text-blue-600">DataDonAn</Link>
                    <ChevronRight size={16} className="mx-2" />
                    <span className="text-gray-900 font-medium truncate max-w-[200px]">{data.id}</span>
                </nav>
            </div>

            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 m-0">
                    Chi tiết Đơn án: {data.id}
                </h3>
                <div className="flex gap-2">
                    <Link href={`/dashboard/data-don-an/${data.id}/edit`}>
                        <Button icon={<Edit size={16} />} variant="primary">Chỉnh sửa</Button>
                    </Link>
                    <Link href="/dashboard/data-don-an">
                        <Button icon={<ArrowLeft size={16} />} variant="secondary">Quay lại</Button>
                    </Link>
                </div>
            </div>

            <DataDonAnDetailTabs data={data} />
        </div>
    );
}
