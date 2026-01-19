'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, X, Edit, Trash2, Save } from 'lucide-react';
import dayjs from 'dayjs';
import { addTaskNote, updateTaskNote, deleteTaskNote } from '@/lib/task-actions';
import type { Task } from '@prisma/client';

import { Modal } from '@/app/ui/components/modal';
import { Button } from '@/app/ui/components/button';
import { TextArea } from '@/app/ui/components/textarea';

interface NoteModalProps {
    visible: boolean;
    onCancel: () => void;
    task: Task;
    onTaskUpdate: (task: Task) => void;
}

interface DisplayNote {
    id: string;
    content: string;
    createdAt: string;
    createdBy?: string;
    isLegacy?: boolean;
}

const NoteModal = ({ visible, onCancel, task, onTaskUpdate }: NoteModalProps) => {
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
            if (Array.isArray(task.notes)) {
                parsedNotes = task.notes as any[];
            } else if (typeof task.notes === 'string') {
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
            if (note.thoi_gian && note.noi_dung) {
                return {
                    id: `legacy_${index}`,
                    content: note.noi_dung,
                    createdAt: note.thoi_gian,
                    createdBy: '',
                    isLegacy: true
                };
            } else {
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
            alert('Vui lòng nhập nội dung ghi chú');
            return;
        }

        setSubmitting(true);
        const currentContent = newNote;

        try {
            const optimisticNote = {
                id: Math.random().toString(),
                content: currentContent,
                createdAt: new Date().toISOString(),
                createdBy: 'Bạn'
            };

            const currentNotesArray = Array.isArray(task.notes) ? (task.notes as any[]) : [];
            const updatedNotes = [...currentNotesArray, optimisticNote];

            onTaskUpdate({
                ...task,
                notes: updatedNotes as any
            });

            setNewNote('');

            const result = await addTaskNote(task.id, currentContent);
            if (!result.success) {
                alert(result.message);
            }
        } catch (error) {
            console.error('Save note error:', error);
            alert('Có lỗi xảy ra khi lưu ghi chú');
        } finally {
            setSubmitting(false);
        }
    };

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
            alert('Nội dung không được để trống');
            return;
        }

        const oldNotes = displayNotes;
        const updatedDisplayNotes = displayNotes.map(n => n.id === noteId ? { ...n, content: editingContent } : n);
        setDisplayNotes(updatedDisplayNotes);
        setEditingNoteId(null);

        const result = await updateTaskNote(task.id, noteId, editingContent);
        if (!result.success) {
            alert(result.message);
            setDisplayNotes(oldNotes);
        }
    };

    const handleDelete = async (noteId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) return;

        const oldNotes = displayNotes;
        const updatedDisplayNotes = displayNotes.filter(n => n.id !== noteId);
        setDisplayNotes(updatedDisplayNotes);

        const result = await deleteTaskNote(task.id, noteId);
        if (!result.success) {
            alert(result.message);
            setDisplayNotes(oldNotes);
        }
    };

    const formatDate = (dateStr: string, isLegacy?: boolean) => {
        if (!dateStr) return '';
        if (isLegacy) {
            return dateStr;
        }
        return dayjs(dateStr).format('HH:mm DD/MM/YYYY');
    };

    return (
        <Modal
            isOpen={visible}
            onClose={onCancel}
            title="Ghi Chú"
            width="600px"
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onCancel}>Hủy</Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        loading={submitting}
                        icon={<Save size={16} />}
                    >
                        Lưu Ghi Chú
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Input Section */}
                <div>
                    <h4 className="flex items-center gap-2 font-semibold text-gray-800 mb-2">
                        <Edit size={16} className="text-green-700" />
                        Nội dung ghi chú <span className="text-red-500">*</span>
                    </h4>
                    <TextArea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Nhập nội dung ghi chú..."
                        rows={4}
                    />
                </div>

                {/* History Section */}
                <div>
                    <h4 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                        <Clock size={16} className="text-green-700" />
                        Lịch sử ghi chú
                    </h4>

                    <div
                        ref={listRef}
                        className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-[300px] overflow-y-auto space-y-3"
                    >
                        {displayNotes.length === 0 ? (
                            <div className="text-center text-gray-400 py-4">Chưa có ghi chú nào</div>
                        ) : (
                            [...displayNotes].reverse().map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 text-purple-600 text-sm font-medium">
                                            <Clock size={14} />
                                            {formatDate(item.createdAt, item.isLegacy)}
                                        </div>
                                        <div className="flex gap-1">
                                            {editingNoteId === item.id ? (
                                                <>
                                                    <button onClick={() => saveEdit(item.id)} className="p-1 hover:text-green-600 text-green-500"><Save size={14} /></button>
                                                    <button onClick={cancelEditing} className="p-1 hover:text-red-600 text-gray-400"><X size={14} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => startEditing(item)} className="p-1 hover:text-blue-600 text-gray-400"><Edit size={14} /></button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-1 hover:text-red-600 text-gray-400"><Trash2 size={14} /></button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {editingNoteId === item.id ? (
                                        <TextArea
                                            value={editingContent}
                                            onChange={(e) => setEditingContent(e.target.value)}
                                            rows={2}
                                            className="mb-0"
                                        />
                                    ) : (
                                        <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                                            {item.content}
                                        </div>
                                    )}

                                    {item.createdBy && (
                                        <div className="mt-2 text-xs text-gray-400 text-right italic">
                                            Bởi: {item.createdBy}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default NoteModal;
