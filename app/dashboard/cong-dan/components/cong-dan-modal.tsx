
'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Row, Col, Tabs, Button, Upload, message, Card, Typography, Divider, Spin } from 'antd';
import { UploadOutlined, ScanOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { createCongDan, updateCongDan } from '@/lib/cong-dan-actions';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const { TabPane } = Tabs;
const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// OCR Helper Function (Simplified from reference)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
const DEFAULT_PROMPT = `
##Nhân vật
  Bạn là công cụ OCR & trích xuất dữ liệu, có khả năng đọc và phân tích chính xác nội dung từ hình ảnh giấy tờ/hệ thống hành chính.
  
##Yêu cầu đầu ra JSON
  {
    "thong_tin_cong_dan": {
      "ho_ten": "",
      "ngay_sinh": "dd/mm/yyyy",
      "gioi_tinh": "Nam/Nữ",
      "dan_toc": "",
      "ton_giao": "",
      "que_quan": "",
      "noi_thuong_tru": "",
      "so_CCCD": "",
      "so_CMND": "",
      "ngay_cap": "",
      "noi_cap": "",
      "nghe_nghiep": "",
      "so_dien_thoai": ""
    }
  }
`;

export default function CongDanModal({ open, onCancel, record }: any) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // OCR State
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrResult, setOcrResult] = useState<any>(null);
    const [fileList, setFileList] = useState<any[]>([]);
    const [apiKey, setApiKey] = useState('');
    const [activeTab, setActiveTab] = useState('1');

    useEffect(() => {
        if (!open) return;
        if (record) {
            form.setFieldsValue({
                ...record,
                ngaySinh: record.ngaySinh ? dayjs(record.ngaySinh, 'DD/MM/YYYY').isValid() ? dayjs(record.ngaySinh, 'DD/MM/YYYY') : null : null,
                // Handle text date format vs DatePicker object
            });
        } else {
            form.resetFields();
        }
    }, [record, form, open]);

    // Save API Key to localStorage
    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) setApiKey(storedKey);
    }, []);

    const handleApiKeyChange = (e: any) => {
        setApiKey(e.target.value);
        localStorage.setItem('gemini_api_key', e.target.value);
    };

    const handleOCR = async () => {
        if (!apiKey) {
            message.error('Vui lòng nhập API Key!');
            return;
        }
        if (fileList.length === 0) {
            message.error('Vui lòng chọn ảnh!');
            return;
        }

        setOcrLoading(true);
        try {
            // Convert first image to Base64
            const file = fileList[0].originFileObj;
            const base64Data = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
            });

            const base64Content = base64Data.split(',')[1];

            const requestBody = {
                contents: [{
                    parts: [
                        { text: DEFAULT_PROMPT },
                        { inline_data: { mime_type: file.type, data: base64Content } }
                    ]
                }],
                generationConfig: {
                    response_mime_type: "application/json"
                }
            };

            const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error('API Request Failed');

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                const json = JSON.parse(text);
                setOcrResult(json);
                message.success('Phân tích thành công!');

                // Auto-switch to Form tab and fill
                // confirm('Bạn muốn điền dữ liệu vào form?')... let's just show button
            } else {
                throw new Error('No text returned');
            }

        } catch (error: any) {
            console.error('OCR Error:', error);
            message.error('Lỗi khi phân tích: ' + error.message);
        } finally {
            setOcrLoading(false);
        }
    };

    const applyOCRData = () => {
        if (ocrResult?.thong_tin_cong_dan) {
            const inf = ocrResult.thong_tin_cong_dan;
            // Map OCR fields to Form fields
            form.setFieldsValue({
                hoTen: inf.ho_ten,
                soCMND: inf.so_CMND,
                soCCCD: inf.so_CCCD,
                gioiTinh: inf.gioi_tinh,
                queQuan: inf.que_quan,
                noiThuongTru: inf.noi_thuong_tru,
                danToc: inf.dan_toc,
                tonGiao: inf.ton_giao,
                ngheNghiep: inf.nghe_nghiep,
                soDienThoai: inf.so_dien_thoai,
                // Basic date check
                ngaySinh: inf.ngay_sinh ? dayjs(inf.ngay_sinh, 'DD/MM/YYYY') : null,
            });
            setActiveTab('1'); // Switch to form
            message.success('Đã điền dữ liệu vào form!');
        }
    };

    const onFinish = async (values: any) => {
        setLoading(true);
        const formData = new FormData();

        // Helper to append if exists
        const append = (key: string, val: any) => {
            if (val) formData.append(key, val);
        };

        if (record?.id) formData.append('id', record.id);
        append('hoTen', values.hoTen);
        append('soCMND', values.soCMND);
        append('soCCCD', values.soCCCD);
        append('gioiTinh', values.gioiTinh);
        if (values.ngaySinh) append('ngaySinh', values.ngaySinh.format('DD/MM/YYYY'));
        append('queQuan', values.queQuan);
        append('noiThuongTru', values.noiThuongTru);
        append('noiOHienTai', values.noiOHienTai);
        append('soDienThoai', values.soDienThoai);
        append('danToc', values.danToc);
        append('tonGiao', values.tonGiao);
        append('ngheNghiep', values.ngheNghiep);
        append('ghiChu', values.ghiChu);

        let result;
        if (record) {
            result = await updateCongDan(record.id, formData);
        } else {
            result = await createCongDan(formData);
        }

        if (result.success) {
            message.success(result.message);
            onCancel();
            setFileList([]);
            setOcrResult(null);
        } else {
            message.error(result.message);
        }
        setLoading(false);
    };

    const tabItems = [
        {
            key: '1',
            label: <span><UploadOutlined /> Thông tin chi tiết</span>,
            children: (
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="hoTen" label="Họ và tên" rules={[{ required: true }]}>
                                <Input placeholder="Nhập họ tên" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="gioiTinh" label="Giới tính">
                                <Select placeholder="Chọn">
                                    <Option value="Nam">Nam</Option>
                                    <Option value="Nữ">Nữ</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="ngaySinh" label="Ngày sinh">
                                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} placeholder="dd/mm/yyyy" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="soCCCD" label="Số CCCD">
                                <Input placeholder="12 chữ số" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="soCMND" label="Số CMND (cũ)">
                                <Input placeholder="9 chữ số" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="danToc" label="Dân tộc"><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="tonGiao" label="Tôn giáo"><Input /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="queQuan" label="Quê quán">
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="noiThuongTru" label="Nơi thường trú">
                                <TextArea rows={2} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="noiOHienTai" label="Nơi ở hiện tại">
                                <TextArea rows={2} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="soDienThoai" label="Số điện thoại"><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="ngheNghiep" label="Nghề nghiệp"><Input /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="ghiChu" label="Ghi chú">
                                <TextArea />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ textAlign: 'right', marginTop: 16 }}>
                        <Button onClick={onCancel} style={{ marginRight: 8 }}>Hủy</Button>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                            {record ? 'Cập nhật' : 'Lưu mới'}
                        </Button>
                    </div>
                </Form>
            )
        },
        {
            key: '2',
            label: <span><ScanOutlined /> Quét ảnh (OCR)</span>,
            children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Card size="small" title="Cấu hình & Tải ảnh">
                        <Input.Password
                            placeholder="Nhập Gemini API Key (Bắt buộc)"
                            value={apiKey}
                            onChange={handleApiKeyChange}
                            style={{ marginBottom: 12 }}
                        />
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            onChange={({ fileList }) => setFileList(fileList)}
                            beforeUpload={() => false} // Manual upload
                            maxCount={1}
                        >
                            {fileList.length < 1 && <div><UploadOutlined /><div style={{ marginTop: 8 }}>Tải ảnh</div></div>}
                        </Upload>
                        <Button
                            type="primary"
                            block
                            icon={<ScanOutlined />}
                            onClick={handleOCR}
                            loading={ocrLoading}
                            disabled={!apiKey || fileList.length === 0}
                            style={{ marginTop: 16, background: '#7b1fa2', borderColor: '#7b1fa2' }}
                        >
                            Phân tích hình ảnh
                        </Button>
                    </Card>

                    {ocrResult && (
                        <Card size="small" title="Kết quả phân tích" extra={<Button size="small" type="primary" onClick={applyOCRData}>Điền vào form</Button>}>
                            <div style={{ maxHeight: 300, overflow: 'auto', background: '#f5f5f5', padding: 10, borderRadius: 4 }}>
                                <pre style={{ fontSize: 11 }}>{JSON.stringify(ocrResult, null, 2)}</pre>
                            </div>
                        </Card>
                    )}
                </div>
            )
        }
    ];

    return (
        <Modal
            title={record ? "Cập nhật thông tin công dân" : "Thêm mới công dân"}
            open={open}
            onCancel={onCancel}
            width={800}
            footer={null}
            destroyOnHidden={true}
        >
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        </Modal>
    );
}
