import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    color?: 'primary' | 'white' | 'gray';
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', color = 'primary' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4',
    };

    const colorClasses = {
        primary: 'border-blue-600 border-t-transparent',
        white: 'border-white border-t-transparent',
        gray: 'border-gray-300 border-t-gray-600',
    };

    return (
        <div
            className={`
                rounded-full animate-spin
                ${sizeClasses[size]}
                ${colorClasses[color]}
                ${className}
            `}
            role="status"
            aria-label="Loading"
        />
    );
};
