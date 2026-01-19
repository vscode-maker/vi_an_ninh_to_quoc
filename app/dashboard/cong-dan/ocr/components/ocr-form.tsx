'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Upload, Scan, Save, Trash2, CheckCircle, RefreshCw,
    FileImage, Loader2, Plus, Send,
    ZoomIn, ZoomOut, Maximize, X, ArrowLeft
} from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Card } from '@/app/ui/components/card';
import { Button } from '@/app/ui/components/button';
import { Input } from '@/app/ui/components/input';
import { Select } from '@/app/ui/components/select';
import { TextArea } from '@/app/ui/components/textarea';
import { FileUpload } from '@/app/ui/components/file-upload';
import { createCongDanFromOCR, testZaloNotification } from '@/lib/cong-dan-actions';

interface OCRResult {
    ho_ten: string;
    ngay_sinh?: string;
    gioi_tinh?: string;
    dan_toc?: string;
    ton_giao?: string;
    tinh_trang_hon_nhan?: string;
    so_CMND?: string;
    so_CCCD?: string;
    ngay_cap?: string;
    noi_cap?: string;
    que_quan?: string;
    noi_dang_ky_khai_sinh?: string;
    noi_thuong_tru?: string;
    noi_o_hien_tai?: string;
    nghe_nghiep?: string;
    so_dien_thoai?: string;
    thong_tin_gia_dinh: Array<{
        ho_ten?: string;
        moi_quan_he?: string;
        so_CMND?: string;
        so_CCCD?: string;
    }>;
    thong_tin_thanh_vien_trong_ho: Array<{
        quan_he?: string;
        ho_ten?: string;
        so_CMND?: string;
        so_CCCD?: string;
    }>;
    [key: string]: any;
}

const initialFormState: OCRResult = {
    ho_ten: '',
    ngay_sinh: '',
    gioi_tinh: '',
    dan_toc: '',
    ton_giao: '',
    tinh_trang_hon_nhan: '',
    so_CMND: '',
    so_CCCD: '',
    ngay_cap: '',
    noi_cap: '',
    que_quan: '',
    noi_dang_ky_khai_sinh: '',
    noi_thuong_tru: '',
    noi_o_hien_tai: '',
    nghe_nghiep: '',
    so_dien_thoai: '',
    thong_tin_gia_dinh: [],
    thong_tin_thanh_vien_trong_ho: []
};

export default function OCRCongDanForm() {
    const router = useRouter();
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testingZalo, setTestingZalo] = useState(false);
    const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
    const [formData, setFormData] = useState<OCRResult>(initialFormState);
    const [error, setError] = useState<string | null>(null);

    // Image Viewer State
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    useEffect(() => {
        // Generate previews
        const urls = files.map(file => URL.createObjectURL(file));
        setPreviewUrls(urls);
        return () => {
            urls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [files]);

    const convertFileToBase64 = (file: File): Promise<{ mimeType: string; base64: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new window.Image();
                img.onload = () => {
                    // Resize logic
                    const MAX_WIDTH = 1500;
                    const MAX_HEIGHT = 1500;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // Compress to JPEG 0.8
                    const base64 = dataUrl.split(',')[1];
                    resolve({ mimeType: 'image/jpeg', base64 });
                };
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleOCR = useCallback(async () => {
        if (files.length === 0) {
            alert('Vui lòng chọn ít nhất một hình ảnh');
            return;
        }

        setLoading(true);
        setError(null);
        setOcrResult(null);

        try {
            // Convert all files to base64
            const images = await Promise.all(
                files.map((f) => convertFileToBase64(f))
            );

            // Call OCR API
            const response = await fetch('/api/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images }),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'OCR thất bại');
            }

            setOcrResult(result.data);
            setFormData({
                ...initialFormState,
                ...result.data,
                thong_tin_gia_dinh: result.data.thong_tin_gia_dinh || [],
                thong_tin_thanh_vien_trong_ho: result.data.thong_tin_thanh_vien_trong_ho || []
            });
            alert('Trích xuất thông tin thành công!');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Đã có lỗi xảy ra';
            setError(errorMessage);
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [files]);

    const handleSave = async () => {
        if (!ocrResult) {
            alert('Chưa có dữ liệu để lưu');
            return;
        }

        // Validation
        if (!formData.ho_ten) {
            alert('Họ tên là bắt buộc!');
            return;
        }
        if (!formData.so_CCCD && !formData.so_CMND) {
            const confirm = window.confirm('Thiếu số giấy tờ tùy thân (CCCD/CMND). Bạn có chắc muốn lưu không?');
            if (!confirm) return;
        }

        setSaving(true);
        try {
            const result = await createCongDanFromOCR(formData);

            if (result.success) {
                alert(result.message);
                // Reset form
                setFiles([]);
                setOcrResult(null);
                setFormData(initialFormState);
                // Navigate to citizen list
                router.push('/dashboard/cong-dan');
            } else {
                alert(result.message);
            }
        } catch (err) {
            alert('Vui lòng kiểm tra lại thông tin');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setOcrResult(null);
        setError(null);
        setFormData(initialFormState);
    };

    const handleTestZalo = async () => {
        setTestingZalo(true);
        try {
            const result = await testZaloNotification();
            if (result.success) {
                alert(result.message);
            } else {
                alert(result.message);
            }
        } catch (err) {
            alert('Lỗi khi test Zalo');
        } finally {
            setTestingZalo(false);
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Helper for nested arrays (family members)
    const updateArrayItem = (arrayName: 'thong_tin_gia_dinh' | 'thong_tin_thanh_vien_trong_ho', index: number, field: string, value: any) => {
        setFormData(prev => {
            const newArray = [...prev[arrayName]];
            newArray[index] = { ...newArray[index], [field]: value };
            return { ...prev, [arrayName]: newArray };
        });
    };

    const addArrayItem = (arrayName: 'thong_tin_gia_dinh' | 'thong_tin_thanh_vien_trong_ho') => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: [...prev[arrayName], {}]
        }));
    };

    const removeArrayItem = (arrayName: 'thong_tin_gia_dinh' | 'thong_tin_thanh_vien_trong_ho', index: number) => {
        setFormData(prev => {
            const newArray = [...prev[arrayName]];
            newArray.splice(index, 1);
            return { ...prev, [arrayName]: newArray };
        });
    };

    const genderOptions = [
        { label: 'Nam', value: 'Nam' },
        { label: 'Nữ', value: 'Nữ' }
    ];

    return (
        <div className="p-6 max-w-[1400px] mx-auto min-h-screen bg-gray-50">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Scan className="text-blue-600" /> OCR Công Dân
                </h1>
                <Button
                    variant="ghost"
                    onClick={handleTestZalo}
                    loading={testingZalo}
                    icon={<Send size={16} />}
                >
                    Test Zalo
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column - Upload */}
                <div className="lg:col-span-5 flex flex-col h-[calc(100vh-140px)] sticky top-6">
                    {previewImage ? (
                        <Card className="flex-1 flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <FileImage size={18} className="text-blue-600" />
                                    Xem chi tiết
                                </h3>
                                <Button variant="ghost" size="sm" onClick={() => setPreviewImage(null)} icon={<X size={18} />} />
                            </div>
                            <div className="flex-1 relative overflow-hidden bg-slate-900/5 select-none">
                                <ImageViewer src={previewImage} />
                            </div>
                        </Card>
                    ) : (
                        <Card
                            className="flex-1 flex flex-col"
                            title={
                                <div className="flex items-center gap-2">
                                    <FileImage size={20} />
                                    <span>Tải lên hình ảnh</span>
                                </div>
                            }
                        >
                            <FileUpload
                                value={files}
                                onChange={setFiles}
                                multiple
                                accept="image/*"
                                maxSizeInMB={5}
                            />

                            {/* Thumbnails */}
                            {files.length > 0 && (
                                <div className="mt-4 grid grid-cols-4 gap-2">
                                    {files.map((file, idx) => (
                                        <div
                                            key={idx}
                                            className="aspect-square rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all relative group"
                                            onClick={() => setPreviewImage(previewUrls[idx])}
                                            title="Click để phóng to"
                                        >
                                            <img
                                                src={previewUrls[idx]}
                                                alt={`Preview ${idx}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                <Maximize className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" size={20} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="my-6 border-t border-gray-100"></div>

                            <div className="flex justify-center gap-3 mt-auto">
                                <Button
                                    variant="primary"
                                    icon={<Scan size={18} />}
                                    size="lg"
                                    onClick={handleOCR}
                                    loading={loading}
                                    disabled={files.length === 0}
                                >
                                    Trích xuất thông tin
                                </Button>
                                <Button
                                    variant="outline"
                                    icon={<Trash2 size={18} />}
                                    onClick={handleReset}
                                    disabled={loading || (files.length === 0 && !ocrResult)}
                                >
                                    Xóa tất cả
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Column - Results */}
                <div className="lg:col-span-7">
                    <Card
                        title={
                            <div className="flex items-center gap-2">
                                <CheckCircle size={20} />
                                <span>Kết quả trích xuất</span>
                            </div>
                        }
                        actions={ocrResult ? [
                            <Button icon={<RefreshCw size={16} />} onClick={handleOCR} disabled={loading} variant="ghost" className="w-full">
                                Trích xuất lại
                            </Button>,
                            <Button icon={<Save size={16} />} onClick={handleSave} loading={saving} variant="primary" className="w-full">
                                Lưu vào hệ thống
                            </Button>
                        ] : []}
                    >
                        {loading && (
                            <div className="text-center py-16">
                                <Loader2 className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-4" />
                                <p className="text-gray-500">Đang trích xuất thông tin...</p>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
                                <span className="font-bold">Lỗi:</span> {error}
                            </div>
                        )}

                        {!loading && !ocrResult && !error && (
                            <div className="text-center py-16 text-gray-400">
                                <FileImage size={64} className="mx-auto mb-4 opacity-50" />
                                <p>Tải lên ảnh và nhấn "Trích xuất thông tin" để bắt đầu</p>
                            </div>
                        )}

                        {ocrResult && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input
                                        label="Họ và tên"
                                        value={formData.ho_ten}
                                        onChange={(e) => updateField('ho_ten', e.target.value)}
                                        error={!formData.ho_ten ? 'Bắt buộc' : ''}
                                    />
                                    <Input
                                        label="Ngày sinh"
                                        value={formData.ngay_sinh}
                                        onChange={(e) => updateField('ngay_sinh', e.target.value)}
                                        placeholder="dd/mm/yyyy"
                                    />
                                    <Select
                                        label="Giới tính"
                                        options={genderOptions}
                                        value={formData.gioi_tinh}
                                        onChange={(e) => updateField('gioi_tinh', e.target.value)}
                                    />
                                    <Input
                                        label="Số CCCD"
                                        value={formData.so_CCCD}
                                        onChange={(e) => updateField('so_CCCD', e.target.value)}
                                    />
                                    <Input
                                        label="Số CMND"
                                        value={formData.so_CMND}
                                        onChange={(e) => updateField('so_CMND', e.target.value)}
                                    />
                                    <Input
                                        label="Ngày cấp"
                                        value={formData.ngay_cap}
                                        onChange={(e) => updateField('ngay_cap', e.target.value)}
                                    />
                                    <Input
                                        label="Nơi cấp"
                                        value={formData.noi_cap}
                                        onChange={(e) => updateField('noi_cap', e.target.value)}
                                    />
                                    <Input
                                        label="Dân tộc"
                                        value={formData.dan_toc}
                                        onChange={(e) => updateField('dan_toc', e.target.value)}
                                    />
                                    <Input
                                        label="Tôn giáo"
                                        value={formData.ton_giao}
                                        onChange={(e) => updateField('ton_giao', e.target.value)}
                                    />
                                    <Input
                                        label="Tình trạng hôn nhân"
                                        value={formData.tinh_trang_hon_nhan}
                                        onChange={(e) => updateField('tinh_trang_hon_nhan', e.target.value)}
                                    />
                                    <Input
                                        label="Nghề nghiệp"
                                        value={formData.nghe_nghiep}
                                        onChange={(e) => updateField('nghe_nghiep', e.target.value)}
                                    />
                                    <Input
                                        label="Số điện thoại"
                                        value={formData.so_dien_thoai}
                                        onChange={(e) => updateField('so_dien_thoai', e.target.value)}
                                    />
                                    <div className="sm:col-span-2">
                                        <TextArea
                                            label="Quê quán"
                                            value={formData.que_quan}
                                            onChange={(e) => updateField('que_quan', e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <TextArea
                                            label="Nơi thường trú"
                                            value={formData.noi_thuong_tru}
                                            onChange={(e) => updateField('noi_thuong_tru', e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <TextArea
                                            label="Nơi ở hiện tại"
                                            value={formData.noi_o_hien_tai}
                                            onChange={(e) => updateField('noi_o_hien_tai', e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <TextArea
                                            label="Nơi đăng ký khai sinh"
                                            value={formData.noi_dang_ky_khai_sinh}
                                            onChange={(e) => updateField('noi_dang_ky_khai_sinh', e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                </div>

                                {/* Family Info */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="font-semibold text-gray-800 mb-4">Thông tin gia đình</h3>
                                    <div className="space-y-4">
                                        {formData.thong_tin_gia_dinh.map((item, index) => (
                                            <div key={index} className="bg-gray-50 p-4 rounded-lg relative border border-gray-200">
                                                <button
                                                    onClick={() => removeArrayItem('thong_tin_gia_dinh', index)}
                                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <Input
                                                        label="Họ tên"
                                                        value={item.ho_ten}
                                                        onChange={(e) => updateArrayItem('thong_tin_gia_dinh', index, 'ho_ten', e.target.value)}
                                                    />
                                                    <Input
                                                        label="Mối quan hệ"
                                                        value={item.moi_quan_he}
                                                        onChange={(e) => updateArrayItem('thong_tin_gia_dinh', index, 'moi_quan_he', e.target.value)}
                                                    />
                                                    <Input
                                                        label="CCCD/CMND"
                                                        value={item.so_CCCD}
                                                        onChange={(e) => updateArrayItem('thong_tin_gia_dinh', index, 'so_CCCD', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <Button
                                            onClick={() => addArrayItem('thong_tin_gia_dinh')}
                                            variant="outline"
                                            className="w-full border-dashed"
                                            icon={<Plus size={16} />}
                                        >
                                            Thêm thành viên gia đình
                                        </Button>
                                    </div>
                                </div>

                                {/* Household Info */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="font-semibold text-gray-800 mb-4">Thành viên trong hộ</h3>
                                    <div className="space-y-4">
                                        {formData.thong_tin_thanh_vien_trong_ho.map((item, index) => (
                                            <div key={index} className="bg-gray-50 p-4 rounded-lg relative border border-gray-200">
                                                <button
                                                    onClick={() => removeArrayItem('thong_tin_thanh_vien_trong_ho', index)}
                                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <Input
                                                        label="Họ tên"
                                                        value={item.ho_ten}
                                                        onChange={(e) => updateArrayItem('thong_tin_thanh_vien_trong_ho', index, 'ho_ten', e.target.value)}
                                                    />
                                                    <Input
                                                        label="Quan hệ với chủ hộ"
                                                        value={item.quan_he}
                                                        onChange={(e) => updateArrayItem('thong_tin_thanh_vien_trong_ho', index, 'quan_he', e.target.value)}
                                                    />
                                                    <Input
                                                        label="CCCD/CMND"
                                                        value={item.so_CCCD}
                                                        onChange={(e) => updateArrayItem('thong_tin_thanh_vien_trong_ho', index, 'so_CCCD', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <Button
                                            onClick={() => addArrayItem('thong_tin_thanh_vien_trong_ho')}
                                            variant="outline"
                                            className="w-full border-dashed"
                                            icon={<Plus size={16} />}
                                        >
                                            Thêm thành viên hộ khẩu
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Internal Image View Component
function ImageViewer({ src }: { src: string }) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const imageRef = useRef<HTMLImageElement>(null);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY * -0.001;
        const newScale = Math.min(Math.max(0.5, scale + delta), 4);
        setScale(newScale);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Reset view when src changes
    useEffect(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, [src]);

    return (
        <div
            className="w-full h-full flex items-center justify-center relative overflow-hidden bg-slate-100 cursor-move"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-white/90 p-2 rounded-lg shadow-sm border border-slate-200">
                <button
                    onClick={() => setScale(s => Math.min(s + 0.1, 4))}
                    className="p-1 hover:bg-slate-100 rounded text-slate-700"
                    title="Phóng to"
                >
                    <ZoomIn size={20} />
                </button>
                <button
                    onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                    className="p-1 hover:bg-slate-100 rounded text-slate-700"
                    title="Thu nhỏ"
                >
                    <ZoomOut size={20} />
                </button>
                <button
                    onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
                    className="p-1 hover:bg-slate-100 rounded text-slate-700"
                    title="Mặc định"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            <img
                ref={imageRef}
                src={src}
                alt="View"
                className="max-w-none transition-transform duration-75"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
                draggable={false}
            />
        </div>
    );
}
