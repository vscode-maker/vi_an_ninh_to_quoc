'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Avatar, Typography, Spin, Empty, Row, Col, Input, Button, message } from 'antd';
import { UserOutlined, SendOutlined } from '@ant-design/icons';
import { fetchChatMessages, addChatMessage, ChatMessage } from '@/lib/actions/chat';
import dayjs from 'dayjs';

interface ChatModalProps {
    groupName: string;
    open: boolean;
    onCancel: () => void;
    onMessageAdded?: () => void;
}

export default function ChatModal({ groupName, open, onCancel, onMessageAdded }: ChatModalProps) {
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputLeft, setInputLeft] = useState('');
    const [inputRight, setInputRight] = useState('');
    const [sending, setSending] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    // Parse group name "A - B"
    const [personLeft, personRight] = groupName ? groupName.split('-').map(s => s.trim()) : ['', ''];

    const refreshMessages = () => {
        if (groupName) {
            fetchChatMessages(groupName)
                .then(setMessages)
                .catch(console.error);
        }
    };

    const handleSend = async (sender: string, receiver: string, content: string, setInput: (v: string) => void) => {
        if (!content.trim()) return;
        if (!sender || !receiver) {
            messageApi.error('Không xác định được danh tính người gửi/nhận từ tên nhóm');
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
            messageApi.success('Đã gửi tin nhắn');
            if (onMessageAdded) {
                onMessageAdded();
            }
        } catch (error) {
            console.error(error);
            messageApi.error('Gửi thất bại');
        } finally {
            setSending(false);
        }
    };

    const footerNode = (
        <div style={{ marginTop: '16px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
            {/* Left Input: Reciever Info (Left in Group Name) */}
            <Row gutter={24}>
                <Col span={12} style={{ borderRight: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Typography.Text type="secondary">Người nhận: <strong>{personLeft}</strong></Typography.Text>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            <Input.TextArea
                                placeholder={`Nhập nội dung...`}
                                rows={1}
                                value={inputLeft}
                                onChange={e => setInputLeft(e.target.value)}
                                style={{ flex: 1 }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(personLeft, personRight, inputLeft, setInputLeft);
                                    }
                                }}
                            />
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                loading={sending}
                                onClick={() => handleSend(personLeft, personRight, inputLeft, setInputLeft)}
                            >
                                Gửi
                            </Button>
                        </div>
                    </div>
                </Col>
                {/* Right Input: Sender Info (Right in Group Name) */}
                <Col span={12}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Typography.Text type="secondary">Người gửi: <strong>{personRight}</strong></Typography.Text>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            <Input.TextArea
                                placeholder={`Nhập nội dung...`}
                                rows={1}
                                value={inputRight}
                                onChange={e => setInputRight(e.target.value)}
                                style={{ flex: 1 }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(personRight, personLeft, inputRight, setInputRight);
                                    }
                                }}
                            />
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                loading={sending}
                                onClick={() => handleSend(personRight, personLeft, inputRight, setInputRight)}
                            >
                                Gửi
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );

    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (open && groupName) {
            setLoading(true);
            fetchChatMessages(groupName)
                .then(data => {
                    setMessages(data);
                })
                .catch(err => {
                    console.error('ChatModal Error:', err);
                    messageApi.error('Không thể tải tin nhắn');
                })
                .finally(() => setLoading(false));

            // Clear inputs
            setInputLeft('');
            setInputRight('');
        }
    }, [open, groupName]);

    return (
        <Modal
            title={`Nội dung chat: ${groupName}`}
            open={open}
            onCancel={onCancel}
            footer={footerNode}
            width={900}
            styles={{ body: { padding: 0 } }} // Remove default padding/scroll from modal body to control it manually
        >
            {contextHolder}
            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '50px', height: '500px' }}><Spin size="large" /></div>
            ) : messages.length === 0 ? (
                <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Empty description="Không có nội dung chat nào" />
                </div>
            ) : (
                <div className="chat-container" style={{ height: '500px', overflowY: 'auto', padding: '20px', backgroundColor: '#e2e4e7' }}>
                    {messages.map((msg, index) => {
                        const isRight = msg.nguoiGui === personRight;

                        // Check sequence (Same sender as previous)
                        // For Left side, we want Avatar on the FIRST message of the sequence (Header)
                        const isSequence = index > 0 && messages[index - 1].nguoiGui === msg.nguoiGui;

                        return (
                            <div key={msg.id} style={{
                                marginBottom: isSequence ? '4px' : '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isRight ? 'flex-end' : 'flex-start'
                            }}>
                                <div style={{ display: 'flex', flexDirection: isRight ? 'row-reverse' : 'row', alignItems: 'flex-start', maxWidth: '80%' }}>
                                    {/* Avatar: Only for Left side, and only for first in sequence */}
                                    {!isRight && (
                                        <div style={{ width: '32px', marginRight: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            {!isSequence ? <Avatar size="small" icon={<UserOutlined />} /> : <div style={{ width: '24px' }} />}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isRight ? 'flex-end' : 'flex-start' }}>
                                        {/* Name header for Left side first msg? Zalo usually hides it in 1-on-1. 
                                            But let's show it small if checking the group name isn't enough context.
                                            User requested "show 2 user info interleaved by time". 
                                            I'll show name only if not sequence.
                                        */}
                                        {!isRight && !isSequence && (
                                            <Typography.Text type="secondary" style={{ fontSize: '11px', marginBottom: '2px', marginLeft: '2px' }}>
                                                {msg.nguoiGui}
                                            </Typography.Text>
                                        )}

                                        {/* Bubble */}
                                        <div style={{
                                            backgroundColor: isRight ? '#dcf4ff' : '#ffffff',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
                                            position: 'relative',
                                            wordBreak: 'break-word',
                                            border: isRight ? '1px solid #c8e8ff' : '1px solid #e8e8e8'
                                        }}>
                                            <Typography.Text>{msg.noiDung}</Typography.Text>
                                        </div>

                                        {/* Time Footer */}
                                        <Typography.Text type="secondary" style={{ fontSize: '10px', marginTop: '2px', opacity: 0.7 }}>
                                            {msg.thoiGian ? dayjs(msg.thoiGian).format('HH:mm') : ''}
                                        </Typography.Text>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </Modal>
    );
}
