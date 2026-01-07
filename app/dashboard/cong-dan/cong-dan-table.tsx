
'use client';

import { useState } from 'react';
import { Table, Button, Input, Space, Tooltip, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useRouter, usePathname, useSearchParams } from 'next/navigation'; // import corrected
import { useDebouncedCallback } from 'use-debounce';
import CongDanModal from './components/cong-dan-modal';
import { deleteCongDan } from '@/lib/cong-dan-actions';

// Define Table Columns
const columns = (onEdit: (record: any) => void, onDelete: (id: string) => void, canEdit: boolean, canDelete: boolean) => [
    { title: 'Họ tên', dataIndex: 'hoTen', key: 'hoTen', width: 200, fixed: 'left' as const },
    { title: 'Số CMND/CCCD', key: 'idCard', width: 150, render: (_: any, record: any) => record.soCCCD || record.soCMND || 'N/A' },
    { title: 'Giới tính', dataIndex: 'gioiTinh', key: 'gioiTinh', width: 80 },
    { title: 'Ngày sinh', dataIndex: 'ngaySinh', key: 'ngaySinh', width: 120 },
    { title: 'Quê quán', dataIndex: 'queQuan', key: 'queQuan', width: 200, ellipsis: true },
    { title: 'Nơi thường trú', dataIndex: 'noiThuongTru', key: 'noiThuongTru', width: 250, ellipsis: true },
    { title: 'SĐT', dataIndex: 'soDienThoai', key: 'soDienThoai', width: 120 },
    {
        title: 'Hành động',
        key: 'action',
        fixed: 'right' as const,
        width: 100,
        render: (_: any, record: any) => (
            <Space size="small">
                {canEdit && (
                    <Tooltip title="Sửa">
                        <Button type="text" icon={<EditOutlined style={{ color: '#1976d2' }} />} onClick={() => onEdit(record)} />
                    </Tooltip>
                )}
                {canDelete && (
                    <Tooltip title="Xóa">
                        <Popconfirm title="Bạn có chắc muốn xóa?" onConfirm={() => onDelete(record.id)} okText="Xóa" cancelText="Hủy">
                            <Button type="text" icon={<DeleteOutlined style={{ color: '#d32f2f' }} />} />
                        </Popconfirm>
                    </Tooltip>
                )}
            </Space>
        )
    }
];

export default function CongDanTable({ initialData, total, currentPage, searchQuery, userPermissions = [], userRole }: any) {
    console.log('CongDanTable props:', { userRole, userPermissions });
    const { replace } = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);

    const canCreate = userRole?.toLowerCase() === 'admin' || userPermissions.includes('CREATE_CITIZEN');
    const canEdit = userRole?.toLowerCase() === 'admin' || userPermissions.includes('EDIT_CITIZEN');
    const canDelete = userRole?.toLowerCase() === 'admin' || userPermissions.includes('DELETE_CITIZEN');

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');
        if (term) {
            params.set('query', term);
        } else {
            params.delete('query');
        }
        replace(`${pathname}?${params.toString()}`);
    }, 500);

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        replace(`${pathname}?${params.toString()}`);
    };

    const handleDelete = async (id: string) => {
        const res = await deleteCongDan(id);
        if (res.success) {
            message.success(res.message);
        } else {
            message.error(res.message);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <Input
                    placeholder="Tìm kiếm theo tên, CMND, SĐT..."
                    prefix={<SearchOutlined />}
                    defaultValue={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ width: 300 }}
                />
                {canCreate && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}
                        style={{ background: '#2e7d32', borderColor: '#2e7d32' }}
                    >
                        Thêm mới
                    </Button>
                )}
            </div>

            <Table
                dataSource={initialData}
                columns={columns((record) => { setEditingRecord(record); setIsModalOpen(true); }, handleDelete, canEdit, canDelete)}
                rowKey="id"
                pagination={{
                    current: currentPage,
                    total: total,
                    pageSize: 10,
                    onChange: handlePageChange,
                    showTotal: (total) => `Tổng ${total} công dân`
                }}
                scroll={{ x: 1300 }}
                size="middle"
                bordered
            />

            <CongDanModal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                record={editingRecord}
            />
        </div>
    );
}
