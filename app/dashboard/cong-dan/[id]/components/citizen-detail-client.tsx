'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    User, Edit, ArrowLeft, Home, CreditCard, Phone, Briefcase,
    Users, Calendar, ChevronRight, UserCircle
} from 'lucide-react';
import { Card } from '@/app/ui/components/card';
import { Tag } from '@/app/ui/components/tag';
import { Button } from '@/app/ui/components/button';
import { Table } from '@/app/ui/components/table';

// Helper for empty value
const DisplayVal = ({ val }: { val?: string | null }) => {
    return val ? <span className="text-gray-900 font-medium">{val}</span> : <span className="text-gray-400 italic">Chưa cập nhật</span>;
};

// Custom Description Item
const DescItem = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-2 border-b border-gray-100 last:border-0">
        <span className="text-sm font-medium text-gray-500 w-[140px] shrink-0">{label}</span>
        <div className="flex-1 text-sm">{children}</div>
    </div>
);

// Custom Section Wrapper (Flat Style)
const Section = ({ title, extra, children, className = '' }: any) => (
    <div className={`mb-8 last:mb-0 ${className}`}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            {extra && <div>{extra}</div>}
        </div>
        <div>{children}</div>
    </div>
);

// Custom Tabs
const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${active
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
    >
        <Icon size={16} />
        {label}
    </button>
);

export default function CitizenDetailClient({ congDan, relationData, householdData }: any) {
    const [activeTab, setActiveTab] = useState('1');

    // Family Columns for Custom Table
    const familyColumns = [
        {
            title: 'Họ tên',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: any) => (
                <div className="flex items-center gap-2">
                    {record.avatar ? (
                        <img src={record.avatar} alt={text} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                        <UserCircle size={24} className="text-gray-300" />
                    )}
                    <Link href={`/dashboard/cong-dan/${record.id}`} className="text-blue-600 hover:underline font-medium">
                        {text}
                    </Link>
                </div>
            )
        },
        {
            title: 'Quan hệ',
            dataIndex: 'relation',
            key: 'relation',
            render: (text: string) => <Tag color="blue">{text}</Tag>
        },
        { title: 'CCCD/CMND', dataIndex: 'cccd', key: 'cccd' },
    ];

    // Household Columns
    const householdColumns = [
        {
            title: 'Họ tên',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: any) => (
                <Link href={`/dashboard/cong-dan/${record.id}`} className="text-blue-600 hover:underline font-medium">
                    {text}
                </Link>
            )
        },
        {
            title: 'Vai trò',
            dataIndex: 'relation',
            key: 'relation',
            render: (text: string) => text === 'Chủ hộ' ? <Tag color="yellow">Chủ hộ</Tag> : <span className="text-gray-500">Thành viên</span>
        },
        { title: 'Ngày sinh', dataIndex: 'dob', key: 'dob' },
        { title: 'CCCD', dataIndex: 'cccd', key: 'cccd' },
    ];

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return <span className="text-gray-400 italic">Chưa cập nhật</span>;
        return <span className="text-gray-900 font-medium">{dateStr}</span>;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Breadcrumb Navigation */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
                    <nav className="flex items-center text-sm text-gray-500">
                        <Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link>
                        <ChevronRight size={16} className="mx-2" />
                        <Link href="/dashboard/cong-dan" className="hover:text-gray-900">Danh sách công dân</Link>
                        <ChevronRight size={16} className="mx-2" />
                        <span className="font-medium text-gray-900">{congDan.hoTen}</span>
                    </nav>
                    <Link href="/dashboard/cong-dan">
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={<ArrowLeft size={16} />}
                        >
                            Quay lại
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* LEFT COLUMN: Overview */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-6 text-center sticky top-24 border border-gray-200">
                            <div className="mb-4 flex flex-col items-center">
                                <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center mb-4 overflow-hidden border-4 border-white shadow-md">
                                    {congDan.hinhAnh ? (
                                        <img src={congDan.hinhAnh} alt={congDan.hoTen} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={64} className="text-blue-500" />
                                    )}
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{congDan.hoTen}</h2>
                                <div className="flex gap-2">
                                    {congDan.chuHo && <Tag color="yellow">Chủ hộ</Tag>}
                                    <Tag color={congDan.gioiTinh === 'Nam' ? 'blue' : 'magenta'}>{congDan.gioiTinh || 'N/A'}</Tag>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 my-4"></div>

                            <div className="text-left space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="flex items-center gap-2 text-gray-500"><Calendar size={14} /> Ngày sinh:</span>
                                    {formatDate(congDan.ngaySinh)}
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="flex items-center gap-2 text-gray-500"><Phone size={14} /> Điện thoại:</span>
                                    <DisplayVal val={congDan.soDienThoai} />
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="flex items-center gap-2 text-gray-500"><Briefcase size={14} /> Nghề nghiệp:</span>
                                    <DisplayVal val={congDan.ngheNghiep} />
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 ml-6">Dân tộc:</span>
                                    <DisplayVal val={congDan.danToc} />
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 ml-6">Tôn giáo:</span>
                                    <DisplayVal val={congDan.tonGiao} />
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 ml-6">Hôn nhân:</span>
                                    <DisplayVal val={congDan.tinhTrangHonNhan} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Details */}
                    <div className="md:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px] flex flex-col">
                            {/* Tabs Header */}
                            <div className="flex border-b border-gray-200 px-2 overflow-x-auto">
                                <TabButton
                                    active={activeTab === '1'}
                                    onClick={() => setActiveTab('1')}
                                    icon={CreditCard}
                                    label="Thông tin Định danh & Cư trú"
                                />
                                <TabButton
                                    active={activeTab === '2'}
                                    onClick={() => setActiveTab('2')}
                                    icon={Users}
                                    label="Quan hệ & Hộ khẩu"
                                />
                            </div>

                            {/* Tabs Content */}
                            <div className="p-6">
                                {activeTab === '1' && (
                                    <div className="space-y-6">
                                        <Section title="Giấy tờ tùy thân">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                                                <DescItem label="Số CCCD"><DisplayVal val={congDan.soCCCD} /></DescItem>
                                                <DescItem label="Số CMND (cũ)"><DisplayVal val={congDan.soCMND} /></DescItem>
                                                <DescItem label="Ngày cấp">{formatDate(congDan.ngayCap)}</DescItem>
                                                <DescItem label="Nơi cấp"><DisplayVal val={congDan.noiCap} /></DescItem>
                                            </div>
                                        </Section>

                                        <Section title="Thông tin Cư trú">
                                            <div className="flex flex-col">
                                                <DescItem label="Quê quán"><DisplayVal val={congDan.queQuan} /></DescItem>
                                                <DescItem label="Nơi ĐK Khai sinh"><DisplayVal val={congDan.noiDangKyKhaiSinh} /></DescItem>
                                                <DescItem label="Nơi thường trú"><DisplayVal val={congDan.noiThuongTru} /></DescItem>
                                                <DescItem label="Nơi ở hiện tại"><DisplayVal val={congDan.noiOHienTai} /></DescItem>
                                            </div>
                                        </Section>

                                        <Section title="Ghi chú khác">
                                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{congDan.ghiChu || 'Không có ghi chú'}</p>
                                        </Section>
                                    </div>
                                )}

                                {activeTab === '2' && (
                                    <div className="space-y-6">
                                        <Section
                                            title={`Quan hệ gia đình (Liên kết) - ${relationData.length} người`}
                                            extra={<Tag color="blue">Dữ liệu quan hệ</Tag>}
                                        >
                                            {relationData.length > 0 ? (
                                                <Table
                                                    dataSource={relationData}
                                                    columns={familyColumns}
                                                    rowKey="id"
                                                    pagination={false}
                                                    className="border-0 shadow-none !rounded-none"
                                                />
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">Chưa có thông tin quan hệ</div>
                                            )}
                                        </Section>

                                        <Section
                                            title={
                                                <div className="flex items-center gap-2">
                                                    <span>Sổ Hộ Khẩu</span>
                                                    {congDan.maHoKhau && <Tag color="green">{congDan.maHoKhau}</Tag>}
                                                </div>
                                            }
                                            extra={<Tag color="cyan">Dữ liệu hộ khẩu</Tag>}
                                        >
                                            {!congDan.maHoKhau ? (
                                                <div className="text-center py-8 text-gray-400">Công dân chưa có Mã hộ khẩu</div>
                                            ) : (
                                                <Table
                                                    dataSource={householdData}
                                                    columns={householdColumns}
                                                    rowKey="id"
                                                    pagination={false}
                                                    className="border-0 shadow-none !rounded-none"
                                                />
                                            )}
                                        </Section>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
