'use client';

import { Table } from '@/app/ui/components/table';
import { Tag } from '@/app/ui/components/tag';
import Link from 'next/link';

interface FamilyMember {
    key: string;
    name: string;
    cccd: string | null;
    relation: string;
    id: string;
}

export default function FamilyTable({ data }: { data: FamilyMember[] }) {
    const columns = [
        {
            title: 'Họ tên',
            dataIndex: 'name',
            key: 'name',
            render: (txt: string, rec: FamilyMember) => (
                <Link href={`/dashboard/cong-dan/${rec.id}`} className="text-blue-600 hover:underline font-medium">
                    {txt}
                </Link>
            ),
        },
        {
            title: 'Quan hệ',
            dataIndex: 'relation',
            key: 'relation',
            render: (txt: string) => <Tag color="cyan">{txt}</Tag>,
        },
        {
            title: 'CCCD',
            dataIndex: 'cccd',
            key: 'cccd',
        },
    ];

    return <Table dataSource={data} columns={columns} rowKey="key" pagination={false} />;
}
