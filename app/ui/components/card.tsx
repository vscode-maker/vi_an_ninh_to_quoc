import React from 'react';

interface CardProps {
    title?: React.ReactNode;
    extra?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    bodyStyle?: React.CSSProperties;
    actions?: React.ReactNode[];
}

export function Card({ title, extra, children, className = '', bodyStyle, actions }: CardProps) {
    return (
        <div className={`bg-white text-slate-800 rounded-xl border border-slate-200 shadow-md overflow-hidden ${className}`}>
            {(title || extra) && (
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    {title && <h3 className="text-lg font-semibold tracking-wide text-slate-900">{title}</h3>}
                    {extra && <div className="text-sm text-slate-500">{extra}</div>}
                </div>
            )}
            <div className="p-6" style={bodyStyle}>
                {children}
            </div>
            {actions && actions.length > 0 && (
                <div className="bg-slate-50 border-t border-slate-200 grid grid-flow-col divide-x divide-slate-200">
                    {actions.map((action, index) => (
                        <div key={index} className="p-3 flex items-center justify-center text-slate-500 hover:text-blue-900 hover:bg-slate-100 transition-colors cursor-pointer">
                            {action}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
