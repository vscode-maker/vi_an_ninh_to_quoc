'use client';
import React from 'react';

export const Radio = ({ children, ...props }: any) => {
    return (
        <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" className="text-blue-600 focus:ring-blue-500" {...props} />
            <span className="text-sm text-gray-700">{children}</span>
        </label>
    );
};

Radio.Group = ({ children, className, ...props }: any) => {
    return (
        <div className={`flex flex-wrap gap-4 ${className}`} {...props}>
            {/* We need to pass name/onChange to children if not using Context. 
                 For compat, this is a visual wrapper. */}
            {children}
        </div>
    );
};
