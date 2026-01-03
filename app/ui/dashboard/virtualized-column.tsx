'use client';

import React from 'react';
import { Typography, Badge } from 'antd';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@prisma/client';
import TaskCard from './task-card';

const { Title } = Typography;

interface ColumnConfig {
    label: string;
    value: string;
    color: string;
    headerColor: string;
    iconColor: string;
}

interface VirtualizedColumnProps {
    id: string;
    column: ColumnConfig;
    tasks: Task[];
    onEdit: (task: Task) => void;
    onView: (task: Task) => void; // Added
    onUpload: (task: Task) => void;
    onAddNote: (task: Task) => void;
    onTaskUpdate: (task: Task) => void;

    onDelete: (task: Task) => void;

    recentlyUpdatedTaskId?: string | null;
    totalCount: number;
    onLoadMore: () => void;
}

// Wrapper component cho mỗi item - OPTIMIZED với memoization
interface SortableTaskItemProps {
    task: Task;
    columnId: string; // Added columnId prop
    onEdit: (task: Task) => void;
    onView: (task: Task) => void;
    onUpload: (task: Task) => void;
    onAddNote: (task: Task) => void;
    onTaskUpdate: (task: Task) => void;

    onDelete: (task: Task) => void;
    isHighlighted?: boolean;
}

const SortableTaskItem = React.memo(({
    task,
    columnId, // Destructure columnId
    onEdit,
    onView,
    onUpload,
    onAddNote,
    onTaskUpdate,

    onDelete,
    isHighlighted,
}: SortableTaskItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: task.id,
        data: {
            task,
            columnId // Include columnId in data
        }
    });

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition,
        // When dragging, this item becomes the placeholder.
        // We keep it opaque (1) so the dashed border is visible, 
        // but we'll hide the inner content.
        opacity: 1,
    };

    // STABLE callback để tránh re-render TaskCard
    const handleAction = React.useCallback(() => onEdit(task), [onEdit, task]);
    const handleView = React.useCallback(() => onView(task), [onView, task]);

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                // Placeholder Styles
                border: isDragging ? '2px dashed #52c41a' : 'none', // Green dashed border
                background: isDragging ? 'rgba(82, 196, 26, 0.1)' : 'transparent', // Light green bg
                borderRadius: '8px',
            }}
            {...attributes}
            {...listeners}
        >
            {/* Hide the actual card content when dragging to show only the placeholder box */}
            <div style={{ opacity: isDragging ? 0 : 1 }}>
                <TaskCard
                    task={task}
                    onAction={handleAction}
                    onView={handleView}
                    onUpload={onUpload}
                    onAddNote={onAddNote}
                    onTaskUpdate={onTaskUpdate}

                    onDelete={onDelete}
                    isHighlighted={isHighlighted}
                />
            </div>
        </div>
    );
}, (prev, next) => {
    // Custom comparator implementation
    return prev.task === next.task &&
        prev.columnId === next.columnId && // Check columnId
        prev.onEdit === next.onEdit &&
        prev.onView === next.onView &&
        prev.onUpload === next.onUpload &&
        prev.onAddNote === next.onAddNote &&
        prev.onTaskUpdate === next.onTaskUpdate &&
        prev.onDelete === next.onDelete &&
        prev.isHighlighted === next.isHighlighted;
});

// Main column component - OPTIMIZED
const VirtualizedColumn = React.memo(({
    id,
    column,
    tasks,
    onEdit,
    onView,
    onUpload,
    onAddNote,
    onTaskUpdate,

    onDelete,
    recentlyUpdatedTaskId,
    totalCount,
    onLoadMore,
}: VirtualizedColumnProps) => {
    const { setNodeRef } = useDroppable({
        id: id,
        data: {
            type: 'Column',
            columnId: id
        }
    });

    // Lazy Rendering State
    const [visibleCount, setVisibleCount] = React.useState(20);
    const observerTarget = React.useRef<HTMLDivElement>(null);

    // Reset visible count when tasks change (e.g. search or filter change)
    React.useEffect(() => {
        setVisibleCount(20);
    }, [tasks.length, id]); // Reset when length changes or column ID changes

    // Intersection Observer for Infinite Scroll
    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    if (visibleCount < tasks.length) {
                        setVisibleCount((prev) => Math.min(prev + 20, tasks.length));
                    } else if (tasks.length < totalCount) {
                        onLoadMore();
                    }
                }
            },
            {
                threshold: 0.1,
                rootMargin: '400px' // Load more when within 400px of bottom
            }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [tasks.length, visibleCount, totalCount, onLoadMore]);

    const visibleTasks = React.useMemo(() => tasks.slice(0, visibleCount), [tasks, visibleCount]);

    return (
        <div
            ref={setNodeRef}
            style={{
                background: '#f0f2f5',
                padding: '16px',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                maxHeight: 'calc(100vh - 64px - 80px)', // Full height minus header and toolbar
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <div style={{
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: 'none',
                padding: '12px 16px',
                background: column.headerColor,
                borderRadius: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}>
                <Title level={5} style={{ margin: 0, color: '#262626' }}>{column.label}</Title>
                <Badge count={totalCount} showZero color={column.iconColor} />
            </div>

            {/* Task List - Lazy Loaded */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: '100px' }} id={`scroll-container-${id}`}>
                <SortableContext items={visibleTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {visibleTasks.map(task => (
                        <SortableTaskItem
                            key={task.id}
                            task={task}
                            columnId={id} // Pass columnId
                            onEdit={onEdit}
                            onView={onView}
                            onUpload={onUpload}
                            onAddNote={onAddNote}
                            onTaskUpdate={onTaskUpdate}

                            onDelete={onDelete}
                            isHighlighted={task.id === recentlyUpdatedTaskId}
                        />
                    ))}
                </SortableContext>

                {/* Loader / Observer Target */}
                {(visibleCount < tasks.length || tasks.length < totalCount) && (
                    <div ref={observerTarget} style={{ height: '40px', display: 'flex', justifyContent: 'center', padding: '10px' }}>
                        <span style={{ color: '#999', fontSize: '12px' }}>Loading more...</span>
                    </div>
                )}

                {tasks.length === 0 && (
                    <div style={{ height: '50px', border: '1px dashed #d9d9d9', borderRadius: '4px' }} />
                )}
            </div>
        </div>
    );
});

export default VirtualizedColumn;
