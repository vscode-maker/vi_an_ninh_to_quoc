'use client';
import React, { useState } from 'react';

export const Tabs = ({ items, defaultActiveKey, className }: any) => {
    const [activeKey, setActiveKey] = useState(defaultActiveKey || items[0]?.key);

    return (
        <div className={className}>
            <div className="flex border-b border-gray-200 overflow-x-auto">
                {items.map((item: any) => (
                    <button
                        type="button"
                        key={item.key}
                        onClick={() => setActiveKey(item.key)}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeKey === item.key
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            <div className="p-4">
                {items.map((item: any) => (
                    <div key={item.key} className={activeKey === item.key ? 'block' : 'hidden'}>
                        {item.children}
                    </div>
                ))}
            </div>
        </div>
    );
};
