import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';

    const variants = {
        primary: 'bg-blue-900 text-white hover:bg-blue-800 shadow-md focus:ring-blue-900', // Navy Blue
        secondary: 'bg-amber-700 text-white hover:bg-amber-600 shadow-md focus:ring-amber-700', // Gold
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md',
        ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-500',
        outline: 'bg-transparent border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-500',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {!loading && icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
}
