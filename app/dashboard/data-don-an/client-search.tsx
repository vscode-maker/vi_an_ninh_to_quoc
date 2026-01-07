
'use client';

import React, { useState } from 'react';
import { Input } from 'antd';
import { useRouter } from 'next/navigation';

export default function ClientSearch({ initialSearch }: { initialSearch: string }) {
    const router = useRouter();
    const [value, setValue] = useState(initialSearch);

    const onSearch = (val: string) => {
        const url = new URL(window.location.href);
        if (val) {
            url.searchParams.set('search', val);
        } else {
            url.searchParams.delete('search');
        }
        url.searchParams.set('page', '1'); // Reset to page 1 on search
        router.push(url.toString());
    };

    return (
        <Input.Search
            placeholder="Tìm kiếm nội dung, trích yếu, phân loại..."
            allowClear
            onSearch={onSearch}
            onChange={(e) => {
                const val = e.target.value;
                setValue(val);
                if (val === '') {
                    onSearch('');
                }
            }}
            value={value}
            enterButton
            style={{ maxWidth: 400 }}
        />
    );
}
