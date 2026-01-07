
'use client';

import React from 'react';
import { Table, Space, Button, Tag, Tooltip } from 'antd';
import { EditOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteDataDonAn } from '@/lib/actions/data-don-an';

interface DataType {
    id: string;
    noiDung: string;
    trichYeu: string;
    phanLoai: string;
    ngayXayRa: string;
    trangThai: string;
}

interface Props {
    data: any[];
    total: number;
    page: number;
    pageSize: number;
}

const DataDonAnTable: React.FC<Props> = ({ data, total, page, pageSize }) => {
    const router = useRouter();

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa dữ liệu này?')) {
            try {
                await deleteDataDonAn(id);
                // Router refresh handled by action revalidate, but we might want client refresh to be sure
                // router.refresh();
            } catch (e) {
                alert('Xóa thất bại: ' + (e as any).message);
            }
        }
    };

    const columns = [
        {
            title: 'Mã',
            dataIndex: 'id',
            key: 'id',
            width: 100,
        },
        {
            title: 'Phân loại',
            dataIndex: 'phanLoai',
            key: 'phanLoai',
            width: 150,
            render: (text: string) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'Trích yếu',
            dataIndex: 'trichYeu',
            key: 'trichYeu',
            ellipsis: true,
        },
        {
            title: 'Ngày xảy ra',
            dataIndex: 'ngayXayRa',
            key: 'ngayXayRa',
            width: 120,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            key: 'trangThai',
            width: 150,
            render: (text: string) => {
                let color = 'default';
                if (text?.includes('Kết thúc')) color = 'success';
                if (text?.includes('Đang')) color = 'processing';
                return <Tag color={color}>{text}</Tag>;
            }
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            render: (_: any, record: DataType) => (
                <Space size="middle">
                    <Tooltip title="Xem chi tiết">
                        <Link href={`/dashboard/data-don-an/${record.id}`}>
                            <Button icon={<EyeOutlined />} size="small" />
                        </Link>
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Link href={`/dashboard/data-don-an/${record.id}?mode=edit`}>
                            <Button icon={<EditOutlined />} size="small" />
                        </Link>
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={() => handleDelete(record.id)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const handleTableChange = (pagination: any) => {
        const url = new URL(window.location.href);
        url.searchParams.set('page', pagination.current.toString());
        url.searchParams.set('pageSize', pagination.pageSize.toString());
        router.push(url.toString());
    };

    return (
        <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={{
                current: page,
                pageSize: pageSize,
                total: total,
                showSizeChanger: true,
            }}
            onChange={handleTableChange}
        />
    );
};

export default DataDonAnTable;
