
import { getUsers } from '@/lib/user-actions';
import NhanVienTable from './nhan-vien-table';
import { auth } from '@/auth';

export default async function NhanVienPage(props: {
    searchParams?: Promise<{
        query?: string;
        page?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const query = searchParams?.query || '';
    const currentPage = Number(searchParams?.page) || 1;

    const session = await auth();
    const userPermissions = session?.user?.permissions || [];
    const userRole = session?.user?.role;

    const { data: users, total } = await getUsers({ page: currentPage, pageSize: 10, search: query });

    return (
        <div style={{ padding: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#1b5e20' }}>QUẢN LÝ NHÂN VIÊN</h1>
            <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <NhanVienTable
                    initialData={users || []}
                    total={total || 0}
                    currentPage={currentPage}
                    userPermissions={userPermissions}
                    userRole={userRole}
                />
            </div>
        </div>
    );
}
