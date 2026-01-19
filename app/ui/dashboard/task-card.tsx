'use client';

import React, { useState } from 'react';
import {
    User, Edit, Trash2, RefreshCw, FileText, Paperclip,
    Landmark, Phone
} from 'lucide-react';
import type { Task } from '@prisma/client';
import { updateTaskStatus } from '@/lib/task-actions';
import dayjs from 'dayjs';

import { Card } from '@/app/ui/components/card';
import { Tag } from '@/app/ui/components/tag';
import { Button } from '@/app/ui/components/button';
import { Tooltip } from '@/app/ui/components/tooltip';
import { Dropdown, DropdownItem } from '@/app/ui/components/dropdown';

// Constants - shared with main board
export const COLUMN_STATUSES = {
    todo: {
        label: 'Chưa thực hiện',
        value: 'Chưa thực hiện',
        color: 'bg-red-50 text-red-600',
        headerColor: 'border-red-200',
        iconColor: 'text-red-500'
    },
    pending: {
        label: 'Chờ kết quả',
        value: 'Chờ kết quả',
        color: 'bg-orange-50 text-orange-600',
        headerColor: 'border-orange-200',
        iconColor: 'text-orange-500'
    },
    done: {
        label: 'Hoàn thành',
        value: 'Hoàn thành',
        color: 'bg-green-50 text-green-600',
        headerColor: 'border-green-200',
        iconColor: 'text-green-500'
    },
};

// Utility functions
export function getRequestTypeColor(type: string | null): 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple' | 'cyan' | 'magenta' | 'gold' {
    const t = type?.toLowerCase() || '';
    if (t.includes('ngân hàng') || t.includes('sao kê')) return 'magenta';
    if (t.includes('điện thoại')) return 'purple';
    if (t.includes('zalo')) return 'cyan';
    if (t.includes('văn bản') || t.includes('công văn')) return 'blue';
    return 'gray';
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
    const [isHovered, setIsHovered] = useState(false);

    const handleStatusChange = async (newItem: { label: string; value: string }) => {
        if (newItem.value === task.status) return;

        const oldStatus = task.status;
        const updatedTask = { ...task, status: newItem.value };
        onTaskUpdate(updatedTask);
        // alert(`Đã cập nhật trạng thái: ${newItem.label}`); // Removed purely visual alert

        try {
            const result = await updateTaskStatus(task.id, newItem.value);
            if (!result.success) {
                onTaskUpdate({ ...task, status: oldStatus });
                alert('Cập nhật thất bại');
            }
        } catch (err) {
            onTaskUpdate({ ...task, status: oldStatus });
            alert('Lỗi kết nối');
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Bạn có chắc muốn xóa công việc này?')) {
            onDelete(task);
        }
    };

    return (
        <div
            className={`
                bg-white rounded-xl shadow-sm border overflow-hidden mb-3 transition-all duration-300
                ${isHighlighted ? 'border-green-500 shadow-[0_0_10px_2px_rgba(34,197,94,0.3)]' : isHovered ? 'border-blue-400 shadow-md' : 'border-gray-200'}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="p-3">
                {/* Header Tags */}
                <div className="flex justify-between items-center mb-2">
                    <Tag color={getRequestTypeColor(task.requestType)}>
                        {task.requestType}
                    </Tag>
                    {task.deadline ? (
                        <Tag color={isOverdue ? 'red' : isUrgent ? 'gold' : 'blue'}>
                            {isOverdue ? 'Quá hạn' : dayjs(task.deadline).format('DD/MM/YYYY')}
                        </Tag>
                    ) : (
                        <Tag color="gray">Chưa hạn</Tag>
                    )}
                </div>

                {/* Main Content */}
                <div
                    onClick={onView}
                    className="mb-3 cursor-pointer group"
                >
                    <h3 className={`text-base font-semibold mb-1 transition-colors ${isHovered ? 'text-blue-600' : 'text-gray-900'}`}>
                        {task.targetName || 'Không tên'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User size={14} />
                        <span className="truncate">{task.requesterName}</span>

                        {task.executionUnit && (
                            <>
                                <span className="w-px h-3 bg-gray-300"></span>
                                <Landmark size={14} className="text-teal-500" />
                                <span className="text-teal-600 truncate">{task.executionUnit}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Context Info */}
                {(task.phoneNumber || task.bankName) && (
                    <div className="bg-gray-50 p-2 rounded-lg mb-3 text-xs">
                        {task.phoneNumber && (
                            <div className="flex items-center gap-2 mb-1 last:mb-0">
                                <Phone size={14} className="text-green-500" />
                                <span className="font-semibold text-gray-700">{task.phoneNumber}</span>
                                <span className="text-gray-500">({task.carrier})</span>
                            </div>
                        )}
                        {task.bankName && (
                            <div className="flex items-center gap-2">
                                <Landmark size={14} className="text-blue-500" />
                                <span className="font-semibold text-gray-700">{task.accountNumber}</span>
                                <span className="text-gray-500">- {task.bankName}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Content Preview */}
                {task.content && (
                    <div className="text-xs text-gray-500 mb-3 italic">
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
                            latestNote = notes[notes.length - 1];
                        }
                    } catch (e) { return null; }

                    if (latestNote && (latestNote.content || latestNote.noi_dung)) {
                        const content = latestNote.content || latestNote.noi_dung;
                        return (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3 text-xs">
                                <div className="flex items-center gap-1.5 mb-1 text-green-700 font-semibold">
                                    <FileText size={12} />
                                    <span>Ghi chú mới nhất:</span>
                                </div>
                                <div className="text-green-600">
                                    {content.length > 60 ? content.substring(0, 60) + '...' : content}
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* Action Bar */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                    <div className="flex items-center gap-1">
                        <Tooltip content="Chỉnh sửa">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={onAction}
                                icon={<Edit size={16} />}
                            />
                        </Tooltip>
                        <Tooltip content="File đính kèm">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpload(task);
                                }}
                                icon={<Paperclip size={16} />}
                            />
                        </Tooltip>

                        <Dropdown
                            trigger={
                                <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-orange-50 text-orange-500 transition-colors">
                                    <RefreshCw size={16} />
                                </button>
                            }
                            menu={
                                <div>
                                    {Object.values(COLUMN_STATUSES).map((item) => (
                                        <DropdownItem
                                            key={item.value}
                                            onClick={() => handleStatusChange(item)}
                                            className={item.value === task.status ? 'bg-blue-50 text-blue-600' : ''}
                                        >
                                            {item.label}
                                        </DropdownItem>
                                    ))}
                                </div>
                            }
                        />

                        <Tooltip content="Ghi chú">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                onClick={(e) => { e.stopPropagation(); onAddNote(task); }}
                                icon={<FileText size={16} />}
                            />
                        </Tooltip>
                    </div>

                    <Tooltip content="Xóa">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={handleDelete}
                            icon={<Trash2 size={16} />}
                        />
                    </Tooltip>
                </div>
            </div>
        </div>
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
