
'use server';

import prisma from '@/lib/prisma';
import { MODULE_CONFIG } from '@/lib/module-config';
import { revalidatePath } from 'next/cache';
import { checkPermission } from '@/lib/actions-utils';

function getModelAndPK(slug: string) {
    const config = MODULE_CONFIG[slug];
    if (!config) throw new Error(`Invalid slug: ${slug}`);
    return { model: config.model, pk: config.primaryKey };
}

function getPermissionCode(slug: string, action: 'ADD' | 'EDIT' | 'DELETE') {
    const upperSlug = slug.replace(/-/g, '_').toUpperCase();
    return `${action}_${upperSlug}`;
}

export async function deleteGenericItem(slug: string, id: string) {
    const permCode = getPermissionCode(slug, 'DELETE');
    if (!(await checkPermission(permCode))) {
        throw new Error(`Unauthorized: Requires ${permCode}`);
    }
    const { model, pk } = getModelAndPK(slug);

    try {
        await (prisma as any)[model].delete({
            where: { [pk]: id }
        });
        revalidatePath(`/dashboard/danh-muc/${slug}`);
        return { success: true };
    } catch (e) {
        console.error("Delete failed:", e);
        throw new Error("Failed to delete item");
    }
}

export async function createGenericItem(slug: string, data: any) {
    const permCode = getPermissionCode(slug, 'ADD');
    if (!(await checkPermission(permCode))) {
        throw new Error(`Unauthorized: Requires ${permCode}`);
    }
    const { model } = getModelAndPK(slug);

    try {
        const newItem = await (prisma as any)[model].create({
            data
        });
        revalidatePath(`/dashboard/danh-muc/${slug}`);
        return { success: true, data: newItem };
    } catch (e: any) {
        console.error("Create failed:", e);
        throw new Error("Failed to create item: " + (e.message || e));
    }
}

export async function updateGenericItem(slug: string, id: string, data: any) {
    const permCode = getPermissionCode(slug, 'EDIT');
    if (!(await checkPermission(permCode))) {
        throw new Error(`Unauthorized: Requires ${permCode}`);
    }
    const { model, pk } = getModelAndPK(slug);

    try {
        const updatedItem = await (prisma as any)[model].update({
            where: { [pk]: id },
            data
        });
        revalidatePath(`/dashboard/danh-muc/${slug}`);
        return { success: true, data: updatedItem };
    } catch (e: any) {
        console.error("Update failed:", e);
        throw new Error("Failed to update item: " + (e.message || e));
    }
}
