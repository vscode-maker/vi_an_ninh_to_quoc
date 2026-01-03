'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Row, Col, Typography, Button, message, Modal, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
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
    DragOverEvent,
} from '@dnd-kit/core';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

import VirtualizedColumn from './virtualized-column';
import TaskCard, { COLUMN_STATUSES } from './task-card';
import CreateTaskForm from './create-task-form';
import EditTaskForm from './edit-task-form';
import UploadModal from './upload-modal';
import NoteModal from './note-modal';

import { updateTaskStatus, fetchMoreTasks, deleteTask } from '@/lib/task-actions';

const { Title, Text } = Typography;

interface KanbanBoardProps {
    tasks: Task[];
    initialCounts: { [key: string]: number };
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: { opacity: '1' },
        },
    }),
};

// Helper to group tasks
const groupTasks = (taskList: Task[]) => ({
    todo: taskList.filter(t => t.status === COLUMN_STATUSES.todo.value),
    pending: taskList.filter(t => t.status === COLUMN_STATUSES.pending.value),
    done: taskList.filter(t => t.status === COLUMN_STATUSES.done.value),
});

export default function KanbanBoard({ tasks: initialTasks, initialCounts }: KanbanBoardProps) {
    // Hooks
    const [messageApi, contextHolder] = message.useMessage();

    // State: Use Columns Map instead of flat Tasks array for performance
    const [columns, setColumns] = useState<{ [key: string]: Task[] }>(() => groupTasks(initialTasks));
    const [counts, setCounts] = useState(initialCounts);

    // Modals State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

    // Active Item State
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null); // For Dragging
    const [activeTask, setActiveTask] = useState<Task | null>(null); // Snapshot for DragOverlay
    const [recentlyUpdatedTaskId, setRecentlyUpdatedTaskId] = useState<string | null>(null);

    // Filter / Search
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    // Mobile Tabs
    const [activeMobileTab, setActiveMobileTab] = useState('todo');
    const [isMobile, setIsMobile] = useState(false);

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    // Sync Props (when Search or Initial Load changes)
    useEffect(() => {
        setColumns(groupTasks(initialTasks));
        setCounts(initialCounts);
    }, [initialTasks, initialCounts]);

    // Mobile Detection
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // --- Search Handler (Handled by URL Params) ---

    // --- Task Actions ---

    // 1. Edit
    const handleEditTask = useCallback((task: Task) => {
        setSelectedTask(task);
        setIsEditModalOpen(true);
    }, []);

    // 2. View
    const handleViewTask = useCallback((task: Task) => {
        setSelectedTask(task);
        setIsEditModalOpen(true);
    }, []);

    // 3. Upload
    const handleUpload = useCallback((task: Task) => {
        setSelectedTask(task);
        setIsUploadModalOpen(true);
    }, []);

    // 4. Notes
    const handleAddNote = useCallback((task: Task) => {
        setSelectedTask(task);
        setIsNoteModalOpen(true);
    }, []);

    // 5. Update (Edit Form / Optimistic)
    const handleTaskUpdate = useCallback((updatedTask: Task) => {
        setColumns(prev => {
            // Find which column the task WAS in
            const statusKey = Object.keys(prev).find(key => prev[key].some(t => t.id === updatedTask.id));
            if (!statusKey) return prev;

            // Check if status changed
            const currentStatus = statusKey === 'todo' ? COLUMN_STATUSES.todo.value :
                statusKey === 'pending' ? COLUMN_STATUSES.pending.value :
                    COLUMN_STATUSES.done.value;

            if (updatedTask.status !== currentStatus) {
                // Determine new column key
                let newColKey = 'todo';
                if (updatedTask.status === COLUMN_STATUSES.pending.value) newColKey = 'pending';
                if (updatedTask.status === COLUMN_STATUSES.done.value) newColKey = 'done';

                messageApi.success('Đã cập nhật công việc');
                return {
                    ...prev,
                    [statusKey]: prev[statusKey].filter(t => t.id !== updatedTask.id),
                    [newColKey]: [updatedTask, ...prev[newColKey]] // Add to top
                };
            } else {
                // Update in place
                return {
                    ...prev,
                    [statusKey]: prev[statusKey].map(t => t.id === updatedTask.id ? updatedTask : t)
                };
            }
        });

        if (selectedTask?.id === updatedTask.id) {
            setSelectedTask(updatedTask);
        }
        setRecentlyUpdatedTaskId(updatedTask.id);
        setTimeout(() => setRecentlyUpdatedTaskId(null), 2000);
    }, [selectedTask, messageApi]);

    // 6. Delete
    const handleDeleteTask = useCallback(async (task: Task) => {
        const oldColumns = { ...columns };
        const oldCounts = { ...counts };

        let colKey = 'todo';
        if (task.status === COLUMN_STATUSES.pending.value) colKey = 'pending';
        if (task.status === COLUMN_STATUSES.done.value) colKey = 'done';

        // Optimistic Delete
        setColumns(prev => ({
            ...prev,
            [colKey]: prev[colKey].filter(t => t.id !== task.id)
        }));

        const statusVal = task.status || 'Chưa thực hiện';
        setCounts(prev => ({
            ...prev,
            [statusVal]: Math.max(0, (prev[statusVal] || 0) - 1)
        }));

        messageApi.success('Đã xóa công việc');

        const result = await deleteTask(task.id);
        if (!result.success) {
            // Rollback
            setColumns(oldColumns);
            setCounts(oldCounts);
            messageApi.error(result.message);
        }
    }, [columns, counts, messageApi]);

    // --- Pagination / Load More ---
    const handleLoadMore = useCallback(async (colKey: string) => {
        const currentTasks = columns[colKey];
        const currentCount = currentTasks.length;
        const statusValue = colKey === 'todo' ? COLUMN_STATUSES.todo.value :
            colKey === 'pending' ? COLUMN_STATUSES.pending.value :
                COLUMN_STATUSES.done.value;

        if (currentCount >= counts[statusValue]) return;

        const newTasks = await fetchMoreTasks(statusValue, currentCount);
        if (newTasks.length > 0) {
            setColumns(prev => {
                const existingIds = new Set(prev[colKey].map(t => t.id));
                const filteredNew = newTasks.filter(t => !existingIds.has(t.id));
                if (filteredNew.length === 0) return prev;

                return {
                    ...prev,
                    [colKey]: [...prev[colKey], ...filteredNew]
                };
            });
        }
    }, [columns, counts]);

    // --- Drag and Drop ---

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);
        // Find the task object for the overlay
        const task = Object.values(columns).flat().find(t => t.id === active.id);
        if (task) setActiveTask(task);
    }, [columns]);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find active container (column)
        const findContainer = (id: string): string | undefined => {
            if (id in columns) return id;
            return Object.keys(columns).find(key => columns[key].some(t => t.id === id));
        };

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        // Active task
        const activeItem = columns[activeContainer].find(t => t.id === activeId);
        if (!activeItem) return;

        // Determine new status based on overContainer
        let newStatus = COLUMN_STATUSES.todo.value;
        if (overContainer === 'pending') newStatus = COLUMN_STATUSES.pending.value;
        if (overContainer === 'done') newStatus = COLUMN_STATUSES.done.value;

        // Optimistic Move
        setColumns((prev) => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];
            const activeIndex = activeItems.findIndex(t => t.id === activeId);

            const newItem = {
                ...activeItems[activeIndex],
                status: newStatus
            };

            let newOverItems = [...overItems];
            const isOverColumn = overId === overContainer;
            if (isOverColumn) {
                newOverItems = [newItem, ...overItems];
            } else {
                newOverItems = [newItem, ...overItems];
            }

            return {
                ...prev,
                [activeContainer]: prev[activeContainer].filter(t => t.id !== activeId),
                [overContainer]: newOverItems
            };
        });
    }, [columns]);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        const id = active.id as string;
        setActiveId(null);
        setActiveTask(null);

        if (!over) return;

        if (!activeTask) return;

        const findContainer = (itemId: string) =>
            Object.keys(columns).find(key => columns[key].some(t => t.id === itemId));

        const finalContainer = findContainer(id);

        if (finalContainer) {
            let newStatus = '';
            if (finalContainer === 'todo') newStatus = COLUMN_STATUSES.todo.value;
            else if (finalContainer === 'pending') newStatus = COLUMN_STATUSES.pending.value;
            else if (finalContainer === 'done') newStatus = COLUMN_STATUSES.done.value;

            // Check against ORIGINAL status
            if (activeTask.status !== newStatus) {
                // API Call
                setRecentlyUpdatedTaskId(id);
                setTimeout(() => setRecentlyUpdatedTaskId(null), 2000);

                setCounts(prev => ({
                    ...prev,
                    [activeTask.status || 'Chưa thực hiện']: Math.max(0, (prev[activeTask.status || 'Chưa thực hiện'] || 0) - 1),
                    [newStatus]: (prev[newStatus] || 0) + 1
                }));

                messageApi.success('Đã cập nhật trạng thái');

                const result = await updateTaskStatus(id, newStatus);
                if (!result.success) {
                    messageApi.error('Cập nhật thất bại');
                }
            }
        }

    }, [activeTask, columns, messageApi]);

    return (
        <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {contextHolder}
            {/* Header */}
            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Title level={4} style={{ margin: 0, color: '#333', fontSize: 20 }}>Quản lý tiến độ</Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>Theo dõi và cập nhật trạng thái công việc</Text>
                </div>
                <Tooltip title="Thêm công việc mới">
                    <Button
                        type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsCreateModalOpen(true)}
                        style={{ background: '#52c41a', borderColor: '#52c41a', boxShadow: '0 4px 14px rgba(82, 196, 26, 0.4)', borderRadius: 8, fontWeight: 500 }}
                    >
                        Thêm mới
                    </Button>
                </Tooltip>
            </div>

            <DndContext
                id="kanban-dnd-context"
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <Row gutter={[16, 16]} style={{ flex: 1, padding: '0 16px 16px 16px', margin: 0, display: 'flex', alignItems: 'stretch' }}>
                    {Object.entries(COLUMN_STATUSES).map(([key, col]) => {
                        const isActive = activeMobileTab === key;
                        if (isMobile && !isActive) return null;

                        const tasks = columns[key] || [];
                        const totalCount = counts[col.value] || 0;

                        return (
                            <Col xs={24} md={8} key={key} style={{ height: '100%' }}>
                                <VirtualizedColumn
                                    id={key}
                                    column={col}
                                    tasks={tasks}
                                    totalCount={totalCount}
                                    onLoadMore={() => handleLoadMore(key)}
                                    onEdit={handleEditTask}
                                    onView={handleViewTask}
                                    onUpload={handleUpload}
                                    onAddNote={handleAddNote}
                                    onTaskUpdate={handleTaskUpdate}
                                    onDelete={handleDeleteTask}
                                    recentlyUpdatedTaskId={recentlyUpdatedTaskId}
                                />
                            </Col>
                        );
                    })}
                </Row>

                <DragOverlay dropAnimation={dropAnimation}>
                    {activeTask ? (
                        <TaskCard
                            task={activeTask}
                            onAction={() => { }} onView={() => { }} onUpload={() => { }} onAddNote={() => { }} onTaskUpdate={() => { }} onDelete={() => { }}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Modals */}
            <Modal title="Thêm mới công việc" open={isCreateModalOpen} onCancel={() => setIsCreateModalOpen(false)} footer={null} width={800} destroyOnHidden>
                <CreateTaskForm onSuccess={() => setIsCreateModalOpen(false)} />
            </Modal>

            <Modal title="Chi tiết công việc" open={isEditModalOpen} onCancel={() => setIsEditModalOpen(false)} footer={null} width={800} destroyOnHidden>
                {selectedTask && (
                    <EditTaskForm task={selectedTask} onSuccess={() => setIsEditModalOpen(false)} onTaskUpdate={handleTaskUpdate} />
                )}
            </Modal>

            <UploadModal visible={isUploadModalOpen} task={selectedTask} onCancel={() => setIsUploadModalOpen(false)} onSuccess={() => setIsUploadModalOpen(false)} />

            {selectedTask && (
                <NoteModal visible={isNoteModalOpen} onCancel={() => setIsNoteModalOpen(false)} task={selectedTask} onTaskUpdate={handleTaskUpdate} />
            )}

            {/* Mobile Footer */}
            {isMobile && (
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 60, background: '#fff', borderTop: '1px solid #e8e8e8', zIndex: 9999, display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 'env(safe-area-inset-bottom)' }}>
                    {Object.entries(COLUMN_STATUSES).map(([key, col]) => (
                        <div key={key} onClick={() => setActiveMobileTab(key)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: activeMobileTab === key ? col.iconColor : '#8c8c8c' }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: activeMobileTab === key ? col.iconColor : '#f0f0f0', color: activeMobileTab === key ? '#fff' : '#8c8c8c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>
                                {counts[col.value] || 0}
                            </div>
                            <span style={{ fontSize: 10, fontWeight: activeMobileTab === key ? 600 : 400 }}>{col.label.toUpperCase()}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
