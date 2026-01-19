
'use client';

import { useState, useEffect } from 'react';
import { createFile, updateFile, deleteFile } from '@/lib/file-actions';
import { useDebounce } from 'use-debounce';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Table } from '@/app/ui/components/table';
import { Button } from '@/app/ui/components/button';
import { Modal } from '@/app/ui/components/modal';
import { Input } from '@/app/ui/components/input';
import {
    Plus, Trash2, Edit, Save, Upload,
    FileText, File, List, Grid
} from 'lucide-react';

export default function TaiLieuTable({ initialData, total, currentPage, userPermissions = [], userRole }: any) {
    const { replace } = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const canCreate = userRole?.toLowerCase() === 'admin' || userPermissions.includes('CREATE_FILE');
    const canEdit = userRole?.toLowerCase() === 'admin' || userPermissions.includes('EDIT_FILE');
    const canDelete = userRole?.toLowerCase() === 'admin' || userPermissions.includes('DELETE_FILE');

    const [fileList, setFileList] = useState<any[]>(initialData || []);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Search state
    const [searchTerm, setSearchTerm] = useState(searchParams.get('query') || '');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

    // Sync fileList with initialData when it changes (server update)
    useEffect(() => {
        setFileList(initialData || []);
    }, [initialData]);

    // Handle Search URL update
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1'); // Reset to page 1 on search
        if (debouncedSearchTerm) {
            params.set('query', debouncedSearchTerm);
        } else {
            params.delete('query');
        }
        replace(`${pathname}?${params.toString()}`);
    }, [debouncedSearchTerm, pathname, replace]);

    // Handle Page Change
    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        replace(`${pathname}?${params.toString()}`);
    };

    const openModal = (record: any = null) => {
        setEditingRecord(record);
        setIsModalOpen(true);
    };

    const handleDelete = async (fileId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa?')) return;
        const res = await deleteFile(fileId);
        if (res.success) {
            alert('Xóa tài liệu thành công');
            window.location.reload();
        } else {
            alert(res.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        let res;
        if (editingRecord) {
            formData.append('fileId', editingRecord.fileId);
            res = await updateFile(formData);
        } else {
            res = await createFile(formData);
        }

        if (res.success) {
            alert(res.message);
            setIsModalOpen(false);
            window.location.reload();
        } else {
            alert(res.message);
        }
        setLoading(false);
    };

    const getFileIcon = (fileType: string) => {
        // Keeping it simple with Lucide icons for now
        return <FileText size={48} className="text-gray-400" />;
    };

    const columns = [
        {
            title: 'Tên tài liệu',
            dataIndex: 'fileName',
            key: 'fileName',
            render: (text: string, record: any) => (
                <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-500" />
                    <a href={record.fileLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {text || 'Không tên'}
                    </a>
                </div>
            )
        },
        { title: 'Ghi chú', dataIndex: 'note', key: 'note' },
        { title: 'Cập nhật', dataIndex: 'updatedAt', key: 'updatedAt', render: (date: any) => date ? new Date(date).toLocaleDateString('vi-VN') : '' },
        {
            title: 'Hành động',
            key: 'action',
            width: '120px',
            render: (_: any, record: any) => (
                <div className="flex gap-2">
                    {canEdit && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={<Edit size={16} />}
                            onClick={() => openModal(record)}
                        />
                    )}
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            icon={<Trash2 size={16} />}
                            onClick={() => handleDelete(record.fileId)}
                        />
                    )}
                </div>
            ),
        },
    ];

    const totalPages = Math.ceil(total / 20);

    const renderGridView = () => (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {fileList.map(file => (
                    <div key={file.fileId} className="group relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                        <div className="h-32 bg-gray-50 flex items-center justify-center pt-4">
                            {getFileIcon(file.fileType || file.fileName)}
                        </div>
                        <div className="p-4 flex-1">
                            <h4 className="font-medium text-gray-900 truncate mb-1" title={file.fileName}>
                                {file.fileName || 'Chưa đặt tên'}
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-2 h-8">
                                {file.note || 'Không có ghi chú'}
                            </p>
                        </div>
                        <div className="flex items-center justify-between px-2 py-2 border-t border-gray-100 bg-gray-50/50">
                            <a
                                href={file.fileLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Tải xuống"
                            >
                                <Upload size={16} className="rotate-180" />
                            </a>
                            <div className="flex gap-1">
                                {canEdit && (
                                    <button
                                        onClick={() => openModal(file)}
                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                        <Edit size={16} />
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        onClick={() => handleDelete(file.fileId)}
                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {fileList.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        Không tìm thấy tài liệu
                    </div>
                )}
            </div>
            {total > 0 && (
                <div className="flex justify-end mt-4">
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
        </>
    );

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-[300px]">
                        <Input
                            placeholder="Tìm kiếm tài liệu..."
                            onChange={(e) => setSearchTerm(e.target.value)}
                            defaultValue={searchTerm}
                        />
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
                {canCreate && (
                    <Button icon={<Plus size={16} />} onClick={() => openModal()}>
                        Thêm tài liệu mới
                    </Button>
                )}
            </div>

            {viewMode === 'grid' ? renderGridView() : (
                <>
                    <Table
                        dataSource={fileList}
                        columns={columns}
                        rowKey="fileId"
                    />
                    {total > 0 && (
                        <div className="flex justify-end mt-4">
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
                </>
            )}

            <Modal
                title={editingRecord ? "Cập nhật tài liệu" : "Thêm tài liệu mới"}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            >
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input
                        name="fileName"
                        label="Tên tài liệu"
                        required
                        defaultValue={editingRecord?.fileName}
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                        <textarea
                            name="note"
                            rows={3}
                            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                            defaultValue={editingRecord?.note}
                        />
                    </div>

                    <Input
                        name="fileLink"
                        label="Link file (Nếu có sẵn)"
                        placeholder="https://..."
                        defaultValue={editingRecord?.fileLink}
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Upload File (Sẽ tạo link Drive)</label>
                        <input
                            type="file"
                            name="file"
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                        <Button type="submit" loading={loading} icon={<Save size={16} />}>Lưu</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
