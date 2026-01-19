'use client';

import { useState, useMemo, useEffect } from 'react';
import { updateUserPermissions, createPermissionDefinition, deletePermissionDefinition, copyUserPermissions } from '@/lib/permission-actions';
import { Button } from '@/app/ui/components/button';
import { Input } from '@/app/ui/components/input';
import { Tag } from '@/app/ui/components/tag';
import { Search, Shield, Save, Copy, Check, X, User, Lock, Plus, Trash2, Edit2, Settings } from 'lucide-react';
import { Modal } from '@/app/ui/components/modal';

// Define types for better safety
interface Permission {
    code: string;
    name: string;
    group: string;
}

interface User {
    id: string;
    fullName: string;
    soHieu: string;
    role: string;
    permissions: string[];
}

export default function PhanQuyenTable({ initialUsers, availablePermissions }: { initialUsers: User[], availablePermissions: Permission[] }) {
    // State
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [permissions, setPermissions] = useState<Permission[]>(availablePermissions);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUsers.length > 0 ? initialUsers[0].id : null);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [tempPermissions, setTempPermissions] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    // Modal States
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [newPerm, setNewPerm] = useState({ code: '', name: '', group: '' });
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [targetUserIds, setTargetUserIds] = useState<string[]>([]);

    // Derived State
    const selectedUser = useMemo(() => users.find(u => u.id === selectedUserId), [users, selectedUserId]);

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        const lowerQ = searchQuery.toLowerCase();
        return users.filter(u =>
            u.fullName.toLowerCase().includes(lowerQ) ||
            u.soHieu?.toLowerCase().includes(lowerQ)
        );
    }, [users, searchQuery]);

    const groupedPermissions = useMemo(() => {
        const groups: { [key: string]: Permission[] } = {};
        permissions.forEach(perm => {
            const groupName = perm.group || 'Khác';
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(perm);
        });
        return groups;
    }, [permissions]);

    // Effects
    useEffect(() => {
        if (selectedUser) {
            setTempPermissions(new Set(selectedUser.permissions || []));
            setIsEditing(false);
        }
    }, [selectedUser]);

    // Handlers
    const handleTogglePermission = (code: string) => {
        if (!isEditing) return;
        const newSet = new Set(tempPermissions);
        if (newSet.has(code)) {
            newSet.delete(code);
        } else {
            newSet.add(code);
        }
        setTempPermissions(newSet);
    };

    const handleToggleGroup = (groupPerms: Permission[]) => {
        if (!isEditing) return;
        const allCodes = groupPerms.map(p => p.code);
        const allSelected = allCodes.every(c => tempPermissions.has(c));

        const newSet = new Set(tempPermissions);
        if (allSelected) {
            // Deselect all
            allCodes.forEach(c => newSet.delete(c));
        } else {
            // Select all
            allCodes.forEach(c => newSet.add(c));
        }
        setTempPermissions(newSet);
    };

    const handleSavePermissions = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            const result = await updateUserPermissions(selectedUser.id, Array.from(tempPermissions));
            if (result.success) {
                // Update local state
                setUsers(users.map(u =>
                    u.id === selectedUser.id
                        ? { ...u, permissions: Array.from(tempPermissions) }
                        : u
                ));
                setIsEditing(false);
                // Optional: Show toast success
            } else {
                alert('Lỗi: ' + result.message);
            }
        } catch (error) {
            alert('Có lỗi xảy ra khi lưu quyền');
        } finally {
            setLoading(false);
        }
    };

    // Permission Management Handlers
    const handleAddPermission = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('code', newPerm.code);
        formData.append('name', newPerm.name);
        formData.append('group', newPerm.group);

        const result = await createPermissionDefinition(formData);
        if (result.success) {
            setPermissions([...permissions, newPerm]);
            setNewPerm({ code: '', name: '', group: '' });
        } else {
            alert(result.message);
        }
    };

    const handleDeletePermission = async (code: string) => {
        if (!confirm('Xóa quyền này?')) return;
        const result = await deletePermissionDefinition(code);
        if (result.success) {
            setPermissions(permissions.filter(p => p.code !== code));
        } else {
            alert(result.message);
        }
    };

    // Copy Handlers
    const handleCopyPermissions = async () => {
        if (!selectedUser || targetUserIds.length === 0) return;
        setLoading(true);
        const result = await copyUserPermissions(selectedUser.id, targetUserIds);
        if (result.success) {
            const sourcePerms = selectedUser.permissions;
            setUsers(users.map(u => targetUserIds.includes(u.id) ? { ...u, permissions: sourcePerms } : u));
            setIsCopyModalOpen(false);
            alert('Sao chép thành công!');
        } else {
            alert(result.message);
        }
        setLoading(false);
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
            {/* LEFT COLUMN: User List */}
            <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <User size={18} className="text-blue-600" />
                        Danh sách Cán bộ
                    </h3>
                    <Button variant="ghost" size="sm" icon={<Settings size={16} />} onClick={() => setIsManageModalOpen(true)} title="Quản lý mã quyền" />
                </div>

                <div className="p-3 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            placeholder="Tìm theo tên hoặc số hiệu..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredUsers.map(user => {
                        const isActive = user.id === selectedUserId;
                        const isAdmin = user.role?.toLowerCase() === 'admin';
                        return (
                            <div
                                key={user.id}
                                onClick={() => setSelectedUserId(user.id)}
                                className={`
                                    group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border
                                    ${isActive
                                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                                        : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-100'
                                    }
                                `}
                            >
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                                    ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}
                                `}>
                                    {user.fullName.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-medium truncate ${isActive ? 'text-blue-900' : 'text-slate-700'}`}>
                                        {user.fullName}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span>{user.soHieu}</span>
                                        {isAdmin && <span className="text-amber-600 font-medium flex items-center gap-0.5"><Lock size={10} /> Admin</span>}
                                    </div>
                                </div>
                                {!isAdmin && (
                                    <div className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                                        {user.permissions?.length || 0}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {filteredUsers.length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            Không tìm thấy kết quả
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: Permission Matrix */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {!selectedUser ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <Shield size={64} className="mb-4 opacity-20" />
                        <p>Chọn một cán bộ từ danh sách để phân quyền</p>
                    </div>
                ) : (
                    <>
                        {/* Detail Header */}
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10 backdrop-blur-sm">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    {selectedUser.fullName}
                                    {selectedUser.role?.toLowerCase() === 'admin' && (
                                        <Tag color="red">Quản trị viên hệ thống</Tag>
                                    )}
                                </h2>
                                <p className="text-sm text-slate-500 mt-1 flex items-center gap-4">
                                    <span>Số hiệu: {selectedUser.soHieu}</span>
                                    <span>•</span>
                                    <span>{selectedUser.permissions?.length || 0} quyền được cấp</span>
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {selectedUser.role?.toLowerCase() === 'admin' ? (
                                    <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-200 flex items-center gap-2">
                                        <Lock size={16} />
                                        <span>Tài khoản Admin có toàn quyền truy cập</span>
                                    </div>
                                ) : (
                                    <>
                                        {!isEditing ? (
                                            <>
                                                <Button variant="outline" size="sm" icon={<Copy size={16} />} onClick={() => setIsCopyModalOpen(true)}>
                                                    Sao chép
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    className="bg-blue-900 border-blue-900"
                                                    size="sm"
                                                    icon={<Edit2 size={16} />}
                                                    onClick={() => setIsEditing(true)}
                                                >
                                                    Chỉnh sửa quyền
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button variant="ghost" size="sm" icon={<X size={16} />} onClick={() => setIsEditing(false)}>
                                                    Hủy bỏ
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    className="bg-green-600 hover:bg-green-700 border-green-600"
                                                    size="sm"
                                                    icon={<Save size={16} />}
                                                    loading={loading}
                                                    onClick={handleSavePermissions}
                                                >
                                                    Lưu thay đổi
                                                </Button>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Matrix Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                            {selectedUser.role?.toLowerCase() === 'admin' ? (
                                <div className="text-center py-20">
                                    <Shield size={64} className="mx-auto mb-4 text-amber-500 opacity-50" />
                                    <h3 className="text-lg font-medium text-slate-800">Toàn quyền hệ thống</h3>
                                    <p className="text-slate-500 max-w-md mx-auto mt-2">
                                        Tài khoản này có vai trò Admin và không bị giới hạn bởi các quyền cụ thể.
                                        Để giới hạn quyền, vui lòng đổi vai trò sang User.
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <table className="w-full text-sm text-center">
                                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-3 text-left w-1/6">Phân hệ</th>
                                                <th className="px-2 py-3 w-1/6">Xem</th>
                                                <th className="px-2 py-3 w-1/6">Thêm</th>
                                                <th className="px-2 py-3 w-1/6">Sửa</th>
                                                <th className="px-2 py-3 w-1/6">Xóa</th>
                                                <th className="px-4 py-3 text-right w-1/6">Khác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {Object.entries(groupedPermissions).map(([group, perms]) => {
                                                // Categorize permissions
                                                const viewPerms = perms.filter(p => p.code.startsWith('VIEW_'));
                                                const addPerms = perms.filter(p => p.code.startsWith('ADD_') || p.code.startsWith('CREATE_'));
                                                const editPerms = perms.filter(p => p.code.startsWith('EDIT_') || p.code.startsWith('UPDATE_'));
                                                const deletePerms = perms.filter(p => p.code.startsWith('DELETE_') || p.code.startsWith('REMOVE_'));
                                                const otherPerms = perms.filter(p =>
                                                    !p.code.startsWith('VIEW_') &&
                                                    !p.code.startsWith('ADD_') && !p.code.startsWith('CREATE_') &&
                                                    !p.code.startsWith('EDIT_') && !p.code.startsWith('UPDATE_') &&
                                                    !p.code.startsWith('DELETE_') && !p.code.startsWith('REMOVE_')
                                                );

                                                const renderCheckbox = (perm: Permission) => {
                                                    const activeSource = isEditing ? tempPermissions : new Set(selectedUser.permissions);
                                                    const isActive = activeSource.has(perm.code);

                                                    return (
                                                        <div
                                                            key={perm.code}
                                                            className={`flex flex-col items-center justify-center gap-1 ${isEditing ? 'cursor-pointer hover:opacity-80' : ''}`}
                                                            onClick={() => isEditing && handleTogglePermission(perm.code)}
                                                            title={perm.name}
                                                        >
                                                            <div className={`
                                                                w-5 h-5 rounded border flex items-center justify-center transition-colors
                                                                ${isActive
                                                                    ? 'bg-blue-600 border-blue-600'
                                                                    : 'bg-white border-slate-300'
                                                                }
                                                            `}>
                                                                {isActive && <Check size={12} className="text-white" />}
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 font-mono hidden xl:block">{perm.code.split('_')[0]}</span>
                                                        </div>
                                                    );
                                                };

                                                const renderCell = (cellPerms: Permission[]) => (
                                                    <div className="flex flex-wrap justify-center gap-2 min-h-[24px]">
                                                        {cellPerms.map(renderCheckbox)}
                                                    </div>
                                                );

                                                return (
                                                    <tr key={group} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-4 text-left font-bold text-slate-700">
                                                            {group}
                                                        </td>
                                                        <td className="px-2 py-4 align-top">
                                                            {renderCell(viewPerms)}
                                                        </td>
                                                        <td className="px-2 py-4 align-top">
                                                            {renderCell(addPerms)}
                                                        </td>
                                                        <td className="px-2 py-4 align-top">
                                                            {renderCell(editPerms)}
                                                        </td>
                                                        <td className="px-2 py-4 align-top">
                                                            {renderCell(deletePerms)}
                                                        </td>
                                                        <td className="px-4 py-4 align-top text-right">
                                                            {renderCell(otherPerms)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* --- Modals managed here --- */}

            {/* Manage Definitions Modal */}
            <Modal
                title="Quản lý danh sách quyền"
                isOpen={isManageModalOpen}
                onClose={() => setIsManageModalOpen(false)}
                width={700}
            >
                <div className="space-y-6">
                    <form onSubmit={handleAddPermission} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="text-sm font-bold text-slate-700 mb-3">Thêm quyền mới</h4>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                            <Input
                                placeholder="Mã (VD: DOC_EDIT)"
                                value={newPerm.code}
                                onChange={(e) => setNewPerm({ ...newPerm, code: e.target.value.toUpperCase() })}
                                required
                                className="bg-white"
                            />
                            <Input
                                placeholder="Tên hiển thị"
                                value={newPerm.name}
                                onChange={(e) => setNewPerm({ ...newPerm, name: e.target.value })}
                                required
                                className="bg-white"
                            />
                            <Input
                                placeholder="Nhóm (VD: Hồ sơ)"
                                value={newPerm.group}
                                onChange={(e) => setNewPerm({ ...newPerm, group: e.target.value })}
                                required
                                className="bg-white"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" size="sm" icon={<Plus size={16} />}>Thêm quyền</Button>
                        </div>
                    </form>

                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium">Mã</th>
                                    <th className="px-4 py-2 text-left font-medium">Tên</th>
                                    <th className="px-4 py-2 text-left font-medium">Nhóm</th>
                                    <th className="px-4 py-2 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {permissions.map(p => (
                                    <tr key={p.code} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 font-mono text-xs">{p.code}</td>
                                        <td className="px-4 py-2">{p.name}</td>
                                        <td className="px-4 py-2"><Tag>{p.group}</Tag></td>
                                        <td className="px-4 py-2 text-right">
                                            <button
                                                onClick={() => handleDeletePermission(p.code)}
                                                className="text-slate-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>

            {/* Copy Permissions Modal */}
            <Modal
                title="Sao chép quyền"
                isOpen={isCopyModalOpen}
                onClose={() => setIsCopyModalOpen(false)}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsCopyModalOpen(false)}>Hủy</Button>
                        <Button onClick={handleCopyPermissions} loading={loading}>Sao chép</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                        Bạn đang sao chép quyền từ <strong>{selectedUser?.fullName}</strong>.
                        Chọn các user đích bên dưới để áp dụng bộ quyền này.
                    </div>

                    <div className="border border-slate-200 rounded-lg max-h-[300px] overflow-y-auto">
                        {users
                            .filter(u => u.id !== selectedUser?.id && u.role?.toLowerCase() !== 'admin')
                            .map(u => (
                                <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        checked={targetUserIds.includes(u.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setTargetUserIds([...targetUserIds, u.id]);
                                            else setTargetUserIds(targetUserIds.filter(id => id !== u.id));
                                        }}
                                    />
                                    <div>
                                        <div className="font-medium text-sm text-slate-800">{u.fullName}</div>
                                        <div className="text-xs text-slate-500">{u.soHieu}</div>
                                    </div>
                                </label>
                            ))
                        }
                    </div>
                    <div className="text-right text-xs text-slate-500">
                        Đã chọn: {targetUserIds.length} cán bộ
                    </div>
                </div>
            </Modal>
        </div>
    );
}
