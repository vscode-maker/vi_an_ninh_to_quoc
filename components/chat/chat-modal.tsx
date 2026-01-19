'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Modal } from '@/app/ui/components/modal';
import { Button } from '@/app/ui/components/button';
import { TextArea } from '@/app/ui/components/textarea';
import { Spinner } from '@/app/ui/components/spinner';
import { User, Send } from 'lucide-react';
import { fetchChatMessages, addChatMessage, ChatMessage } from '@/lib/actions/chat';
import dayjs from 'dayjs';

interface ChatModalProps {
    groupName: string;
    open: boolean;
    onCancel: () => void;
    onMessageAdded?: () => void;
}

// Simple Toast fallback
const toast = (msg: string, type: 'success' | 'error' = 'success') => {
    console.log(`[${type.toUpperCase()}] ${msg}`);
};

export default function ChatModal({ groupName, open, onCancel, onMessageAdded }: ChatModalProps) {
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputLeft, setInputLeft] = useState('');
    const [inputRight, setInputRight] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Parse group name "A - B"
    const [personLeft, personRight] = groupName ? groupName.split('-').map(s => s.trim()) : ['', ''];

    const refreshMessages = () => {
        if (groupName) {
            fetchChatMessages(groupName)
                .then(setMessages)
                .catch(console.error);
        }
    };

    useEffect(() => {
        if (open && groupName) {
            setLoading(true);
            fetchChatMessages(groupName)
                .then(data => {
                    setMessages(data);
                })
                .catch(err => {
                    console.error('ChatModal Error:', err);
                    toast('Không thể tải tin nhắn', 'error');
                })
                .finally(() => setLoading(false));

            // Clear inputs
            setInputLeft('');
            setInputRight('');
        }
    }, [open, groupName]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (sender: string, receiver: string, content: string, setInput: (v: string) => void) => {
        if (!content.trim()) return;
        if (!sender || !receiver) {
            toast('Không xác định được danh tính người gửi/nhận từ tên nhóm', 'error');
            return;
        }

        setSending(true);
        try {
            await addChatMessage({
                nhom: groupName,
                nguoiGui: sender,
                nguoiNhan: receiver,
                noiDung: content,
                thoiGian: dayjs().format('YYYY-MM-DD HH:mm:ss')
            });
            setInput('');
            refreshMessages();
            toast('Đã gửi tin nhắn');
            if (onMessageAdded) {
                onMessageAdded();
            }
        } catch (error) {
            console.error(error);
            toast('Gửi thất bại', 'error');
        } finally {
            setSending(false);
        }
    };

    const Footer = (
        <div className="w-full grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            {/* Left Input */}
            <div className="border-r border-gray-100 pr-6">
                <div className="flex flex-col gap-2">
                    <span className="text-sm text-gray-500">Người nhận: <strong>{personLeft}</strong></span>
                    <div className="flex gap-2 items-start">
                        <TextArea
                            placeholder="Nhập nội dung..."
                            rows={1}
                            value={inputLeft}
                            onChange={e => setInputLeft(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(personLeft, personRight, inputLeft, setInputLeft);
                                }
                            }}
                            className="flex-1"
                        />
                        <Button
                            variant="primary"
                            icon={<Send size={16} />}
                            loading={sending}
                            onClick={() => handleSend(personLeft, personRight, inputLeft, setInputLeft)}
                        >
                            Gửi
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right Input */}
            <div className="pl-2">
                <div className="flex flex-col gap-2">
                    <span className="text-sm text-gray-500">Người gửi: <strong>{personRight}</strong></span>
                    <div className="flex gap-2 items-start">
                        <TextArea
                            placeholder="Nhập nội dung..."
                            rows={1}
                            value={inputRight}
                            onChange={e => setInputRight(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(personRight, personLeft, inputRight, setInputRight);
                                }
                            }}
                            className="flex-1"
                        />
                        <Button
                            variant="primary"
                            icon={<Send size={16} />}
                            loading={sending}
                            onClick={() => handleSend(personRight, personLeft, inputRight, setInputRight)}
                        >
                            Gửi
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Modal
            title={`Nội dung chat: ${groupName}`}
            isOpen={open}
            onClose={onCancel}
            width={900}
            footer={Footer}
            className="flex flex-col"
        >
            <div className="h-[500px] flex flex-col bg-gray-100 p-0 rounded-lg overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Spinner size="lg" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Không có nội dung chat nào
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {messages.map((msg, index) => {
                            const isRight = msg.nguoiGui === personRight;
                            const isSequence = index > 0 && messages[index - 1].nguoiGui === msg.nguoiGui;

                            return (
                                <div key={msg.id || index} className={`flex flex-col ${isRight ? 'items-end' : 'items-start'}`}>
                                    <div className={`flex ${isRight ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[80%] gap-2`}>
                                        {/* Avatar */}
                                        {!isRight && (
                                            <div className="w-8 flex flex-col items-center">
                                                {!isSequence ? (
                                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                                        <User size={16} className="text-gray-600" />
                                                    </div>
                                                ) : <div className="w-8" />}
                                            </div>
                                        )}

                                        <div className={`flex flex-col ${isRight ? 'items-end' : 'items-start'}`}>
                                            {/* Name */}
                                            {!isRight && !isSequence && (
                                                <span className="text-xs text-gray-500 mb-1 ml-1">
                                                    {msg.nguoiGui}
                                                </span>
                                            )}

                                            {/* Bubble */}
                                            <div className={`
                                                px-3 py-2 rounded-lg text-sm shadow-sm relative break-words
                                                ${isRight ? 'bg-blue-100 text-gray-900 border border-blue-200' : 'bg-white text-gray-900 border border-gray-200'}
                                            `}>
                                                {msg.noiDung}
                                            </div>

                                            {/* Time */}
                                            <span className="text-[10px] text-gray-400 mt-1">
                                                {msg.thoiGian ? dayjs(msg.thoiGian).format('HH:mm') : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>
        </Modal>
    );
}
