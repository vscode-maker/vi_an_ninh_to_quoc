
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getGenericList } from '@/lib/actions/csv-entities';
import GenericView from '@/components/generic-module/generic-view';

export const dynamic = 'force-dynamic';

export default async function GenericModulePage({
    params,
    searchParams
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string; search?: string }>;
}) {
    const { slug } = await params;
    const { page, search } = await searchParams; // Next.js 15+ searchParams is also Promise

    // Parse params
    const currentPage = Number(page) || 1;
    const currentSearch = search || '';

    let result;
    try {
        result = await getGenericList(slug, currentPage, currentSearch);
    } catch (e) {
        console.error(`Error loading generic module ${slug}:`, e);
        return notFound();
    }

    return (
        <Suspense fallback={<div>Loading Module...</div>}>
            <GenericView
                data={result.data}
                total={result.total}
                page={result.page}
                pageSize={result.pageSize}
                slug={slug}
                search={currentSearch}
            />
        </Suspense>
    );
}
