
import { Suspense } from 'react';
import { getBoLuatList } from '@/lib/actions/csv-entities';
import BoLuatView from '@/components/bo-luat/bo-luat-view';

export const dynamic = 'force-dynamic';

export default async function BoLuatPage({
    searchParams,
}: {
    searchParams: { page?: string; pageSize?: string; search?: string };
}) {
    const page = Number(searchParams?.page) || 1;
    const pageSize = Number(searchParams?.pageSize) || 20;
    const search = searchParams?.search || '';

    const { data, total } = await getBoLuatList(search, page);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BoLuatView
                data={data}
                total={total}
                page={page}
                pageSize={pageSize}
                search={search}
            />
        </Suspense>
    );
}
