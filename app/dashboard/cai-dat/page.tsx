
import { getSettings } from '@/lib/setting-actions';
import CaiDatTable from './cai-dat-table';

export default async function CaiDatPage() {
    const { data } = await getSettings();

    return (
        <div style={{ padding: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#1b5e20' }}>CÀI ĐẶT HỆ THỐNG</h1>
            <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <CaiDatTable initialData={data || []} />
            </div>
        </div>
    );
}
