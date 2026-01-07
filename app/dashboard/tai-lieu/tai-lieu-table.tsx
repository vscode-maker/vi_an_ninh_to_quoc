
'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Upload, Segmented, Card, Col, Row, Tooltip, Empty, Pagination } from 'antd';
import {
    PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined, UploadOutlined,
    FileTextOutlined, AppstoreOutlined, BarsOutlined, FilePdfOutlined,
    FileExcelOutlined, FileWordOutlined, FileImageOutlined
} from '@ant-design/icons';
import { createFile, updateFile, deleteFile } from '@/lib/file-actions';
import { useDebounce } from 'use-debounce';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const { Meta } = Card;

export default function TaiLieuTable({ initialData, total, currentPage, userPermissions = [], userRole }: any) {
    const { replace } = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const canCreate = userRole?.toLowerCase() === 'admin' || userPermissions.includes('CREATE_FILE');
    const canEdit = userRole?.toLowerCase() === 'admin' || userPermissions.includes('EDIT_FILE');
    const canDelete = userRole?.toLowerCase() === 'admin' || userPermissions.includes('DELETE_FILE');

    const [fileList, setFileList] = useState<any[]>(initialData || []);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [form] = Form.useForm();
    const [uploadFileList, setUploadFileList] = useState<any[]>([]);

    // Search state
    const [searchTerm, setSearchTerm] = useState(searchParams.get('query') || '');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

    // Sync fileList with initialData when it changes (server update)
    useEffect(() => {
        setFileList(initialData || []);
    }, [initialData]);

    // Handle Search URL update
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1'); // Reset to page 1 on search
        if (debouncedSearchTerm) {
            params.set('query', debouncedSearchTerm);
        } else {
            params.delete('query');
        }
        replace(`${pathname}?${params.toString()}`);
    }, [debouncedSearchTerm, pathname, replace]);

    // Handle Page Change
    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        replace(`${pathname}?${params.toString()}`);
    };

    const openModal = (record: any = null) => {
        setEditingRecord(record);
        setUploadFileList([]);
        setIsModalOpen(true);
    };

    useEffect(() => {
        if (!isModalOpen) return;
        if (editingRecord) {
            form.setFieldsValue(editingRecord);
        } else {
            form.resetFields();
        }
    }, [isModalOpen, editingRecord, form]);

    const handleDelete = async (fileId: string) => {
        const res = await deleteFile(fileId);
        if (res.success) {
            message.success('Xóa tài liệu thành công');
            // Optimistic update for better UX? Or just reload/revalidate
            // Reloading is safer for server-side pagination consistency
            window.location.reload();
        } else {
            message.error(res.message);
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const formData = new FormData();

            if (uploadFileList.length > 0) {
                formData.append('file', uploadFileList[0].originFileObj);
            }

            formData.append('fileName', values.fileName);
            formData.append('note', values.note || '');
            formData.append('fileLink', values.fileLink || '');

            let res;
            if (editingRecord) {
                formData.append('fileId', editingRecord.fileId);
                res = await updateFile(formData);
            } else {
                res = await createFile(formData);
            }

            if (res.success) {
                message.success(res.message);
                setIsModalOpen(false);
                window.location.reload();
            } else {
                message.error(res.message);
            }
        } catch (error) {
            console.error('Validate Failed:', error);
        }
    };

    const getFileIcon = (fileType: string) => {
        if (!fileType) return <FileTextOutlined style={{ fontSize: 48, color: '#8c8c8c' }} />;
        const type = fileType.toLowerCase();
        if (type.includes('pdf')) return <FilePdfOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />;
        if (type.includes('sheet') || type.includes('excel') || type.includes('xlsx') || type.includes('xls')) return <FileExcelOutlined style={{ fontSize: 48, color: '#52c41a' }} />;
        if (type.includes('word') || type.includes('doc') || type.includes('docx')) return <FileWordOutlined style={{ fontSize: 48, color: '#1890ff' }} />;
        if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('jpeg')) return <FileImageOutlined style={{ fontSize: 48, color: '#fa8c16' }} />;
        return <FileTextOutlined style={{ fontSize: 48, color: '#8c8c8c' }} />;
    };

    const renderGridView = () => (
        <>
            <Row gutter={[16, 16]}>
                {fileList.map(file => (
                    <Col xs={24} sm={12} md={8} lg={6} xl={4} key={file.fileId}>
                        <Card
                            hoverable
                            actions={[
                                <EditOutlined key="edit" onClick={() => openModal(file)} />,
                                <Popconfirm title="Bạn có chắc chắn muốn xóa?" onConfirm={() => handleDelete(file.fileId)}>
                                    <DeleteOutlined key="delete" style={{ color: 'red' }} />
                                </Popconfirm>,
                                <a href={file.fileLink} target="_blank" rel="noopener noreferrer" key="download">
                                    <UploadOutlined rotate={180} />
                                </a>
                            ]}
                            cover={
                                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', paddingTop: 20 }}>
                                    {getFileIcon(file.fileType || file.fileName)}
                                </div>
                            }
                        >
                            <Meta
                                title={
                                    <Tooltip title={file.fileName}>
                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {file.fileName || 'Chưa đặt tên'}
                                        </div>
                                    </Tooltip>
                                }
                                description={
                                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                                        {file.note ? (file.note.length > 20 ? file.note.substring(0, 20) + '...' : file.note) : 'Không có ghi chú'}
                                    </div>
                                }
                            />
                        </Card>
                    </Col>
                ))}
                {fileList.length === 0 && (
                    <Col span={24}>
                        <Empty description="Không tìm thấy tài liệu" />
                    </Col>
                )}
            </Row>
            {total > 0 && (
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                    <Pagination
                        current={currentPage}
                        total={total}
                        pageSize={20}
                        onChange={handlePageChange}
                        showTotal={(total) => `Tổng ${total} tài liệu`}
                    />
                </div>
            )}
        </>
    );

    const columns = [
        {
            title: 'Tên tài liệu',
            dataIndex: 'fileName',
            key: 'fileName',
            render: (text: string, record: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileTextOutlined />
                    <a href={record.fileLink} target="_blank" rel="noopener noreferrer">{text || 'Không tên'}</a>
                </div>
            )
        },
        { title: 'Ghi chú', dataIndex: 'note', key: 'note' },
        { title: 'Cập nhật', dataIndex: 'updatedAt', key: 'updatedAt', render: (date: any) => date ? new Date(date).toLocaleDateString('vi-VN') : '' },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: any) => (
                <div className="flex gap-2">
                    {canEdit && <Button icon={<EditOutlined />} onClick={() => openModal(record)} />}
                    {canDelete && (
                        <Popconfirm title="Xóa tài liệu?" onConfirm={() => handleDelete(record.fileId)}>
                            <Button icon={<DeleteOutlined />} danger />
                        </Popconfirm>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <Input.Search
                        placeholder="Tìm kiếm tài liệu..."
                        style={{ width: 300 }}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        defaultValue={searchTerm}
                    />
                    <Segmented
                        options={[
                            { label: 'Lưới', value: 'grid', icon: <AppstoreOutlined /> },
                            { label: 'Danh sách', value: 'list', icon: <BarsOutlined /> },
                        ]}
                        value={viewMode}
                        onChange={(val: any) => setViewMode(val)}
                    />
                </div>
                {canCreate && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                        Thêm tài liệu mới
                    </Button>
                )}
            </div>

            {viewMode === 'grid' ? renderGridView() : (
                <Table
                    dataSource={fileList}
                    columns={columns}
                    rowKey="fileId"
                    pagination={{
                        current: currentPage,
                        total: total,
                        pageSize: 20,
                        onChange: handlePageChange,
                        showTotal: (total) => `Tổng ${total} tài liệu`
                    }}
                />
            )}

            <Modal
                title={editingRecord ? "Cập nhật tài liệu" : "Thêm tài liệu mới"}
                open={isModalOpen}
                onOk={handleOk}
                onCancel={() => setIsModalOpen(false)}
                okText="Lưu"
                cancelText="Hủy"
                destroyOnHidden={true}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="fileName" label="Tên tài liệu" rules={[{ required: true, message: 'Vui lòng nhập tên tài liệu' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="note" label="Ghi chú">
                        <Input.TextArea />
                    </Form.Item>
                    <Form.Item name="fileLink" label="Link file (Nếu có sẵn)">
                        <Input placeholder="https://..." />
                    </Form.Item>
                    <Form.Item label="Upload File (Sẽ tạo link Drive)">
                        <Upload
                            fileList={uploadFileList}
                            beforeUpload={() => false}
                            onChange={({ fileList }) => setUploadFileList(fileList)}
                            maxCount={1}
                        >
                            <Button icon={<UploadOutlined />}>Chọn file</Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
