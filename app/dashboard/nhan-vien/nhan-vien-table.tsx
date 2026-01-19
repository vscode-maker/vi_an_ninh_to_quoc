
'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import NhanVienModal from './components/nhan-vien-modal';
import { deleteUser } from '@/lib/user-actions';
import { Table } from '@/app/ui/components/table';
import { Button } from '@/app/ui/components/button';
import { Input } from '@/app/ui/components/input';
import { Tag } from '@/app/ui/components/tag';
import { Plus, Trash2, Edit, Search } from 'lucide-react';

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
        if (!confirm('Xóa nhân viên này?')) return;

        const result = await deleteUser(id);
        if (result.success) {
            alert(result.message);
        } else {
            alert(result.message);
        }
    };

    const columns = [
        { title: 'Số hiệu', dataIndex: 'soHieu', key: 'soHieu', width: '10%' },
        { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
        { title: 'Chức vụ', dataIndex: 'position', key: 'position' },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => (
                <Tag color={role?.toLowerCase() === 'admin' ? 'red' : 'blue'}>
                    {role}
                </Tag>
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: any) => (
                <div className="flex gap-2">
                    {canEdit && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={<Edit size={16} />}
                            onClick={() => { setEditingRecord(record); setIsModalOpen(true); }}
                        />
                    )}
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            icon={<Trash2 size={16} />}
                            onClick={() => handleDelete(record.id)}
                        />
                    )}
                </div>
            )
        }
    ];

    // Simple Pagination Controls
    const totalPages = Math.ceil(total / 10);
    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div className="relative w-[300px]">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Search size={16} />
                    </span>
                    <Input
                        placeholder="Tìm kiếm nhân viên..."
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                        defaultValue={searchParams.get('query')?.toString()}
                    />
                </div>
                {canCreate && (
                    <Button icon={<Plus size={16} />} onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}>
                        Thêm nhân viên
                    </Button>
                )}
            </div>

            <Table
                dataSource={initialData}
                columns={columns}
                rowKey="id"
            />

            {/* Pagination UI */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => handlePageChange(Number(currentPage) - 1)}
                    >
                        Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => handlePageChange(Number(currentPage) + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}

            <NhanVienModal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                record={editingRecord}
            />
        </div>
    );
}
