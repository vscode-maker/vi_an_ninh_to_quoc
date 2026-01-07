import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Session } from 'next-auth';

/**
 * Verifies if the current user has access to a specific task based on their role and group assignments.
 * 
 * @param taskId The ID of the task to verify access for.
 * @returns A promise that resolves to true if authorized, or throws an error if unauthorized/not found.
 */
export async function verifyTaskAccess(taskId: string): Promise<boolean> {
    const session = await auth();

    if (!session?.user) {
        throw new Error('Unauthorized: No active session');
    }

    const { role, groupIds } = session.user;

    // Admin has access to everything
    // Also check for MANAGE_SYSTEM permission
    const permissions = (session.user as any)?.permissions || [];
    if (role?.toLowerCase() === 'admin' || permissions.includes('MANAGE_SYSTEM')) {
        return true;
    }

    // Fetch task to check its groupId
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { groupId: true }
    });

    if (!task) {
        throw new Error('Task not found');
    }

    // Tasks without a group are theoretically accessible only to admins (or everyone? defaulting to stricter)
    // If business logic says "no group = public", change this. 
    // Assuming "no group" means it might be a draft or system task, let's restrict to be safe, 
    // OR if the user has NO groups assigned, they shouldn't see it.

    if (!task.groupId) {
        // If a task has no group, only admin can access (strict mode)
        // Or strictly follow the previous logic: if it doesn't match a group in user's list, fail.
        throw new Error('Unauthorized: Task has no group assignment');
    }

    if (!groupIds) {
        throw new Error('Unauthorized: User has no group assignments');
    }

    const userGroupIds = groupIds.split(',').map(id => id.trim());

    if (!userGroupIds.includes(task.groupId)) {
        throw new Error('Unauthorized: You do not have access to this group');
    }

    return true;
}

export async function checkPermission(permission: string): Promise<boolean> {
    const session: any = await auth();
    const userPermissions = session?.user?.permissions || [];
    const role = session?.user?.role;
    // Case-insensitive admin check
    if (role?.toLowerCase() === 'admin' || userPermissions.includes('MANAGE_SYSTEM')) {
        return true;
    }
    return userPermissions.includes(permission);
}
