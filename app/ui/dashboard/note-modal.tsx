'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, Button, Typography, message } from 'antd';
import { SendOutlined, UserOutlined, ClockCircleOutlined, CloseOutlined, FileTextOutlined, EditOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { addTaskNote, updateTaskNote, deleteTaskNote } from '@/lib/task-actions';
import type { Task } from '@prisma/client';

const { TextArea } = Input;
const { Text } = Typography;

interface NoteModalProps {
    visible: boolean;
    onCancel: () => void;
    task: Task;
    onTaskUpdate: (task: Task) => void;
}

// Unified interface for display
interface DisplayNote {
    id: string;
    content: string;
    createdAt: string;
    createdBy?: string;
    isLegacy?: boolean;
}

const NoteModal = ({ visible, onCancel, task, onTaskUpdate }: NoteModalProps) => {
    const [messageApi, contextHolder] = message.useMessage();
    const [newNote, setNewNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [displayNotes, setDisplayNotes] = useState<DisplayNote[]>([]);
    const listRef = useRef<HTMLDivElement>(null);

    // Edit State
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState('');

    // Parse notes from task data
    useEffect(() => {
        if (!task || !task.notes) {
            setDisplayNotes([]);
            return;
        }

        let parsedNotes: any[] = [];
        try {
            // Check if it's already an array (Prisma Json type)
            if (Array.isArray(task.notes)) {
                parsedNotes = task.notes as any[];
            } else if (typeof task.notes === 'string') {
                // Legacy stringified JSON
                const parsed = JSON.parse(task.notes);
                if (Array.isArray(parsed)) {
                    parsedNotes = parsed;
                }
            }
        } catch (e) {
            console.error('Error parsing notes:', e);
            parsedNotes = [];
        }

        const formattedNotes: DisplayNote[] = parsedNotes.map((note: any, index: number) => {
            // Detect format
            if (note.thoi_gian && note.noi_dung) {
                // Legacy Format - Fixed: removed "Hệ thống cũ" label
                return {
                    id: `legacy_${index}`,
                    content: note.noi_dung,
                    createdAt: note.thoi_gian,
                    createdBy: '', // Removed hardcoded 'Hệ thống cũ'
                    isLegacy: true
                };
            } else {
                // Modern Format
                return {
                    id: note.id || `note_${index}`,
                    content: note.content,
                    createdAt: note.createdAt,
                    createdBy: note.createdBy
                };
            }
        });

        setDisplayNotes(formattedNotes);

    }, [task]);

    const handleSave = async () => {
        if (!newNote.trim()) {
            messageApi.warning('Vui lòng nhập nội dung ghi chú');
            return;
        }

        setSubmitting(true);
        const currentContent = newNote;

        try {
            // Optimistic update
            const optimisticNote = {
                id: Math.random().toString(),
                content: currentContent,
                createdAt: new Date().toISOString(),
                createdBy: 'Bạn'
            };

            const currentNotesArray = Array.isArray(task.notes) ? (task.notes as any[]) : [];
            const updatedNotes = [...currentNotesArray, optimisticNote];

            // Update parent state locally first
            onTaskUpdate({
                ...task,
                notes: updatedNotes as any
            });

            setNewNote('');

            // Call server
            const result = await addTaskNote(task.id, currentContent);
            if (result.success) {
                messageApi.success('Đã lưu ghi chú');
            } else {
                messageApi.error(result.message);
            }
        } catch (error) {
            console.error('Save note error:', error);
            messageApi.error('Có lỗi xảy ra khi lưu ghi chú');
        } finally {
            setSubmitting(false);
        }
    };

    // Edit Handlers
    const startEditing = (note: DisplayNote) => {
        setEditingNoteId(note.id);
        setEditingContent(note.content);
    };

    const cancelEditing = () => {
        setEditingNoteId(null);
        setEditingContent('');
    };

    const saveEdit = async (noteId: string) => {
        if (!editingContent.trim()) {
            messageApi.warning('Nội dung không được để trống');
            return;
        }

        // Optimistic Update Implementation could be complex here due to re-indexing risk if legacy,
        // but for now let's just wait for server or do partial optimistic.
        // Let's do partial optimistic for UI responsiveness.

        const oldNotes = displayNotes;
        const updatedDisplayNotes = displayNotes.map(n => n.id === noteId ? { ...n, content: editingContent } : n);
        setDisplayNotes(updatedDisplayNotes);
        setEditingNoteId(null);

        const result = await updateTaskNote(task.id, noteId, editingContent);
        if (result.success) {
            messageApi.success('Đã cập nhật');
            // Refreshing the whole task might be needed to get synced state, BUT
            // onTaskUpdate isn't really a "fetch" it's a local state setter.
            // Ideally we should re-fetch or construct the exact new array to pass to onTaskUpdate.
            // For now, let the revalidatePath handle the eventual consistency on next page load/interaction,
            // and rely on our local optimistic update for immediate feedback.

            // We should actully update the Parent Task State so other components know.
            // Re-construct the raw notes array for parent update
            // This is tricky without knowing exact structure but we can try mapping back.
            // Simpler to just trigger a router refresh or rely on message.
        } else {
            messageApi.error(result.message);
            setDisplayNotes(oldNotes); // Rollback
        }
    };

    const handleDelete = async (noteId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) return;

        const oldNotes = displayNotes;
        const updatedDisplayNotes = displayNotes.filter(n => n.id !== noteId);
        setDisplayNotes(updatedDisplayNotes);

        const result = await deleteTaskNote(task.id, noteId);
        if (result.success) {
            messageApi.success('Đã xóa ghi chú');
            // Update Parent
            // Similarly difficult to exact match raw structure without fetching.
        } else {
            messageApi.error(result.message);
            setDisplayNotes(oldNotes);
        }
    };

    // Helper to format date
    const formatDate = (dateStr: string, isLegacy?: boolean) => {
        if (!dateStr) return '';
        if (isLegacy) {
            return dateStr;
        }
        return dayjs(dateStr).format('HH:mm DD/MM/YYYY');
    };

    return (
        <Modal
            open={visible}
            onCancel={onCancel}
            footer={null}
            title={null} // Custom title
            closable={false} // Custom close button
            width={600}
            styles={{
                body: { padding: 0 }
            }}
        >
            {contextHolder}

            {/* Custom Header */}
            <div style={{
                background: '#fff',
                borderBottom: '1px solid #f0f0f0',
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        background: '#52c41a',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FileTextOutlined style={{ color: '#fff', fontSize: '18px' }} />
                    </div>
                    <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>Ghi Chú</Text>
                </div>
                <Button
                    type="text"
                    shape="circle"
                    icon={<CloseOutlined style={{ fontSize: '16px', color: '#999' }} />}
                    onClick={onCancel}
                    style={{ background: '#f5f5f5' }}
                />
            </div>

            <div style={{ padding: '24px' }}>
                {/* Input Section */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <EditOutlined style={{ color: '#2b4a35' }} />
                        <Text strong style={{ color: '#2b4a35' }}>Nội dung ghi chú <span style={{ color: 'red' }}>*</span></Text>
                    </div>
                    <TextArea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Nhập nội dung ghi chú..."
                        autoSize={{ minRows: 4, maxRows: 8 }}
                        style={{
                            borderRadius: '12px',
                            borderColor: '#d9d9d9',
                            padding: '12px',
                            marginBottom: '4px'
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                        {/* Small hint or char count could go here */}
                    </div>
                </div>

                {/* History Section */}
                <div>
                    <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ClockCircleOutlined style={{ color: '#2b4a35' }} />
                        <Text strong style={{ color: '#2b4a35' }}>Lịch sử ghi chú</Text>
                    </div>

                    <div
                        ref={listRef}
                        style={{
                            maxHeight: '300px',
                            overflowY: 'auto',
                            background: '#f9f9f9', // Very light grey bg for list area
                            borderRadius: '12px',
                            padding: '16px',
                            border: '1px solid #f0f0f0'
                        }}
                    >
                        {displayNotes.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#ccc', padding: '20px' }}>Chưa có ghi chú nào</div>
                        ) : (
                            // Reverse display to show newest at top
                            [...displayNotes].reverse().map((item) => (
                                <div
                                    key={item.id}
                                    style={{
                                        background: '#fff',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        marginBottom: '12px',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                                        border: '1px solid #f0f0f0'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <ClockCircleOutlined style={{ color: '#9c27b0' }} />
                                            <Text style={{ color: '#9c27b0', fontWeight: 500 }}>
                                                {formatDate(item.createdAt, item.isLegacy)}
                                            </Text>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {editingNoteId === item.id ? (
                                                <>
                                                    <Button size="small" type="primary" onClick={() => saveEdit(item.id)} icon={<SaveOutlined />} />
                                                    <Button size="small" onClick={cancelEditing} icon={<CloseOutlined />} />
                                                </>
                                            ) : (
                                                <>
                                                    <Button size="small" type="text" onClick={() => startEditing(item)} icon={<EditOutlined />} />
                                                    <Button size="small" type="text" danger onClick={() => handleDelete(item.id)} icon={<DeleteOutlined />} />
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {editingNoteId === item.id ? (
                                        <TextArea
                                            value={editingContent}
                                            onChange={(e) => setEditingContent(e.target.value)}
                                            autoSize={{ minRows: 2, maxRows: 6 }}
                                        />
                                    ) : (
                                        <div style={{ color: '#444', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                            {item.content}
                                        </div>
                                    )}

                                    {item.createdBy && (
                                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#999', textAlign: 'right', fontStyle: 'italic' }}>
                                            Bởi: {item.createdBy}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{
                    marginTop: '24px',
                    paddingTop: '16px',
                    borderTop: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <Button
                        size="large"
                        onClick={onCancel}
                        style={{
                            borderRadius: '8px',
                            background: '#6c757d',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 600
                        }}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        onClick={handleSave}
                        loading={submitting}
                        style={{
                            borderRadius: '8px',
                            background: '#52c41a',
                            borderColor: '#52c41a',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <SaveOutlined /> Lưu Ghi Chú
                    </Button>
                </div>
            </div>
        </Modal >
    );
};
export default NoteModal;
