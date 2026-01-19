
import React, { useState } from 'react';
import { Modal } from '@/app/ui/components/modal';
import { Table } from '@/app/ui/components/table';
import { Tag } from '@/app/ui/components/tag';
import { Tooltip } from '@/app/ui/components/tooltip';
import { Button } from '@/app/ui/components/button';
import { Edit, Eye, Trash2 } from 'lucide-react';
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

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (id: string) => {
        setDeleteTargetId(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTargetId) return;
        setIsDeleting(true);
        try {
            await deleteDataDonAn(deleteTargetId);
            setIsDeleteModalOpen(false);
            setDeleteTargetId(null);
        } catch (e) {
            alert('Xóa thất bại: ' + (e as any).message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
        setDeleteTargetId(null);
    };

    const columns = [
        {
            title: 'Mã',
            dataIndex: 'id',
            key: 'id',
            width: '100px',
        },
        {
            title: 'Phân loại',
            dataIndex: 'phanLoai',
            key: 'phanLoai',
            width: '150px',
            render: (text: string) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'Trích yếu',
            dataIndex: 'trichYeu',
            key: 'trichYeu',
            render: (text: string) => (
                <div className="max-w-md truncate" title={text}>
                    {text}
                </div>
            )
        },
        {
            title: 'Ngày xảy ra',
            dataIndex: 'ngayXayRa',
            key: 'ngayXayRa',
            width: '120px',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            key: 'trangThai',
            width: '150px',
            render: (text: string) => {
                let color: 'gray' | 'green' | 'blue' = 'gray';
                if (text?.includes('Kết thúc') || text?.includes('Đã giải quyết')) color = 'green';
                if (text?.includes('Đang')) color = 'blue';
                return <Tag color={color}>{text}</Tag>;
            }
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: '150px',
            render: (_: any, record: DataType) => (
                <div className="flex gap-2">
                    <Tooltip content="Xem chi tiết">
                        <Link href={`/dashboard/data-don-an/${record.id}`}>
                            <Button variant="ghost" size="sm" icon={<Eye size={16} />} />
                        </Link>
                    </Tooltip>
                    <Tooltip content="Chỉnh sửa">
                        <Link href={`/dashboard/data-don-an/${record.id}?mode=edit`}>
                            <Button variant="ghost" size="sm" icon={<Edit size={16} />} />
                        </Link>
                    </Tooltip>
                    <Tooltip content="Xóa">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            icon={<Trash2 size={16} />}
                            onClick={() => handleDeleteClick(record.id)}
                        />
                    </Tooltip>
                </div>
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
        <>
            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
            // Map custom table pagination prop structure
            // Note: The custom table component currently has a placeholder pagination
            // We might need to enhance the custom table to support onPageChange or similar if it's not fully wired
            // For now, passing these props just to match the component signature if extended, 
            // but the Table component we viewed earlier seemed to lack interactive pagination controls.
            // We'll rely on the parent or adding a Pagination component if needed, 
            // but for now let's stick to the visible structure. 
            // NOTE: The custom table has a "Showing X items" placeholder. 
            // Real pagination links should ideally be separate or added to Table.
            />
            <Modal
                isOpen={isDeleteModalOpen}
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
                <p className="text-gray-600">
                    Bạn có chắc chắn muốn xóa dữ liệu hồ sơ này? Hành động này sẽ xóa vĩnh viễn hồ sơ và các dữ liệu liên quan.
                </p>
            </Modal>
        </>
    );
};

export default DataDonAnTable;
