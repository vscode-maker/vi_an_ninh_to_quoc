import React, { forwardRef } from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: React.ReactNode;
    checked?: boolean;
    indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className = '', label, checked, indeterminate, ...props }, ref) => {
        return (
            <label className={`inline-flex items-center cursor-pointer ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
                <div className="relative flex items-center">
                    <input
                        type="checkbox"
                        ref={ref}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:border-blue-600 checked:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed"
                        checked={checked}
                        {...props}
                    />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
                        {checked && !indeterminate && <Check size={14} strokeWidth={3} />}
                        {indeterminate && <div className="h-0.5 w-2.5 bg-blue-600" />}
                        {/* Indeterminate state usually requires proprietary handling if using standard checkbox input, simulating visual here */}
                    </div>
                </div>
                {label && <span className="ml-2 text-sm text-gray-700 select-none">{label}</span>}
            </label>
        );
    }
);

Checkbox.displayName = 'Checkbox';
