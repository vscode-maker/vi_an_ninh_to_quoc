import React, { useState, useRef, useEffect } from 'react';

interface DropdownProps {
    trigger: React.ReactNode;
    menu: React.ReactNode;
    align?: 'left' | 'right';
    className?: string;
}

export function Dropdown({ trigger, menu, align = 'right', className = '' }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>

            {isOpen && (
                <div
                    className={`
                        absolute z-50 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none
                        ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}
                        animate-in fade-in zoom-in-95 duration-100
                    `}
                >
                    <div className="py-1">
                        {menu}
                    </div>
                </div>
            )}
        </div>
    );
}

export function DropdownItem({ children, onClick, icon, className = '' }: { children: React.ReactNode; onClick?: () => void; icon?: React.ReactNode; className?: string }) {
    return (
        <button
            onClick={onClick}
            className={`
                group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900
                ${className}
            `}
        >
            {icon && <span className="mr-3 text-gray-400 group-hover:text-gray-500">{icon}</span>}
            {children}
        </button>
    );
}
