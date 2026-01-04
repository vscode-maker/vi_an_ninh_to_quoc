'use client';

import React from 'react';
import { Card, Tag, Typography, Button, message, Tooltip, Space, Popover, Popconfirm } from 'antd';
import {
    UserOutlined,
    EditOutlined,
    DeleteOutlined,
    SyncOutlined,
    FileTextOutlined,
    PaperClipOutlined,
    BankOutlined,
    PhoneOutlined,
} from '@ant-design/icons';
import type { Task } from '@prisma/client';
import { updateTaskStatus } from '@/lib/task-actions';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// Constants - shared with main board
export const COLUMN_STATUSES = {
    todo: {
        label: 'Chưa thực hiện',
        value: 'Chưa thực hiện',
        color: '#fff0f6',
        headerColor: 'linear-gradient(90deg, #ff4d4f 0%, #fff0f6 100%)', // Red gradient
        iconColor: '#eb2f96'
    },
    pending: {
        label: 'Chờ kết quả',
        value: 'Chờ kết quả',
        color: '#fff7e6',
        headerColor: 'linear-gradient(90deg, #fa8c16 0%, #fff7e6 100%)', // Orange gradient
        iconColor: '#fa8c16'
    },
    done: {
        label: 'Hoàn thành',
        value: 'Hoàn thành',
        color: '#f6ffed',
        headerColor: 'linear-gradient(90deg, #52c41a 0%, #f6ffed 100%)', // Green gradient
        iconColor: '#52c41a'
    },
};

// Utility functions
export function getRequestTypeColor(type: string | null) {
    const t = type?.toLowerCase() || '';
    if (t.includes('ngân hàng') || t.includes('sao kê')) return 'magenta';
    if (t.includes('điện thoại')) return 'purple';
    if (t.includes('zalo')) return 'cyan';
    if (t.includes('văn bản') || t.includes('công văn')) return 'geekblue';
    return 'default';
}

export interface TaskCardProps {
    task: Task;
    onAction: () => void;
    onView: () => void;
    onUpload: (task: Task) => void;
    onAddNote: (task: Task) => void;
    onTaskUpdate: (task: Task) => void;
    onDelete: (task: Task) => void;
    isHighlighted?: boolean;
}

const TaskCard = React.memo(function TaskCard({ task, onAction, onView, onUpload, onAddNote, onTaskUpdate, onDelete, isHighlighted }: TaskCardProps) {
    const isOverdue = task.deadline && dayjs(task.deadline).isBefore(dayjs());

    const isUrgent = task.progressWarning === 'Khẩn cấp';
    const [isHovered, setIsHovered] = React.useState(false);

    const handleStatusChange = async (e: React.MouseEvent, newItem: any) => {
        e.stopPropagation();
        if (newItem.value === task.status) return;

        const oldStatus = task.status;
        const updatedTask = { ...task, status: newItem.value };
        onTaskUpdate(updatedTask);
        message.success(`Đã cập nhật trạng thái: ${newItem.label}`);

        try {
            const result = await updateTaskStatus(task.id, newItem.value);
            if (!result.success) {
                onTaskUpdate({ ...task, status: oldStatus });
                message.error('Cập nhật thất bại');
            }
        } catch (err) {
            onTaskUpdate({ ...task, status: oldStatus });
            message.error('Lỗi kết nối');
        }
    };

    const cardStyle: React.CSSProperties = {
        borderRadius: 12,
        boxShadow: isHighlighted ? '0 0 10px 2px #52c41a' : (isHovered ? '0 4px 12px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.1)'),
        border: isHighlighted ? '1px solid #52c41a' : (isHovered ? '1px solid #40a9ff' : '1px solid #e8e8e8'),
        overflow: 'hidden',
        marginBottom: 12,
        transition: 'all 0.3s ease',
    };

    return (
        <Card
            size="small"
            hoverable
            onClick={undefined} // Removed global click
            style={cardStyle}
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

            {/* Main Content - Click Scope Restricted Here */}
            <div
                onClick={onView}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    marginBottom: 12,
                    cursor: 'pointer', // Only this area is interactive for details
                    transition: 'all 0.3s ease'
                }}
            >
                <Title
                    level={5}
                    style={{
                        margin: '0 0 4px',
                        fontSize: 16,
                        color: isHovered ? '#1890ff' : 'inherit',
                        transition: 'color 0.3s ease'
                    }}
                >
                    {task.targetName || 'Không tên'}
                </Title>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8c8c8c', fontSize: 13 }}>
                    <UserOutlined />
                    <Text type="secondary" style={{ marginRight: 8 }}>{task.requesterName}</Text>

                    {task.executionUnit && (
                        <>
                            <div style={{ width: 1, height: 12, background: '#d9d9d9' }} /> {/* Separator */}
                            <BankOutlined style={{ color: '#13c2c2' }} /> {/* Or TeamOutlined */}
                            <Text type="secondary" style={{ color: '#13c2c2' }}>{task.executionUnit}</Text>
                        </>
                    )}
                </div>
            </div>

            {/* ... (rest of render until Action Bar) ... */}

            {/* Context Info */}
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

            {/* Notes Preview (Latest) */}
            {(() => {
                if (!task.notes) return null;
                let latestNote = null;
                try {
                    const notes = Array.isArray(task.notes) ? task.notes : JSON.parse(task.notes as string);
                    if (Array.isArray(notes) && notes.length > 0) {
                        // Get last note (assuming chronological push) or first if sorted Newest First
                        // Logic in NoteModal was push to end, so last item is newest.
                        latestNote = notes[notes.length - 1];
                    }
                } catch (e) { return null; }

                if (latestNote && (latestNote.content || latestNote.noi_dung)) {
                    const content = latestNote.content || latestNote.noi_dung;
                    return (
                        <div style={{
                            background: '#f6ffed',
                            border: '1px solid #b7eb8f',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            marginBottom: 12,
                            fontSize: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: '#389e0d', fontWeight: 600 }}>
                                <FileTextOutlined />
                                Ghi chú mới nhất:
                            </div>
                            <div style={{ color: '#52c41a' }}>
                                {content.length > 60 ? content.substring(0, 60) + '...' : content}
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

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
                        <Button type="text" size="small" icon={<FileTextOutlined style={{ color: '#722ed1' }} />} onClick={(e) => { e.stopPropagation(); onAddNote(task); }} />
                    </Tooltip>
                </Space>
                <div onClick={(e) => e.stopPropagation()}>
                    <Popconfirm
                        title="Xóa công việc"
                        description="Bạn có chắc muốn xóa công việc này?"
                        onConfirm={() => onDelete(task)}
                        okText="Có"
                        cancelText="Không"
                        placement="topRight"
                    >
                        <Tooltip title="Xóa">
                            <Button type="text" size="small" icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />} />
                        </Tooltip>
                    </Popconfirm>
                </div>
            </div>
        </Card>
    );
}, (prev, next) => {
    return prev.task === next.task &&
        prev.onAction === next.onAction &&
        prev.onView === next.onView &&
        prev.onUpload === next.onUpload &&
        prev.onAddNote === next.onAddNote &&
        prev.onTaskUpdate === next.onTaskUpdate &&
        prev.onDelete === next.onDelete &&
        prev.isHighlighted === next.isHighlighted;
});

export default TaskCard;
