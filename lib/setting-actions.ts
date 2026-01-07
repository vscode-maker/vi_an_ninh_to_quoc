'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { checkPermission } from '@/lib/actions-utils';

export async function getSettings() {
    try {
        const hasPermission = await checkPermission('VIEW_SETTING');
        if (!hasPermission) return { success: false, message: 'Bạn không có quyền xem cài đặt' };

        const settings = await prisma.setting.findMany();
        return { success: true, data: settings };
    } catch (error) {
        return { success: false, message: 'Lỗi tải cài đặt' };
    }
}

export async function createSetting(formData: FormData) {
    const hasPermission = await checkPermission('CREATE_SETTING');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền thêm cài đặt' };

    const rawData = Object.fromEntries(formData.entries());
    try {
        await prisma.setting.create({
            data: {
                type: rawData.type as string,
                value: rawData.value as string,
            }
        });
        revalidatePath('/dashboard/cai-dat');
        return { success: true, message: 'Thêm cài đặt thành công' };
    } catch (error) {
        return { success: false, message: 'Lỗi thêm cài đặt' };
    }
}

export async function updateSetting(id: number, formData: FormData) {
    const hasPermission = await checkPermission('EDIT_SETTING');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền sửa cài đặt' };

    const rawData = Object.fromEntries(formData.entries());
    try {
        await prisma.setting.update({
            where: { id },
            data: {
                type: rawData.type as string,
                value: rawData.value as string,
            }
        });
        revalidatePath('/dashboard/cai-dat');
        return { success: true, message: 'Cập nhật thành công' };
    } catch (error) {
        return { success: false, message: 'Lỗi cập nhật' };
    }
}

export async function deleteSetting(id: number) {
    const hasPermission = await checkPermission('DELETE_SETTING');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền xóa cài đặt' };

    try {
        await prisma.setting.delete({ where: { id } });
        revalidatePath('/dashboard/cai-dat');
        return { success: true, message: 'Đã xóa cài đặt' };
    } catch (error) {
        return { success: false, message: 'Lỗi xóa cài đặt' };
    }
}
