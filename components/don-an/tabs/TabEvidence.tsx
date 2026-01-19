import React, { useState, useEffect } from 'react';
import { Button } from '@/app/ui/components/button';
import { Input } from '@/app/ui/components/input';
import { Plus, Trash2 } from 'lucide-react';

interface TabEvidenceProps {
    form: any;
}

interface EvidenceItem {
    ten_vat_chung: string;
    loai_vat_chung: string;
    so_luong: number | string;
    don_vi: string;
    noi_bao_quan: string;
    mo_ta: string;
}

const TabEvidence: React.FC<TabEvidenceProps> = ({ form }) => {
    const [evidence, setEvidence] = useState<EvidenceItem[]>([]);

    useEffect(() => {
        const stored = form.getFieldValue('thong_tin_vat_chung') || [];
        setEvidence(stored);
    }, []);

    const updateForm = (newData: EvidenceItem[]) => {
        setEvidence(newData);
        form.setFieldValue('thong_tin_vat_chung', newData);
    };

    const addItem = () => {
        updateForm([...evidence, {
            ten_vat_chung: '',
            loai_vat_chung: '',
            so_luong: 1,
            don_vi: '',
            noi_bao_quan: '',
            mo_ta: ''
        }]);
    };

    const removeItem = (index: number) => {
        const newData = [...evidence];
        newData.splice(index, 1);
        updateForm(newData);
    };

    const handleChange = (index: number, field: keyof EvidenceItem, value: any) => {
        const newData = [...evidence];
        newData[index] = { ...newData[index], [field]: value };
        updateForm(newData);
    };

    return (
        <div className="max-w-3xl">
            <div className="space-y-4">
                {evidence.map((item, index) => (
                    <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-6">
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Tên vật chứng</label>
                                <Input
                                    placeholder="Nhập tên..."
                                    value={item.ten_vat_chung}
                                    onChange={(e: any) => handleChange(index, 'ten_vat_chung', e.target.value)}
                                />
                            </div>
                            <div className="col-span-4">
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Loại</label>
                                <Input
                                    placeholder="Loại..."
                                    value={item.loai_vat_chung}
                                    onChange={(e: any) => handleChange(index, 'loai_vat_chung', e.target.value)}
                                />
                            </div>
                            <div className="col-span-2 flex items-end justify-end pb-1">
                                <Button
                                    variant="ghost"
                                    className="text-red-500 hover:bg-red-50"
                                    icon={<Trash2 size={16} />}
                                    onClick={() => removeItem(index)}
                                />
                            </div>

                            <div className="col-span-3">
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">SL</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                    value={item.so_luong}
                                    onChange={(e) => handleChange(index, 'so_luong', e.target.value)}
                                />
                            </div>
                            <div className="col-span-3">
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Đơn vị</label>
                                <Input
                                    placeholder="Cái/Chiếc..."
                                    value={item.don_vi}
                                    onChange={(e: any) => handleChange(index, 'don_vi', e.target.value)}
                                />
                            </div>
                            <div className="col-span-6">
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Nơi bảo quản</label>
                                <Input
                                    placeholder="Kho..."
                                    value={item.noi_bao_quan}
                                    onChange={(e: any) => handleChange(index, 'noi_bao_quan', e.target.value)}
                                />
                            </div>

                            <div className="col-span-12">
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Mô tả chi tiết / Tình trạng</label>
                                <Input
                                    placeholder="Mô tả thêm..."
                                    value={item.mo_ta}
                                    onChange={(e: any) => handleChange(index, 'mo_ta', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <Button
                    variant="ghost"
                    onClick={addItem}
                    icon={<Plus size={16} />}
                    className="w-full h-12 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl border-dashed border border-indigo-200 font-medium"
                >
                    Thêm vật chứng
                </Button>
            </div>
        </div>
    );
};

export default TabEvidence;
