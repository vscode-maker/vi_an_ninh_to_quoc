'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function getUsersWithPermissions() {
    const session = await auth();
    // Only Admin can view?
    // if ((session?.user as any)?.role !== 'admin') return [];

    try {
        // Cast to any to avoid TS error if client is stale regarding 'permissions' field
        const users = await (prisma.user as any).findMany({
            select: {
                id: true,
                soHieu: true,
                fullName: true,
                role: true,
                permissions: true,
            },
            orderBy: { soHieu: 'asc' }
        });
        return users;
    } catch (error) {
        console.error('Error fetching users for permissions:', error);
        return [];
    }
}


// Fix: Use singular 'permission' and cast to any to avoid stale client errors
// Fix: Use singular 'permission' and cast to any to avoid stale client errors
export async function getPermissionDefinitions() {
    try {
        // Debug: Check which model exists
        // console.log('Prisma keys:', Object.keys(prisma)); 
        const delegate = (prisma as any).permission || (prisma as any).permissions;
        if (!delegate) {
            console.error('Prisma permission delegate not found!');
            return [];
        }
        return await delegate.findMany({ orderBy: { group: 'asc' } });
    } catch (error) {
        console.error('Error fetching permissions:', error);
        return [];
    }
}

export async function createPermissionDefinition(formData: FormData) {
    const session = await auth();
    // if ((session?.user as any)?.role !== 'admin') return { success: false, message: 'Unauthorized' };

    const code = formData.get('code') as string;
    const name = formData.get('name') as string;
    const group = formData.get('group') as string;

    try {
        await (prisma as any).permission.create({
            data: { code, name, group }
        });
        revalidatePath('/dashboard/phan-quyen');
        return { success: true, message: 'Đã thêm quyền mới' };
    } catch (e) {
        return { success: false, message: 'Lỗi thêm quyền' };
    }
}

export async function deletePermissionDefinition(code: string) {
    try {
        await (prisma as any).permission.delete({ where: { code } });
        revalidatePath('/dashboard/phan-quyen');
        return { success: true, message: 'Đã xóa quyền' };
    } catch (e) {
        return { success: false, message: 'Lỗi xóa quyền' };
    }
}

export async function updateUserPermissions(userId: string, permissions: string[]) {
    const session = await auth();
    // Security check: Only admin
    // if ((session?.user as any)?.role !== 'admin') return { success: false, message: 'Unauthorized' };

    try {
        await (prisma.user as any).update({
            where: { id: userId },
            data: {
                permissions: permissions
            }
        });
        revalidatePath('/dashboard/phan-quyen');
        return { success: true, message: 'Cập nhật quyền thành công!' };
    } catch (error) {
        console.error('Error updating permissions:', error);
        return { success: false, message: 'Lỗi cập nhật quyền.' };
    }
}

export async function copyUserPermissions(sourceUserId: string, targetUserIds: string[]) {
    try {
        // 1. Get Source Permissions
        const sourceUser = await (prisma.user as any).findUnique({
            where: { id: sourceUserId },
            select: { permissions: true }
        });

        if (!sourceUser) {
            return { success: false, message: 'User nguồn không tồn tại' };
        }

        const permissionsToCopy = sourceUser.permissions || [];

        // 2. Update All Targets
        await (prisma.user as any).updateMany({
            where: {
                id: { in: targetUserIds }
            },
            data: {
                permissions: permissionsToCopy
            }
        });

        revalidatePath('/dashboard/phan-quyen');
        return { success: true, message: `Đã sao chép quyền cho ${targetUserIds.length} users thành công!` };

    } catch (error) {
        console.error('Error copying permissions:', error);
        return { success: false, message: 'Lỗi sao chép quyền.' };
    }
}
