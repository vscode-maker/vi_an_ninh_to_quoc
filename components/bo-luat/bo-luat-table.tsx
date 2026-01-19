'use client';

import React from 'react';
import { Table } from '@/app/ui/components/table';
import { Tag } from '@/app/ui/components/tag';

interface Props {
    data: any[];
    total: number;
    page: number;
    pageSize: number;
}

const BoLuatTable: React.FC<Props> = ({ data, total, page, pageSize }) => {

    const columns = [
        {
            title: 'Điều',
            dataIndex: 'dieu',
            key: 'dieu',
            width: '80px',
        },
        {
            title: 'Khoản',
            dataIndex: 'khoan',
            key: 'khoan',
            width: '80px',
        },
        {
            title: 'Tội danh',
            dataIndex: 'toiDanh',
            key: 'toiDanh',
            width: '200px',
        },
        {
            title: 'Nội dung',
            dataIndex: 'noiDung',
            key: 'noiDung',
        },
        {
            title: 'Mức hình phạt',
            dataIndex: 'mucHinhPhat',
            key: 'mucHinhPhat',
            width: '150px',
            render: (text: string) => <Tag>{text}</Tag>
        }
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <Table
                columns={columns}
                dataSource={data}
                rowKey="idBoLuat"
                pagination={{
                    current: page,
                    pageSize: pageSize,
                    total: total,
                }}
            />
        </div>
    );
};

export default BoLuatTable;
