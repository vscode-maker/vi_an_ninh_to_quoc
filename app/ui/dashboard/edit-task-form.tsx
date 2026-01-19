'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import {
    Upload as UploadIcon, Plus, X, User, Banknote, Smartphone,
    MessageCircle, FileText, Search, Paperclip, Link as LinkIcon,
    Trash2, Clock, Check, AlertTriangle, MoreHorizontal
} from 'lucide-react';
import { updateTask, getExecutionUnits, getZaloGroups, getTaskAttachments, deleteTask } from '@/lib/task-actions';
import { Task } from '@prisma/client';
import dayjs from 'dayjs';

import { Button } from '@/app/ui/components/button';
import { Input } from '@/app/ui/components/input';
import { TextArea } from '@/app/ui/components/textarea';
import { Select } from '@/app/ui/components/select';
import { FileUpload } from '@/app/ui/components/file-upload';
import { Card } from '@/app/ui/components/card';

const NoteModal = React.lazy(() => import('./note-modal'));

interface EditTaskFormProps {
    task: Task;
    onSuccess: () => void;
    onTaskUpdate: (task: Task) => void;
    readOnly?: boolean;
}

const EditTaskForm = React.memo(function EditTaskForm({ task, onSuccess, onTaskUpdate, readOnly = false }: EditTaskFormProps) {
    const [loading, setLoading] = useState(false);
    const [executionUnits, setExecutionUnits] = useState<string[]>([]);
    const [zaloGroups, setZaloGroups] = useState<{ groupId: string; name: string }[]>([]);
    const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [addingNote, setAddingNote] = useState(false);

    // Initial Values
    const initialValues = useMemo(() => {
        let relatedPeople = [];
        if (task.moreInfo) {
            if (Array.isArray(task.moreInfo)) {
                relatedPeople = task.moreInfo;
            } else if (typeof task.moreInfo === 'string') {
                try {
                    relatedPeople = JSON.parse(task.moreInfo);
                } catch (e) { console.error("Error parsing moreInfo", e); }
            }
        }

        return {
            requestType: task.requestType || 'Sao kê',
            groupId: task.groupId || '',
            targetName: task.targetName || '',
            deadline: task.deadline ? dayjs(task.deadline).format('YYYY-MM-DDTHH:mm') : '',
            executionUnit: task.executionUnit ? (task.executionUnit.includes(',') ? task.executionUnit.split(', ') : [task.executionUnit]) : [],
            status: task.status || 'Chưa thực hiện',
            progressWarning: task.progressWarning || 'Bình thường',

            // Search Detail Fields (Assuming strict mapping or reusing fields)
            accountNumber: task.accountNumber || '',
            bankName: task.bankName || '',
            accountName: task.accountName || '',
            phoneNumber: task.phoneNumber || '',
            carrier: task.carrier || '',
            qrCode: task.qrCode || '',
            socialAccountName: task.socialAccountName || '',
            documentInfo: task.documentInfo || '',
            content: task.content || '',

            relatedPeople: relatedPeople
        };
    }, [task]);

    const [formData, setFormData] = useState(initialValues);
    const [relatedPeople, setRelatedPeople] = useState<any[]>(initialValues.relatedPeople);

    useEffect(() => {
        setFormData(initialValues);
        setRelatedPeople(initialValues.relatedPeople);
    }, [initialValues]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [units, groups, attachments] = await Promise.all([
                    getExecutionUnits(),
                    getZaloGroups(),
                    getTaskAttachments(task.id)
                ]);
                setExecutionUnits(units);
                setZaloGroups(groups);
                setExistingAttachments(attachments);
            } catch (error) {
                console.error("Failed to fetch form data", error);
            }
        };
        fetchData();
    }, [task.id]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const data = new FormData();

            // Append basic fields based on formData
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'executionUnit' && Array.isArray(value)) {
                    // Join array to string for backend
                    if (value.length > 0) data.append(key, value.join(', '));
                } else if (key === 'deadline' && value) {
                    data.append(key, new Date(value as string).toISOString());
                } else if (key === 'relatedPeople') {
                    // Skip, handled below
                } else if (value !== null && value !== undefined) {
                    data.append(key, value as string);
                }
            });

            if (relatedPeople.length > 0) {
                data.append('moreInfo', JSON.stringify(relatedPeople));
            }

            // Append Files
            files.forEach((file) => {
                data.append('files', file);
            });

            const result = await updateTask(task.id, data);
            if (result.success) {
                alert(result.message);

                const updatedTask = {
                    ...task,
                    ...formData,
                    executionUnit: Array.isArray(formData.executionUnit) ? formData.executionUnit.join(', ') : formData.executionUnit,
                    deadline: formData.deadline ? new Date(formData.deadline) : null,
                    moreInfo: relatedPeople
                };
                onTaskUpdate(updatedTask);
                onSuccess();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra khi cập nhật');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Bạn có chắc chắn muốn xóa công việc này không? Hành động này không thể hoàn tác.')) return;

        try {
            const result = await deleteTask(task.id);
            if (result.success) {
                alert(result.message);
                onSuccess();
                window.location.reload();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi khi xóa công việc');
        }
    };

    // Related People Helpers
    const addPerson = () => {
        setRelatedPeople([...relatedPeople, {
            ho_ten: '', so_dien_thoai: '', ngay_sinh: '', gioi_tinh: '',
            cccd_cmnd: '', ho_khau_thuong_tru: '', cho_o_hien_nay: '', link_facebook: ''
        }]);
    };

    const removePerson = (index: number) => {
        const newPeople = [...relatedPeople];
        newPeople.splice(index, 1);
        setRelatedPeople(newPeople);
    };

    const updatePerson = (index: number, field: string, value: string) => {
        const newPeople = [...relatedPeople];
        newPeople[index] = { ...newPeople[index], [field]: value };
        setRelatedPeople(newPeople);
    };

    // Options
    const requestTypeOptions = [
        // Flattened list for simplicity or structured if Custom Select supports groups (it supports flat mostly)
        { label: 'Sao kê', value: 'Sao kê' },
        { label: 'Cung cấp thông tin', value: 'Cung cấp thông tin' },
        { label: 'Cung cấp IP', value: 'Cung cấp IP' },
        { label: 'Cung cấp hình ảnh', value: 'Cung cấp hình ảnh' },
        { label: 'Rút list', value: 'Rút list' },
        { label: 'Quét Imei', value: 'Quét Imei' },
        { label: 'Giám sát', value: 'Giám sát' },
        { label: 'Định vị', value: 'Định vị' },
        { label: 'Cung cấp thông tin Zalo', value: 'Cung cấp thông tin Zalo' },
        { label: 'Cung cấp IP Zalo', value: 'Cung cấp IP Zalo' },
        { label: 'Công văn', value: 'Công văn' },
        { label: 'Uỷ thác điều tra', value: 'Uỷ thác điều tra' },
        { label: 'Xác minh phương tiện', value: 'Xác minh phương tiện' },
        { label: 'Xác minh đối tượng', value: 'Xác minh đối tượng' },
        { label: 'Vẽ sơ đồ đường dây', value: 'Vẽ sơ đồ đường dây' },
        { label: 'Khác', value: 'Khác' }
    ];

    const groupOptions = zaloGroups.map(g => ({ label: g.name, value: g.groupId }));
    const executionUnitOptions = executionUnits.map(u => ({ label: u, value: u }));
    const statusOptions = [
        { label: 'Chưa thực hiện', value: 'Chưa thực hiện' },
        { label: 'Đang thực hiện', value: 'Đang thực hiện' },
        { label: 'Hoàn thành', value: 'Hoàn thành' },
        { label: 'Chờ kết quả', value: 'Chờ kết quả' }
    ];
    const progressWarningOptions = [
        { label: 'Bình thường', value: 'Bình thường' },
        { label: 'Cảnh báo', value: 'Cảnh báo' },
        { label: 'Khẩn cấp', value: 'Khẩn cấp' }
    ];

    return (
        <div className="space-y-6 max-h-[80vh] overflow-y-auto p-1 text-sm">
            {/* 1. Loại Yêu Cầu */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative pl-10">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500 rounded-l-lg"></div>
                <div className="absolute left-3 top-4 text-green-600 font-bold bg-green-50 rounded-full w-6 h-6 flex items-center justify-center text-xs border border-green-200">1</div>

                <h3 className="font-semibold text-gray-800 mb-3 ml-1">Loại Yêu Cầu</h3>
                <Select
                    label="Chọn loại yêu cầu"
                    options={requestTypeOptions}
                    value={formData.requestType}
                    onChange={(e) => handleChange('requestType', e.target.value)}
                    disabled={readOnly}
                />
            </div>

            {/* 2. Thông Tin Chung */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative pl-10">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-lg"></div>
                <div className="absolute left-3 top-4 text-blue-600 font-bold bg-blue-50 rounded-full w-6 h-6 flex items-center justify-center text-xs border border-blue-200">2</div>

                <h3 className="font-semibold text-gray-800 mb-3 ml-1">Thông Tin Chung</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Nhóm *"
                        options={groupOptions}
                        value={formData.groupId}
                        onChange={(e) => handleChange('groupId', e.target.value)}
                        disabled={readOnly}
                    />
                    <Input
                        label="Họ Tên Đối Tượng *"
                        value={formData.targetName}
                        onChange={(e) => handleChange('targetName', e.target.value)}
                        disabled={readOnly}
                    />
                    <Input
                        label="Thời Hạn"
                        type="datetime-local"
                        value={formData.deadline}
                        onChange={(e) => handleChange('deadline', e.target.value)}
                        disabled={readOnly}
                    />
                    <Select
                        label="Đơn vị Thực Hiện"
                        options={executionUnitOptions}
                        value={formData.executionUnit[0] || ''}
                        onChange={(e) => handleChange('executionUnit', [e.target.value])}
                        disabled={readOnly}
                    />
                </div>
            </div>

            {/* 3. Chi Tiết Yêu Cầu */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative pl-10">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-500 rounded-l-lg"></div>
                <div className="absolute left-3 top-4 text-purple-600 font-bold bg-purple-50 rounded-full w-6 h-6 flex items-center justify-center text-xs border border-purple-200">3</div>

                <h3 className="font-semibold text-gray-800 mb-3 ml-1">Chi Tiết Yêu Cầu</h3>

                {['Sao kê', 'Cung cấp thông tin', 'Cung cấp IP', 'Cung cấp hình ảnh', 'Ngân hàng'].includes(formData.requestType) && (
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2"><Banknote size={14} /> Thông tin ngân hàng:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Input label="Số tài khoản" value={formData.accountNumber} onChange={(e) => handleChange('accountNumber', e.target.value)} disabled={readOnly} />
                            <Input label="Ngân hàng" value={formData.bankName} onChange={(e) => handleChange('bankName', e.target.value)} disabled={readOnly} />
                            <Input label="Tên chủ TK" value={formData.accountName} onChange={(e) => handleChange('accountName', e.target.value)} disabled={readOnly} />
                        </div>
                    </div>
                )}

                {['Rút list', 'Định vị', 'Quét Imei', 'Giám sát', 'Xác minh số điện thoại'].includes(formData.requestType) && (
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2"><Smartphone size={14} /> Thông tin thuê bao:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input label="Số điện thoại" value={formData.phoneNumber} onChange={(e) => handleChange('phoneNumber', e.target.value)} disabled={readOnly} />
                            <Input label="Nhà mạng" value={formData.carrier} onChange={(e) => handleChange('carrier', e.target.value)} disabled={readOnly} />
                        </div>
                    </div>
                )}

                {['Cung cấp thông tin Zalo', 'Cung cấp IP Zalo', 'Zalo'].includes(formData.requestType) && (
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2"><MessageCircle size={14} /> Thông tin Zalo:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <Input label="Số điện thoại Zalo" value={formData.phoneNumber} onChange={(e) => handleChange('phoneNumber', e.target.value)} disabled={readOnly} />
                            <Input label="Nhà mạng" value={formData.carrier} onChange={(e) => handleChange('carrier', e.target.value)} disabled={readOnly} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input label="Mã QR/ID Zalo" value={formData.qrCode} onChange={(e) => handleChange('qrCode', e.target.value)} disabled={readOnly} />
                            <Input label="Tên tài khoản MXH" value={formData.socialAccountName} onChange={(e) => handleChange('socialAccountName', e.target.value)} disabled={readOnly} />
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
                            disabled={readOnly}
                        />
                    </div>
                )}
            </div>

            {/* 4. Nội Dung & Đính Kèm */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative pl-10">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500 rounded-l-lg"></div>
                <div className="absolute left-3 top-4 text-orange-600 font-bold bg-orange-50 rounded-full w-6 h-6 flex items-center justify-center text-xs border border-orange-200">4</div>

                <h3 className="font-semibold text-gray-800 mb-3 ml-1">Nội Dung & File</h3>
                <div className="space-y-4">
                    <TextArea
                        label="Nội dung chi tiết"
                        value={formData.content}
                        onChange={(e) => handleChange('content', e.target.value)}
                        rows={4}
                        disabled={readOnly}
                    />

                    <Select
                        label="Cảnh báo tiến độ"
                        options={progressWarningOptions}
                        value={formData.progressWarning}
                        onChange={(e) => handleChange('progressWarning', e.target.value)}
                        disabled={readOnly}
                    />

                    {!readOnly && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Thêm file đính kèm</label>
                            <FileUpload
                                value={files}
                                onChange={setFiles}
                                multiple
                                maxSizeInMB={20}
                            />
                        </div>
                    )}

                    {existingAttachments.length > 0 && (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
                                <Paperclip size={12} /> Tệp đính kèm đã lưu ({existingAttachments.length})
                            </h4>
                            <div className="space-y-2">
                                {existingAttachments.map((file) => (
                                    <div key={file.fileId} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded shadow-sm">
                                        <a
                                            href={file.fileLink || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm font-medium truncate"
                                        >
                                            <LinkIcon size={14} />
                                            {file.fileName || 'Không tên'}
                                        </a>
                                        <span className="text-xs text-gray-400">
                                            {file.updatedAt ? dayjs(file.updatedAt).format('DD/MM/YYYY') : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Check for Related People */}
                    <div className="pt-4 border-t border-gray-100">
                        <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <User size={16} /> Thông tin đối tượng liên quan (Optional)
                        </h4>

                        <div className="space-y-4">
                            {relatedPeople.map((person, index) => (
                                <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200 relative">
                                    {!readOnly && (
                                        <button
                                            onClick={() => removePerson(index)}
                                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Input label="Họ tên" value={person.ho_ten} onChange={(e) => updatePerson(index, 'ho_ten', e.target.value)} disabled={readOnly} placeholder="Họ tên" />
                                        <Input label="SĐT" value={person.so_dien_thoai} onChange={(e) => updatePerson(index, 'so_dien_thoai', e.target.value)} disabled={readOnly} placeholder="SĐT" />
                                        <Input label="Ngày sinh" value={person.ngay_sinh} onChange={(e) => updatePerson(index, 'ngay_sinh', e.target.value)} disabled={readOnly} placeholder="DD/MM/YYYY" />
                                        <Input label="CCCD" value={person.cccd_cmnd} onChange={(e) => updatePerson(index, 'cccd_cmnd', e.target.value)} disabled={readOnly} placeholder="CCCD" />
                                        <Input label="HKTT" value={person.ho_khau_thuong_tru} onChange={(e) => updatePerson(index, 'ho_khau_thuong_tru', e.target.value)} disabled={readOnly} className="md:col-span-2" placeholder="Hộ khẩu" />
                                        <Input label="Link FB" value={person.link_facebook} onChange={(e) => updatePerson(index, 'link_facebook', e.target.value)} disabled={readOnly} className="md:col-span-2" placeholder="Facebook Link" />
                                    </div>
                                </div>
                            ))}
                            {!readOnly && (
                                <Button variant="outline" onClick={addPerson} className="w-full border-dashed" icon={<Plus size={16} />}>
                                    Thêm đối tượng
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* History/Notes Button */}
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100 flex justify-between items-center">
                        <div className="text-blue-800 font-medium flex items-center gap-2">
                            <Clock size={16} />
                            Lịch sử hoạt động / Ghi chú
                            <span className="bg-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                                {task.notes && Array.isArray(task.notes) ? task.notes.length : 0}
                            </span>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setAddingNote(true)}
                            icon={<FileText size={14} />}
                        >
                            Xem & Thêm Ghi Chú
                        </Button>
                    </div>

                </div>
            </div>

            {/* 5. Trạng Thái */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative pl-10">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-500 rounded-l-lg"></div>
                <div className="absolute left-3 top-4 text-teal-600 font-bold bg-teal-50 rounded-full w-6 h-6 flex items-center justify-center text-xs border border-teal-200">5</div>

                <h3 className="font-semibold text-gray-800 mb-3 ml-1">Trạng Thái</h3>
                <Select
                    label="Trạng Thái hiện tại"
                    options={statusOptions}
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    disabled={readOnly}
                />
            </div>

            {/* Note Modal */}
            <Suspense fallback={null}>
                {addingNote && (
                    <NoteModal
                        visible={addingNote}
                        onCancel={() => setAddingNote(false)}
                        task={task}
                        onTaskUpdate={onTaskUpdate}
                    />
                )}
            </Suspense>

            {/* Footer Actions */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                {!readOnly && (
                    <Button
                        variant="danger"
                        onClick={handleDelete}
                        icon={<Trash2 size={16} />}
                    >
                        Xóa
                    </Button>
                )}

                <div className="flex gap-2 ml-auto">
                    <Button variant="ghost" onClick={onSuccess}>
                        {readOnly ? 'Đóng' : 'Hủy'}
                    </Button>
                    {!readOnly && (
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            loading={loading}
                            icon={<Check size={16} />}
                        >
                            Lưu Thay Đổi
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
});

export default EditTaskForm;
