import React, { useState, useEffect } from 'react';
import { Button } from '@/app/ui/components/button';
import { Input } from '@/app/ui/components/input';
import { Modal } from '@/app/ui/components/modal';
import { Tag } from '@/app/ui/components/tag';
import { getBoLuatList } from '@/lib/actions/csv-entities';
import { useDebounce } from 'use-debounce';
import { Search, Plus, Trash2, Gavel } from 'lucide-react';

interface TabLawSelectorProps {
    form: any;
}

const TabLawSelector: React.FC<TabLawSelectorProps> = ({ form }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch] = useDebounce(searchQuery, 300);
    const [laws, setLaws] = useState<any[]>([]);
    const [selectedLaws, setSelectedLaws] = useState<any[]>([]);

    // Load selected laws from form initial values if redundant
    useEffect(() => {
        const stored = form.getFieldValue('thong_tin_bo_luat') || [];
        setSelectedLaws(stored);
    }, []);

    // Fetch laws when modal opens or search changes
    useEffect(() => {
        if (isModalOpen) {
            getBoLuatList(debouncedSearch, 1).then(res => {
                // Handle new return structure { data, total }
                setLaws(res.data || []);
            });
        }
    }, [isModalOpen, debouncedSearch]);

    const handleSelectLaw = (law: any) => {
        const newSelection = [...selectedLaws, law];
        setSelectedLaws(newSelection);
        form.setFieldValue('thong_tin_bo_luat', newSelection);
        setIsModalOpen(false);
    };

    const handleRemoveLaw = (index: number) => {
        const newSelection = [...selectedLaws];
        newSelection.splice(index, 1);
        setSelectedLaws(newSelection);
        form.setFieldValue('thong_tin_bo_luat', newSelection);
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-purple-50 rounded-xl p-6 mb-6 flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center m-0">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3 text-white">
                            <Gavel size={20} />
                        </div>
                        Điều luật áp dụng
                    </h3>
                </div>
                <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsModalOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                    Chọn điều luật
                </Button>
            </div>

            {/* Selected Laws List */}
            {selectedLaws.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center bg-gray-50 rounded-xl border-dashed border-2 border-gray-100">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <Search size={32} />
                    </div>
                    <p className="text-gray-500 font-medium">Chưa có điều luật nào được chọn</p>
                    <Button variant="ghost" onClick={() => setIsModalOpen(true)} className="text-purple-600 hover:text-purple-700">
                        + Thêm ngay
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {selectedLaws.map((law, idx) => (
                        <div key={idx} className="group relative bg-white rounded-xl p-6 transition-all hover:bg-gray-50 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg m-0 text-gray-800">{law.toiDanh}</h4>
                                    <div className="text-gray-500 mt-2 flex flex-wrap gap-2">
                                        <Tag className="bg-purple-100 text-purple-700 border-none">Điều {law.dieu}</Tag>
                                        <Tag className="bg-gray-100 text-gray-700 border-none">Khoản {law.khoan}</Tag>
                                        {law.nhanDieuLuat && <span className="text-sm italic text-gray-500 self-center">{law.nhanDieuLuat}</span>}
                                    </div>
                                    <p className="mt-3 text-gray-600 bg-gray-50 p-3 rounded-lg text-sm leading-relaxed mb-0">{law.noiDung}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    icon={<Trash2 size={16} />}
                                    onClick={() => handleRemoveLaw(idx)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Law Selector Modal */}
            <Modal
                title="Chọn điều luật"
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                width={800}
            >
                <div className="py-2">
                    <div className="relative mb-6">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Tìm kiếm tội danh, điều luật..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[500px] overflow-y-auto space-y-2">
                        {laws.length > 0 ? (
                            laws.map((law: any, i) => (
                                <div
                                    key={i}
                                    className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer border-b border-gray-100 last:border-0"
                                    onClick={() => handleSelectLaw(law)}
                                >
                                    <div>
                                        <div className="font-semibold text-gray-800">Điều {law.dieu} - {law.toiDanh}</div>
                                        <div className="line-clamp-2 text-sm text-gray-500 mt-1">{law.noiDung}</div>
                                    </div>
                                    <Button variant="ghost" className="text-purple-600 hover:bg-purple-50 font-medium whitespace-nowrap">
                                        Chọn
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                Không tìm thấy dữ liệu
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TabLawSelector;
