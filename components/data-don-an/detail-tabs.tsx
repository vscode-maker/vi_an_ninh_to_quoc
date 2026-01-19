'use client';

import React, { useState, useEffect } from 'react';
import { Tabs } from '@/app/ui/compat/tabs-compat';
import { Card } from '@/app/ui/components/card';
import { Table } from '@/app/ui/components/table';
import { getRelatedEntityByDataDonAnId } from '@/lib/actions/csv-entities';

interface Props {
    data: any; // DataDonAn
}

const DataDonAnDetailTabs: React.FC<Props> = ({ data }) => {
    // Tabs compat uses internal state or controlled. It supports onChange.
    // The compat component I saw earlier uses internal state if defaultActiveKey provided, or can be controlled?
    // Let's check compat: It has `activeKey` prop but uses internal `state` derived from `defaultActiveKey`? 
    // Actually the compat code I saw: `const [activeKey, setActiveKey] = useState(defaultActiveKey || items[0]?.key);`
    // It DOES NOT synchronize with `activeKey` prop if it changes potentially.
    // But here we just need simple tabs works.

    return (
        <Card>
            <Tabs
                items={[
                    {
                        key: '1',
                        label: 'Thông tin chung',
                        children: <GeneralInfo data={data} />,
                    },
                    {
                        key: '2',
                        label: 'Biện pháp ngăn chặn',
                        children: <RelatedList model="bienPhapNganChan" dataDonAnId={data.id} />,
                    },
                    {
                        key: '3',
                        label: 'Vật chứng',
                        children: <RelatedList model="thongTinVatChung" dataDonAnId={data.id} />,
                    },
                ]}
            />
        </Card>
    );
};

const GeneralInfo = ({ data }: { data: any }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 bg-white">
            <DescriptionItem label="ID" value={data.id} />
            {/* Use full width for some or just grid flow */}
        </div>
        <div className="divide-y divide-gray-200 border-t border-gray-200">
            <DescriptionItem label="Phân loại" value={data.phanLoai} />
            <DescriptionItem label="Trích yếu" value={data.trichYeu} />
            <DescriptionItem label="Nội dung" value={data.noiDung} />
            <DescriptionItem label="Ngày xảy ra" value={data.ngayXayRa} />
            <DescriptionItem label="Nơi xảy ra" value={data.noiXayRa} />
            <DescriptionItem label="Trạng thái" value={data.trangThai} />
            <DescriptionItem label="Cảnh báo tiến độ" value={data.canhBaoTienDo} />
        </div>
    </div>
);

const DescriptionItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="grid grid-cols-3 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
        <dt className="text-sm font-medium text-gray-500 col-span-1">{label}</dt>
        <dd className="text-sm text-gray-900 col-span-2 sm:col-span-2 block break-words">{value || '-'}</dd>
    </div>
);

// Generic Related List Component
const RelatedList = ({ model, dataDonAnId }: { model: string, dataDonAnId: string }) => {
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getRelatedEntityByDataDonAnId(model, dataDonAnId)
            .then(setList)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [model, dataDonAnId]);

    const columns = list.length > 0 ? Object.keys(list[0]).map(key => ({
        title: key,
        dataIndex: key,
        key: key,
    })).slice(0, 5) : [];

    if (loading) return <div className="p-4 text-center text-gray-500">Loading...</div>;
    if (list.length === 0) return <div className="p-8 text-center text-gray-500 border border-gray-100 rounded-lg bg-gray-50">Không có dữ liệu</div>;

    return (
        <div className="overflow-hidden border border-gray-200 rounded-lg">
            <Table dataSource={list} columns={columns} pagination={{ pageSize: 5 }} rowKey="id" />
        </div>
    );
};

export default DataDonAnDetailTabs;
