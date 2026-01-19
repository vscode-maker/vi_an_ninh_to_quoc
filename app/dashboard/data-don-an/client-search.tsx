'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

export default function ClientSearch({ initialSearch }: { initialSearch: string }) {
    const router = useRouter();
    const [value, setValue] = useState(initialSearch);

    const onSearch = useDebouncedCallback((val: string) => {
        const url = new URL(window.location.href);
        if (val) {
            url.searchParams.set('search', val);
        } else {
            url.searchParams.delete('search');
        }
        url.searchParams.set('page', '1'); // Reset to page 1 on search
        router.push(url.toString());
    }, 500);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setValue(val);
        onSearch(val);
    };

    return (
        <div className="relative max-w-[400px]">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search size={16} />
            </span>
            <input
                type="text"
                className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="Tìm kiếm nội dung, trích yếu, phân loại..."
                value={value}
                onChange={handleChange}
            />
        </div>
    );
}
