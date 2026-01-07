'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

const checkPermission = async (permission: string) => {
    const session: any = await auth();
    const userPermissions = session?.user?.permissions || [];
    const role = session?.user?.role;
    if (role?.toLowerCase() !== 'admin' && !userPermissions.includes(permission)) {
        return false;
    }
    return true;
};

export async function getCongDans({
    page = 1,
    pageSize = 10,
    search = '',
}: {
    page?: number;
    pageSize?: number;
    search?: string;
}) {
    const hasPermission = await checkPermission('VIEW_CITIZEN');
    if (!hasPermission) {
        return { success: false, message: 'Bạn không có quyền xem danh sách công dân.', data: [], total: 0 };
    }

    const where: any = {};
    if (search) {
        where.OR = [
            { hoTen: { contains: search, mode: 'insensitive' } },
            { soCMND: { contains: search, mode: 'insensitive' } },
            { soCCCD: { contains: search, mode: 'insensitive' } },
            { soDienThoai: { contains: search, mode: 'insensitive' } },
        ];
    }

    try {
        const [data, total] = await Promise.all([
            prisma.congDan.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { ngayTao: 'desc' },
            }),
            prisma.congDan.count({ where }),
        ]);

        return { success: true, data, total, page, pageSize };
    } catch (error) {
        console.error('Error fetching citizens:', error);
        return { success: false, message: 'Lỗi khi tải danh sách công dân.' };
    }
}

export async function createCongDan(formData: FormData) {
    const hasPermission = await checkPermission('CREATE_CITIZEN');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền thêm mới công dân.' };

    const session = await auth();
    const rawData = Object.fromEntries(formData.entries());

    try {
        await prisma.congDan.create({
            data: {
                id: rawData.id ? String(rawData.id) : `CD${Date.now()}`,
                hoTen: String(rawData.hoTen),
                soCMND: rawData.soCMND ? String(rawData.soCMND) : null,
                soCCCD: rawData.soCCCD ? String(rawData.soCCCD) : null,
                gioiTinh: rawData.gioiTinh ? String(rawData.gioiTinh) : null,
                ngaySinh: rawData.ngaySinh ? String(rawData.ngaySinh) : null,
                queQuan: rawData.queQuan ? String(rawData.queQuan) : null,
                noiThuongTru: rawData.noiThuongTru ? String(rawData.noiThuongTru) : null,
                noiOHienTai: rawData.noiOHienTai ? String(rawData.noiOHienTai) : null,
                soDienThoai: rawData.soDienThoai ? String(rawData.soDienThoai) : null,
                ngheNghiep: rawData.ngheNghiep ? String(rawData.ngheNghiep) : null,
                danToc: rawData.danToc ? String(rawData.danToc) : null,
                tonGiao: rawData.tonGiao ? String(rawData.tonGiao) : null,
                ghiChu: rawData.ghiChu ? String(rawData.ghiChu) : null,
                nguoiTao: session?.user?.name,
            }
        });
        revalidatePath('/dashboard/cong-dan');
        return { success: true, message: 'Thêm công dân thành công!' };
    } catch (error) {
        console.error('Create error:', error);
        return { success: false, message: 'Lỗi khi thêm mới công dân.' };
    }
}

export async function updateCongDan(id: string, formData: FormData) {
    const hasPermission = await checkPermission('EDIT_CITIZEN');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền sửa thông tin công dân.' };

    const rawData = Object.fromEntries(formData.entries());
    try {
        await prisma.congDan.update({
            where: { id },
            data: {
                hoTen: String(rawData.hoTen),
                soCMND: rawData.soCMND ? String(rawData.soCMND) : null,
                soCCCD: rawData.soCCCD ? String(rawData.soCCCD) : null,
                gioiTinh: rawData.gioiTinh ? String(rawData.gioiTinh) : null,
                ngaySinh: rawData.ngaySinh ? String(rawData.ngaySinh) : null,
                queQuan: rawData.queQuan ? String(rawData.queQuan) : null,
                noiThuongTru: rawData.noiThuongTru ? String(rawData.noiThuongTru) : null,
                noiOHienTai: rawData.noiOHienTai ? String(rawData.noiOHienTai) : null,
                soDienThoai: rawData.soDienThoai ? String(rawData.soDienThoai) : null,
                ngheNghiep: rawData.ngheNghiep ? String(rawData.ngheNghiep) : null,
                danToc: rawData.danToc ? String(rawData.danToc) : null,
                tonGiao: rawData.tonGiao ? String(rawData.tonGiao) : null,
                ghiChu: rawData.ghiChu ? String(rawData.ghiChu) : null,
            }
        });
        revalidatePath('/dashboard/cong-dan');
        return { success: true, message: 'Cập nhật thành công!' };
    } catch (error) {
        console.error('Update error:', error);
        return { success: false, message: 'Lỗi khi cập nhật thông tin.' };
    }
}

export async function deleteCongDan(id: string) {
    const hasPermission = await checkPermission('DELETE_CITIZEN');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền xóa công dân.' };

    try {
        await prisma.congDan.delete({ where: { id } });
        revalidatePath('/dashboard/cong-dan');
        return { success: true, message: 'Đã xóa công dân.' };
    } catch (error) {
        return { success: false, message: 'Lỗi khi xóa.' };
    }
}
