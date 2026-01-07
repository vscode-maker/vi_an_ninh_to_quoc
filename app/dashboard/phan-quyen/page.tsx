
import { getUsersWithPermissions, getPermissionDefinitions } from '@/lib/permission-actions';
import PhanQuyenTable from './phan-quyen-table';
import { Card } from 'antd';

export default async function PhanQuyenPage() {
    const [users, permissions] = await Promise.all([
        getUsersWithPermissions(),
        getPermissionDefinitions()
    ]);

    return (
        <div style={{ padding: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#1b5e20' }}>PHÂN QUYỀN HỆ THỐNG</h1>
            <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <PhanQuyenTable initialUsers={users || []} availablePermissions={permissions || []} />
            </div>
        </div>
    );
}
