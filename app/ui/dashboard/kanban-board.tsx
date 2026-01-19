'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
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
    useDroppable
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { updateTaskStatus, deleteTask } from '@/lib/task-actions';
import type { Task } from '@prisma/client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Plus, Search, Filter } from 'lucide-react';

// Custom Components
import { Button } from '@/app/ui/components/button';
import { Input } from '@/app/ui/components/input';
import { Modal } from '@/app/ui/components/modal';
import TaskCard, { COLUMN_STATUSES } from './task-card';
import CreateTaskForm from './create-task-form';
import EditTaskForm from './edit-task-form';
import { UploadFilesModal } from './upload-files-modal';
import NoteModal from './note-modal';

interface KanbanBoardProps {
    tasks: Task[];
    initialCounts?: { [key: string]: number };
}

// --- Dnd Kit Components ---

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: { opacity: '0.5' },
        },
    }),
};

interface SortableItemProps {
    task: Task;
    onAction: () => void;
    onView: () => void;
    onUpload: (task: Task) => void;
    onAddNote: (task: Task) => void;
    onTaskUpdate: (task: Task) => void;
    onDelete: (task: Task) => void;
}

function SortableItem({ task, onAction, onView, onUpload, onAddNote, onTaskUpdate, onDelete }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { task } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 touch-none">
            <TaskCard
                task={task}
                onAction={onAction}
                onView={onView}
                onUpload={onUpload}
                onAddNote={onAddNote}
                onTaskUpdate={onTaskUpdate}
                onDelete={onDelete}
            />
        </div>
    );
}

interface DroppableColumnProps {
    id: string;
    column: any;
    tasks: Task[];
    count?: number;
    onEdit: (task: Task) => void;
    onView: (task: Task) => void;
    onUpload: (task: Task) => void;
    onAddNote: (task: Task) => void;
    onTaskUpdate: (task: Task) => void;
    onDelete: (task: Task) => void;
}

function DroppableColumn({ id, column, tasks, count, onEdit, onView, onUpload, onAddNote, onTaskUpdate, onDelete }: DroppableColumnProps) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className="flex flex-col h-full rounded-xl bg-gray-50/50 border border-gray-100/50 shadow-sm"
            style={{
                borderTop: `4px solid ${column.headerColor ? column.headerColor.replace('border-', 'var(--tw-border-opacity) ') : '#ccc'}`,
            }}
        >
            {/* Header */}
            <div className={`p-4 pb-2 flex justify-between items-center border-t-4 ${column.headerColor} rounded-t-xl bg-white/50`}>
                <h3 className={`font-bold flex items-center gap-2 ${column.iconColor}`}>
                    <span className={`w-2.5 h-2.5 rounded-full bg-current opacity-70`}></span>
                    {column.label}
                </h3>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-semibold text-gray-500 border border-gray-200 shadow-sm">
                    {count !== undefined ? count : tasks.length}
                </span>
            </div>

            {/* Task List */}
            <div className={`flex-1 p-3 overflow-y-auto min-h-[100px] ${column.color} bg-opacity-30`}>
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <SortableItem
                            key={task.id}
                            task={task}
                            onAction={() => onEdit(task)}
                            onView={() => onView(task)}
                            onUpload={() => onUpload(task)}
                            onAddNote={() => onAddNote(task)}
                            onTaskUpdate={onTaskUpdate}
                            onDelete={onDelete}
                        />
                    ))}
                    {tasks.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200/50 rounded-lg">
                            Kéo thả vào đây
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
}

export default function KanbanBoard({ tasks: initialTasks, initialCounts }: KanbanBoardProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    // Counts state not needed locally if we assume initialCounts are static until reload, 
    // BUT dragging updates counts. Local count should update.
    // However, if we have lazy loading, local tasks.length != total count.

    // Simplification: Use initialCounts as baseline, and adjust based on optimistic updates?
    // Or just rely on tasks.length if we don't have paginated lists yet?
    // Since fetchTasks implements pagination (limit 20), we SHOULD use initialCounts.
    // But updating counts on drag when we don't have all tasks is tricky.
    // For now, let's display initialCounts for the corresponding status, unless we don't have it.

    const [activeId, setActiveId] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Modal States
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [uploadTask, setUploadTask] = useState<Task | null>(null);
    const [noteTask, setNoteTask] = useState<Task | null>(null);

    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    // Derived Columns
    const columns = useMemo(() => {
        const mappedCols: Record<string, Task[]> = {
            todo: tasks.filter(t => t.status === 'Chưa thực hiện' || !t.status),
            pending: tasks.filter(t => t.status === 'Chờ kết quả' || t.status === 'Đang thực hiện'),
            done: tasks.filter(t => t.status === 'Hoàn thành'),
        };
        return mappedCols;
    }, [tasks]);

    // Drag Handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find dest column
        let destColumnId = overId as string;

        // Check if over is a task
        const overTask = tasks.find(t => t.id === overId);
        if (overTask) {
            if (overTask.status === 'Chưa thực hiện') destColumnId = 'todo';
            else if (overTask.status === 'Chờ kết quả' || overTask.status === 'Đang thực hiện') destColumnId = 'pending';
            else if (overTask.status === 'Hoàn thành') destColumnId = 'done';
            else destColumnId = 'todo';
        }

        // Map column ID to Status String
        let newStatus = '';
        if (destColumnId === 'todo') newStatus = 'Chưa thực hiện';
        else if (destColumnId === 'pending') newStatus = 'Chờ kết quả';
        else if (destColumnId === 'done') newStatus = 'Hoàn thành';
        else return;

        const currentTask = tasks.find(t => t.id === activeId);
        if (currentTask && currentTask.status !== newStatus) {
            // Optimistic Update
            const updatedTasks = tasks.map(t => t.id === activeId ? { ...t, status: newStatus } : t);
            setTasks(updatedTasks);

            // Server Call
            const result = await updateTaskStatus(activeId as string, newStatus);
            if (!result.success) {
                alert('Có lỗi xảy ra khi cập nhật trạng thái: ' + (result.error || 'Lỗi không xác định'));
                setTasks(tasks); // Rollback
            }
        }
    };

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('query', term);
        } else {
            params.delete('query');
        }
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    const handleTaskUpdate = useCallback((updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    }, []);

    const handleDeleteTask = async (task: Task) => {
        // Optimistic delete
        const oldTasks = tasks;
        setTasks(prev => prev.filter(t => t.id !== task.id));

        const result = await deleteTask(task.id);
        if (!result.success) {
            alert(result.message || 'Lỗi khi xóa công việc');
            setTasks(oldTasks);
        }
    };

    const handleCreateSuccess = () => {
        setIsCreateModalOpen(false);
        window.location.reload();
    };

    // Helper to get count
    const getCount = (columnId: string, statusLabel: string) => {
        if (initialCounts && initialCounts[statusLabel] !== undefined) {
            // Adjust based on current filtering (tasks state)?
            // If user searched, tasks state is filtered (via fetchTasks prop update).
            // fetchTasks returns counts appropriate for query (Step 2501 line 45 for search).
            // So initialCounts respects query.
            return initialCounts[statusLabel];
        }
        return undefined; // fallback to tasks.length in child
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 justify-between items-center sm:sticky sm:top-0 z-10">
                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Tìm kiếm..."
                            className="pl-10"
                            onChange={(e) => handleSearch(e.target.value)}
                            defaultValue={searchParams.get('query')?.toString()}
                        />
                    </div>
                </div>
                <Button
                    variant="primary"
                    icon={<Plus size={18} />}
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    Thêm Công Việc Mới
                </Button>
            </div>

            {/* Board */}
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 overflow-x-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-w-[800px] md:min-w-0 pb-4">
                        {Object.entries(COLUMN_STATUSES).map(([columnId, columnDef]) => (
                            <DroppableColumn
                                key={columnId}
                                id={columnId}
                                column={columnDef}
                                tasks={columns[columnId] || []}
                                count={getCount(columnId, (columnDef as any).value)}
                                onEdit={setEditingTask}
                                onView={setEditingTask}
                                onUpload={setUploadTask}
                                onAddNote={setNoteTask}
                                onTaskUpdate={handleTaskUpdate}
                                onDelete={handleDeleteTask}
                            />
                        ))}
                    </div>
                </div>

                <DragOverlay dropAnimation={dropAnimation}>
                    {activeId ? (
                        <div className="opacity-90 rotate-2 scale-105 cursor-grabbing">
                            <TaskCard
                                task={tasks.find(t => t.id === activeId)!}
                                onAction={() => { }}
                                onView={() => { }}
                                onUpload={() => { }}
                                onAddNote={() => { }}
                                onTaskUpdate={() => { }}
                                onDelete={() => { }}
                                isHighlighted
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Thêm Công Việc Mới"
                width="800px"
            >
                <CreateTaskForm
                    onSuccess={handleCreateSuccess}
                    onCancel={() => setIsCreateModalOpen(false)}
                />
            </Modal>

            {/* Edit Modal / View Modal */}
            {editingTask && (
                <Modal
                    isOpen={!!editingTask}
                    onClose={() => setEditingTask(null)}
                    title={`Chi tiết: ${editingTask.requesterName || 'Công việc'}`}
                    width="900px"
                >
                    <EditTaskForm
                        task={editingTask}
                        onSuccess={() => {
                            setEditingTask(null);
                        }}
                        onTaskUpdate={handleTaskUpdate}
                    />
                </Modal>
            )}

            {/* Upload Modal */}
            <UploadFilesModal
                visible={!!uploadTask}
                onCancel={() => setUploadTask(null)}
                task={uploadTask}
                onSuccess={() => {
                    setUploadTask(null);
                    window.location.reload();
                }}
            />

            {/* Note Modal */}
            <Suspense fallback={null}>
                {noteTask && (
                    <NoteModal
                        visible={!!noteTask}
                        onCancel={() => setNoteTask(null)}
                        task={noteTask}
                        onTaskUpdate={handleTaskUpdate}
                    />
                )}
            </Suspense>
        </div>
    );
}
