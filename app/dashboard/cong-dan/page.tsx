
import { getCongDans } from '@/lib/cong-dan-actions';
import { auth } from '@/auth';
import CongDanTable from './cong-dan-table';


export default async function CongDanPage({
    searchParams,
}: {
    searchParams?: Promise<{
        page?: string;
        query?: string;
    }>;
}) {
    const params = await searchParams;
    const page = Number(params?.page) || 1;
    const query = params?.query || '';

    const { data: congDans, total, success, message } = await getCongDans({ page, search: query });
    const session: any = await auth();
    console.log('CongDanPage Session:', JSON.stringify(session?.user, null, 2));
    const userPermissions = session?.user?.permissions || [];
    const role = session?.user?.role;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-blue-900">QUẢN LÝ CÔNG DÂN</h1>
            <CongDanTable
                initialData={congDans || []}
                total={total || 0}
                currentPage={page}
                searchQuery={query}
                userPermissions={userPermissions}
                userRole={role}
            />
        </div>
    );
}
