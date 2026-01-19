import React, { useState, useEffect } from 'react';
import { Button } from '@/app/ui/components/button';
import { Input } from '@/app/ui/components/input';
import { Select } from '@/app/ui/components/select';
import { Plus, Trash2, User } from 'lucide-react';

interface TabParticipantsProps {
    form: any;
}

interface Participant {
    id_cong_dan: string;
    vai_tro: string;
    mo_ta: string;
}

const TabParticipants: React.FC<TabParticipantsProps> = ({ form }) => {
    // Initial dummy state or from form
    const [participants, setParticipants] = useState<Participant[]>([]);

    useEffect(() => {
        const stored = form.getFieldValue('thong_tin_nguoi_tham_gia') || [];
        setParticipants(stored);
    }, []);

    const updateForm = (newData: Participant[]) => {
        setParticipants(newData);
        form.setFieldValue('thong_tin_nguoi_tham_gia', newData);
    };

    const addParticipant = () => {
        updateForm([...participants, { id_cong_dan: '', vai_tro: 'khac', mo_ta: '' }]);
    };

    const removeParticipant = (index: number) => {
        const newData = [...participants];
        newData.splice(index, 1);
        updateForm(newData);
    };

    const handleChange = (index: number, field: keyof Participant, value: any) => {
        const newData = [...participants];
        newData[index] = { ...newData[index], [field]: value };
        updateForm(newData);
    };

    return (
        <div className="max-w-3xl">
            <div className="space-y-4">
                {/* Header Row */}
                {participants.length > 0 && (
                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        <div className="col-span-4">Mã định danh</div>
                        <div className="col-span-3">Vai trò</div>
                        <div className="col-span-4">Ghi chú</div>
                        <div className="col-span-1"></div>
                    </div>
                )}

                {participants.map((item, index) => (
                    <div
                        key={index}
                        className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4 border border-gray-100"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                            {/* Field 1: ID */}
                            <div className="md:col-span-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <User size={16} />
                                    </div>
                                    <input
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập mã công dân..."
                                        value={item.id_cong_dan}
                                        onChange={(e) => handleChange(index, 'id_cong_dan', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Field 2: Role */}
                            <div className="md:col-span-3">
                                <Select
                                    value={item.vai_tro}
                                    onChange={(val: string) => handleChange(index, 'vai_tro', val)}
                                    options={[
                                        { label: 'Bị can / Bị cáo', value: 'bi_can' },
                                        { label: 'Bị hại', value: 'bi_hai' },
                                        { label: 'Người làm chứng', value: 'nguoi_lam_chung' },
                                        { label: 'Người liên quan', value: 'nguoi_lien_quan' },
                                        { label: 'Khác', value: 'khac' }
                                    ]}
                                />
                            </div>

                            {/* Field 3: Note */}
                            <div className="md:col-span-4">
                                <Input
                                    placeholder="Ghi chú thêm..."
                                    value={item.mo_ta}
                                    onChange={(e: any) => handleChange(index, 'mo_ta', e.target.value)}
                                />
                            </div>

                            {/* Action: Delete */}
                            <div className="md:col-span-1 flex justify-end pt-1">
                                <Button
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    icon={<Trash2 size={16} />}
                                    onClick={() => removeParticipant(index)}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add Button */}
                <div
                    onClick={addParticipant}
                    className="bg-gray-50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-all group border border-dashed border-gray-200 hover:border-blue-200"
                >
                    <div className="w-10 h-10 rounded-full bg-white text-blue-600 shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Plus size={20} />
                    </div>
                    <p className="text-gray-500 font-medium group-hover:text-blue-600 m-0">Thêm người tham gia tố tụng</p>
                </div>
            </div>
        </div>
    );
};

export default TabParticipants;
