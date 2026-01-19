'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface FormContextType {
    values: any;
    errors: any;
    handleChange: (name: string, value: any) => void;
    register: (name: string) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const useFormContext = () => {
    const context = useContext(FormContext);
    if (!context) {
        throw new Error('useFormContext must be used within a FormProvider');
    }
    return context;
};

interface FormProps {
    form?: any;
    onFinish?: (values: any) => void;
    initialValues?: any;
    children: React.ReactNode;
    layout?: 'vertical' | 'horizontal';
    className?: string;
    [key: string]: any;
}

export const Form = ({ form, onFinish, initialValues = {}, children, className, ...props }: FormProps) => {
    // If form instance is passed (from useForm), use it. Otherwise use local state.
    // For simplicity in this migration, we'll assume the parent manages state or we use this local state.
    // But CreateCaseForm has "const [form] = Form.useForm();".
    // We need to support that pattern.

    // Actually, to fully replace Antd, we need our own useForm.
    return (
        <form
            className={className}
            onSubmit={(e) => {
                e.preventDefault();
                if (onFinish) onFinish(form ? form.getFieldsValue() : initialValues);
            }}
            {...props}
        >
            {children}
        </form>
    );
};

// Mocking useForm
export const useForm = () => {
    const [values, setValues] = useState<any>({});

    const formInstance = {
        getFieldsValue: () => values,
        setFieldsValue: (newValues: any) => setValues((prev: any) => ({ ...prev, ...newValues })),
        resetFields: () => setValues({}),
        submit: () => { /* trigger submit */ },
        getFieldValue: (name: string) => values[name],
    };

    return [formInstance];
};

Form.useForm = useForm;

// Form Item
export const FormItem = ({ name, label, children, rules, className, ...props }: any) => {
    // This is a visual wrapper in this simplified version.
    // Real validation would go here.
    return (
        <div className={`mb-4 ${className || ''}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {children}
            </div>
            {/* Error message slot */}
        </div>
    );
};

Form.Item = FormItem; // Attach Item to Form
Form.List = ({ name, children }: any) => {
    // Simplifying Form.List is hard. It uses Render Props.
    // For now, we might need to manually refactor Form.List usages.
    return <div className="p-4 border border-dashed rounded bg-gray-50">{children([], { add: () => { }, remove: () => { } })}</div>
}; 
