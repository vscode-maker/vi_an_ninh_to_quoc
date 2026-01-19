
'use client';

import { useState } from 'react';
import { createSetting, updateSetting, deleteSetting } from '@/lib/setting-actions';
import { Table } from '@/app/ui/components/table';
import { Button } from '@/app/ui/components/button';
import { Modal } from '@/app/ui/components/modal';
import { Input } from '@/app/ui/components/input';
import { Plus, Trash2, Edit, Save } from 'lucide-react';

export default function CaiDatTable({ initialData }: any) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleDelete = async (id: number) => {
        if (!confirm('Xóa cài đặt này?')) return;
        const result = await deleteSetting(id);
        if (result.success) alert(result.message);
        else alert(result.message);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        let result;
        if (editingRecord) {
            result = await updateSetting(editingRecord.id, formData);
        } else {
            result = await createSetting(formData);
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
        { title: 'Loại (Type)', dataIndex: 'type', key: 'type', width: '20%' },
        {
            title: 'Giá trị (Value)',
            dataIndex: 'value',
            key: 'value',
            render: (text: string) => <div className="truncate max-w-md" title={text}>{text}</div>
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: '150px',
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
                        onClick={() => handleDelete(record.id)}
                    />
                </div>
            )
        }
    ];

    return (
        <div>
            <div className="mb-4">
                <Button icon={<Plus size={16} />} onClick={() => openModal(null)}>Thêm cấu hình</Button>
            </div>

            <Table dataSource={initialData} columns={columns} rowKey="id" />

            <Modal
                title={editingRecord ? "Cập nhật cấu hình" : "Thêm cấu hình"}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            >
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input
                        name="type"
                        label="Loại (Key)"
                        placeholder="VD: SYSTEM_COLOR, API_KEY..."
                        defaultValue={editingRecord?.type}
                        disabled={!!editingRecord}
                        required
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Giá trị</label>
                        <textarea
                            name="value"
                            rows={4}
                            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Nhập giá trị..."
                            defaultValue={editingRecord?.value}
                            required
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
