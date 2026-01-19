import React, { useState, useEffect } from 'react';
import { Button } from '@/app/ui/components/button';
import { Input } from '@/app/ui/components/input';
import { Select } from '@/app/ui/components/select';
import { Plus, Trash2 } from 'lucide-react';

interface TabDamageProps {
    form: any;
}

interface DamageItem {
    loai_thiet_hai: string;
    gia_tri: number | string;
    mo_ta: string;
}

const TabDamage: React.FC<TabDamageProps> = ({ form }) => {
    const [damages, setDamages] = useState<DamageItem[]>([]);

    useEffect(() => {
        const stored = form.getFieldValue('thong_tin_thiet_hai') || [];
        setDamages(stored);
    }, []);

    const updateForm = (newData: DamageItem[]) => {
        setDamages(newData);
        form.setFieldValue('thong_tin_thiet_hai', newData);
    };

    const addDamage = () => {
        updateForm([...damages, { loai_thiet_hai: 'tai_san', gia_tri: 0, mo_ta: '' }]);
    };

    const removeDamage = (index: number) => {
        const newData = [...damages];
        newData.splice(index, 1);
        updateForm(newData);
    };

    const handleChange = (index: number, field: keyof DamageItem, value: any) => {
        const newData = [...damages];
        newData[index] = { ...newData[index], [field]: value };
        updateForm(newData);
    };

    return (
        <div className="max-w-3xl">
            <div className="space-y-3">
                {damages.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-sm transition-all border border-gray-100">
                        <div className="w-full sm:w-1/4">
                            <Select
                                value={item.loai_thiet_hai}
                                onChange={(val: string) => handleChange(index, 'loai_thiet_hai', val)}
                                options={[
                                    { label: 'Tài sản', value: 'tai_san' },
                                    { label: 'Sức khỏe', value: 'suc_khoe' },
                                    { label: 'Tinh thần', value: 'tinh_than' },
                                    { label: 'Khác', value: 'khac' }
                                ]}
                            />
                        </div>

                        <div className="w-full sm:w-1/4">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">₫</span>
                                <input
                                    type="number"
                                    className="w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Giá trị"
                                    value={item.gia_tri}
                                    onChange={(e) => handleChange(index, 'gia_tri', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="w-full sm:w-2/5">
                            <Input
                                placeholder="Mô tả chi tiết..."
                                value={item.mo_ta}
                                onChange={(e: any) => handleChange(index, 'mo_ta', e.target.value)}
                            />
                        </div>

                        <div className="w-auto ml-auto">
                            <Button
                                variant="ghost"
                                className="text-red-500 hover:bg-red-50"
                                icon={<Trash2 size={16} />}
                                onClick={() => removeDamage(index)}
                            />
                        </div>
                    </div>
                ))}

                <Button
                    variant="ghost"
                    onClick={addDamage}
                    icon={<Plus size={16} />}
                    className="w-full h-14 bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-dashed border-gray-200"
                >
                    Thêm thiệt hại
                </Button>
            </div>
        </div>
    );
};

export default TabDamage;
