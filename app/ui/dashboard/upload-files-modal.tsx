'use client';

import React, { useState, useEffect } from 'react';
import { Upload as UploadIcon, User, Plus, Trash2, X } from 'lucide-react';
import type { Task } from '@prisma/client';
import dayjs from 'dayjs';
import { uploadTaskFiles } from '@/lib/task-actions';

import { Modal } from '@/app/ui/components/modal';
import { Button } from '@/app/ui/components/button';
import { Input } from '@/app/ui/components/input';
import { TextArea } from '@/app/ui/components/textarea';
import { Select } from '@/app/ui/components/select';
import { FileUpload } from '@/app/ui/components/file-upload';
import { Card } from '@/app/ui/components/card';

interface UploadFilesModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    task: Task | null;
}

interface RelatedPerson {
    ho_ten: string;
    cccd_cmnd: string;
    so_dien_thoai: string;
    ngay_sinh: string;
    phan_loai: string;
    ho_khau_thuong_tru: string;
}

const emptyPerson: RelatedPerson = {
    ho_ten: '',
    cccd_cmnd: '',
    so_dien_thoai: '',
    ngay_sinh: '',
    phan_loai: 'Người sử dụng',
    ho_khau_thuong_tru: ''
};

export function UploadFilesModal({ visible, onCancel, onSuccess, task }: UploadFilesModalProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [note, setNote] = useState('');
    const [relatedPeople, setRelatedPeople] = useState<RelatedPerson[]>([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (visible) {
            setFiles([]);
            setNote('');
            setRelatedPeople([]);
        }
    }, [visible]);

    const handleUpload = async () => {
        if (!task) return;

        if (files.length === 0) {
            alert('Vui lòng chọn file');
            return;
        }

        try {
            const formData = new FormData();

            // Add files
            files.forEach((file) => {
                formData.append('files', file);
            });

            // Add metadata
            formData.append('note', note);

            // Handle Related People
            if (relatedPeople.length > 0) {
                // Remove empty entries if name is missing
                const validPeople = relatedPeople.filter(p => p.ho_ten.trim() !== '');
                if (validPeople.length > 0) {
                    formData.append('moreInfo', JSON.stringify(validPeople));
                }
            }

            setUploading(true);
            const result = await uploadTaskFiles(task.id, formData);

            if (result.success) {
                alert(result.message);
                onSuccess();
                onCancel();
            } else {
                alert(result.message || 'Lỗi tải lên');
            }
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra hoặc thiếu thông tin');
        } finally {
            setUploading(false);
        }
    };

    const addPerson = () => {
        setRelatedPeople([...relatedPeople, { ...emptyPerson }]);
    };

    const updatePerson = (index: number, field: keyof RelatedPerson, value: string) => {
        const newPeople = [...relatedPeople];
        newPeople[index] = { ...newPeople[index], [field]: value };
        setRelatedPeople(newPeople);
    };

    const removePerson = (index: number) => {
        const newPeople = [...relatedPeople];
        newPeople.splice(index, 1);
        setRelatedPeople(newPeople);
    };

    const personTypeOptions = [
        { label: 'Người sử dụng', value: 'Người sử dụng' },
        { label: 'Người đăng ký', value: 'Người đăng ký' },
        { label: 'Khác', value: 'Khác' }
    ];

    return (
        <Modal
            isOpen={visible}
            onClose={onCancel}
            title={`Đính kèm file cho: ${task?.requesterName || 'Công việc'}`}
            width="800px"
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onCancel}>Hủy</Button>
                    <Button
                        variant="primary"
                        onClick={handleUpload}
                        loading={uploading}
                        icon={<UploadIcon size={16} />}
                    >
                        {uploading ? 'Đang tải lên...' : 'Tải lên ngay'}
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* File Upload Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <UploadIcon size={16} /> Chọn file:
                    </label>
                    <FileUpload
                        value={files}
                        onChange={setFiles}
                        multiple
                        accept="*"
                        maxSizeInMB={10}
                    />
                </div>

                {/* Note Section */}
                <TextArea
                    label="Ghi chú file"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Nhập ghi chú chung cho các file..."
                    rows={2}
                />

                {/* Related People Section */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <User size={16} /> Thông tin đối tượng liên quan (Tùy chọn)
                    </h3>

                    <div className="space-y-4">
                        {relatedPeople.map((person, index) => (
                            <div key={index} className="bg-white p-3 rounded shadow-sm border border-gray-100 relative">
                                <button
                                    onClick={() => removePerson(index)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                >
                                    <X size={16} />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Input
                                        label="Họ tên"
                                        value={person.ho_ten}
                                        onChange={(e) => updatePerson(index, 'ho_ten', e.target.value)}
                                        placeholder="Họ và tên"
                                    />
                                    <Input
                                        label="CCCD/CMND"
                                        value={person.cccd_cmnd}
                                        onChange={(e) => updatePerson(index, 'cccd_cmnd', e.target.value)}
                                        placeholder="Số giấy tờ"
                                    />
                                    <Input
                                        label="SĐT"
                                        value={person.so_dien_thoai}
                                        onChange={(e) => updatePerson(index, 'so_dien_thoai', e.target.value)}
                                        placeholder="Số điện thoại"
                                    />
                                    <Input
                                        label="Ngày sinh"
                                        type="date"
                                        value={person.ngay_sinh}
                                        onChange={(e) => updatePerson(index, 'ngay_sinh', e.target.value)}
                                    />
                                    <Select
                                        label="Phân loại"
                                        options={personTypeOptions}
                                        value={person.phan_loai}
                                        onChange={(e) => updatePerson(index, 'phan_loai', e.target.value)}
                                    />
                                    <Input
                                        label="HKTT"
                                        value={person.ho_khau_thuong_tru}
                                        onChange={(e) => updatePerson(index, 'ho_khau_thuong_tru', e.target.value)}
                                        placeholder="Hộ khẩu thường trú"
                                    />
                                </div>
                            </div>
                        ))}

                        <Button
                            variant="outline"
                            onClick={addPerson}
                            className="w-full border-dashed"
                            icon={<Plus size={16} />}
                        >
                            Thêm người liên quan
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
