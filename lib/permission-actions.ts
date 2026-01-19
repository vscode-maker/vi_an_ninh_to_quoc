'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function getUsersWithPermissions() {
    const session = await auth();
    // Only Admin can view?
    // if ((session?.user as any)?.role !== 'admin') return [];

    try {
<<<<<<< HEAD
        // Cast to any to avoid TS error if client is stale regarding 'permissions' field
        const users = await (prisma.user as any).findMany({
=======
        const users = await prisma.user.findMany({
>>>>>>> 5c9e8ae (Fix import path and update tasks)
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


<<<<<<< HEAD
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
=======
export async function getPermissionDefinitions() {
    try {
        return await prisma.permission.findMany({ orderBy: { group: 'asc' } });
    } catch (error) {
>>>>>>> 5c9e8ae (Fix import path and update tasks)
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
<<<<<<< HEAD
        await (prisma as any).permission.create({
=======
        await prisma.permission.create({
>>>>>>> 5c9e8ae (Fix import path and update tasks)
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
<<<<<<< HEAD
        await (prisma as any).permission.delete({ where: { code } });
=======
        await prisma.permission.delete({ where: { code } });
>>>>>>> 5c9e8ae (Fix import path and update tasks)
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
<<<<<<< HEAD
        await (prisma.user as any).update({
            where: { id: userId },
            data: {
                permissions: permissions
=======
        await prisma.user.update({
            where: { id: userId },
            data: {
                permissions: permissions // Prisma Json handles array automatically? Yes.
>>>>>>> 5c9e8ae (Fix import path and update tasks)
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
<<<<<<< HEAD
        const sourceUser = await (prisma.user as any).findUnique({
=======
        const sourceUser = await prisma.user.findUnique({
>>>>>>> 5c9e8ae (Fix import path and update tasks)
            where: { id: sourceUserId },
            select: { permissions: true }
        });

        if (!sourceUser) {
            return { success: false, message: 'User nguồn không tồn tại' };
        }

        const permissionsToCopy = sourceUser.permissions || [];

        // 2. Update All Targets
<<<<<<< HEAD
        await (prisma.user as any).updateMany({
=======
        // Use updateMany? No, updateMany doesn't support setting Json for specific logic sometimes, but strict set should work.
        // Prisma updateMany for Json: set value.
        await prisma.user.updateMany({
>>>>>>> 5c9e8ae (Fix import path and update tasks)
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
