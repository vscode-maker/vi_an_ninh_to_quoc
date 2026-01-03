'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { Task } from '@prisma/client';
import { verifyTaskAccess } from './actions-utils';

export async function updateTaskStatus(taskId: string, newStatus: string) {
    try {
        const authorized = await verifyTaskAccess(taskId);
        if (!authorized) throw new Error('Unauthorized');

        await prisma.task.update({
            where: { id: taskId },
            data: { status: newStatus },
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Failed to update task status:', error);
        return { success: false, error: 'Failed to update task status' };
    }
}

import { uploadToDrive } from '@/lib/google-drive';

// ... existing imports

export async function createTask(prevState: any, formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user) return { success: false, message: 'Unauthorized' };

        const rawData = Object.fromEntries(formData.entries());

        // Handle File Uploads
        const files = formData.getAll('files') as File[];
        const uploadedAttachments = [];

        for (const file of files) {
            if (file.size > 0 && file.name !== 'undefined') {
                const uploadResult = await uploadToDrive(file);
                if (uploadResult) {
                    uploadedAttachments.push(uploadResult);
                }
            }
        }

        // Auto-generate ID (simple timestamp + random for now, or use UUID if library available)
        const id = `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        let groupName = rawData.groupName as string || null;
        const groupId = rawData.groupId as string || null;

        // If groupId is provided but groupName is not (or to ensure consistency), fetch groupName
        if (groupId) {
            const group = await prisma.groupZalo.findUnique({
                where: { groupId: groupId },
                select: { name: true }
            });
            if (group) {
                groupName = group.name;
            }
        }

        const taskData = {
            id,
            requestDate: new Date(),
            requesterName: session.user.fullName, // Auto-fill requester
            recorderId: (session.user as any).soHieu, // Auto-fill recorder ID from session
            groupName: groupName,
            groupId: groupId,
            targetName: rawData.targetName as string || null,
            requestType: rawData.requestType as string || null,
            status: 'Chưa thực hiện',
            deadline: rawData.deadline ? new Date(rawData.deadline as string) : null,
            content: rawData.content as string || null,
            accountName: rawData.accountName as string || null,
            accountNumber: rawData.accountNumber as string || null,
            bankName: rawData.bankName as string || null,
            phoneNumber: rawData.phoneNumber as string || null,
            carrier: rawData.carrier as string || null,
            documentInfo: rawData.documentInfo as string || null,
            qrCode: rawData.qrCode as string || null,
            socialAccountName: rawData.socialAccountName as string || null,
            moreInfo: rawData.moreInfo ? JSON.parse(rawData.moreInfo as string) : undefined,
            attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined, // Save as JSON
        };

        await prisma.task.create({
            data: taskData,
        });

        revalidatePath('/dashboard');
        return { success: true, message: 'Tạo công việc thành công!' };
    } catch (error) {
        console.error('Failed to create task:', error);
        return { success: false, message: 'Lỗi tạo công việc' };
    }
}

export async function updateTask(taskId: string, formData: FormData) {
    // Similar to create, but update
    try {
        const session = await auth();
        if (!session?.user) return { success: false, message: 'Unauthorized' };

        // Verify access before update
        try {
            await verifyTaskAccess(taskId);
        } catch (e) {
            return { success: false, message: 'Bạn không có quyền chỉnh sửa công việc này' };
        }

        const rawData = Object.fromEntries(formData.entries());

        await prisma.task.update({
            where: { id: taskId },
            data: {
                targetName: rawData.targetName as string,
                content: rawData.content as string,
                deadline: rawData.deadline ? new Date(rawData.deadline as string) : null,
                status: rawData.status as string,
                requestType: rawData.requestType as string,
                groupId: rawData.groupId as string,
                // Bank fields
                bankName: rawData.bankName as string,
                accountNumber: rawData.accountNumber as string,
                accountName: rawData.accountName as string,
                // Phone fields
                phoneNumber: rawData.phoneNumber as string,
                carrier: rawData.carrier as string,
                // Zalo fields
                qrCode: rawData.qrCode as string,
                socialAccountName: rawData.socialAccountName as string,
                // Other fields
                executionUnit: rawData.executionUnit as string,
                documentInfo: rawData.documentInfo as string,
                progressWarning: rawData.progressWarning as string,
                moreInfo: rawData.moreInfo ? JSON.parse(rawData.moreInfo as string) : undefined,
            }
        });

        // Handle File Uploads for Update
        const files = formData.getAll('files') as File[];
        // NOTE: Does not currently remove old files, only adds new ones.
        if (files && files.length > 0) {
            for (const file of files) {
                if (file.size > 0 && file.name !== 'undefined') {
                    const uploadResult = await uploadToDrive(file);
                    if (uploadResult) {
                        await prisma.fileAttach.create({
                            data: {
                                fileId: uploadResult.fileId as string,
                                taskId: taskId,
                                fileName: uploadResult.name,
                                fileLink: uploadResult.url,
                                fileType: uploadResult.mimeType || null,
                                updatedAt: new Date(),
                                // Optional: Add note or moreInfo if passed in formData, currently just basic upload
                            }
                        });
                    }
                }
            }
        }

        revalidatePath('/dashboard');
        return { success: true, message: 'Cập nhật thành công!' };
    } catch (error) {
        console.error('Failed to update task:', error);
        return { success: false, message: 'Lỗi cập nhật' };
    }
}
// ... (existing updateTask)

export async function uploadTaskFiles(taskId: string, formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user) return { success: false, message: 'Unauthorized' };

        // Verify access before upload
        try {
            await verifyTaskAccess(taskId);
        } catch (e) {
            return { success: false, message: 'Bạn không có quyền tải file lên công việc này' };
        }

        // Handle File Uploads
        const files = formData.getAll('files') as File[];
        // Parse metadata
        const note = formData.get('note') as string;
        const moreInfoStr = formData.get('moreInfo') as string;
        let moreInfoJson: any = null;
        try {
            if (moreInfoStr) moreInfoJson = JSON.parse(moreInfoStr);
        } catch (e) {
            console.error('Invalid JSON for moreInfo');
        }

        if ((!files || files.length === 0) && !moreInfoJson) {
            return { success: false, message: 'Không có file nào được chọn và không có thông tin bổ sung' };
        }

        // If simple info update without files
        if ((!files || files.length === 0) && moreInfoJson) {
            // Check if we need to update Task.moreInfo
            // The upload modal sends { relatedPeople: [...] }
            // The task.moreInfo expects [...] (Array of people)
            if (moreInfoJson.relatedPeople && Array.isArray(moreInfoJson.relatedPeople)) {
                const currentTask = await prisma.task.findUnique({
                    where: { id: taskId },
                    select: { moreInfo: true }
                });

                let currentPeople: any[] = [];
                if (currentTask?.moreInfo) {
                    if (Array.isArray(currentTask.moreInfo)) {
                        currentPeople = currentTask.moreInfo as any[];
                    } else if (typeof currentTask.moreInfo === 'string') {
                        // legacy check
                        try { currentPeople = JSON.parse(currentTask.moreInfo); } catch { }
                    }
                }

                const updatedPeople = [...currentPeople, ...moreInfoJson.relatedPeople];

                await prisma.task.update({
                    where: { id: taskId },
                    data: { moreInfo: updatedPeople }
                });

                revalidatePath('/dashboard');
                return { success: true, message: 'Đã cập nhật thông tin người liên quan!' };
            }
        }

        let uploadCount = 0;

        let errorMsg = '';
        for (const file of files) {
            if (file.size > 0 && file.name !== 'undefined') {
                const uploadResult = await uploadToDrive(file);
                if (uploadResult && !('error' in uploadResult)) {
                    await prisma.fileAttach.create({
                        data: {
                            fileId: uploadResult.fileId,
                            taskId: taskId,
                            fileName: uploadResult.name,
                            fileLink: uploadResult.url,
                            fileType: uploadResult.mimeType || null,
                            updatedAt: new Date(),
                            note: note || null,
                            moreInfo: moreInfoJson || undefined,
                        }
                    });
                    uploadCount++;
                } else if (uploadResult && 'error' in uploadResult) {
                    errorMsg = (uploadResult as any).error;
                    console.error('Upload failed for file', file.name, errorMsg);
                }
            }
        }

        revalidatePath('/dashboard');

        if (uploadCount === 0 && errorMsg) {
            return { success: false, message: `Lỗi tải lên: ${errorMsg}` };
        }

        return { success: true, message: `Đã tải lên ${uploadCount} file thành công!` };
    } catch (error) {
        console.error('Failed to upload task files:', error);
        return { success: false, message: 'Lỗi tải lên file' };
    }
}

export async function getExecutionUnits() {
    try {
        const settings = await prisma.setting.findMany({
            where: {
                type: 'Đối tượng thực hiện'
            },
            select: {
                value: true
            }
        });
        return settings.map(s => s.value);
    } catch (error) {
        console.error('Failed to fetch execution units:', error);
        return [];
    }
}

export async function getZaloGroups() {
    try {
        const session = await auth();
        if (!session?.user) return [];

        const { role, groupIds } = session.user;
        const where: any = {};

        if (role !== 'admin') {
            if (!groupIds) return [];
            const groupIdArray = groupIds.split(',').map((id: string) => id.trim());
            where.groupId = { in: groupIdArray };
        }

        const groups = await prisma.groupZalo.findMany({
            where: where,
            select: {
                groupId: true,
                name: true
            },
            orderBy: {
                name: 'asc'
            }
        });
        return groups;
    } catch (error) {
        console.error('Failed to fetch zalo groups:', error);
        return [];
    }
}

export async function getTaskAttachments(taskId: string) {
    try {
        const attachments = await prisma.fileAttach.findMany({
            where: { taskId: taskId },
            orderBy: { updatedAt: 'desc' }
        });
        return attachments;
    } catch (error) {
        console.error('Failed to fetch task attachments:', error);
        return [];
    }
}

export async function addTaskNote(taskId: string, content: string) {
    try {
        const session = await auth();
        if (!session?.user) return { success: false, message: 'Unauthorized' };

        // Verify access before adding note
        try {
            await verifyTaskAccess(taskId);
        } catch (e) {
            return { success: false, message: 'Bạn không có quyền thêm ghi chú' };
        }

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            select: { notes: true }
        });

        if (!task) return { success: false, message: 'Task not found' };

        const currentNotes = (task.notes as any[]) || [];

        const newNote = {
            id: Date.now().toString(),
            content,
            createdAt: new Date().toISOString(),
            createdBy: session.user.fullName || session.user.email || 'Unknown'
        };

        const updatedNotes = [...currentNotes, newNote];

        await prisma.task.update({
            where: { id: taskId },
            data: { notes: updatedNotes }
        });

        revalidatePath('/dashboard');
        return { success: true, message: 'Thêm ghi chú thành công!', note: newNote };
    } catch (error) {
        console.error('Failed to add note:', error);
        return { success: false, message: 'Lỗi thêm ghi chú' };
    }
}

export async function updateTaskNote(taskId: string, noteId: string, newContent: string) {
    try {
        const session = await auth();
        if (!session?.user) return { success: false, message: 'Unauthorized' };

        try {
            await verifyTaskAccess(taskId);
        } catch (e) {
            return { success: false, message: 'Bạn không có quyền sửa ghi chú' };
        }

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            select: { notes: true }
        });

        if (!task) return { success: false, message: 'Task not found' };

        const currentNotes = (task.notes as any[]) || [];
        const noteIndex = currentNotes.findIndex((n: any) => n.id === noteId || (n.thoi_gian && `legacy_${currentNotes.indexOf(n)}` === noteId));

        if (noteIndex === -1) return { success: false, message: 'Note not found' };

        // Update content
        currentNotes[noteIndex].content = newContent;
        if (currentNotes[noteIndex].noi_dung) {
            currentNotes[noteIndex].noi_dung = newContent; // Legacy support
        }

        await prisma.task.update({
            where: { id: taskId },
            data: { notes: currentNotes }
        });

        revalidatePath('/dashboard');
        return { success: true, message: 'Cập nhật ghi chú thành công!' };
    } catch (error) {
        console.error('Failed to update note:', error);
        return { success: false, message: 'Lỗi cập nhật ghi chú' };
    }
}

export async function deleteTaskNote(taskId: string, noteId: string) {
    try {
        const session = await auth();
        if (!session?.user) return { success: false, message: 'Unauthorized' };

        try {
            await verifyTaskAccess(taskId);
        } catch (e) {
            return { success: false, message: 'Bạn không có quyền xóa ghi chú' };
        }

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            select: { notes: true }
        });

        if (!task) return { success: false, message: 'Task not found' };

        const currentNotes = (task.notes as any[]) || [];
        // Filter out the note. Handle legacy ID generation logic if needed or just rely on consistent index/ID match.
        // Since legacy generated IDs are 'legacy_index', we need to be careful.
        // Best approach: If it has real ID, use it. If legacy, we can't easily rely on 'legacy_index' for delete unless we recalc indices.
        // Actually, let's just use the same logic:

        let newNotes = [];
        // Re-construct the ID logic to find valid index to splice? 
        // Or filter.

        // Simpler: Map to add temp IDs then filter?
        // No, let's filter based on logic

        newNotes = currentNotes.filter((n: any, index: number) => {
            const currentId = n.id || `legacy_${index}`;
            return currentId !== noteId;
        });

        await prisma.task.update({
            where: { id: taskId },
            data: { notes: newNotes }
        });

        revalidatePath('/dashboard');
        return { success: true, message: 'Xóa ghi chú thành công!' };
    } catch (error) {
        console.error('Failed to delete note:', error);
        return { success: false, message: 'Lỗi xóa ghi chú' };
    }
}

export async function deleteTask(taskId: string) {
    try {
        const session = await auth();
        if (!session?.user) return { success: false, message: 'Unauthorized' };

        // Verify access before delete
        try {
            await verifyTaskAccess(taskId);
        } catch (e) {
            return { success: false, message: 'Bạn không có quyền xóa công việc này' };
        }

        // Manually delete related FileAttach records first
        await prisma.fileAttach.deleteMany({
            where: { taskId: taskId }
        });

        await prisma.task.delete({
            where: { id: taskId }
        });

        revalidatePath('/dashboard');
        return { success: true, message: 'Xóa công việc thành công!' };
    } catch (error) {
        console.error('Failed to delete task:', error);
        return { success: false, message: 'Lỗi xóa công việc (có thể do ràng buộc dữ liệu)' };
    }
}

export async function fetchMoreTasks(status: string, skip: number): Promise<Task[]> {
    try {
        const session = await auth();
        if (!session?.user) return [];

        const { role, groupIds } = session.user;
        const baseWhere: any = { status };

        if (role !== 'admin') {
            if (!groupIds) return [];
            const groupIdArray = groupIds.split(',').map((id: string) => id.trim());
            baseWhere.groupId = { in: groupIdArray };
        }

        return await prisma.task.findMany({
            where: baseWhere,
            orderBy: { updatedAt: 'desc' },
            take: 20,
            skip: skip
        });
    } catch (error) {
        console.error('Failed to fetch more tasks:', error);
        return [];
    }
}
