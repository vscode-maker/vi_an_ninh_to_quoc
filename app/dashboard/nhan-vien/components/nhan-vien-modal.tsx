
'use client';

import { useState, useEffect } from 'react';
import { createUser, updateUser } from '@/lib/user-actions';
import { Modal } from '@/app/ui/components/modal';
import { Button } from '@/app/ui/components/button';
import { Input } from '@/app/ui/components/input';
import { Save } from 'lucide-react';

export default function NhanVienModal({ open, onCancel, record }: any) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        let result;
        if (record) {
            result = await updateUser(record.id, formData);
        } else {
            result = await createUser(formData);
        }

        if (result.success) {
            alert(result.message);
            onCancel();
        } else {
            alert(result.message);
        }
        setLoading(false);
    };

    return (
        <Modal
            title={record ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
            isOpen={open}
            onClose={onCancel}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                    name="soHieu"
                    label="Số hiệu (ID)"
                    placeholder="VD: 123456"
                    title="Số hiệu (ID)"
                    required
                    defaultValue={record?.soHieu}
                    disabled={!!record}
                />
                <Input
                    name="fullName"
                    label="Họ và tên"
                    placeholder="Nhập họ tên"
                    title="Họ và tên"
                    required
                    defaultValue={record?.fullName}
                />
                <Input
                    type="password"
                    name="password"
                    label={record ? "Mật khẩu mới (Để trống nếu không đổi)" : "Mật khẩu"}
                    placeholder="Nhập mật khẩu"
                    title="Mật khẩu"
                    required={!record}
                />

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Vai trò</label>
                    <select
                        name="role"
                        className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue={record?.role || 'user'}
                    >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <Input
                    name="position"
                    label="Chức vụ"
                    placeholder="Chức vụ"
                    title="Chức vụ"
                    defaultValue={record?.position}
                />

                <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="ghost" onClick={onCancel}>Hủy</Button>
                    <Button type="submit" loading={loading} icon={<Save size={16} />}>
                        {record ? 'Cập nhật' : 'Lưu mới'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
