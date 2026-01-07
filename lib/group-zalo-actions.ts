'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { checkPermission } from '@/lib/actions-utils';

export async function getGroupZalos() {
    try {
        const hasPermission = await checkPermission('VIEW_ZALO');
        if (!hasPermission) return { success: false, message: 'Bạn không có quyền xem nhóm Zalo' };

        const groups = await prisma.groupZalo.findMany({ orderBy: { name: 'asc' } });
        return { success: true, data: groups };
    } catch (error) {
        return { success: false, message: 'Lỗi tải danh sách nhóm Zalo' };
    }
}

export async function createGroupZalo(formData: FormData) {
    const hasPermission = await checkPermission('CREATE_ZALO');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền thêm nhóm Zalo' };

    const rawData = Object.fromEntries(formData.entries());
    try {
        await prisma.groupZalo.create({
            data: {
                // Assuming group_id is manual or from Zalo, if manual use input, else UUID
                groupId: rawData.groupId ? rawData.groupId as string : `G${Date.now()}`,
                name: rawData.name as string,
                status: 'active',
                groupLink: rawData.groupLink as string || '',
                groupDescription: rawData.groupDescription as string || '',
                // totalMember: logic?
            }
        });
        revalidatePath('/dashboard/zalo');
        return { success: true, message: 'Thêm nhóm Zalo thành công' };
    } catch (error) {
        return { success: false, message: 'Lỗi thêm nhóm' };
    }
}

export async function updateGroupZalo(id: string, formData: FormData) {
    const hasPermission = await checkPermission('EDIT_ZALO');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền sửa nhóm Zalo' };

    const rawData = Object.fromEntries(formData.entries());
    try {
        await prisma.groupZalo.update({
            where: { groupId: id },
            data: {
                name: rawData.name as string,
                groupLink: rawData.groupLink as string,
                groupDescription: rawData.groupDescription as string,
            }
        });
        revalidatePath('/dashboard/zalo');
        return { success: true, message: 'Cập nhật thành công' };
    } catch (error) {
        return { success: false, message: 'Lỗi cập nhật' };
    }
}

export async function deleteGroupZalo(id: string) {
    const hasPermission = await checkPermission('DELETE_ZALO');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền xóa nhóm Zalo' };

    try {
        await prisma.groupZalo.delete({ where: { groupId: id } });
        revalidatePath('/dashboard/zalo');
        return { success: true, message: 'Đã xóa nhóm' };
    } catch (error) {
        return { success: false, message: 'Lỗi xóa nhóm' };
    }
}
