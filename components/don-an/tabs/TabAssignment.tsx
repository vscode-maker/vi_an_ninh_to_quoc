import React, { useState, useEffect } from 'react';
import { Button } from '@/app/ui/components/button';
import { Input } from '@/app/ui/components/input';
import { Select } from '@/app/ui/components/select';
import { Plus, Trash2 } from 'lucide-react';

interface TabAssignmentProps {
    form: any;
}

interface AssignmentItem {
    ho_ten: string;
    don_vi: string;
    vai_tro: string;
}

const TabAssignment: React.FC<TabAssignmentProps> = ({ form }) => {
    const [assignments, setAssignments] = useState<AssignmentItem[]>([]);

    useEffect(() => {
        const stored = form.getFieldValue('thong_tin_phan_cong') || [];
        setAssignments(stored);
    }, []);

    const updateForm = (newData: AssignmentItem[]) => {
        setAssignments(newData);
        form.setFieldValue('thong_tin_phan_cong', newData);
    };

    const addItem = () => {
        updateForm([...assignments, { ho_ten: '', don_vi: '', vai_tro: 'thanh_vien' }]);
    };

    const removeItem = (index: number) => {
        const newData = [...assignments];
        newData.splice(index, 1);
        updateForm(newData);
    };

    const handleChange = (index: number, field: keyof AssignmentItem, value: any) => {
        const newData = [...assignments];
        newData[index] = { ...newData[index], [field]: value };
        updateForm(newData);
    };

    return (
        <div className="max-w-3xl">
            <div className="space-y-4">
                {assignments.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-5">
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Cán bộ / Điều tra viên</label>
                                <Input
                                    placeholder="Họ và tên..."
                                    value={item.ho_ten}
                                    onChange={(e: any) => handleChange(index, 'ho_ten', e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-4">
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Đơn vị</label>
                                <Input
                                    placeholder="Đơn vị công tác..."
                                    value={item.don_vi}
                                    onChange={(e: any) => handleChange(index, 'don_vi', e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Vai trò</label>
                                <Select
                                    value={item.vai_tro}
                                    onChange={(val: string) => handleChange(index, 'vai_tro', val)}
                                    options={[
                                        { label: 'Chủ trì', value: 'chu_tri' },
                                        { label: 'Phối hợp', value: 'phoi_hop' },
                                        { label: 'Hỗ trợ', value: 'ho_tro' }
                                    ]}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-2">
                            <Button
                                variant="ghost"
                                className="text-red-500 hover:text-red-700 text-xs"
                                icon={<Trash2 size={14} />}
                                onClick={() => removeItem(index)}
                            >Xóa</Button>
                        </div>
                    </div>
                ))}

                <Button
                    variant="ghost"
                    onClick={addItem}
                    icon={<Plus size={16} />}
                    className="w-full h-12 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl border-dashed border-gray-300 font-medium"
                >
                    Thêm phân công
                </Button>
            </div>
        </div>
    );
};

export default TabAssignment;
