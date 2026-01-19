import React, { forwardRef } from 'react';

interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
    ({ className = '', label, error, helperText, type = 'date', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        type={type}
                        ref={ref}
                        className={`
                            w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
                            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
                            ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                            ${className}
                        `}
                        {...props}
                    />
                    {/* Optional: Add custom calendar icon here if needed, but native input handles it well usually */}
                </div>
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
            </div>
        );
    }
);

DatePicker.displayName = 'DatePicker';
