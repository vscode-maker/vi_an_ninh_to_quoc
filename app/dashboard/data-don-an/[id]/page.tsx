
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getDataDonAnById } from '@/lib/actions/data-don-an';
import DataDonAnDetailView from '@/components/data-don-an/data-don-an-detail-view';

export const dynamic = 'force-dynamic';

export default async function DataDonAnDetailPage({
    params
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const item = await getDataDonAnById(id);

    if (!item) {
        notFound();
    }

    return (
        <Suspense fallback={<div>Loading Details...</div>}>
            <DataDonAnDetailView data={item} />
        </Suspense>
    );
}
