'use client';

import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Tag, Typography, Button, message, Modal, Form, Input, DatePicker, Select, Badge, Tooltip, Avatar, Space, Popover, Upload, List } from 'antd';
import {
    ClockCircleOutlined,
    UserOutlined,
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    SyncOutlined,
    FileTextOutlined,
    PaperClipOutlined,
    BankOutlined,
    PhoneOutlined,
    MoreOutlined,
    UploadOutlined,
    InboxOutlined,
    CloseOutlined,
    SendOutlined
} from '@ant-design/icons';
import type { Task } from '@prisma/client';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragStartEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
    useDroppable,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { updateTaskStatus, createTask, updateTask, uploadTaskFiles, getExecutionUnits, getZaloGroups, addTaskNote, deleteTask } from '@/lib/task-actions';
import dayjs from 'dayjs';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

const { Title, Text } = Typography;
const { Option, OptGroup } = Select;
const { TextArea } = Input;

const COLUMN_STATUSES = {
    todo: {
        label: 'Chưa thực hiện',
        value: 'Chưa thực hiện',
        color: '#fff0f6', // Light Pink bg
        headerColor: '#ffadd2', // Pink Border
        iconColor: '#eb2f96'
    },
    pending: {
        label: 'Chờ kết quả',
        value: 'Chờ kết quả',
        color: '#fff7e6', // Light Orange bg
        headerColor: '#ffd591', // Orange Border
        iconColor: '#fa8c16'
    },
    done: {
        label: 'Hoàn thành',
        value: 'Hoàn thành',
        color: '#f6ffed', // Light Green bg
        headerColor: '#b7eb8f', // Green Border
        iconColor: '#52c41a'
    },
};

interface KanbanBoardProps {
    tasks: Task[];
}

interface TaskCardProps {
    task: Task;
    onAction: () => void;
    onUpload: (task: Task) => void;
    onTaskUpdate: (task: Task) => void;
}

interface DroppableColumnProps {
    id: string;
    column: {
        label: string;
        value: string;
        color: string;
        headerColor: string;
        iconColor: string;
    };
    tasks: Task[];
    onEdit: (task: Task) => void;
    onUpload: (task: Task) => void;
    onTaskUpdate: (task: Task) => void;
}

// stable noop
const noop = () => { };

// STABLE: Di chuyển ra ngoài component để tránh tạo mới mỗi render
const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: { opacity: '0.5' },
        },
    }),
};

// Memoized Modal
const UploadFilesModal = React.memo(({ visible, onCancel, onSuccess, task }: { visible: boolean, onCancel: () => void, onSuccess: () => void, task: Task | null }) => {
    const [fileList, setFileList] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [form] = Form.useForm();

    // Reset form when opening
    React.useEffect(() => {
        if (visible) {
            form.resetFields();
            setFileList([]);
        }
    }, [visible, form]);

    const handleUpload = async () => {
        if (!task) return;

        try {
            const values = await form.validateFields();
            const formData = new FormData();

            // Add files
            fileList.forEach((file) => {
                formData.append('files', file.originFileObj);
            });

            if (fileList.length === 0) {
                message.error('Vui lòng chọn file');
                return;
            }

            // Add metadata
            formData.append('note', values.note || '');

            // Handle Related People (More Info)
            if (values.relatedPeople && values.relatedPeople.length > 0) {
                // Format dates to string
                const formattedPeople = values.relatedPeople.map((p: any) => ({
                    ...p,
                    ngay_sinh: p.ngay_sinh ? dayjs(p.ngay_sinh).format('YYYY-MM-DD') : ''
                }));
                formData.append('moreInfo', JSON.stringify(formattedPeople));
            }

            setUploading(true);
            const result = await uploadTaskFiles(task.id, formData);
            if (result.success) {
                message.success(result.message);
                onSuccess();
                onCancel();
            } else {
                message.error(result.message || 'Lỗi tải lên');
            }
        } catch (error) {
            console.error(error);
            message.error('Có lỗi xảy ra hoặc thiếu thông tin');
        } finally {
            setUploading(false);
        }
    };

    const uploadProps: any = {
        onRemove: (file: any) => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: (file: any) => {
            setFileList([...fileList, file]);
            return false;
        },
        fileList,
        multiple: true,
    };

    return (
        <Modal
            title={`Đính kèm file cho: ${task?.requesterName || 'Công việc'}`}
            open={visible}
            onCancel={onCancel}
            width={700}
            footer={[
                <Button key="back" onClick={onCancel}>Hủy</Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={uploading}
                    onClick={handleUpload}
                    style={{ background: '#1890ff' }}
                >
                    {uploading ? 'Đang tải lên...' : 'Tải lên ngay'}
                </Button>,
            ]}
        >
            <Form form={form} layout="vertical">
                {/* File Upload Section */}
                <div style={{ marginBottom: 16 }}>
                    <Text strong><PaperClipOutlined /> Chọn file:</Text>
                    <div style={{ marginTop: 8 }}>
                        <Upload.Dragger {...uploadProps}>
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined style={{ color: '#1890ff' }} />
                            </p>
                            <p className="ant-upload-text">Nhấp hoặc kéo thả file vào đây</p>
                        </Upload.Dragger>
                    </div>
                </div>

                {/* Note Section */}
                <Form.Item name="note" label="Ghi chú file">
                    <Input.TextArea rows={2} placeholder="Nhập ghi chú chung cho các file..." />
                </Form.Item>

                {/* Related People Section (Dynamic List) */}
                <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 8 }}>
                    <Text strong><UserOutlined /> Thông tin đối tượng liên quan (Optional)</Text>
                    <Form.List name="relatedPeople">
                        {(fields, { add, remove }) => (
                            <div style={{ marginTop: 8 }}>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Card
                                        key={key}
                                        size="small"
                                        style={{ marginBottom: 8 }}
                                        extra={<CloseOutlined onClick={() => remove(name)} />}
                                    >
                                        <Row gutter={12}>
                                            <Col span={12}>
                                                <Form.Item required {...restField} name={[name, 'ho_ten']} label="Họ tên" rules={[{ required: true, message: 'Thiếu tên' }]}>
                                                    <Input placeholder="Họ và tên" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item {...restField} name={[name, 'cccd_cmnd']} label="CCCD/CMND">
                                                    <Input placeholder="Số giấy tờ" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item {...restField} name={[name, 'so_dien_thoai']} label="SĐT">
                                                    <Input placeholder="Số điện thoại" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item {...restField} name={[name, 'ngay_sinh']} label="Ngày sinh">
                                                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item {...restField} name={[name, 'phan_loai']} label="Phân loại">
                                                    <Select placeholder="Chọn loại">
                                                        <Select.Option value="Người sử dụng">Người sử dụng</Select.Option>
                                                        <Select.Option value="Người đăng ký">Người đăng ký</Select.Option>
                                                        <Select.Option value="Khác">Khác</Select.Option>
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item {...restField} name={[name, 'ho_khau_thuong_tru']} label="HKTT">
                                                    <Input placeholder="Hộ khẩu thường trú" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Card>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Thêm người liên quan
                                </Button>
                            </div>
                        )}
                    </Form.List>
                </div>
            </Form>
        </Modal>
    );
});

// --- Optimized Components ---

const TaskCard = React.memo(function TaskCard({ task, onAction, onUpload, onTaskUpdate }: TaskCardProps) {
    const isOverdue = task.deadline && dayjs(task.deadline).isBefore(dayjs());
    const isUrgent = task.progressWarning === 'Khẩn cấp';

    // Handler to avoid inline async function creation in render
    const handleStatusChange = async (e: React.MouseEvent, newItem: any) => {
        e.stopPropagation();
        if (newItem.value === task.status) return;

        // Optimistic Update
        const oldStatus = task.status;
        const updatedTask = { ...task, status: newItem.value };
        onTaskUpdate(updatedTask);
        message.success(`Đã cập nhật trạng thái: ${newItem.label}`);

        // Server Update
        try {
            const result = await updateTaskStatus(task.id, newItem.value);
            if (!result.success) {
                // Rollback on failure
                onTaskUpdate({ ...task, status: oldStatus });
                message.error('Cập nhật thất bại');
            }
        } catch (err) {
            onTaskUpdate({ ...task, status: oldStatus });
            message.error('Lỗi kết nối');
        }
    };

    return (
        <Card
            size="small"
            style={{
                borderRadius: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid #e8e8e8',
                overflow: 'hidden',
                marginBottom: 12
            }}
            styles={{ body: { padding: '12px 16px' } }}
        >
            {/* Header Tags */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Tag color={getRequestTypeColor(task.requestType)} style={{ borderRadius: 12, padding: '0 10px', fontWeight: 500, border: 'none' }}>
                    {task.requestType}
                </Tag>
                {task.deadline ? (
                    <Tag color={isOverdue ? 'red' : isUrgent ? 'gold' : 'geekblue'} style={{ borderRadius: 12, marginRight: 0 }}>
                        {isOverdue ? 'Quá hạn' : dayjs(task.deadline).format('DD/MM/YYYY')}
                    </Tag>
                ) : (
                    <Tag style={{ borderRadius: 12, marginRight: 0 }}>Chưa định thời hạn</Tag>
                )}
            </div>

            {/* Main Content */}
            <div style={{ marginBottom: 12 }}>
                <Title level={5} style={{ margin: '0 0 4px', fontSize: 16 }}>{task.targetName || 'Không tên'}</Title>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8c8c8c', fontSize: 13 }}>
                    <UserOutlined />
                    <Text type="secondary">{task.requesterName}</Text>
                </div>
            </div>

            {/* Context Info (Phone/Bank) */}
            {(task.phoneNumber || task.bankName) && (
                <div style={{ background: '#f9f9f9', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
                    {task.phoneNumber && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <PhoneOutlined style={{ color: '#52c41a' }} />
                            <Text strong>{task.phoneNumber}</Text>
                            <Text type="secondary">({task.carrier})</Text>
                        </div>
                    )}
                    {task.bankName && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <BankOutlined style={{ color: '#1890ff' }} />
                            <Text strong>{task.accountNumber}</Text>
                            <Text type="secondary">- {task.bankName}</Text>
                        </div>
                    )}
                </div>
            )}

            {/* Content Preview */}
            {task.content && (
                <div style={{ fontSize: 13, color: '#595959', marginBottom: 12, fontStyle: 'italic' }}>
                    "{task.content.length > 80 ? task.content.substring(0, 80) + '...' : task.content}"
                </div>
            )}

            {/* Action Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid #f0f0f0',
                paddingTop: 8,
                marginTop: 8
            }}>
                <Space size={4}>
                    <Tooltip title="Chỉnh sửa">
                        <Button type="text" size="small" icon={<EditOutlined style={{ color: '#52c41a' }} />} onClick={onAction} />
                    </Tooltip>
                    <Tooltip title="File đính kèm">
                        <Button
                            type="text"
                            size="small"
                            icon={<PaperClipOutlined style={{ color: '#1890ff' }} />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpload(task);
                            }}
                        />
                    </Tooltip>
                    <Popover
                        content={
                            <div style={{ minWidth: 200 }}>
                                {Object.values(COLUMN_STATUSES).map((item) => (
                                    <div
                                        key={item.value}
                                        onClick={(e) => handleStatusChange(e, item)}
                                        style={{
                                            cursor: 'pointer',
                                            background: item.value === task.status ? '#e6f7ff' : 'transparent',
                                            padding: '8px 12px',
                                            borderRadius: 4,
                                            marginBottom: 4,
                                            transition: 'background 0.3s'
                                        }}
                                        className="status-item-hover"
                                    >
                                        <Text style={{ color: item.iconColor }}>{item.label}</Text>
                                    </div>
                                ))}
                            </div>
                        }
                        title="Chuyển trạng thái"
                        trigger="click"
                        placement="bottom"
                    >
                        <Tooltip title="Cập nhật trạng thái">
                            <Button type="text" size="small" icon={<SyncOutlined style={{ color: '#fa8c16' }} />} onClick={(e) => e.stopPropagation()} />
                        </Tooltip>
                    </Popover>
                    <Tooltip title="Ghi chú">
                        <Button type="text" size="small" icon={<FileTextOutlined style={{ color: '#722ed1' }} />} onClick={onAction} />
                    </Tooltip>
                </Space>
                <Tooltip title="Xóa">
                    <Button type="text" size="small" icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />} />
                </Tooltip>
            </div>
        </Card>
    );
}, (prev, next) => {
    // Custom comparison for performance if needed, but default shallow compare is usually enough for props
    return prev.task === next.task && prev.onAction === next.onAction && prev.onUpload === next.onUpload && prev.onTaskUpdate === next.onTaskUpdate;
});

const SortableItem = React.memo(function SortableItem({ task, onEdit, onUpload, onTaskUpdate }: { task: Task; onEdit: (task: Task) => void; onUpload: (task: Task) => void; onTaskUpdate: (task: Task) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id, data: { task } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1, // Dim while dragging
    };

    // STABLE: Tạo callback ổn định thay vì inline
    const handleAction = React.useCallback(() => onEdit(task), [onEdit, task]);

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard task={task} onAction={handleAction} onUpload={onUpload} onTaskUpdate={onTaskUpdate} />
        </div>
    );
});

const DroppableColumn = React.memo(function DroppableColumn({ id, column, tasks, onEdit, onUpload, onTaskUpdate }: DroppableColumnProps) {
    const { setNodeRef } = useDroppable({
        id: id,
        data: {
            type: 'Column',
            columnId: id
        }
    });

    return (
        <div
            ref={setNodeRef}
            style={{
                background: '#f0f2f5',
                padding: '16px',
                borderRadius: '8px',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
            }}
        >
            <div style={{
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `2px solid ${column.headerColor}`,
                paddingBottom: '8px'
            }}>
                <Title level={5} style={{ margin: 0, color: '#262626' }}>{column.label}</Title>
                <Badge count={tasks.length} showZero color={column.iconColor} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: '100px' }}>
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <SortableItem key={task.id} task={task} onEdit={onEdit} onUpload={onUpload} onTaskUpdate={onTaskUpdate} />
                    ))}
                </SortableContext>
                {/* Placeholder for empty lists */}
                {tasks.length === 0 && <div style={{ height: '50px', border: '1px dashed #d9d9d9', borderRadius: '4px' }} />}
            </div>
        </div>
    );
});

export default function KanbanBoard({ tasks: initialTasks }: KanbanBoardProps) {

    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [currentTaskForUpload, setCurrentTaskForUpload] = useState<Task | null>(null);

    // Read URL Search Params for filtering
    const searchParams = useSearchParams();
    const query = searchParams.get('query')?.toString().toLowerCase() || '';

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    // Sync tasks when props change
    React.useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    // --- Memoized Handlers ---

    const handleEditClick = React.useCallback((task: Task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    }, []);

    const handleUploadClick = React.useCallback((task: Task) => {
        setCurrentTaskForUpload(task);
        setIsUploadModalOpen(true);
    }, []);

    const handleTaskUpdate = React.useCallback((updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        setSelectedTask(prev => (prev && prev.id === updatedTask.id ? updatedTask : prev));
    }, []);

    // Filter tasks - Memoized to prevent recalculation on every render
    const filteredTasks = React.useMemo(() => tasks.filter(t =>
        t.targetName?.toLowerCase().includes(query) ||
        t.requesterName?.toLowerCase().includes(query) ||
        t.content?.toLowerCase().includes(query)
    ), [tasks, query]);

    // Group tasks by status - Key optimization to provide stable props to DroppableColumn
    const tasksByStatus = React.useMemo(() => {
        const acc = {
            todo: [] as Task[],
            pending: [] as Task[],
            done: [] as Task[]
        };

        filteredTasks.forEach(task => {
            if (task.status === COLUMN_STATUSES.todo.value) acc.todo.push(task);
            else if (task.status === COLUMN_STATUSES.pending.value) acc.pending.push(task);
            else if (task.status === COLUMN_STATUSES.done.value) acc.done.push(task);
        });

        return acc;
    }, [filteredTasks]);

    const handleDragStart = React.useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }, []);

    const handleDragEnd = React.useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeTask = tasks.find((t) => t.id === active.id);
        const overContainer = over.data.current?.sortable?.containerId || over.id;

        if (activeTask && overContainer) {
            let newStatus = '';
            // Map column IDs or values to status string
            const colKey = Object.keys(COLUMN_STATUSES).find(k => k === overContainer) || overContainer;

            if (colKey === 'todo' || colKey === 'Chưa thực hiện') newStatus = 'Chưa thực hiện';
            else if (colKey === 'pending' || colKey === 'Chờ kết quả') newStatus = 'Chờ kết quả';
            else if (colKey === 'done' || colKey === 'Hoàn thành') newStatus = 'Hoàn thành';
            else return; // Invalid drop

            if (activeTask.status !== newStatus) {
                // Optimistic Logic (reused)
                const updatedTasks = tasks.map(t =>
                    t.id === activeTask.id ? { ...t, status: newStatus } : t
                );
                setTasks(updatedTasks);
                message.success('Đã cập nhật trạng thái!');
                await updateTaskStatus(activeTask.id, newStatus);
            }
        }
    }, [tasks]);

    // Unchanged handlers
    const handleUploadSuccess = () => {
        setIsUploadModalOpen(false);
    };

    const { replace } = useRouter();
    const pathname = usePathname();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [activeMobileTab, setActiveMobileTab] = useState('todo');

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('query', term);
        } else {
            params.delete('query');
        }
        replace(`${pathname}?${params.toString()}`);
    }, 400);

    // Stable Cancel Handlers
    const handleUploadCancel = React.useCallback(() => setIsUploadModalOpen(false), []);
    const handleEditCancel = React.useCallback(() => setIsModalOpen(false), []);
    const handleCreateCancel = React.useCallback(() => setIsCreateModalOpen(false), []);



    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* Header / Toolbar */}
            <div style={{
                padding: '12px 16px 12px 60px',
                background: '#fff',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                flexWrap: 'nowrap',
                gap: 12,
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <Title level={4} style={{ margin: 0, color: '#333', whiteSpace: 'nowrap', fontSize: 16, flex: 'none', textAlign: 'left' }}>Quản lý công việc</Title>

                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
                    <Popover
                        content={
                            <Input
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                placeholder="Tìm kiếm..."
                                style={{ width: 250, borderRadius: 20 }}
                                onChange={(e) => handleSearch(e.target.value)}
                                defaultValue={query}
                                autoFocus
                                allowClear
                            />
                        }
                        title={null}
                        trigger="click"
                        placement="bottomRight"
                        arrow={false}
                    >
                        <Tooltip title="Tìm kiếm">
                            <Button
                                shape="circle"
                                size="large"
                                icon={<SearchOutlined />}
                                style={{ border: 'none', background: '#f5f5f5', color: '#555' }}
                            />
                        </Tooltip>
                    </Popover>

                    <Tooltip title="Thêm công việc mới">
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            shape="circle"
                            size="large"
                            onClick={() => setIsCreateModalOpen(true)}
                            style={{ background: '#52c41a', borderColor: '#52c41a', boxShadow: '0 2px 8px rgba(82, 196, 26, 0.35)' }}
                        />
                    </Tooltip>
                </div>
            </div>

            <DndContext
                id="kanban-dnd-context"
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <Row gutter={[16, 16]} style={{ height: '100%', padding: '16px' }}>
                    {Object.entries(COLUMN_STATUSES).map(([key, col]) => {
                        const isActive = activeMobileTab === key;

                        // Use stable task groups
                        // Note: key should match logic in tasksByStatus (todo, pending, done)
                        let columnTasks: Task[] = [];
                        if (key === 'todo') columnTasks = tasksByStatus.todo;
                        else if (key === 'pending') columnTasks = tasksByStatus.pending;
                        else if (key === 'done') columnTasks = tasksByStatus.done;

                        return (
                            <Col
                                xs={isActive ? 24 : 0}
                                md={8}
                                key={key}
                                style={{ height: '100%', display: undefined }}
                            >
                                <DroppableColumn
                                    id={key}
                                    column={col}
                                    tasks={columnTasks}
                                    onEdit={handleEditClick}
                                    onUpload={handleUploadClick}
                                    onTaskUpdate={handleTaskUpdate}
                                />
                            </Col>
                        );
                    })}
                </Row>


                {/* Mobile Footer Tabs matches original ... */}
                <div className="mobile-footer-tabs">
                    {/* 3 Tabs */}
                    <div
                        className={`mobile-tab-item ${activeMobileTab === 'todo' ? 'active' : ''}`}
                        onClick={() => setActiveMobileTab('todo')}
                    >
                        <div className="tab-icon" style={{ background: '#ff4d4f' }}>1</div>
                        <span>Chưa thực hiện</span>
                    </div>
                    <div
                        className={`mobile-tab-item ${activeMobileTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveMobileTab('pending')}
                    >
                        <div className="tab-icon" style={{ background: '#faad14' }}>2</div>
                        <span>Chờ kết quả</span>
                    </div>
                    <div
                        className={`mobile-tab-item ${activeMobileTab === 'done' ? 'active' : ''}`}
                        onClick={() => setActiveMobileTab('done')}
                    >
                        <div className="tab-icon" style={{ background: '#52c41a' }}>3</div>
                        <span>Hoàn thành</span>
                    </div>
                </div>


                <DragOverlay dropAnimation={dropAnimation}>
                    {activeId ? (
                        <TaskCard
                            task={tasks.find(t => t.id === activeId)!}
                            onUpload={handleUploadClick}
                            onAction={noop}
                            onTaskUpdate={noop}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* View/Edit Modal */}
            <Modal
                title="Chi tiết công việc"
                open={isModalOpen}
                onCancel={handleEditCancel}
                footer={null}
                width={800}
                destroyOnHidden
            >
                {selectedTask && (
                    <EditTaskForm
                        task={selectedTask}
                        onSuccess={handleEditCancel}
                        onTaskUpdate={handleTaskUpdate}
                    />
                )}
            </Modal>

            {/* Create Task Modal */}
            <Modal
                title="Thêm mới công việc"
                open={isCreateModalOpen}
                onCancel={handleCreateCancel}
                footer={null}
                width={800}
                destroyOnHidden
            >
                <CreateTaskForm onSuccess={handleCreateCancel} />
            </Modal>

            {/* Upload Modal */}
            <UploadFilesModal
                visible={isUploadModalOpen}
                task={currentTaskForUpload}
                onCancel={handleUploadCancel}
                onSuccess={handleUploadSuccess}
            />

        </div>
    );
}

// --- Forms ---

const CreateTaskForm = React.memo(function CreateTaskForm({ onSuccess }: { onSuccess: () => void }) {
    const [form] = Form.useForm();
    const requestType = Form.useWatch('requestType', form);
    const [executionUnits, setExecutionUnits] = useState<string[]>([]);
    const [zaloGroups, setZaloGroups] = useState<{ groupId: string; name: string }[]>([]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [units, groups] = await Promise.all([
                    getExecutionUnits(),
                    getZaloGroups()
                ]);
                setExecutionUnits(units);
                setZaloGroups(groups);
            } catch (error) {
                console.error("Failed to fetch form data", error);
            }
        };
        fetchData();
    }, []);

    const onFinish = async (values: any) => {
        const formData = new FormData();
        Object.keys(values).forEach(key => {
            if (key !== 'files' && values[key] !== undefined && values[key] !== null) {
                if (key === 'deadline' && values[key]) {
                    formData.append(key, values[key].toISOString());
                } else {
                    formData.append(key, values[key]);
                }
            }
        });

        // Append Files
        if (values.files && values.files.length > 0) {
            values.files.forEach((file: any) => {
                if (file.originFileObj) {
                    formData.append('files', file.originFileObj);
                }
            });
        }

        const result = await createTask(null, formData);
        if (result.success) {
            message.success(result.message);
            onSuccess();
        } else {
            message.error(result.message);
        }
    };

    return (
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ requestType: 'Sao kê' }}>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="targetName" label="Họ tên đối tượng" rules={[{ required: true, message: 'Vui lòng nhập họ tên đối tượng' }]}>
                        <Input placeholder="Nhập tên đối tượng" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="groupId" label="Nhóm/Chuyên án" rules={[{ required: true }]}>
                        <Select placeholder="-- Chọn nhóm --" showSearch optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())}>
                            {zaloGroups.map(group => (
                                <Option key={group.groupId} value={group.groupId}>{group.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="requestType" label="Loại yêu cầu" rules={[{ required: true }]}>
                        <Select placeholder="-- Chọn loại yêu cầu --">
                            <OptGroup label="🏦 Bank">
                                <Option key="bank_saoke" value="Sao kê">Sao kê</Option>
                                <Option value="Cung cấp thông tin">Cung cấp thông tin</Option>
                                <Option value="Cung cấp IP">Cung cấp IP</Option>
                                <Option value="Cung cấp hình ảnh">Cung cấp hình ảnh</Option>
                            </OptGroup>
                            <OptGroup label="Napas">
                                <Option key="napas_saoke" value="Sao kê">Sao kê (Napas)</Option>
                            </OptGroup>
                            <OptGroup label="📱 Số điện thoại">
                                <Option value="Rút list">Rút list</Option>
                                <Option value="Quét Imei">Quét Imei</Option>
                                <Option value="Giám sát">Giám sát</Option>
                                <Option value="Định vị">Định vị</Option>
                            </OptGroup>
                            <OptGroup label="💬 Zalo">
                                <Option value="Cung cấp thông tin Zalo">Cung cấp thông tin Zalo</Option>
                                <Option value="Cung cấp IP Zalo">Cung cấp IP Zalo</Option>
                            </OptGroup>
                            <OptGroup label="📄 Công văn">
                                <Option value="Công văn">Công văn</Option>
                                <Option value="Uỷ thác điều tra">Uỷ thác điều tra</Option>
                            </OptGroup>
                            <OptGroup label="🔍 Xác minh">
                                <Option value="Xác minh phương tiện">Xác minh phương tiện</Option>
                                <Option value="Xác minh đối tượng">Xác minh đối tượng</Option>
                                <Option value="Vẽ sơ đồ đường dây">Vẽ sơ đồ đường dây</Option>
                                <Option value="Khác">Khác</Option>
                            </OptGroup>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="executionUnit" label="Đơn vị thực hiện">
                        <Select placeholder="Chọn đơn vị" showSearch optionFilterProp="children">
                            {executionUnits.map((unit) => (
                                <Option key={unit} value={unit}>{unit}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="deadline" label="Thời hạn">
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
                    </Form.Item>
                </Col>
            </Row>

            {/* Dynamic Fields based on Request Type */}
            {['Sao kê', 'Cung cấp thông tin', 'Cung cấp IP', 'Cung cấp hình ảnh'].includes(requestType) && (
                <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: 8, marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Thông tin ngân hàng:</Text>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="accountNumber" label="Số tài khoản"><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="bankName" label="Ngân hàng"><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="accountName" label="Tên chủ TK"><Input /></Form.Item></Col>
                    </Row>
                </div>
            )}

            {['Rút list', 'Định vị', 'Quét Imei', 'Giám sát', 'Cung cấp thông tin Zalo', 'Cung cấp IP Zalo'].includes(requestType) && (
                <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: 8, marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Thông tin thuê bao:</Text>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="phoneNumber" label="Số điện thoại"><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="carrier" label="Nhà mạng"><Input /></Form.Item></Col>
                    </Row>
                </div>
            )}

            {['Công văn', 'Uỷ thác điều tra'].includes(requestType) && (
                <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: 8, marginBottom: 16 }}>
                    <Form.Item name="documentInfo" label="Thông tin văn bản/Quyết định">
                        <Input.TextArea rows={2} placeholder="Số công văn, ngày tháng, nội dung tóm tắt..." />
                    </Form.Item>
                </div>
            )}

            <Form.Item name="content" label="Nội dung chi tiết/Ghi chú">
                <TextArea rows={4} placeholder="Nhập nội dung chi tiết..." />
            </Form.Item>



            <Form.Item>
                <Button type="primary" htmlType="submit" block loading={false} style={{ height: 40, background: '#52c41a', borderColor: '#52c41a' }}>
                    Thêm công việc
                </Button>
            </Form.Item>
        </Form>
    )
});

const EditTaskForm = React.memo(function EditTaskForm({ task, onSuccess, onTaskUpdate }: { task: Task, onSuccess: () => void, onTaskUpdate: (task: Task) => void }) {
    const [form] = Form.useForm();
    const requestType = Form.useWatch('requestType', form);
    const [zaloGroups, setZaloGroups] = useState<{ groupId: string; name: string }[]>([]);
    const [newNote, setNewNote] = useState('');
    const [addingNote, setAddingNote] = useState(false);

    useEffect(() => {
        getZaloGroups().then(setZaloGroups);
    }, []);

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        // Optimistic Update
        const optimisticNote = {
            id: Math.random().toString(),
            content: newNote,
            createdBy: 'Bạn',
            createdAt: new Date(),
            taskId: task.id
        };
        const updatedTask = {
            ...task,
            notes: [...(task.notes as any[] || []), optimisticNote]
        };
        onTaskUpdate(updatedTask);
        setNewNote('');

        setAddingNote(true);
        try {
            const result = await addTaskNote(task.id, newNote);
            if (result.success) {
                message.success('Đã thêm ghi chú');
                // Note: We do NOT close the modal on note add
            } else {
                message.error(result.message);
                // Ideally rollback here if failed
            }
        } catch (error) {
            console.error(error);
        } finally {
            setAddingNote(false);
        }
    };

    const initialValues = {
        ...task,
        deadline: task.deadline ? dayjs(task.deadline) : undefined,
    };

    const onFinish = async (values: any) => {
        const formData = new FormData();
        Object.keys(values).forEach(key => {
            if (values[key] !== undefined && values[key] !== null) {
                if (key === 'deadline' && values[key]) {
                    formData.append(key, values[key].toISOString());
                } else {
                    formData.append(key, values[key]);
                }
            }
        });

        const result = await updateTask(task.id, formData);
        if (result.success) {
            message.success(result.message);
            onSuccess();
        } else {
            message.error(result.message);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            onFinish={onFinish}
        >
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="groupName" label="Nhóm/Chuyên án">
                        <Select
                            placeholder="Chọn nhóm"
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option: any) =>
                                (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {zaloGroups.map(group => (
                                <Option key={group.groupId} value={group.groupId}>{group.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="targetName" label="Tên đối tượng/Chủ tài khoản" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item name="requestType" label="Loại yêu cầu">
                <Select disabled>
                    <Option value="Sao kê">Sao kê</Option>
                    <Option value="Xác minh số điện thoại">Xác minh SĐT</Option>
                    <Option value="Zalo">Zalo</Option>
                    <Option value="Công văn">Công văn</Option>
                </Select>
            </Form.Item>

            {/* Dynamic Fields for Edit - Show based on current type (Simplified for now, can be expanded) */}
            {(initialValues.requestType === 'Sao kê' || initialValues.requestType === 'Ngân hàng') && (
                <Row gutter={16}>
                    <Col span={8}><Form.Item name="accountNumber" label="Số tài khoản"><Input /></Form.Item></Col>
                    <Col span={8}><Form.Item name="bankName" label="Ngân hàng"><Input /></Form.Item></Col>
                    <Col span={8}><Form.Item name="accountName" label="Tên chủ TK"><Input /></Form.Item></Col>
                </Row>
            )}
            {(initialValues.requestType === 'Xác minh số điện thoại') && (
                <Row gutter={16}>
                    <Col span={12}><Form.Item name="phoneNumber" label="Số điện thoại"><Input /></Form.Item></Col>
                    <Col span={12}><Form.Item name="carrier" label="Nhà mạng"><Input /></Form.Item></Col>
                </Row>
            )}

            <Form.Item name="content" label="Nội dung">
                <TextArea rows={4} />
            </Form.Item>
            <Form.Item name="deadline" label="Hạn chót">
                <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="progressWarning" label="Cảnh báo tiến độ">
                <Select>
                    <Option value="Bình thường">Bình thường</Option>
                    <Option value="Cảnh báo">Cảnh báo</Option>
                    <Option value="Khẩn cấp">Khẩn cấp</Option>
                </Select>
            </Form.Item>

            <div style={{ marginTop: 24 }}>
                <Text strong><FileTextOutlined /> Hoạt động / Ghi chú</Text>
                <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginTop: 8 }}>
                    <div style={{ marginBottom: 16, maxHeight: 200, overflowY: 'auto' }}>
                        {(!task.notes || (task.notes as any[]).length === 0) ? (
                            <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>Chưa có ghi chú nào</div>
                        ) : (
                            (task.notes as any[]).map((item: any, index: number) => (
                                <div key={item.id || index} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Avatar style={{ backgroundColor: '#87d068', marginRight: 12, flexShrink: 0 }} icon={<UserOutlined />} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <Text strong>{item.createdBy}</Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(item.createdAt).format('HH:mm DD/MM/YYYY')}</Text>
                                            </div>
                                            <div style={{ color: '#595959' }}>{item.content}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Input
                            placeholder="Viết ghi chú..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            onPressEnter={handleAddNote}
                        />
                        <Button type="primary" icon={<SendOutlined />} onClick={handleAddNote} loading={addingNote}>
                            Gửi
                        </Button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
                <Button onClick={onSuccess}>Hủy</Button>
                <Button type="primary" htmlType="submit">
                    Lưu thay đổi
                </Button>
            </div>
        </Form>
    );
});

function getPriorityColor(warning: string | null) {
    if (!warning) return '#d9d9d9';
    const w = warning.toLowerCase();
    if (w.includes('khẩn') || w.includes('quá hạn')) return '#ff4d4f';
    if (w.includes('cảnh báo')) return '#faad14';
    return '#52c41a';
}

function getRequestTypeColor(type: string | null) {
    const t = type?.toLowerCase() || '';
    if (t.includes('ngân hàng') || t.includes('sao kê')) return 'magenta'; // Changed to magenta to match screenshot's pink
    if (t.includes('điện thoại')) return 'purple';
    if (t.includes('zalo')) return 'cyan';
    if (t.includes('văn bản') || t.includes('công văn')) return 'geekblue';
    return 'default';
}
