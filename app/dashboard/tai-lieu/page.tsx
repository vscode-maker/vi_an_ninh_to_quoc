
import { getFiles } from '@/lib/file-actions';
import TaiLieuTable from './tai-lieu-table';
import { auth } from '@/auth';

export default async function TaiLieuPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams;
    const query = typeof searchParams.query === 'string' ? searchParams.query : '';
    const pageVal = searchParams.page;
    const currentPage = (typeof pageVal === 'string' ? parseInt(pageVal) : 1) || 1;

    const session = await auth();
    const userPermissions = session?.user?.permissions || [];
    const userRole = session?.user?.role;

    const { data, total } = await getFiles({ page: currentPage, pageSize: 20, search: query });

    return (
        <div style={{ padding: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#1b5e20' }}>QUẢN LÝ TÀI LIỆU</h1>
            <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <TaiLieuTable
                    initialData={data || []}
                    total={total || 0}
                    currentPage={currentPage}
                    userPermissions={userPermissions}
                    userRole={userRole}
                />
            </div>
        </div>
    );
}
