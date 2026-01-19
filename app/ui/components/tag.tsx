import React from 'react';

interface TagProps {
    children: React.ReactNode;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple' | 'cyan' | 'magenta' | 'gold';
    className?: string;
    onClick?: () => void;
}

export function Tag({ children, color = 'gray', className = '', onClick }: TagProps) {
    const colorStyles = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        green: 'bg-green-50 text-green-700 border-green-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        gray: 'bg-gray-50 text-gray-700 border-gray-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        magenta: 'bg-pink-50 text-pink-700 border-pink-200',
        gold: 'bg-amber-50 text-amber-700 border-amber-200',
    };

    return (
        <span
            className={`
                inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
                ${colorStyles[color]}
                ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
                ${className}
            `}
            onClick={onClick}
        >
            {children}
        </span>
    );
}
