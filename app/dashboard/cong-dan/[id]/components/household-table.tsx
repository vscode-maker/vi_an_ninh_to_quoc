'use client';

import { Table } from '@/app/ui/components/table';
import { Tag } from '@/app/ui/components/tag';
import Link from 'next/link';

interface HouseholdMember {
    id: string;
    hoTen: string;
    chuHo: boolean;
    ngaySinh: string | null;
    soCCCD: string | null;
}

export default function HouseholdTable({ data }: { data: HouseholdMember[] }) {
    const columns = [
        {
            title: 'Họ tên',
            dataIndex: 'hoTen',
            key: 'hoTen',
            render: (txt: string, rec: HouseholdMember) => (
                <Link href={`/dashboard/cong-dan/${rec.id}`} className="text-blue-600 hover:underline font-medium">
                    {txt}
                </Link>
            ),
        },
        {
            title: 'Vai trò',
            dataIndex: 'chuHo',
            key: 'chuHo',
            render: (val: boolean) => (val ? <Tag color="blue">Chủ hộ</Tag> : <Tag>Thành viên</Tag>),
        },
        {
            title: 'Ngày sinh',
            dataIndex: 'ngaySinh',
            key: 'ngaySinh',
        },
        {
            title: 'CCCD',
            dataIndex: 'soCCCD',
            key: 'soCCCD',
        },
    ];

    return <Table dataSource={data} columns={columns} rowKey="id" pagination={false} />;
}
