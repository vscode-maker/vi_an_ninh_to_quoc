'use server';

import prisma from '@/lib/prisma';
import { checkPermission } from '@/lib/actions-utils';

export interface ChatMessage {
    id: string;
    thoiGian: string | null;
    noiDung: string | null;
    nguoiGui: string | null;
    nguoiNhan: string | null;
    nhom: string | null;
    ghiChu: string | null;
}

export async function fetchChatMessages(group: string): Promise<ChatMessage[]> {
    try {
        // Try strict, but if not assume contains
        // Using contains and trim to be more forgiving with whitespace
        const messages = await prisma.thongTinChat.findMany({
            where: {
                nhom: {
                    contains: group.trim()
                }
            },
            orderBy: {
                thoiGian: 'asc'
            }
        });

        // Fallback for differently formatted group names (e.g. database has "01 - 02" but UI requests "Dung - Hoa")
        // Or if the group is just names "A - B" trying to find messages between A and B regardless of group string
        if (messages.length === 0 && group.includes('-')) {
            const parts = group.split('-').map(s => s.trim());
            if (parts.length === 2) {
                const [p1, p2] = parts;
                const messagesFallback = await prisma.thongTinChat.findMany({
                    where: {
                        OR: [
                            { nguoiGui: p1, nguoiNhan: p2 },
                            { nguoiGui: p2, nguoiNhan: p1 }
                        ]
                    },
                    orderBy: {
                        thoiGian: 'asc'
                    }
                });

                if (messagesFallback.length > 0) {
                    return messagesFallback.map(msg => ({
                        ...msg,
                        thoiGian: msg.thoiGian || null,
                        noiDung: msg.noiDung || '',
                        nguoiGui: msg.nguoiGui || '',
                        nguoiNhan: msg.nguoiNhan || '',
                        nhom: msg.nhom || '',
                        ghiChu: msg.ghiChu || null
                    }));
                }
            }
        }

        // Return found messages (or empty array if none found)
        return messages.map(msg => ({
            ...msg,
            thoiGian: msg.thoiGian || null,
            // Ensure strings
            noiDung: msg.noiDung || '',
            nguoiGui: msg.nguoiGui || '',
            nguoiNhan: msg.nguoiNhan || '',
            nhom: msg.nhom || '',
            ghiChu: msg.ghiChu || null
        }));
    } catch (error) {
        console.error('[fetchChatMessages] Error fetching chat messages:', error);
        return [];
    }
}

export async function addChatMessage(data: { nhom: string; nguoiGui: string; nguoiNhan: string; noiDung: string; thoiGian: string }) {
    if (!(await checkPermission('ADD_THONG_TIN_CHAT'))) {
        throw new Error('Permission denied');
    }
    await prisma.thongTinChat.create({
        data
    });
}
