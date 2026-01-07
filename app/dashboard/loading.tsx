'use client';

import { Skeleton, Space } from 'antd';

export default function Loading() {
    return (
        <div>
            {/* Header / Title area */}
            <div style={{ marginBottom: 24 }}>
                <Skeleton.Input active size="large" style={{ width: 300, height: 40 }} />
            </div>

            {/* Main Content Area (mimicking table/card) */}
            <div style={{
                background: '#fff',
                borderRadius: 8,
                padding: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                {/* Toolbar area */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                    <Space>
                        <Skeleton.Button active size="default" shape="default" style={{ width: 120 }} />
                        <Skeleton.Button active size="default" shape="default" />
                    </Space>
                    <Skeleton.Input active style={{ width: 200 }} />
                </div>

                {/* Table rows simulation */}
                <Skeleton active paragraph={{ rows: 12 }} title={false} />
            </div>
        </div>
    );
}
