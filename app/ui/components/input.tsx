import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, helperText, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-slate-800 mb-1.5">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`
                        w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                        bg-white text-slate-800 placeholder-slate-400
                        ${error ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'}
                        ${props.disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}
                        ${className}
                    `}
                    {...props}
                />
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                {helperText && !error && <p className="mt-1 text-sm text-slate-500">{helperText}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';
