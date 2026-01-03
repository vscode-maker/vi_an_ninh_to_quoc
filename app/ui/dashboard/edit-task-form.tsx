'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Form, Input, DatePicker, Select, Button, Row, Col, Typography, message, Upload, Card, Popconfirm, Table, Spin } from 'antd';
import {
    UploadOutlined,
    PlusOutlined,
    CloseOutlined,
    UserOutlined,
    BankOutlined,
    MobileOutlined,
    MessageOutlined,
    FileTextOutlined,
    SearchOutlined,
    PaperClipOutlined,
    LinkOutlined,
    DeleteOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import { updateTask, getExecutionUnits, getZaloGroups, getTaskAttachments, deleteTask } from '@/lib/task-actions';
import { Task } from '@prisma/client';
import dayjs from 'dayjs';

const NoteModal = React.lazy(() => import('./note-modal'));

const { Option, OptGroup } = Select;
const { Text, Title } = Typography;
const { TextArea } = Input;

interface EditTaskFormProps {
    task: Task;
    onSuccess: () => void;
    onTaskUpdate: (task: Task) => void;
    readOnly?: boolean;
}

const EditTaskForm = React.memo(function EditTaskForm({ task, onSuccess, onTaskUpdate, readOnly = false }: EditTaskFormProps) {
    const [form] = Form.useForm();
    const requestType = Form.useWatch('requestType', form);
    const [executionUnits, setExecutionUnits] = useState<string[]>([]);
    const [zaloGroups, setZaloGroups] = useState<{ groupId: string; name: string }[]>([]);
    const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
    const [fileList, setFileList] = useState<any[]>([]);
    const [addingNote, setAddingNote] = useState(false);

    // Initial Values Derivation
    const initialValues = React.useMemo(() => {
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
            ...task,
            deadline: task.deadline ? dayjs(task.deadline) : null,
            relatedPeople: relatedPeople
        };
    }, [task]);

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

    useEffect(() => {
        form.resetFields();
    }, [task, form, initialValues]);

    const onFinish = async (values: any) => {
        const formData = new FormData();

        Object.keys(values).forEach(key => {
            if (key !== 'files' && key !== 'relatedPeople' && values[key] !== undefined && values[key] !== null) {
                if (key === 'deadline' && values[key]) {
                    formData.append(key, values[key].toISOString());
                } else {
                    formData.append(key, values[key]);
                }
            }
        });

        if (values.relatedPeople && values.relatedPeople.length > 0) {
            formData.append('moreInfo', JSON.stringify(values.relatedPeople));
        }

        // Handle new files
        fileList.forEach((file: any) => {
            if (file.originFileObj) {
                formData.append('files', file.originFileObj);
            }
        });

        const result = await updateTask(task.id, formData);
        if (result.success) {
            message.success(result.message);
            // Construct updated task object for optimistic UI update (partial)
            const updatedTask = {
                ...task,
                ...values,
                deadline: values.deadline ? values.deadline.toDate() : null,
                moreInfo: values.relatedPeople
            };
            onTaskUpdate(updatedTask);
            onSuccess();
        } else {
            message.error(result.message);
        }
    };

    const handleDelete = async () => {
        const result = await deleteTask(task.id);
        if (result.success) {
            message.success(result.message);
            // Parent needs to handle removal from list
            // But here we can just close modal and let parent refresh or use onTaskUpdate/onDelete prop if we had it
            // Kanban board handles delete via its own handler passed to TaskCard, but here we are in Edit Form.
            // Ideally we should call a callback. For now simply closing. 
            // Better: trigger a refresh or pass onDelete prop. 
            // Re-use onSuccess to close. The parent list might need refresh.
            // KanbanBoardOptimized passes handleEditCancel as onSuccess.
            // It also has handleTaskUpdate.
            // We should probably rely on `deleteTask` calling revalidatePath.
            // But client state needs update. 
            // Given I cannot easily add a new prop without changing interface in multiple places, 
            // and `deleteTask` is imported here, I will rely on revalidation or page refresh for now, OR
            // I can't easily fix the client state from here without a prop.
            // Wait, `KanbanBoardOptimized` passes `handleDeleteTask` to `TaskCard` but not `EditTaskForm`.
            // User can delete from Card. From Edit Form, ideally we use same handler.
            // I'll leave it as is, standard server action + close.
            onSuccess();
            window.location.reload(); // Force reload to reflect delete if client state isn't updated
        } else {
            message.error(result.message);
        }
    };

    const uploadProps: any = {
        onRemove: (file: any) => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: (file: any) => {
            setFileList(prev => [...prev, file]);
            return false;
        },
        fileList,
        multiple: true,
    };

    // Table columns for related people
    const relatedPeopleColumns = [
        { title: 'Họ tên', dataIndex: 'ho_ten', key: 'ho_ten' },
        { title: 'SĐT', dataIndex: 'so_dien_thoai', key: 'so_dien_thoai' },
        { title: 'Ngày sinh', dataIndex: 'ngay_sinh', key: 'ngay_sinh' },
        { title: 'Giới tính', dataIndex: 'gioi_tinh', key: 'gioi_tinh' },
        { title: 'CCCD', dataIndex: 'cccd_cmnd', key: 'cccd_cmnd' },
        { title: 'HKTT', dataIndex: 'ho_khau_thuong_tru', key: 'ho_khau_thuong_tru' },
        { title: 'Chỗ ở', dataIndex: 'cho_o_hien_nay', key: 'cho_o_hien_nay' },
        {
            title: 'Facebook',
            dataIndex: 'link_facebook',
            key: 'link_facebook',
            render: (text: string) => text ? <a href={text} target="_blank" rel="noopener noreferrer">Link</a> : ''
        },
    ];

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            onFinish={onFinish}
            disabled={readOnly}
        >
            {/* 1. Loại Yêu Cầu */}
            <div style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                <Title level={5} style={{ color: '#52c41a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    1. Loại Yêu Cầu
                </Title>
                <Form.Item name="requestType" label="Chọn loại yêu cầu" rules={[{ required: true }]}>
                    <Select placeholder="-- Chọn loại yêu cầu --" size="large">
                        <OptGroup label={<span><BankOutlined /> Bank</span>}>
                            <Option key="bank_saoke" value="Sao kê">Sao kê</Option>
                            <Option value="Cung cấp thông tin">Cung cấp thông tin</Option>
                            <Option value="Cung cấp IP">Cung cấp IP</Option>
                            <Option value="Cung cấp hình ảnh">Cung cấp hình ảnh</Option>
                        </OptGroup>
                        <OptGroup label={<span><MobileOutlined /> Số điện thoại</span>}>
                            <Option value="Rút list">Rút list</Option>
                            <Option value="Quét Imei">Quét Imei</Option>
                            <Option value="Giám sát">Giám sát</Option>
                            <Option value="Định vị">Định vị</Option>
                        </OptGroup>
                        <OptGroup label={<span><MessageOutlined /> Zalo</span>}>
                            <Option value="Cung cấp thông tin Zalo">Cung cấp thông tin Zalo</Option>
                            <Option value="Cung cấp IP Zalo">Cung cấp IP Zalo</Option>
                        </OptGroup>
                        <OptGroup label={<span><FileTextOutlined /> Công văn</span>}>
                            <Option value="Công văn">Công văn</Option>
                            <Option value="Uỷ thác điều tra">Uỷ thác điều tra</Option>
                        </OptGroup>
                        <OptGroup label={<span><SearchOutlined /> Xác minh</span>}>
                            <Option value="Xác minh phương tiện">Xác minh phương tiện</Option>
                            <Option value="Xác minh đối tượng">Xác minh đối tượng</Option>
                            <Option value="Vẽ sơ đồ đường dây">Vẽ sơ đồ đường dây</Option>
                            <Option value="Khác">Khác</Option>
                        </OptGroup>
                    </Select>
                </Form.Item>
            </div>

            {/* 2. Thông Tin Chung */}
            <div style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                <Title level={5} style={{ color: '#52c41a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    2. Thông Tin Chung
                </Title>

                <Form.Item name="groupId" label="Nhóm/Chuyên án" rules={[{ required: true }]}>
                    <Select placeholder="-- Chọn nhóm --" showSearch optionFilterProp="children" size="large">
                        {zaloGroups.map(group => (
                            <Option key={group.groupId} value={group.groupId}>{group.name}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="targetName" label="Họ Tên Đối Tượng" rules={[{ required: true }]}>
                            <Input placeholder="Nhập tên đối tượng" size="large" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="deadline" label="Thời Hạn">
                            <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} size="large" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="executionUnit" label="Đơn vị Thực Hiện">
                    <Select placeholder="Chọn đơn vị thực hiện..." showSearch optionFilterProp="children" size="large">
                        {executionUnits.map((unit) => (
                            <Option key={unit} value={unit}>{unit}</Option>
                        ))}
                    </Select>
                </Form.Item>
            </div>

            {/* 3. Chi Tiết Yêu Cầu */}
            <div style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                <Title level={5} style={{ color: '#52c41a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    3. Chi Tiết Yêu Cầu
                </Title>

                {['Sao kê', 'Cung cấp thông tin', 'Cung cấp IP', 'Cung cấp hình ảnh', 'Ngân hàng'].includes(requestType) && (
                    <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                        <Text strong style={{ display: 'block', marginBottom: 12 }}>Thông tin ngân hàng:</Text>
                        <Row gutter={16}>
                            <Col span={8}><Form.Item name="accountNumber" label="Số tài khoản"><Input /></Form.Item></Col>
                            <Col span={8}><Form.Item name="bankName" label="Ngân hàng"><Input /></Form.Item></Col>
                            <Col span={8}><Form.Item name="accountName" label="Tên chủ TK"><Input /></Form.Item></Col>
                        </Row>
                    </div>
                )}

                {['Rút list', 'Định vị', 'Quét Imei', 'Giám sát', 'Xác minh số điện thoại'].includes(requestType) && (
                    <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                        <Text strong style={{ display: 'block', marginBottom: 12 }}>Thông tin thuê bao:</Text>
                        <Row gutter={16}>
                            <Col span={12}><Form.Item name="phoneNumber" label="Số điện thoại"><Input /></Form.Item></Col>
                            <Col span={12}><Form.Item name="carrier" label="Nhà mạng"><Input /></Form.Item></Col>
                        </Row>
                    </div>
                )}

                {['Cung cấp thông tin Zalo', 'Cung cấp IP Zalo', 'Zalo'].includes(requestType) && (
                    <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                        <Text strong style={{ display: 'block', marginBottom: 12 }}>Thông tin Zalo:</Text>
                        <Row gutter={16}>
                            <Col span={12}><Form.Item name="phoneNumber" label="Số điện thoại Zalo"><Input /></Form.Item></Col>
                            <Col span={12}><Form.Item name="carrier" label="Nhà mạng"><Input /></Form.Item></Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}><Form.Item name="qrCode" label="Mã QR/ID Zalo"><Input placeholder="Nhập mã QR hoặc ID Zalo" /></Form.Item></Col>
                            <Col span={12}><Form.Item name="socialAccountName" label="Tên tài khoản MXH"><Input placeholder="Tên hiển thị trên Zalo" /></Form.Item></Col>
                        </Row>
                    </div>
                )}

                {['Công văn', 'Uỷ thác điều tra'].includes(requestType) && (
                    <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                        <Form.Item name="documentInfo" label="Thông tin văn bản/Quyết định">
                            <Input.TextArea rows={2} placeholder="Số công văn, ngày tháng, nội dung tóm tắt..." />
                        </Form.Item>
                    </div>
                )}
            </div>

            {/* 4. Nội Dung & Đính Kèm */}
            <div style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                <Title level={5} style={{ color: '#52c41a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    4. Nội Dung & Đính Kèm
                </Title>

                <Form.Item name="content" label="Nội dung chi tiết">
                    <TextArea rows={4} placeholder="Nhập nội dung chi tiết..." />
                </Form.Item>

                <Form.Item name="progressWarning" label="Cảnh báo tiến độ">
                    <Select>
                        <Option value="Bình thường">Bình thường</Option>
                        <Option value="Cảnh báo">Cảnh báo</Option>
                        <Option value="Khẩn cấp">Khẩn cấp</Option>
                    </Select>
                </Form.Item>

                {!readOnly && (
                    <Form.Item label="Thêm file đính kèm (nếu có)">
                        <Upload {...uploadProps}>
                            <Button icon={<UploadOutlined />}>Chọn file</Button>
                        </Upload>
                    </Form.Item>
                )}

                {existingAttachments.length > 0 && (
                    <div style={{ marginTop: 16, padding: 12, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                            <PaperClipOutlined /> Tệp đính kèm đã lưu ({existingAttachments.length})
                        </Text>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {existingAttachments.map((file) => (
                                <div key={file.fileId} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 8, background: '#fff', border: '1px solid #e6e6e6', borderRadius: 4 }}>
                                    <div style={{ flex: 1 }}>
                                        <a href={file.fileLink || '#'} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 500, color: '#1890ff', display: 'flex', alignItems: 'center' }}>
                                            <LinkOutlined style={{ marginRight: 6 }} />
                                            {file.fileName || 'Không tên'}
                                        </a>
                                        {/* Optional: Add file type icon or size */}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#999', whiteSpace: 'nowrap', marginLeft: 8 }}>
                                        {file.updatedAt ? dayjs(file.updatedAt).format('DD/MM/YYYY HH:mm') : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Related People Section - Conditional Rendering */}
                <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8, marginTop: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 16 }}><UserOutlined /> Thông tin đối tượng liên quan (Optional)</Text>
                    {readOnly ? (
                        <Table
                            dataSource={initialValues.relatedPeople}
                            columns={relatedPeopleColumns}
                            pagination={false}
                            size="small"
                            bordered
                            rowKey={(record: any) => record.ho_ten + record.so_dien_thoai} // unique key
                            scroll={{ x: 'max-content' }}
                        />
                    ) : (
                        <Form.List name="relatedPeople">
                            {(fields, { add, remove }) => (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Card
                                            key={key}
                                            size="small"
                                            title={`Đối tượng #${name + 1}`}
                                            extra={<CloseOutlined onClick={() => remove(name)} />}
                                        >
                                            <Row gutter={16}>
                                                <Col span={12}>
                                                    <Form.Item {...restField} name={[name, 'ho_ten']} label="Họ tên">
                                                        <Input placeholder="Họ tên" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item {...restField} name={[name, 'so_dien_thoai']} label="Số điện thoại">
                                                        <Input placeholder="Số điện thoại" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item {...restField} name={[name, 'ngay_sinh']} label="Ngày sinh">
                                                        <Input placeholder="DD/MM/YYYY" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item {...restField} name={[name, 'gioi_tinh']} label="Giới tính">
                                                        <Select placeholder="Chọn">
                                                            <Option value="Nam">Nam</Option>
                                                            <Option value="Nữ">Nữ</Option>
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item {...restField} name={[name, 'cccd_cmnd']} label="CCCD/CMND">
                                                        <Input placeholder="Số CCCD" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={24}>
                                                    <Form.Item {...restField} name={[name, 'ho_khau_thuong_tru']} label="HKTT">
                                                        <Input placeholder="Hộ khẩu thường trú" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={24}>
                                                    <Form.Item {...restField} name={[name, 'cho_o_hien_nay']} label="Chỗ ở hiện nay">
                                                        <Input placeholder="Chỗ ở hiện nay" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={24}>
                                                    <Form.Item {...restField} name={[name, 'link_facebook']} label="Link Facebook">
                                                        <Input placeholder="https://facebook.com/..." />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </Card>
                                    ))}
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        Thêm thông tin đối tượng
                                    </Button>
                                </div>
                            )}
                        </Form.List>
                    )}
                </div>

                {/* Note Section */}
                <div style={{ marginTop: 24, padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text strong style={{ fontSize: '15px', color: '#2b4a35' }}>
                            <FileTextOutlined style={{ marginRight: 8 }} />
                            Lịch sử hoạt động / Ghi chú
                        </Text>

                        <Button
                            onClick={() => setAddingNote(true)}
                            style={{ color: '#52c41a', borderColor: '#52c41a' }}
                            icon={<FileTextOutlined />}
                            size="small"
                        >
                            Xem & Thêm Ghi Chú
                        </Button>
                    </div>
                    {task.notes && (
                        <div style={{ fontSize: '13px', color: '#666' }}>
                            {(Array.isArray(task.notes) && task.notes.length > 0) ? (
                                <span>
                                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                                    {task.notes.length} ghi chú.
                                </span>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>

            {/* 5. Trạng Thái */}
            <div style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                <Title level={5} style={{ color: '#52c41a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    5. Trạng Thái
                </Title>
                <Form.Item name="status" label="Trạng Thái" rules={[{ required: true }]}>
                    <Select size="large">
                        <Option value="Chưa thực hiện">Chưa thực hiện</Option>
                        <Option value="Đang thực hiện">Đang thực hiện</Option>
                        <Option value="Hoàn thành">Hoàn thành</Option>
                        <Option value="Chờ kết quả">Chờ kết quả</Option>
                    </Select>
                </Form.Item>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                {!readOnly && (
                    <Popconfirm
                        title="Xóa công việc"
                        description="Bạn có chắc chắn muốn xóa công việc này không?"
                        onConfirm={handleDelete}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button danger icon={<DeleteOutlined />}>Xóa</Button>
                    </Popconfirm>
                )}
                <div style={{ display: 'flex', gap: 8, width: readOnly ? '100%' : 'auto', justifyContent: readOnly ? 'flex-end' : 'flex-end' }}>
                    <Button onClick={onSuccess}>{readOnly ? 'Đóng' : 'Hủy'}</Button>
                    {!readOnly && (
                        <Button type="primary" htmlType="submit" style={{ background: '#52c41a', borderColor: '#52c41a', minWidth: 120 }}>
                            Lưu Thay Đổi
                        </Button>
                    )}
                </div>
            </div>
        </Form>
    );
});

export default EditTaskForm;
