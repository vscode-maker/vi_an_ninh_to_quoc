import React from 'react';
import { Inbox } from 'lucide-react';

const TabAttachments: React.FC<any> = ({ form }) => {
    return (
        <div className="max-w-5xl mx-auto">
            {/* Note Section */}
            <div className="p-4 bg-blue-50 rounded-lg mb-4 text-sm text-blue-800">
                <div className="flex items-center gap-2 mb-1 font-semibold">
                    <Inbox size={16} />
                    Ghi chú
                </div>
                <p className="m-0 text-blue-700">
                    Tính năng upload file đang được phát triển. Vui lòng sử dụng hệ thống quản lý file riêng nếu cần thiết.
                </p>
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/50">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                    <Inbox className="text-gray-400" size={24} />
                </div>
                <p className="text-gray-600 font-medium mb-1">
                    Khu vực tải lên (Tạm thời bị vô hiệu hóa)
                </p>
                <p className="text-gray-400 text-xs">
                    Vui lòng liên hệ quản trị viên để biết thêm chi tiết.
                </p>
            </div>
        </div>
    );
};

export default TabAttachments;
