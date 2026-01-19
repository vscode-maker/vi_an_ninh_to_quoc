'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import dayjs from 'dayjs';
import CongDanModal from './components/cong-dan-modal';
import { deleteCongDan } from '@/lib/cong-dan-actions';
import { Table } from '@/app/ui/components/table';
import { Button } from '@/app/ui/components/button';
import { Modal } from '@/app/ui/components/modal';
import { Input } from '@/app/ui/components/input';
import { Checkbox } from '@/app/ui/components/checkbox';
import { Tag } from '@/app/ui/components/tag';
import { Eye, Edit, Trash2, Search, Settings, Plus, X } from 'lucide-react';

// Key for localStorage
const STORAGE_KEY = 'congDanTableConfig_v1';

// All available columns definition
const COLUMN_DEFS = {
    hoTen: { title: 'Họ tên', width: '200px', fixed: 'left' },
    soCMND: { title: 'CMND', width: '120px' },
    soCCCD: { title: 'CCCD', width: '150px' },
    gioiTinh: { title: 'Giới tính', width: '80px' },
    ngaySinh: { title: 'Ngày sinh', width: '120px' },
    queQuan: { title: 'Quê quán', width: '200px' },
    noiThuongTru: { title: 'Thường trú', width: '250px' },
    noiOHienTai: { title: 'Chỗ ở hiện tại', width: '250px' },
    soDienThoai: { title: 'SĐT', width: '120px' },
    danToc: { title: 'Dân tộc', width: '100px' },
    tonGiao: { title: 'Tôn giáo', width: '100px' },
    ngheNghiep: { title: 'Nghề nghiệp', width: '150px' },
    tinhTrangHonNhan: { title: 'Hôn nhân', width: '150px' },
    ngayCap: { title: 'Ngày cấp', width: '120px' },
    noiCap: { title: 'Nơi cấp', width: '150px' },
    noiDangKyKhaiSinh: { title: 'ĐK Khai sinh', width: '200px' },
    ghiChu: { title: 'Ghi chú', width: '200px' },
    maHoKhau: { title: 'Mã Hộ Khẩu', width: '150px' },
    chuHo: { title: 'Vai trò', width: '100px', render: (val: boolean) => val ? <Tag color="blue">Chủ hộ</Tag> : <Tag>Thành viên</Tag> },
    nguoiTao: { title: 'Người tạo', width: '150px' },
    ngayTao: { title: 'Ngày tạo', width: '150px', render: (val: any) => val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '' },
    nguoiCapNhat: { title: 'Người sửa', width: '150px' },
    ngayCapNhat: { title: 'Ngày sửa', width: '150px', render: (val: any) => val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '' },
};

// Default visible columns
const DEFAULT_VISIBLE = [
    'hoTen', 'soCCCD', 'gioiTinh', 'ngaySinh', 'queQuan', 'noiThuongTru', 'soDienThoai'
];

export default function CongDanTable({ initialData, total, currentPage, searchQuery, userPermissions = [], userRole }: any) {
    const { replace } = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // State for visible columns
    const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Load config from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setVisibleColumns(parsed);
                }
            } catch (e) {
                console.error('Error loading table config', e);
            }
        }

        // Click outside to close popover
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setPopoverOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Save to local storage when changed
    const handleColumnChange = (checked: boolean, key: string) => {
        let newCols;
        if (checked) {
            newCols = [...visibleColumns, key];
        } else {
            newCols = visibleColumns.filter(c => c !== key);
        }

        // Sort based on original order
        const allKeys = Object.keys(COLUMN_DEFS);
        newCols.sort((a, b) => allKeys.indexOf(a) - allKeys.indexOf(b));

        setVisibleColumns(newCols);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newCols));
    };

    const handleSelectAll = () => {
        const allKeys = Object.keys(COLUMN_DEFS);
        setVisibleColumns(allKeys);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allKeys));
    };

    const handleResetDefault = () => {
        setVisibleColumns(DEFAULT_VISIBLE);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_VISIBLE));
    };

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

    const handleDeleteClick = (id: string) => {
        setDeleteTargetId(id);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTargetId) return;
        setIsDeleting(true);
        try {
            const res = await deleteCongDan(deleteTargetId);
            if (res.success) {
                // Success
                setDeleteModalOpen(false);
                setDeleteTargetId(null);
            } else {
                alert(res.message);
            }
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra khi xóa');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancelDelete = () => {
        setDeleteModalOpen(false);
        setDeleteTargetId(null);
    };

    // Construct the columns array dynamically
    const tableColumns = useMemo(() => {
        const generatedCols = Object.keys(COLUMN_DEFS)
            .filter(key => visibleColumns.includes(key))
            .map(key => {
                const def = (COLUMN_DEFS as any)[key];
                return {
                    title: def.title,
                    dataIndex: key,
                    key: key,
                    width: def.width,
                    render: def.render || ((val: any) => <div className="truncate" title={val?.toString()}>{val}</div>)
                };
            });

        const actionCol = {
            title: 'Hành động',
            key: 'action',
            width: '120px',
            fixed: 'right',
            render: (_: any, record: any) => (
                <div className="flex items-center gap-1">
                    <a href={`/dashboard/cong-dan/${record.id}`} title="Xem chi tiết">
                        <div className="p-1 hover:bg-gray-100 rounded-md text-cyan-600 transition-colors cursor-pointer">
                            <Eye size={18} />
                        </div>
                    </a>
                    {canEdit && (
                        <div
                            className="p-1 hover:bg-gray-100 rounded-md text-blue-600 transition-colors cursor-pointer"
                            onClick={() => { setEditingRecord(record); setIsModalOpen(true); }}
                            title="Sửa"
                        >
                            <Edit size={18} />
                        </div>
                    )}
                    {canDelete && (
                        <div
                            className="p-1 hover:bg-gray-100 rounded-md text-red-600 transition-colors cursor-pointer"
                            onClick={() => handleDeleteClick(record.id)}
                            title="Xóa"
                        >
                            <Trash2 size={18} />
                        </div>
                    )}
                </div>
            )
        };

        return [...generatedCols, actionCol];
    }, [visibleColumns, canEdit, canDelete]);

    const totalPages = Math.ceil(total / 10);

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="relative w-full md:w-[300px]">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Search size={16} />
                    </span>
                    <Input
                        placeholder="Tìm kiếm theo tên, CMND, SĐT..."
                        defaultValue={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex gap-2 relative">
                    <div ref={popoverRef}>
                        <Button
                            variant="outline"
                            icon={<Settings size={16} />}
                            onClick={() => setPopoverOpen(!popoverOpen)}
                        >
                            Cấu hình cột
                        </Button>

                        {popoverOpen && (
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4">
                                <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
                                    <h4 className="font-semibold text-sm">Chọn cột hiển thị</h4>
                                    <button onClick={() => setPopoverOpen(false)} className="text-gray-400 hover:text-gray-600">
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2 mb-3">
                                    {Object.keys(COLUMN_DEFS).map(key => (
                                        <Checkbox
                                            key={key}
                                            label={(COLUMN_DEFS as any)[key].title}
                                            checked={visibleColumns.includes(key)}
                                            onChange={(e) => handleColumnChange(e.target.checked, key)}
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-100">
                                    <button
                                        className="text-xs text-blue-600 hover:underline"
                                        onClick={handleSelectAll}
                                    >
                                        Chọn tất cả
                                    </button>
                                    <button
                                        className="text-xs text-red-600 hover:underline"
                                        onClick={handleResetDefault}
                                    >
                                        Mặc định
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {canCreate && (
                        <Button
                            icon={<Plus size={16} />}
                            onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}
                        >
                            Thêm mới
                        </Button>
                    )}
                </div>
            </div>

            <Table
                dataSource={initialData}
                columns={tableColumns}
                rowKey="id"
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-500">
                        Tổng {total} công dân
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1}
                            onClick={() => handlePageChange(Number(currentPage) - 1)}
                        >
                            Previous
                        </Button>
                        <span className="flex items-center px-2 text-sm text-gray-600">
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
                </div>
            )}

            <CongDanModal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                record={editingRecord}
            />

            <Modal
                isOpen={deleteModalOpen}
                onClose={handleCancelDelete}
                title="Xác nhận xóa"
                footer={
                    <>
                        <Button variant="ghost" onClick={handleCancelDelete} disabled={isDeleting}>
                            Hủy
                        </Button>
                        <Button
                            variant="primary"
                            className="bg-red-600 hover:bg-red-700 text-white border-red-600 focus:ring-red-500"
                            onClick={handleConfirmDelete}
                            loading={isDeleting}
                        >
                            Xóa
                        </Button>
                    </>
                }
            >
                <div className="text-slate-600">
                    <p>Bạn có chắc chắn muốn xóa hồ sơ công dân này?</p>
                    <p className="text-sm text-red-500 mt-2">Hành động này không thể hoàn tác.</p>
                </div>
            </Modal>
        </div>
    );
}
