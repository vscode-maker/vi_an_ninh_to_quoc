
'use server';

import prisma from '@/lib/prisma';
import { checkPermission } from '@/lib/actions-utils';
import { revalidatePath } from 'next/cache';

// Permission constants
const PERM_VIEW = 'VIEW_DATA_DON_AN';
// Granular permissions
const PERM_ADD = 'ADD_DATA_DON_AN';
const PERM_EDIT = 'EDIT_DATA_DON_AN';
const PERM_DELETE = 'DELETE_DATA_DON_AN';

export async function getDataDonAn({
    page = 1,
    pageSize = 10,
    search = '',
    filters = {}
}: {
    page?: number;
    pageSize?: number;
    search?: string;
    filters?: any;
}) {
    if (!(await checkPermission(PERM_VIEW))) {
        throw new Error('Unauthorized');
    }

    const skip = (page - 1) * pageSize;

    const where: any = {
        AND: []
    };

    if (search) {
        where.AND.push({
            OR: [
                { noiDung: { contains: search, mode: 'insensitive' } },
                { trichYeu: { contains: search, mode: 'insensitive' } },
                { phanLoai: { contains: search, mode: 'insensitive' } },
                // Add more searchable fields
                { soLuuTru: { contains: search, mode: 'insensitive' } },
            ]
        });
    }

    // Apply strict filters
    if (filters) {
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                where[key] = filters[key];
            }
        });
    }

    const [data, total] = await Promise.all([
        prisma.dataDonAn.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: {
                id: 'desc'
            }
        }),
        prisma.dataDonAn.count({ where })
    ]);

    return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
    };
}

export async function getDataDonAnById(id: string) {
    if (!(await checkPermission(PERM_VIEW))) {
        return null;
    }
    const item = await prisma.dataDonAn.findUnique({
        where: { id },
    });
    return item;
}

export async function createDataDonAn(formData: any) {
    if (!(await checkPermission(PERM_ADD))) {
        throw new Error('Unauthorized: Missing Permissions');
    }

    const newItem = await prisma.dataDonAn.create({
        data: formData
    });

    revalidatePath('/dashboard/data-don-an');
    return newItem;
}

export async function updateDataDonAn(id: string, formData: any) {
    if (!(await checkPermission(PERM_EDIT))) {
        throw new Error('Unauthorized: Missing Permissions');
    }

    const updatedItem = await prisma.dataDonAn.update({
        where: { id },
        data: formData
    });

    revalidatePath('/dashboard/data-don-an');
    revalidatePath(`/dashboard/data-don-an/${id}`);
    return updatedItem;
}

export async function deleteDataDonAn(id: string) {
    if (!(await checkPermission(PERM_DELETE))) {
        throw new Error('Unauthorized: Missing Permissions');
    }

    try {
        await prisma.dataDonAn.delete({
            where: { id }
        });
        revalidatePath('/dashboard/data-don-an');
        return true;
    } catch (error) {
        console.error('Delete failed:', error);
        throw new Error('Failed to delete. Likely has related data.');
    }
}
