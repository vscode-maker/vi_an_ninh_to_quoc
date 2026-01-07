
'use client';

import React from 'react';
import { Table, Tag } from 'antd';

interface DataType {
    idBoLuat: string;
    toiDanh: string;
    dieu: string;
    khoan: string;
    noiDung: string;
    mucHinhPhat: string;
}

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
            width: 80,
        },
        {
            title: 'Khoản',
            dataIndex: 'khoan',
            key: 'khoan',
            width: 80,
        },
        {
            title: 'Tội danh',
            dataIndex: 'toiDanh',
            key: 'toiDanh',
            width: 200,
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
            width: 150,
            render: (text: string) => <Tag>{text}</Tag>
        }
    ];

    return (
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
    );
};

export default BoLuatTable;
