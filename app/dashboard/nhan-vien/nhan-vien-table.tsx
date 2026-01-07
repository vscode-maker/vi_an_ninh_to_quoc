
'use client';

import { useState } from 'react';
import { Table, Button, Input, Modal, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import NhanVienModal from './components/nhan-vien-modal';
import { deleteUser } from '@/lib/user-actions';

export default function NhanVienTable({ initialData, total, currentPage, userPermissions = [], userRole }: any) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [editingRecord, setEditingRecord] = useState(null);
    const { replace } = useRouter();

    const canCreate = userRole?.toLowerCase() === 'admin' || userPermissions.includes('CREATE_EMPLOYEE');
    const canEdit = userRole?.toLowerCase() === 'admin' || userPermissions.includes('EDIT_EMPLOYEE');
    const canDelete = userRole?.toLowerCase() === 'admin' || userPermissions.includes('DELETE_EMPLOYEE');
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleSearch = useDebouncedCallback((term) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');
        if (term) {
            params.set('query', term);
        } else {
            params.delete('query');
        }
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    const handleDelete = async (id: string) => {
        const result = await deleteUser(id);
        if (result.success) {
            message.success(result.message);
        } else {
            message.error(result.message);
        }
    };

    const columns = [
        { title: 'Số hiệu', dataIndex: 'soHieu', key: 'soHieu', width: 100 },
        { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
        { title: 'Chức vụ', dataIndex: 'position', key: 'position' },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => <Tag color={role?.toLowerCase() === 'admin' ? 'red' : 'blue'}>{role}</Tag>
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: any) => (
                <div style={{ display: 'flex', gap: 8 }}>
                    {canEdit && (
                        <Button
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => { setEditingRecord(record); setIsModalOpen(true); }}
                        />
                    )}
                    {canDelete && (
                        <Popconfirm title="Xóa nhân viên này?" onConfirm={() => handleDelete(record.id)}>
                            <Button icon={<DeleteOutlined />} size="small" danger />
                        </Popconfirm>
                    )}
                </div>
            )
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Input
                    placeholder="Tìm kiếm nhân viên..."
                    prefix={<SearchOutlined />}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ width: 300 }}
                    defaultValue={searchParams.get('query')?.toString()}
                />
                {canCreate && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}>
                        Thêm nhân viên
                    </Button>
                )}
            </div>

            <Table
                dataSource={initialData}
                columns={columns}
                rowKey="id"
                pagination={{
                    current: currentPage,
                    total: total,
                    pageSize: 10,
                    onChange: (page) => {
                        const params = new URLSearchParams(searchParams);
                        params.set('page', page.toString());
                        replace(`${pathname}?${params.toString()}`);
                    }
                }}
            />

            <NhanVienModal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                record={editingRecord}
            />
        </div>
    );
}
