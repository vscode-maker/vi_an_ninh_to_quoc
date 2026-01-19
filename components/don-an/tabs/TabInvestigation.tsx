import React, { useState, useEffect } from 'react';
import { Button } from '@/app/ui/components/button';
import { Input } from '@/app/ui/components/input';
import { Plus, Trash2 } from 'lucide-react';

interface TabInvestigationProps {
    form: any;
}

interface InvestigationItem {
    ngay_thuc_hien: string;
    noi_dung: string;
    ket_qua: string;
    dia_diem: string;
}

const TabInvestigation: React.FC<TabInvestigationProps> = ({ form }) => {
    const [items, setItems] = useState<InvestigationItem[]>([]);

    useEffect(() => {
        const stored = form.getFieldValue('thong_tin_qua_trinh_deu_tra') || [];
        setItems(stored);
    }, []);

    const updateForm = (newData: InvestigationItem[]) => {
        setItems(newData);
        form.setFieldValue('thong_tin_qua_trinh_deu_tra', newData);
    };

    const addItem = () => {
        updateForm([...items, { ngay_thuc_hien: '', noi_dung: '', ket_qua: '', dia_diem: '' }]);
    };

    const removeItem = (index: number) => {
        const newData = [...items];
        newData.splice(index, 1);
        updateForm(newData);
    };

    const handleChange = (index: number, field: keyof InvestigationItem, value: any) => {
        const newData = [...items];
        newData[index] = { ...newData[index], [field]: value };
        updateForm(newData);
    };

    return (
        <div className="max-w-3xl">
            <div className="space-y-6">
                {items.map((item, index) => (
                    <div key={index} className="bg-white rounded-xl p-4 hover:bg-gray-50 transition-colors border border-gray-100 shadow-sm">
                        <div className="grid grid-cols-12 gap-4 items-end">
                            <div className="col-span-3">
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Ngày thực hiện</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={item.ngay_thuc_hien}
                                    onChange={(e) => handleChange(index, 'ngay_thuc_hien', e.target.value)}
                                />
                            </div>
                            <div className="col-span-8">
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Nội dung công việc</label>
                                <Input
                                    placeholder="Nội dung bước điều tra..."
                                    value={item.noi_dung}
                                    onChange={(e: any) => handleChange(index, 'noi_dung', e.target.value)}
                                />
                            </div>
                            <div className="col-span-1">
                                <Button
                                    variant="ghost"
                                    className="text-red-500 hover:bg-red-50"
                                    icon={<Trash2 size={16} />}
                                    onClick={() => removeItem(index)}
                                />
                            </div>

                            <div className="col-span-12 mt-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Kết quả</label>
                                        <Input
                                            placeholder="Kết quả đạt được..."
                                            value={item.ket_qua}
                                            onChange={(e: any) => handleChange(index, 'ket_qua', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Địa điểm</label>
                                        <Input
                                            placeholder="Tại..."
                                            value={item.dia_diem}
                                            onChange={(e: any) => handleChange(index, 'dia_diem', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="h-px bg-gray-100 my-4 mx-2" />
                    </div>
                ))}
                <Button
                    variant="ghost"
                    onClick={addItem}
                    icon={<Plus size={16} />}
                    className="w-full h-12 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl border border-dashed border-green-200 font-medium"
                >
                    Thêm nhật ký điều tra
                </Button>
            </div>
        </div>
    );
};

export default TabInvestigation;
