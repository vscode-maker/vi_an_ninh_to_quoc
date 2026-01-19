
'use client';

import { useState } from 'react';
import { createGroupZalo, updateGroupZalo, deleteGroupZalo } from '@/lib/group-zalo-actions';
import { Table } from '@/app/ui/components/table';
import { Button } from '@/app/ui/components/button';
import { Modal } from '@/app/ui/components/modal';
import { Input } from '@/app/ui/components/input';
import { Tag } from '@/app/ui/components/tag';
import { Plus, Trash2, Edit, Save } from 'lucide-react';

export default function ZaloTable({ initialData }: any) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa nhóm này?')) return;
        const result = await deleteGroupZalo(id);
        if (result.success) alert(result.message);
        else alert(result.message);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        let result;
        if (editingRecord) {
            result = await updateGroupZalo(editingRecord.groupId, formData);
        } else {
            result = await createGroupZalo(formData);
        }

        if (result.success) {
            alert(result.message);
            setIsModalOpen(false);
        } else {
            alert(result.message);
        }
        setLoading(false);
    };

    const openModal = (record: any = null) => {
        setEditingRecord(record);
        setIsModalOpen(true);
    };

    const columns = [
        { title: 'ID Nhóm', dataIndex: 'groupId', key: 'groupId', width: '15%' },
        { title: 'Tên Nhóm', dataIndex: 'name', key: 'name' },
        {
            title: 'Link Nhóm',
            dataIndex: 'groupLink',
            key: 'groupLink',
            render: (text: string) => text ? (
                <a href={text} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    Tham gia
                </a>
            ) : '-'
        },
        { title: 'Mô tả', dataIndex: 'groupDescription', key: 'groupDescription' },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            render: (st: string) => <Tag color="green">{st}</Tag>
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: '120px',
            render: (_: any, record: any) => (
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit size={16} />}
                        onClick={() => openModal(record)}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        icon={<Trash2 size={16} />}
                        onClick={() => handleDelete(record.groupId)}
                    />
                </div>
            )
        }
    ];

    return (
        <div>
            <div className="mb-4">
                <Button icon={<Plus size={16} />} onClick={() => openModal(null)}>Thêm nhóm Zalo</Button>
            </div>

            <Table dataSource={initialData} columns={columns} rowKey="groupId" />

            <Modal
                title={editingRecord ? "Cập nhật nhóm" : "Thêm nhóm Zalo"}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            >
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {!editingRecord && (
                        <Input
                            name="groupId"
                            label="ID Nhóm (Tùy chọn)"
                            placeholder="Để trống sẽ tự sinh"
                        />
                    )}
                    <Input
                        name="name"
                        label="Tên nhóm"
                        defaultValue={editingRecord?.name}
                        required
                    />
                    <Input
                        name="groupLink"
                        label="Link tham gia"
                        defaultValue={editingRecord?.groupLink}
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Mô tả</label>
                        <textarea
                            name="groupDescription"
                            rows={3}
                            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                            defaultValue={editingRecord?.groupDescription}
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
