
'use client';

import { useState, useMemo } from 'react';
import { Table, Checkbox, message, Tag, Button, Modal, Form, Input, Popconfirm, Card, Row, Col, Divider, Space, Select } from 'antd';
import { PlusOutlined, DeleteOutlined, SettingOutlined, UserSwitchOutlined, CopyOutlined } from '@ant-design/icons';
import { updateUserPermissions, createPermissionDefinition, deletePermissionDefinition, copyUserPermissions } from '@/lib/permission-actions';

export default function PhanQuyenTable({ initialUsers, availablePermissions }: any) {
    const [users, setUsers] = useState(initialUsers);
    const [permissions, setPermissions] = useState(availablePermissions);
    const [loading, setLoading] = useState<boolean>(false);

    // Manage Permission Definitions Modal
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [form] = Form.useForm();

    // User Permission Assignment Modal
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [tempPermissions, setTempPermissions] = useState<string[]>([]);

    const [messageApi, contextHolder] = message.useMessage();

    // Group permissions by 'group'
    const groupedPermissions = useMemo(() => {
        const groups: { [key: string]: any[] } = {};
        permissions.forEach((perm: any) => {
            const groupName = perm.group || 'Khác';
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(perm);
        });
        return groups;
    }, [permissions]);

    const openAssignModal = (user: any) => {
        setSelectedUser(user);
        setTempPermissions(user.permissions || []);
        setIsAssignModalOpen(true);
    };

    const handlePermissionToggle = (code: string, checked: boolean) => {
        if (checked) {
            setTempPermissions(prev => [...prev, code]);
        } else {
            setTempPermissions(prev => prev.filter(p => p !== code));
        }
    };

    const handleGroupToggle = (groupPerms: any[], checked: boolean) => {
        const codes = groupPerms.map(p => p.code);
        if (checked) {
            // Add all missing codes from this group
            setTempPermissions(prev => {
                const newPerms = new Set([...prev, ...codes]);
                return Array.from(newPerms);
            });
        } else {
            // Remove all codes from this group
            setTempPermissions(prev => prev.filter(p => !codes.includes(p)));
        }
    };

    const handleSaveUserPermissions = async () => {
        if (!selectedUser) return;
        setLoading(true);
        const result = await updateUserPermissions(selectedUser.id, tempPermissions);

        if (result.success) {
            messageApi.success('Cập nhật quyền thành công');
            setUsers(users.map((u: any) => u.id === selectedUser.id ? { ...u, permissions: tempPermissions } : u));
            setIsAssignModalOpen(false);
        } else {
            messageApi.error(result.message);
        }
        setLoading(false);
    };

    // ... (Existing Manage Permission Definition Logic)
    const handleAddPermission = async (values: any) => {
        const formData = new FormData();
        formData.append('code', values.code);
        formData.append('name', values.name);
        formData.append('group', values.group);

        const result = await createPermissionDefinition(formData);
        if (result.success) {
            messageApi.success(result.message);
            setPermissions([...permissions, values]);
            form.resetFields();
        } else {
            messageApi.error(result.message);
        }
    };

    const handleDeletePermission = async (code: string) => {
        const result = await deletePermissionDefinition(code);
        if (result.success) {
            messageApi.success(result.message);
            setPermissions(permissions.filter((p: any) => p.code !== code));
        } else {
            messageApi.error(result.message);
        }
    };

    // Copy Permission Modal
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [sourceUser, setSourceUser] = useState<any>(null);
    const [targetUserIds, setTargetUserIds] = useState<string[]>([]);

    // ... existing helpers

    const openCopyModal = (user: any) => {
        setSourceUser(user);
        setTargetUserIds([]);
        setIsCopyModalOpen(true);
    };

    const handleCopyPermissions = async () => {
        if (!sourceUser || targetUserIds.length === 0) return;
        setLoading(true);
        const result = await copyUserPermissions(sourceUser.id, targetUserIds);

        if (result.success) {
            messageApi.success(result.message);
            // Optimistic update? Or just wait for revalidate.
            // Permissions are in JSON, complex to update locally without fetch.
            // But revalidatePath should handle it on next refresh/action. 
            // For immediate feedback, we can manually update users state if we knew the permissions.
            const sourcePerms = sourceUser.permissions;
            setUsers(users.map((u: any) => targetUserIds.includes(u.id) ? { ...u, permissions: sourcePerms } : u));
            setIsCopyModalOpen(false);
        } else {
            messageApi.error(result.message);
        }
        setLoading(false);
    };

    const columns = [
        {
            title: 'Cán bộ',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (text: string, record: any) => (
                <div>
                    <div style={{ fontWeight: 'bold' }}>{text}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{record.soHieu}</div>
                </div>
            )
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => <Tag color={role?.toLowerCase() === 'admin' ? 'red' : 'blue'}>{role.toUpperCase()}</Tag>
        },
        {
            title: 'Số quyền',
            key: 'permCount',
            render: (_: any, record: any) => {
                if (record.role?.toLowerCase() === 'admin') return <Tag color="gold">Toàn quyền</Tag>;
                return <Tag>{record.permissions?.length || 0} quyền</Tag>;
            }
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: any) => (
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        type="primary"
                        ghost
                        size="small"
                        icon={<UserSwitchOutlined />}
                        disabled={record.role?.toLowerCase() === 'admin'}
                        onClick={() => openAssignModal(record)}
                    >
                        Phân quyền
                    </Button>
                    <Button
                        size="small"
                        icon={<CopyOutlined />}
                        title="Sao chép quyền sang user khác"
                        disabled={record.role?.toLowerCase() === 'admin'}
                        onClick={() => openCopyModal(record)}
                    />
                </div>
            )
        }
    ];

    return (
        <div>
            {contextHolder}
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <Button icon={<SettingOutlined />} onClick={() => setIsManageModalOpen(true)}>
                    Quản lý danh sách quyền
                </Button>
            </div>

            <Table
                dataSource={users}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 20 }}
                bordered
            />

            {/* Modal Assign Permissions */}
            <Modal
                title={`Phân quyền cho: ${selectedUser?.fullName}`}
                open={isAssignModalOpen}
                onOk={handleSaveUserPermissions}
                onCancel={() => setIsAssignModalOpen(false)}
                width={800}
                confirmLoading={loading}
            >
                {/* ... existing assign modal content ... */}
                <Table
                    dataSource={Object.entries(groupedPermissions).map(([group, perms]) => ({ group, perms }))}
                    rowKey="group"
                    pagination={false}
                    size="small"
                    scroll={{ y: '60vh' }}
                    columns={[
                        {
                            title: 'Nhóm chức năng',
                            dataIndex: 'group',
                            key: 'group',
                            width: 180,
                            render: (text, record) => {
                                const allCodes = record.perms.map(p => p.code);
                                const allChecked = allCodes.every(c => tempPermissions.includes(c));
                                const indeterminate = allCodes.some(c => tempPermissions.includes(c)) && !allChecked;
                                return (
                                    <Checkbox
                                        indeterminate={indeterminate}
                                        checked={allChecked}
                                        onChange={(e) => handleGroupToggle(record.perms, e.target.checked)}
                                    >
                                        <span style={{ fontWeight: 600 }}>{text}</span>
                                    </Checkbox>
                                );
                            }
                        },
                        {
                            title: 'Xem',
                            key: 'view',
                            align: 'center',
                            render: (_, record) => {
                                const perm = record.perms.find(p => p.code.startsWith('VIEW_'));
                                if (!perm) return null;
                                return (
                                    <Checkbox
                                        checked={tempPermissions.includes(perm.code)}
                                        onChange={(e) => handlePermissionToggle(perm.code, e.target.checked)}
                                    />
                                );
                            }
                        },
                        {
                            title: 'Thêm',
                            key: 'add',
                            align: 'center',
                            render: (_, record) => {
                                const perm = record.perms.find(p => p.code.startsWith('ADD_') || p.code.startsWith('CREATE_'));
                                if (!perm) return null;
                                return (
                                    <Checkbox
                                        checked={tempPermissions.includes(perm.code)}
                                        onChange={(e) => handlePermissionToggle(perm.code, e.target.checked)}
                                    />
                                );
                            }
                        },
                        {
                            title: 'Sửa',
                            key: 'edit',
                            align: 'center',
                            render: (_, record) => {
                                const perm = record.perms.find(p => p.code.startsWith('EDIT_') || p.code.startsWith('UPDATE_'));
                                if (!perm) return null;
                                return (
                                    <Checkbox
                                        checked={tempPermissions.includes(perm.code)}
                                        onChange={(e) => handlePermissionToggle(perm.code, e.target.checked)}
                                    />
                                );
                            }
                        },
                        {
                            title: 'Xóa',
                            key: 'delete',
                            align: 'center',
                            render: (_, record) => {
                                const perm = record.perms.find(p => p.code.startsWith('DELETE_') || p.code.startsWith('REMOVE_'));
                                if (!perm) return null;
                                return (
                                    <Checkbox
                                        checked={tempPermissions.includes(perm.code)}
                                        onChange={(e) => handlePermissionToggle(perm.code, e.target.checked)}
                                    />
                                );
                            }
                        },
                        {
                            title: 'Khác',
                            key: 'other',
                            render: (_, record) => {
                                const standardPrefixes = ['VIEW_', 'ADD_', 'CREATE_', 'EDIT_', 'UPDATE_', 'DELETE_', 'REMOVE_'];
                                const otherPerms = record.perms.filter(p => !standardPrefixes.some(prefix => p.code.startsWith(prefix)));
                                if (otherPerms.length === 0) return null;
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {otherPerms.map(perm => (
                                            <Checkbox
                                                key={perm.code}
                                                checked={tempPermissions.includes(perm.code)}
                                                onChange={(e) => handlePermissionToggle(perm.code, e.target.checked)}
                                            >
                                                <span style={{ fontSize: 12 }}>{perm.name}</span>
                                            </Checkbox>
                                        ))}
                                    </div>
                                );
                            }
                        }
                    ]}
                />
            </Modal>

            {/* Modal Copy Permissions */}
            <Modal
                title="Sao chép quyền"
                open={isCopyModalOpen}
                onOk={handleCopyPermissions}
                onCancel={() => setIsCopyModalOpen(false)}
                confirmLoading={loading}
                okText="Sao chép"
                cancelText="Hủy"
            >
                <div style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>User nguồn (Copy từ):</div>
                    <Input value={`${sourceUser?.fullName} (${sourceUser?.soHieu})`} disabled />
                    <div style={{ marginTop: 4, fontSize: 12, color: '#888' }}>
                        Đang có {sourceUser?.permissions?.length || 0} quyền
                    </div>
                </div>

                <div>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>User đích (Copy đến):</div>
                    <Select
                        mode="multiple"
                        style={{ width: '100%' }}
                        placeholder="Chọn user để áp dụng quyền..."
                        value={targetUserIds}
                        onChange={setTargetUserIds}
                        filterOption={(input, option) =>
                            String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={users
                            .filter((u: any) => u.id !== sourceUser?.id && u.role?.toLowerCase() !== 'admin')
                            .map((u: any) => ({
                                label: `${u.fullName} (${u.soHieu})`,
                                value: u.id
                            }))
                        }
                    />
                </div>
            </Modal>

            {/* Modal Manage Definitions */}
            <Modal
                title="Quản lý danh sách quyền"
                open={isManageModalOpen}
                onCancel={() => setIsManageModalOpen(false)}
                footer={null}
                width={700}
            >
                <Form layout="inline" form={form} onFinish={handleAddPermission} style={{ marginBottom: 24 }}>
                    <Form.Item name="code" rules={[{ required: true, message: 'Nhập mã!' }]}>
                        <Input placeholder="Mã (VD: EDIT_REPORT)" />
                    </Form.Item>
                    <Form.Item name="name" rules={[{ required: true, message: 'Nhập tên!' }]}>
                        <Input placeholder="Tên hiển thị" />
                    </Form.Item>
                    <Form.Item name="group" rules={[{ required: true, message: 'Nhập nhóm!' }]}>
                        <Input placeholder="Nhóm" style={{ width: 100 }} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>Thêm</Button>
                    </Form.Item>
                </Form>

                <Table
                    dataSource={permissions}
                    rowKey="code"
                    size="small"
                    pagination={{ pageSize: 5 }}
                    columns={[
                        { title: 'Mã', dataIndex: 'code' },
                        { title: 'Tên', dataIndex: 'name' },
                        { title: 'Nhóm', dataIndex: 'group' },
                        {
                            title: '',
                            key: 'action',
                            render: (_, record: any) => (
                                <Popconfirm title="Xóa quyền này?" onConfirm={() => handleDeletePermission(record.code)}>
                                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                            )
                        }
                    ]}
                />
            </Modal>
        </div>
    );
}
