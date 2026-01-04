'use client';

import React from 'react';
import { Typography, Badge } from 'antd';
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
    onView: (task: Task) => void;
    onUpload: (task: Task) => void;
    onAddNote: (task: Task) => void;
    onTaskUpdate: (task: Task) => void;

    onDelete: (task: Task) => void;

    recentlyUpdatedTaskId?: string | null;
    totalCount: number;
    onLoadMore: () => void;
}

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
                {visibleTasks.map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onAction={() => onEdit(task)}
                        onView={() => onView(task)}
                        onUpload={onUpload}
                        onAddNote={onAddNote}
                        onTaskUpdate={onTaskUpdate}
                        onDelete={onDelete}
                        isHighlighted={task.id === recentlyUpdatedTaskId}
                    />
                ))}

                {/* Loader / Observer Target */}
                {(visibleCount < tasks.length || tasks.length < totalCount) && (
                    <div ref={observerTarget} style={{ height: '40px', display: 'flex', justifyContent: 'center', padding: '10px' }}>
                        <span style={{ color: '#999', fontSize: '12px' }}>Loading more...</span>
                    </div>
                )}

                {tasks.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Chưa có công việc</div>
                )}
            </div>
        </div>
    );
});

export default VirtualizedColumn;
