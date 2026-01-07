
import { getCongDans } from '@/lib/cong-dan-actions';
import { auth } from '@/auth';
import CongDanTable from './cong-dan-table';
import { Card } from 'antd';

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
        <div style={{ padding: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#1b5e20' }}>QUẢN LÝ CÔNG DÂN</h1>
            <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <CongDanTable
                    initialData={congDans || []}
                    total={total || 0}
                    currentPage={page}
                    searchQuery={query}
                    userPermissions={userPermissions}
                    userRole={role}
                />
            </div>
        </div>
    );
}
