'use client';

import React, { useState, useMemo } from 'react';
import { Table } from '@/app/ui/components/table';
import { Button } from '@/app/ui/components/button';
import { Modal } from '@/app/ui/components/modal';
import { Form } from '@/app/ui/compat/antd-form-compat';
import { Input } from '@/app/ui/components/input';
import { TextArea } from '@/app/ui/components/textarea';
import { DatePicker } from '@/app/ui/components/date-picker';
import { Plus, Edit, Trash2, ArrowRightLeft } from 'lucide-react';
import { MODULE_CONFIG } from '@/lib/module-config';
import { createGenericItem, updateGenericItem, deleteGenericItem } from '@/lib/actions/generic-crud';
import ClientSearch from '@/app/dashboard/data-don-an/client-search';
import dayjs from 'dayjs';
import ChatModal from '@/components/chat/chat-modal';
import { useRouter } from 'next/navigation';

// Simple Toast fallback
const toast = (msg: string, type: 'success' | 'error' = 'success') => {
    // In a real app, use a proper toast library like sonner or react-hot-toast
    // For now, consistent with other refactors
    console.log(`[${type.toUpperCase()}] ${msg}`);
    if (type === 'error') alert(msg);
};

interface Props {
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    slug: string;
    search: string;
}

export default function GenericView({ data, total, page, pageSize, slug, search }: Props) {
    const config = MODULE_CONFIG[slug];
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [chatModalOpen, setChatModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    if (!config) return <div className="p-4 text-red-500">Invalid Module Configuration</div>;

    const handleCreate = (initialValues?: any) => {
        setEditingItem(null);
        form.resetFields();
        if (initialValues && typeof initialValues === 'object') {
            form.setFieldsValue(initialValues);
        }
        setIsModalOpen(true);
    };

    const handleEdit = (record: any) => {
        setEditingItem(record);
        // Convert date strings to dayjs objects
        const formValues = { ...record };
        config.fields.forEach(field => {
            if ((field.type === 'date' || field.type === 'datetime') && formValues[field.name]) {
                // Keep as strings for native inputs, or dayjs if using antd-compat?
                // Our custom DatePicker expects string (YYYY-MM-DD).
                // Antd Form Compat might just pass value through.
                // Let's try formatting to string if it is a string from DB.
                // If it's generic, we might need to check format.
                const val = formValues[field.name];
                if (typeof val === 'string') {
                    const d = dayjs(val);
                    if (d.isValid()) {
                        formValues[field.name] = field.type === 'datetime' ? d.format('YYYY-MM-DDTHH:mm') : d.format('YYYY-MM-DD');
                    }
                }
            }
        });
        form.setFieldsValue(formValues);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn chắc chắn muốn xóa?')) return;
        try {
            await deleteGenericItem(slug, id);
            toast('Xóa thành công');
            router.refresh(); // Ensure list updates
        } catch (e) {
            toast('Xóa thất bại', 'error');
        }
    };

    const handleOk = async () => {
        // Form 'submit' logic
        // We trigger submit via button in Modal footer or form method
        // With antd-compat, we might simulate submit or just validate manually if exposed
        // For now, let's assume we click the submit button inside the form or trigger it.
        // But our custom Modal has footer. Let's put submit button in Form or Modal footer?
        // Let's stick to putting actions in the form or triggering validation manually.
        // antd-compat 'form' object doesn't have full validateFields yet in my simple mock?
        // Wait, I updated it? I need to check antd-form-compat.
        // It has `getFieldsValue`. It doesn't have `validateFields` fully implemented in the simple version I saw earlier.
        // But let's assume valid for now or basic check.

        try {
            const values = form.getFieldsValue();
            // Basic required check
            for (const field of config.fields) {
                if (field.required && !values[field.name]) {
                    alert(`Vui lòng nhập ${field.label}`);
                    return;
                }
            }

            setLoading(true);
            if (editingItem) {
                await updateGenericItem(slug, editingItem[config.primaryKey], values);
                toast('Cập nhật thành công');
            } else {
                await createGenericItem(slug, values);
                toast('Thêm mới thành công');
            }
            setIsModalOpen(false);
            form.resetFields();
            router.refresh();
        } catch (e) {
            if (e instanceof Error) toast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const processedData = useMemo(() => {
        if (!config.groupBy) return data;
        const sortedData = [...data].sort((a, b) => {
            const ga = a[config.groupBy!] || '';
            const gb = b[config.groupBy!] || '';
            return ga.localeCompare(gb);
        });

        const result: any[] = [];
        let lastGroup: string | null = null;
        sortedData.forEach((item, index) => {
            const group = item[config.groupBy!] || 'Không có nhóm';
            if (group !== lastGroup) {
                const headerRow = {
                    ...item,
                    _isGroupHeader: true,
                    [config.groupBy!]: group,
                    [config.primaryKey]: `group_header_${group}_${index}`
                };
                result.push(headerRow);
                lastGroup = group;
            }
            result.push(item);
        });
        return result;
    }, [data, config.groupBy, config.primaryKey]);

    const activeData = config.groupBy ? processedData : data;

    const baseColumns = config.fields.filter(f => !f.hideInTable).map(f => ({
        title: f.label,
        dataIndex: f.name,
        key: f.name,
        // ellipsis: true, // Custom table handles text overflow via defaults or class
    }));

    // Add Actions
    baseColumns.push({
        title: 'Thao tác',
        key: 'action',
        render: (_: any, record: any) => (
            <div className="flex gap-2">
                <Button size="sm" variant="ghost" icon={<Edit size={16} />} onClick={() => handleEdit(record)} />
                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" icon={<Trash2 size={16} />} onClick={() => handleDelete(record[config.primaryKey])} />
            </div>
        )
    } as any);

    // Transform Columns for grouping
    const columns = baseColumns.map((col, index) => {
        if (!config.groupBy) return col;
        return {
            ...col,
            onCell: (record: any) => {
                if (record._isGroupHeader) {
                    if (index === 0) {
                        return { colSpan: baseColumns.length, className: 'bg-gray-50' };
                    }
                    return { colSpan: 0 };
                }
                return {};
            },
            render: (value: any, record: any) => {
                if (record._isGroupHeader) {
                    if (index === 0) {
                        return (
                            <div className="flex justify-between items-center font-bold px-2">
                                <span>{config.groupBy!.toUpperCase()}: {record[config.groupBy!]}</span>
                                {slug === 'thong-tin-chat' && (
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedGroup(record[config.groupBy!]);
                                            setChatModalOpen(true);
                                        }}
                                    >
                                        Xem trích xuất chát
                                    </Button>
                                )}
                            </div>
                        );
                    }
                    return null;
                }
                return (col as any).render ? (col as any).render(value, record) : value;
            }
        };
    });

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">{config.title}</h2>
                <Button variant="primary" icon={<Plus size={20} />} onClick={() => handleCreate()}>
                    Thêm mới
                </Button>
            </div>

            <div className="mb-6">
                <ClientSearch initialSearch={search} />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <Table
                    dataSource={activeData}
                    columns={columns}
                    rowKey={config.primaryKey}
                    pagination={{
                        current: page,
                        pageSize: pageSize,
                        total: total,
                        showSizeChanger: false
                    }}
                    rowClassName={(record) => record._isGroupHeader ? 'bg-gray-50 font-medium' : ''}
                />
            </div>

            <Modal
                title={editingItem ? `Cập nhật ${config.title}` : `Thêm mới ${config.title}`}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                className="max-w-xl w-full"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                        <Button variant="primary" loading={loading} onClick={handleOk}>
                            {editingItem ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </>
                }
            >
                <Form
                    form={form}
                    className="space-y-4"
                    onValuesChange={(changedValues: any, allValues: any) => {
                        if (slug === 'thong-tin-chat') {
                            if (changedValues.nguoiGui || changedValues.nguoiNhan) {
                                const sender = allValues.nguoiGui || '';
                                const receiver = allValues.nguoiNhan || '';
                                if (sender && receiver) {
                                    const [first, second] = [sender, receiver].sort();
                                    form.setFieldsValue({
                                        nhom: `${first} - ${second}`
                                    });
                                }
                            }
                        }
                    }}
                >
                    {config.fields.filter(f => !f.hideInForm).map(field => (
                        <React.Fragment key={field.name}>
                            <Form.Item
                                name={field.name}
                                label={field.label}
                                className="mb-4"
                            // rules implementation would go here for real validation
                            >
                                {field.type === 'textarea' ? <TextArea rows={3} /> :
                                    field.type === 'datetime' ? <DatePicker type="datetime-local" /> :
                                        field.type === 'date' ? <DatePicker /> :
                                            <Input />}
                            </Form.Item>
                            {slug === 'thong-tin-chat' && field.name === 'nguoiGui' && (
                                <div className="text-center mb-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        icon={<ArrowRightLeft size={16} className="rotate-90" />}
                                        onClick={() => {
                                            const { nguoiGui, nguoiNhan } = form.getFieldsValue();
                                            form.setFieldsValue({
                                                nguoiGui: nguoiNhan,
                                                nguoiNhan: nguoiGui
                                            });
                                            const sender = nguoiNhan || '';
                                            const receiver = nguoiGui || '';
                                            if (sender && receiver) {
                                                const [first, second] = [sender, receiver].sort();
                                                form.setFieldsValue({
                                                    nhom: `${first} - ${second}`
                                                });
                                            }
                                        }}
                                    >
                                        Đổi vị trí người gửi/nhận
                                    </Button>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </Form>
            </Modal>

            <ChatModal
                groupName={selectedGroup}
                open={chatModalOpen}
                onCancel={() => setChatModalOpen(false)}
                onMessageAdded={() => {
                    router.refresh();
                }}
            />
        </div >
    );
}
