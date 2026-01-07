
'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, Descriptions, Card, Table, Empty } from 'antd';
import { getRelatedEntityByDataDonAnId } from '@/lib/actions/csv-entities';

interface Props {
    data: any; // DataDonAn
}

const DataDonAnDetailTabs: React.FC<Props> = ({ data }) => {
    const [activeTab, setActiveTab] = useState('1');

    // We could fetch related data Server Side and pass it in, 
    // OR fetch Client Side on tab change.
    // Given potential size, client fetch on demand is better for performance.
    // But for simple verification, passing everything or fetching simple is ok.
    // Let's implement Client Fetching for a related list as a POC.

    return (
        <Card>
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
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
                    // Add more tabs for other relations
                ]}
            />
        </Card>
    );
};

const GeneralInfo = ({ data }: { data: any }) => (
    <Descriptions bordered column={1}>
        <Descriptions.Item label="ID">{data.id}</Descriptions.Item>
        <Descriptions.Item label="Phân loại">{data.phanLoai}</Descriptions.Item>
        <Descriptions.Item label="Trích yếu">{data.trichYeu}</Descriptions.Item>
        <Descriptions.Item label="Nội dung">{data.noiDung}</Descriptions.Item>
        <Descriptions.Item label="Ngày xảy ra">{data.ngayXayRa}</Descriptions.Item>
        <Descriptions.Item label="Nơi xảy ra">{data.noiXayRa}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái">{data.trangThai}</Descriptions.Item>
        <Descriptions.Item label="Cảnh báo tiến độ">{data.canhBaoTienDo}</Descriptions.Item>
    </Descriptions>
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

    // Define columns dynamically or simple JSON dump for now?
    // Start with JSON dump or simple generic table.
    // Ideally specific columns per model.
    // User wants "Modules"...
    // I will auto-generate columns from keys of first item if available.

    const columns = list.length > 0 ? Object.keys(list[0]).map(key => ({
        title: key,
        dataIndex: key,
        key: key,
        ellipsis: true
    })).slice(0, 5) : []; // Limit to 5 columns for safety

    if (loading) return <div>Loading...</div>;
    if (list.length === 0) return <Empty description="Không có dữ liệu" />;

    return <Table dataSource={list} columns={columns} pagination={false} rowKey="id" scroll={{ x: true }} />;
};

export default DataDonAnDetailTabs;
