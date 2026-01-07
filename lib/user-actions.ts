'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { uploadToDrive } from '@/lib/google-drive';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { checkPermission } from '@/lib/actions-utils';

export async function updateAvatarAction(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: 'Bạn chưa đăng nhập.' };
        }

        const file = formData.get('file') as File;
        if (!file || file.size === 0) {
            return { success: false, message: 'Vui lòng chọn file ảnh.' };
        }

        // Upload to Google Drive using existing utility
        // Note: folderId is optional in uploadToDrive, it falls back to env var
        const uploadResult = await uploadToDrive(file);

        if (uploadResult.error) {
            console.error('Drive Upload Error:', uploadResult.error);
            return { success: false, message: 'Lỗi khi tải ảnh lên Drive.' };
        }

        // Processing link to be LH3 style (direct image link logic)
        // Usually, thumbnailLink looks like: https://lh3.googleusercontent.com/drive-viewer/...=s220
        // We want to remove the size param (=s...) to get full resolution or control it.
        let avatarUrl = uploadResult.thumbnail;
        if (avatarUrl) {
            // Remove the size parameter (e.g., =s220) to get the original quality or default large
            avatarUrl = avatarUrl.replace(/=s\d+$/, '');
        } else {
            // Fallback if thumbnail is somehow missing but we have ID, though thumbnail is best for LH3
            // webContentLink is for download, webViewLink is for preview. 
            // Ideally we want the googleusercontent link which comes in thumbnail.
            // If thumbnail is missing, we might have to stick with what we have or try to construct it.
            // For now, let's assume thumbnail is returned as per google-drive.ts
            return { success: false, message: 'Không lấy được link ảnh từ Drive.' };
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { avatar: avatarUrl },
        });

        revalidatePath('/dashboard');
        return { success: true, message: 'Cập nhật ảnh đại diện thành công!' };

    } catch (error: any) {
        console.error('Update Avatar Error:', error);
        return { success: false, message: 'Lỗi server: ' + error.message };
    }
}

export async function updatePasswordAction(prevState: any, formData: FormData) {
    try {
        const session = await auth();
        // Use soHieu to identify user accurately as ID might not be in session depending on config, 
        // but auth.ts puts ID in session. Let's use ID or soHieu. auth.ts actually puts 'id' in session.
        if (!session?.user?.id) {
            return { success: false, message: 'Bạn chưa đăng nhập.' };
        }

        // We need to fetch the user to verify the old password
        // Use soHieu from session if available (auth.ts: 54), else fetch by ID.
        // Let's rely on ID since it's unique.
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return { success: false, message: 'Không tìm thấy thông tin người dùng.' };
        }

        const currentPassword = formData.get('currentPassword') as string;
        const newPassword = formData.get('newPassword') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return { success: false, message: 'Vui lòng nhập đầy đủ thông tin.' };
        }

        if (newPassword !== confirmPassword) {
            return { success: false, message: 'Mật khẩu mới không khớp.' };
        }

        // Verify Old Password
        let passwordsMatch = false;
        // 1. Check Plain Text (Legacy)
        if (currentPassword === user.password) {
            passwordsMatch = true;
        }
        // 2. Check Bcrypt
        else if (user.password.startsWith('$2')) {
            passwordsMatch = await bcrypt.compare(currentPassword, user.password);
        }

        if (!passwordsMatch) {
            return { success: false, message: 'Mật khẩu hiện tại không đúng.' };
        }

        // Hash New Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        // Optional: Sign out user or keep logged in? Changing password usually doesn't require re-login unless strict security.
        // We will just return success.

        return { success: true, message: 'Đổi mật khẩu thành công!' };

    } catch (error: any) {
        console.error('Update Password Error:', error);
        return { success: false, message: 'Lỗi server: ' + error.message };
    }
}

export async function getUsers({ page = 1, pageSize = 10, search = '' }: { page?: number; pageSize?: number; search?: string }) {
    const hasPermission = await checkPermission('VIEW_EMPLOYEE');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền xem danh sách nhân viên', data: [], total: 0 };

    const where: any = {};
    if (search) {
        where.OR = [
            { fullName: { contains: search, mode: 'insensitive' } },
            { soHieu: { contains: search, mode: 'insensitive' } },
        ];
    }
    try {
        const [data, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { soHieu: 'asc' },
            }),
            prisma.user.count({ where }),
        ]);
        return { success: true, data, total, page, pageSize };
    } catch (error) {
        return { success: false, message: 'Lỗi tải danh sách cán bộ' };
    }
}

export async function createUser(formData: FormData) {
    const hasPermission = await checkPermission('CREATE_EMPLOYEE');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền thêm nhân viên' };

    const rawData = Object.fromEntries(formData.entries());
    try {
        const hashedPassword = await bcrypt.hash(rawData.password as string, 10);
        await prisma.user.create({
            data: {
                id: crypto.randomUUID(),
                soHieu: rawData.soHieu as string,
                fullName: rawData.fullName as string,
                password: hashedPassword,
                role: rawData.role as string || 'user',
                position: rawData.position as string || '',
                // Add other fields...
            }
        });
        revalidatePath('/dashboard/nhan-vien');
        return { success: true, message: 'Thêm cán bộ thành công' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Lỗi thêm cán bộ (Có thể trùng số hiệu)' };
    }
}

export async function updateUser(id: string, formData: FormData) {
    const hasPermission = await checkPermission('EDIT_EMPLOYEE');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền sửa thông tin nhân viên' };

    const rawData = Object.fromEntries(formData.entries());
    const data: any = {
        soHieu: rawData.soHieu,
        fullName: rawData.fullName,
        role: rawData.role,
        position: rawData.position,
    };
    if (rawData.password) {
        data.password = await bcrypt.hash(rawData.password as string, 10);
    }
    try {
        await prisma.user.update({ where: { id }, data });
        revalidatePath('/dashboard/nhan-vien');
        return { success: true, message: 'Cập nhật thành công' };
    } catch (error) {
        return { success: false, message: 'Lỗi cập nhật' };
    }
}

export async function deleteUser(id: string) {
    const hasPermission = await checkPermission('DELETE_EMPLOYEE');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền xóa nhân viên' };

    try {
        await prisma.user.delete({ where: { id } });
        revalidatePath('/dashboard/nhan-vien');
        return { success: true, message: 'Đã xóa cán bộ' };
    } catch (error) {
        return { success: false, message: 'Lỗi xóa cán bộ' };
    }
}
