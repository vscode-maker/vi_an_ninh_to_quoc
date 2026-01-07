'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { uploadToDrive } from '@/lib/google-drive';
import { checkPermission } from '@/lib/actions-utils';

export async function getFiles({ page = 1, pageSize = 20, search = '' }: { page?: number; pageSize?: number; search?: string }) {
    const hasPermission = await checkPermission('VIEW_FILE');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền xem tài liệu', data: [], total: 0 };

    const where: any = {};
    if (search) {
        where.OR = [
            { fileName: { contains: search, mode: 'insensitive' } },
        ];
    }
    try {
        const [data, total] = await Promise.all([
            prisma.fileAttach.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { updatedAt: 'desc' },
            }),
            prisma.fileAttach.count({ where }),
        ]);
        return { success: true, data, total, page, pageSize };
    } catch (error) {
        return { success: false, message: 'Lỗi tải danh sách file' };
    }
}

export async function createFile(formData: FormData) {
    const hasPermission = await checkPermission('CREATE_FILE');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền thêm tài liệu' };

    const rawData = Object.fromEntries(formData.entries());
    const file = formData.get('file') as File;

    let fileLink = rawData.fileLink as string || '';

    if (file && file.size > 0) {
        const upload = await uploadToDrive(file);
        if (!upload.error && upload.url) {
            fileLink = upload.url;
        } else {
            return { success: false, message: 'Lỗi upload file lên Drive' };
        }
    }

    try {
        await prisma.fileAttach.create({
            data: {
                fileId: `F${Date.now()}`,
                fileName: rawData.fileName as string || file?.name || 'Untitled',
                fileLink: fileLink,
                fileType: rawData.fileType as string || file?.type || 'unknown',
                note: rawData.note as string,
                updatedAt: new Date(),
            }
        });
        revalidatePath('/dashboard/tai-lieu');
        return { success: true, message: 'Thêm tài liệu thành công' };
    } catch (error: any) {
        console.error(error);
        return { success: false, message: 'Lỗi thêm tài liệu' };
    }
}

export async function updateFile(formData: FormData) {
    const hasPermission = await checkPermission('EDIT_FILE');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền sửa tài liệu' };

    const rawData = Object.fromEntries(formData.entries());
    const fileId = rawData.fileId as string;

    if (!fileId) return { success: false, message: 'Thiếu ID tài liệu' };

    try {
        await prisma.fileAttach.update({
            where: { fileId: fileId },
            data: {
                fileName: rawData.fileName as string,
                note: rawData.note as string,
                fileLink: rawData.fileLink as string,
                updatedAt: new Date()
            }
        });
        revalidatePath('/dashboard/tai-lieu');
        return { success: true, message: 'Cập nhật thành công' };
    } catch (error) {
        return { success: false, message: 'Lỗi cập nhật' };
    }
}

export async function deleteFile(id: string) {
    const hasPermission = await checkPermission('DELETE_FILE');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền xóa tài liệu' };

    try {
        await prisma.fileAttach.delete({ where: { fileId: id } });
        // Optionally delete from Drive if possible?
        revalidatePath('/dashboard/tai-lieu');
        return { success: true, message: 'Đã xóa tài liệu' };
    } catch (error) {
        return { success: false, message: 'Lỗi xóa tài liệu' };
    }
}
