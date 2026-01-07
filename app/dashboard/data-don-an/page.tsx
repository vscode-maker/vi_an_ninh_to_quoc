
import { Suspense } from 'react';
import { getDataDonAn } from '@/lib/actions/data-don-an';
import DataDonAnView from '@/components/data-don-an/data-don-an-view';

export const dynamic = 'force-dynamic';

export default async function DataDonAnPage({
    searchParams,
}: {
    searchParams: { page?: string; pageSize?: string; search?: string };
}) {
    const page = Number(searchParams?.page) || 1;
    const pageSize = Number(searchParams?.pageSize) || 10;
    const search = searchParams?.search || '';

    const { data, total } = await getDataDonAn({ page, pageSize, search });

    return (
        <Suspense fallback={<div>Loading data...</div>}>
            <DataDonAnView
                data={data}
                total={total}
                page={page}
                pageSize={pageSize}
                search={search}
            />
        </Suspense>
    );
}
