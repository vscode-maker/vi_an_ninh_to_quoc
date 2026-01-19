'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, useForm } from '@/app/ui/compat/antd-form-compat';
import { Tabs } from '@/app/ui/compat/tabs-compat';
import { Button } from '@/app/ui/components/button';
import { Save, RefreshCw, ArrowLeft } from 'lucide-react';

// Tab Components
import TabBasicInfo from '@/components/don-an/tabs/TabBasicInfo';
import TabLocation from '@/components/don-an/tabs/TabLocation';
import TabLawSelector from '@/components/don-an/tabs/TabLawSelector';
import TabParticipants from '@/components/don-an/tabs/TabParticipants';
import TabDamage from '@/components/don-an/tabs/TabDamage';
import TabEvidence from '@/components/don-an/tabs/TabEvidence';
import TabAssignment from '@/components/don-an/tabs/TabAssignment';
import TabInvestigation from '@/components/don-an/tabs/TabInvestigation';
import TabAttachments from '@/components/don-an/tabs/TabAttachments';

import { createDonAn } from '@/lib/actions/don-an-actions-new';

const CreateCaseForm: React.FC = () => {
    const router = useRouter();
    const [form] = useForm();
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        form.setFieldsValue({
            ngay_xay_ra: today,
            ngay_tiep_nhan: today
        });
        setMounted(true);
    }, []);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            console.log('Submitting values:', values);
            const result = await createDonAn(values);

            if (result.success) {
                alert('Tạo hồ sơ thành công!');
                router.push('/dashboard/don-an');
            } else {
                alert('Lỗi khi lưu: ' + result.error);
            }
        } catch (error) {
            console.error('Submission failed:', error);
            alert('Có lỗi xảy ra khi gửi đơn.');
        } finally {
            setLoading(false);
        }
    };

    const tabsItems = [
        {
            key: 'basic',
            label: <span className="flex items-center gap-2 text-sm">Thông tin</span>,
            children: <TabBasicInfo form={form} />,
        },
        {
            key: 'location',
            label: <span className="flex items-center gap-2 text-sm">Địa điểm</span>,
            children: <TabLocation form={form} />,
        },
        // Keeping other tabs for layout, but note they still use Antd internal components
        {
            key: 'law',
            label: <span className="flex items-center gap-2 text-sm">Tội danh</span>,
            children: <TabLawSelector form={form} />,
        },
        {
            key: 'participants',
            label: <span className="flex items-center gap-2 text-sm">Đối tượng</span>,
            children: <TabParticipants form={form} />,
        },
        {
            key: 'damage',
            label: <span className="flex items-center gap-2 text-sm">Thiệt hại</span>,
            children: <TabDamage form={form} />,
        },
        {
            key: 'evidence',
            label: <span className="flex items-center gap-2 text-sm">Vật chứng</span>,
            children: <TabEvidence form={form} />,
        },
        {
            key: 'assignment',
            label: <span className="flex items-center gap-2 text-sm">Phân công</span>,
            children: <TabAssignment form={form} />,
        },
        {
            key: 'investigation',
            label: <span className="flex items-center gap-2 text-sm">Điều tra</span>,
            children: <TabInvestigation form={form} />,
        },
        {
            key: 'attachments',
            label: <span className="flex items-center gap-2 text-sm">Đính kèm</span>,
            children: <TabAttachments form={form} />,
        },
    ];

    if (!mounted) return <div className="p-8 text-center text-slate-400">Đang tải...</div>;

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/don-an">
                        <Button variant="ghost" icon={<ArrowLeft size={16} />} className="text-slate-500" />
                    </Link>
                    <h1 className="text-base font-semibold text-slate-800 m-0">Tạo hồ sơ mới</h1>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        icon={<RefreshCw size={16} />}
                        onClick={() => form.resetFields()}
                    >
                        Làm mới
                    </Button>
                    <Button
                        variant="primary"
                        icon={<Save size={16} />}
                        loading={loading}
                        onClick={() => form.submit()}
                    >
                        Lưu
                    </Button>
                </div>
            </div>

            {/* Main Form Content */}
            <div className="p-4 md:p-6 max-w-5xl mx-auto">
                <Form
                    form={form}
                    onFinish={onFinish}
                    initialValues={{
                        phan_loai: 'vu_viec',
                        nguoi_tao: 'admin',
                        tinh_thanh: 'Tỉnh Nghệ An'
                    }}
                    className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                    <Tabs
                        defaultActiveKey="basic"
                        items={tabsItems}
                        className="w-full"
                    />
                </Form>
            </div>
        </div>
    );
};

export default CreateCaseForm;
