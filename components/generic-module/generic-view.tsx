'use client';

import React, { useState } from 'react';
import { Table, Typography, Card, Button, Space, Modal, Form, Input, message, Popconfirm, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SwapOutlined } from '@ant-design/icons';
import { MODULE_CONFIG } from '@/lib/module-config';
import { createGenericItem, updateGenericItem, deleteGenericItem } from '@/lib/actions/generic-crud';
import ClientSearch from '@/app/dashboard/data-don-an/client-search';
import dayjs from 'dayjs';
import ChatModal from '@/components/chat/chat-modal';

interface Props {
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    slug: string; // Changed from modelName to slug for config lookup
    search: string;
}

import { useRouter } from 'next/navigation';

export default function GenericView({ data, total, page, pageSize, slug, search }: Props) {
    const config = MODULE_CONFIG[slug];
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [chatModalOpen, setChatModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    if (!config) return <div>Invalid Module Configuration</div>;

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
                formValues[field.name] = dayjs(formValues[field.name]);
            }
        });
        form.setFieldsValue(formValues);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteGenericItem(slug, id);
            messageApi.success('Xóa thành công');
        } catch (e) {
            messageApi.error('Xóa thất bại');
        }
    };

    const handleOk = async () => {
        try {
            const rawValues = await form.validateFields();
            // Sanitize values (convert Date/Dayjs to string)
            const values = { ...rawValues };
            config.fields.forEach(field => {
                if ((field.type === 'date' || field.type === 'datetime') && values[field.name]) {
                    // Check if it has format method (dayjs/moment)
                    const val = values[field.name];
                    if (val && typeof val.format === 'function') {
                        values[field.name] = field.type === 'datetime'
                            ? val.format('YYYY-MM-DD HH:mm:ss')
                            : val.format('YYYY-MM-DD');
                    }
                }
            });

            setLoading(true);
            if (editingItem) {
                await updateGenericItem(slug, editingItem[config.primaryKey], values);
                messageApi.success('Cập nhật thành công');
            } else {
                await createGenericItem(slug, values);
                messageApi.success('Thêm mới thành công');
            }
            setIsModalOpen(false);
            form.resetFields();
        } catch (e) {
            // Validation error or server error
            if (e instanceof Error) messageApi.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const processedData = React.useMemo(() => {
        if (!config.groupBy) return data;
        // Group logic: Flatten with header rows.
        // Important: Data should be sorted by group for this to work perfectly.
        // Assuming data comes in valid order or we sort it simply here.
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
                // Insert Header Row
                // Must have a unique ID that follows primaryKey rule
                const headerRow = {
                    ...item, // Copy properties for auto-fill
                    _isGroupHeader: true,
                    [config.groupBy!]: group,
                    [config.primaryKey]: `group_header_${group}_${index}` // Fake ID
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
        ellipsis: true,
    }));

    // Add Actions
    baseColumns.push({
        title: 'Thao tác',
        key: 'action',
        render: (_: any, record: any) => (
            <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                <Popconfirm title="Bạn chắc chắn muốn xóa?" onConfirm={() => handleDelete(record[config.primaryKey])}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            </Space>
        )
    } as any);

    // Transform Columns for grouping (colSpan)
    const columns = baseColumns.map((col, index) => {
        if (!config.groupBy) return col;
        return {
            ...col,
            onCell: (record: any) => {
                if (record._isGroupHeader) {
                    if (index === 0) {
                        return { colSpan: baseColumns.length };
                    }
                    return { colSpan: 0 };
                }
                return {};
            },
            render: (value: any, record: any) => {
                if (record._isGroupHeader) {
                    if (index === 0) {
                        return (
                            <div style={{ background: '#f0f2f5', fontWeight: 'bold', padding: '8px', marginLeft: '-8px', marginRight: '-8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{config.groupBy!.toUpperCase()}: {record[config.groupBy!]}</span>
                                {slug === 'thong-tin-chat' && (
                                    <Space>
                                        <Button
                                            size="small"
                                            type="primary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedGroup(record[config.groupBy!]);
                                                setChatModalOpen(true);
                                            }}
                                        >
                                            Xem trích xuất chát
                                        </Button>
                                    </Space>
                                )}
                            </div>
                        );
                    }
                    return null;
                }
                // Normal render - preserve existing render if any (Action col has one)
                // Use type assertion (any) because col.render might not be typed in this map context
                return (col as any).render ? (col as any).render(value, record) : value;
            }
        };
    });

    return (
        <div style={{ padding: '24px' }}>
            {contextHolder}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Typography.Title level={2}>{config.title}</Typography.Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    Thêm mới
                </Button>
            </div>

            <div style={{ marginBottom: 16 }}>
                <ClientSearch initialSearch={search} />
            </div>

            <Card>
                <Table
                    dataSource={activeData}
                    columns={columns}
                    rowKey={config.primaryKey}
                    pagination={{
                        current: page,
                        pageSize: pageSize,
                        total: total, // Total might be inaccurate if we add header rows, but total logic usually server side.
                        // If we inject rows client side, sorting/pagination might look weird if we don't account for it.
                        // But data comes paginated from server. Grouping per page is standard for this approach.
                        showSizeChanger: false
                    }}
                    scroll={{ x: true }}
                    onChange={(pagination) => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('page', pagination.current?.toString() || '1');
                        window.location.href = url.toString();
                    }}
                    // Row class for styling
                    rowClassName={(record) => record._isGroupHeader ? 'group-header-row' : ''}
                />
            </Card>

            <Modal
                title={editingItem ? `Cập nhật ${config.title}` : `Thêm mới ${config.title}`}
                open={isModalOpen}
                onOk={handleOk}
                onCancel={() => setIsModalOpen(false)}
                confirmLoading={loading}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onValuesChange={(changedValues, allValues) => {
                        if (slug === 'thong-tin-chat') {
                            // Auto-generate group name: "Sender - Receiver" (Sorted alphabetically)
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
                                rules={[{ required: field.required, message: 'Vui lòng nhập thông tin' }]}
                            >
                                {field.type === 'textarea' ? <Input.TextArea rows={3} /> :
                                    field.type === 'datetime' ? <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} /> :
                                        field.type === 'date' ? <DatePicker style={{ width: '100%' }} /> :
                                            <Input />}
                            </Form.Item>
                            {/* Add Swap Button for Chat Info between Sender and Receiver */}
                            {slug === 'thong-tin-chat' && field.name === 'nguoiGui' && (
                                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                    <Button
                                        icon={<SwapOutlined rotate={90} />}
                                        onClick={() => {
                                            const { nguoiGui, nguoiNhan } = form.getFieldsValue();
                                            form.setFieldsValue({
                                                nguoiGui: nguoiNhan,
                                                nguoiNhan: nguoiGui
                                            });
                                            // Trigger manual update of group name if needed via re-calculation
                                            // GenericView onValuesChange handles user input, but setFieldsValue might not trigger it.
                                            // Let's enforce the group name update here to be safe.
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
                    router.refresh(); // Refresh server data
                }}
            />
        </div >
    );
}
