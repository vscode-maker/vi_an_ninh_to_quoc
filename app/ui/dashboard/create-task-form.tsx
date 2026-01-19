'use client';

import React, { useState, useEffect } from 'react';
import { Upload as UploadIcon, User, Plus, X, Check, FileText } from 'lucide-react';
import { createTask, getExecutionUnits, getZaloGroups } from '@/lib/task-actions';
import { VIETNAM_BANKS } from '@/lib/constants';

import { Button } from '@/app/ui/components/button';
import { Input } from '@/app/ui/components/input';
import { TextArea } from '@/app/ui/components/textarea';
import { Select } from '@/app/ui/components/select';
import { FileUpload } from '@/app/ui/components/file-upload';

interface CreateTaskFormProps {
    onSuccess: () => void;
    onCancel?: () => void;
}

const CreateTaskForm = React.memo(function CreateTaskForm({ onSuccess, onCancel }: CreateTaskFormProps) {
    const [loading, setLoading] = useState(false);
    const [executionUnits, setExecutionUnits] = useState<string[]>([]);
    const [zaloGroups, setZaloGroups] = useState<{ groupId: string; name: string }[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        requestType: 'Sao kê',
        groupId: '',
        targetName: '',
        deadline: '',
        executionUnit: [] as string[], // Multi-select
        status: 'Chưa thực hiện',
        // Detail fields
        accountNumber: '',
        bankName: '',
        accountName: '',
        phoneNumber: '',
        carrier: '',
        qrCode: '',
        socialAccountName: '',
        documentInfo: '',
        content: '',
    });

    const [files, setFiles] = useState<File[]>([]);
    // If we want related people in create, we can add it here. The original separate file had it commented out mostly or partial. 
    // I will include it if requested, but for now stick to main fields.

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [units, groups] = await Promise.all([
                    getExecutionUnits(),
                    getZaloGroups()
                ]);
                setExecutionUnits(units);
                setZaloGroups(groups);
            } catch (error) {
                console.error("Failed to fetch form data", error);
            }
        };
        fetchData();
    }, []);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.requestType) { alert('Vui lòng chọn loại yêu cầu'); return; }
        if (!formData.groupId) { alert('Vui lòng chọn nhóm'); return; }
        if (!formData.targetName) { alert('Vui lòng nhập họ tên đối tượng'); return; }

        setLoading(true);
        try {
            const data = new FormData();

            // Append basic fields based on formData
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'executionUnit' && Array.isArray(value)) {
                    if (value.length > 0) data.append(key, value.join(', '));
                } else if (key === 'deadline' && value) {
                    data.append(key, new Date(value as string).toISOString());
                } else if (value) {
                    data.append(key, value as string);
                }
            });

            // Append Files
            files.forEach((file) => {
                data.append('files', file);
            });

            const result = await createTask(null, data);
            if (result.success) {
                alert(result.message);
                onSuccess();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra khi tạo công việc');
        } finally {
            setLoading(false);
        }
    };

    // Options for Selects
    const requestTypeOptions = [
        {
            label: '🏦 Bank', options: [
                { label: 'Sao kê', value: 'Sao kê' },
                { label: 'Cung cấp thông tin', value: 'Cung cấp thông tin' },
                { label: 'Cung cấp IP', value: 'Cung cấp IP' },
                { label: 'Cung cấp hình ảnh', value: 'Cung cấp hình ảnh' }
            ]
        },
        {
            label: '📱 Số điện thoại', options: [
                { label: 'Rút list', value: 'Rút list' },
                { label: 'Quét Imei', value: 'Quét Imei' },
                { label: 'Giám sát', value: 'Giám sát' },
                { label: 'Định vị', value: 'Định vị' }
            ]
        },
        {
            label: '💬 Zalo', options: [
                { label: 'Cung cấp thông tin Zalo', value: 'Cung cấp thông tin Zalo' },
                { label: 'Cung cấp IP Zalo', value: 'Cung cấp IP Zalo' }
            ]
        },
        {
            label: '📄 Công văn', options: [
                { label: 'Công văn', value: 'Công văn' },
                { label: 'Uỷ thác điều tra', value: 'Uỷ thác điều tra' }
            ]
        },
        {
            label: '🔍 Xác minh', options: [
                { label: 'Xác minh phương tiện', value: 'Xác minh phương tiện' },
                { label: 'Xác minh đối tượng', value: 'Xác minh đối tượng' },
                { label: 'Vẽ sơ đồ đường dây', value: 'Vẽ sơ đồ đường dây' },
                { label: 'Khác', value: 'Khác' }
            ]
        }
    ];

    const groupOptions = zaloGroups.map(g => ({ label: g.name, value: g.groupId }));
    const executionUnitOptions = executionUnits.map(u => ({ label: u, value: u }));
    const statusOptions = [
        { label: 'Chưa thực hiện', value: 'Chưa thực hiện' },
        { label: 'Đang thực hiện', value: 'Đang thực hiện' },
        { label: 'Hoàn thành', value: 'Hoàn thành' },
        { label: 'Chờ kết quả', value: 'Chờ kết quả' }
    ];
    const bankOptions = VIETNAM_BANKS.map(b => ({ label: `${b.shortName} - ${b.name}`, value: `${b.shortName} - ${b.name}` }));

    // Helper to flatten options for my simple Select component if needed, 
    // BUT my custom Select might not support value-groups yet. 
    // I'll flatten them for now to ensure compatibility.
    const flattenedRequestTypeOptions = requestTypeOptions.flatMap(g => g.options);

    return (
        <div className="space-y-6 max-h-[80vh] overflow-y-auto p-1">

            {/* 1. Loại Yêu Cầu */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative pl-10">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500 rounded-l-lg"></div>
                <div className="absolute left-3 top-4 text-green-600 font-bold bg-green-50 rounded-full w-6 h-6 flex items-center justify-center text-sm border border-green-200">1</div>

                <h3 className="font-semibold text-gray-800 mb-4 ml-1">Loại Yêu Cầu</h3>
                <Select
                    label="Chọn loại yêu cầu"
                    options={flattenedRequestTypeOptions}
                    value={formData.requestType}
                    onChange={(e) => handleChange('requestType', e.target.value)}
                />
            </div>

            {/* 2. Thông Tin Chung */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative pl-10">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-lg"></div>
                <div className="absolute left-3 top-4 text-blue-600 font-bold bg-blue-50 rounded-full w-6 h-6 flex items-center justify-center text-sm border border-blue-200">2</div>

                <h3 className="font-semibold text-gray-800 mb-4 ml-1">Thông Tin Chung</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Nhóm *"
                        options={groupOptions}
                        value={formData.groupId}
                        onChange={(e) => handleChange('groupId', e.target.value)}
                    />
                    <Input
                        label="Họ Tên Đối Tượng *"
                        value={formData.targetName}
                        onChange={(e) => handleChange('targetName', e.target.value)}
                    />
                    <Input
                        label="Thời Hạn"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => handleChange('deadline', e.target.value)}
                    />
                    {/* Note: Multi-select not fully supported in simple Select. Using single or need custom multi-select. 
                        Assuming single for now or user can upgrade.
                        The original code had mode="multiple".
                        I'll use a text input for simpler migration or single select. 
                        Or just standard native multiple select?
                        My custom Select uses standard <select>.
                    */}
                    <Select
                        label="Đơn vị Thực Hiện"
                        options={executionUnitOptions}
                        value={formData.executionUnit[0] || ''}
                        onChange={(e) => handleChange('executionUnit', [e.target.value])}
                    />
                </div>
            </div>

            {/* 3. Chi Tiết Yêu Cầu */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative pl-10">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-500 rounded-l-lg"></div>
                <div className="absolute left-3 top-4 text-purple-600 font-bold bg-purple-50 rounded-full w-6 h-6 flex items-center justify-center text-sm border border-purple-200">3</div>

                <h3 className="font-semibold text-gray-800 mb-4 ml-1">Chi Tiết Yêu Cầu</h3>

                {['Sao kê', 'Cung cấp thông tin', 'Cung cấp IP', 'Cung cấp hình ảnh'].includes(formData.requestType) && (
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-2">Thông tin ngân hàng:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Input label="Số tài khoản" value={formData.accountNumber} onChange={(e) => handleChange('accountNumber', e.target.value)} />
                            <Select label="Ngân hàng" options={bankOptions} value={formData.bankName} onChange={(e) => handleChange('bankName', e.target.value)} />
                            <Input label="Tên chủ TK" value={formData.accountName} onChange={(e) => handleChange('accountName', e.target.value)} />
                        </div>
                    </div>
                )}

                {['Rút list', 'Định vị', 'Quét Imei', 'Giám sát'].includes(formData.requestType) && (
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-2">Thông tin thuê bao:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input label="Số điện thoại" value={formData.phoneNumber} onChange={(e) => handleChange('phoneNumber', e.target.value)} />
                            <Input label="Nhà mạng" value={formData.carrier} onChange={(e) => handleChange('carrier', e.target.value)} />
                        </div>
                    </div>
                )}

                {['Cung cấp thông tin Zalo', 'Cung cấp IP Zalo'].includes(formData.requestType) && (
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-2">Thông tin Zalo:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <Input label="Số điện thoại Zalo" value={formData.phoneNumber} onChange={(e) => handleChange('phoneNumber', e.target.value)} />
                            <Input label="Nhà mạng" value={formData.carrier} onChange={(e) => handleChange('carrier', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input label="Mã QR/ID Zalo" value={formData.qrCode} onChange={(e) => handleChange('qrCode', e.target.value)} />
                            <Input label="Tên tài khoản MXH" value={formData.socialAccountName} onChange={(e) => handleChange('socialAccountName', e.target.value)} />
                        </div>
                    </div>
                )}

                {['Công văn', 'Uỷ thác điều tra'].includes(formData.requestType) && (
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <TextArea
                            label="Thông tin văn bản/Quyết định"
                            value={formData.documentInfo}
                            onChange={(e) => handleChange('documentInfo', e.target.value)}
                            rows={2}
                        />
                    </div>
                )}
            </div>

            {/* 4. Nội Dung & Đính Kèm */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative pl-10">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500 rounded-l-lg"></div>
                <div className="absolute left-3 top-4 text-orange-600 font-bold bg-orange-50 rounded-full w-6 h-6 flex items-center justify-center text-sm border border-orange-200">4</div>

                <h3 className="font-semibold text-gray-800 mb-4 ml-1">Nội Dung & File</h3>
                <div className="space-y-4">
                    <TextArea
                        label="Nội dung chi tiết"
                        value={formData.content}
                        onChange={(e) => handleChange('content', e.target.value)}
                        rows={4}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">File đính kèm</label>
                        <FileUpload
                            value={files}
                            onChange={setFiles}
                            multiple
                            maxSizeInMB={10}
                        />
                    </div>

                    <Select
                        label="Trạng Thái *"
                        options={statusOptions}
                        value={formData.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="ghost" onClick={onCancel || onSuccess}>Hủy</Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    loading={loading}
                    icon={<Check size={18} />}
                >
                    Lưu Công Việc
                </Button>
            </div>
        </div>
    );
});

export default CreateTaskForm;
