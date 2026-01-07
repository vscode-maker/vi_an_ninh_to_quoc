
import { getGroupZalos } from '@/lib/group-zalo-actions';
import ZaloTable from './zalo-table';

export default async function ZaloPage() {
    const { data } = await getGroupZalos();

    return (
        <div style={{ padding: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#1b5e20' }}>QUẢN LÝ NHÓM ZALO</h1>
            <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <ZaloTable initialData={data || []} />
            </div>
        </div>
    );
}
