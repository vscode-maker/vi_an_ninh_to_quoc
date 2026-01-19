'use server';

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

const checkPermission = async (permission: string) => {
    const session: any = await auth();
    const userPermissions = session?.user?.permissions || [];
    const role = session?.user?.role;
    if (role?.toLowerCase() !== 'admin' && !userPermissions.includes(permission)) {
        return false;
    }
    return true;
};

export async function getCongDans({
    page = 1,
    pageSize = 10,
    search = '',
}: {
    page?: number;
    pageSize?: number;
    search?: string;
}) {
    const hasPermission = await checkPermission('VIEW_CITIZEN');
    if (!hasPermission) {
        return { success: false, message: 'Bạn không có quyền xem danh sách công dân.', data: [], total: 0 };
    }

    const where: Prisma.CongDanWhereInput = {};
    if (search) {
        where.OR = [
            { hoTen: { contains: search, mode: 'insensitive' } },
            { soCMND: { contains: search, mode: 'insensitive' } },
            { soCCCD: { contains: search, mode: 'insensitive' } },
            { soDienThoai: { contains: search, mode: 'insensitive' } },
            { maHoKhau: { contains: search, mode: 'insensitive' } },
            { queQuan: { contains: search, mode: 'insensitive' } },
            { noiThuongTru: { contains: search, mode: 'insensitive' } },
            { noiOHienTai: { contains: search, mode: 'insensitive' } },
            { ghiChu: { contains: search, mode: 'insensitive' } },
            { ngaySinh: { contains: search, mode: 'insensitive' } },
        ];
    }

    try {
        const [data, total] = await Promise.all([
            prisma.congDan.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { ngayTao: 'desc' },
            }),
            prisma.congDan.count({ where }),
        ]);

        return { success: true, data, total, page, pageSize };
    } catch (error) {
        console.error('Error fetching citizens:', error);
        return { success: false, message: 'Lỗi khi tải danh sách công dân.' };
    }
}

export async function createCongDan(formData: FormData) {
    const hasPermission = await checkPermission('CREATE_CITIZEN');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền thêm mới công dân.' };

    const session = await auth();
    const rawData = Object.fromEntries(formData.entries());

    try {
        await prisma.congDan.create({
            data: {
                id: rawData.id ? String(rawData.id) : `CD${Date.now()}`,
                hoTen: String(rawData.hoTen),
                soCMND: rawData.soCMND ? String(rawData.soCMND) : null,
                soCCCD: rawData.soCCCD ? String(rawData.soCCCD) : null,
                gioiTinh: rawData.gioiTinh ? String(rawData.gioiTinh) : null,
                ngaySinh: rawData.ngaySinh ? String(rawData.ngaySinh) : null,
                queQuan: rawData.queQuan ? String(rawData.queQuan) : null,
                noiThuongTru: rawData.noiThuongTru ? String(rawData.noiThuongTru) : null,
                noiOHienTai: rawData.noiOHienTai ? String(rawData.noiOHienTai) : null,
                soDienThoai: rawData.soDienThoai ? String(rawData.soDienThoai) : null,
                ngheNghiep: rawData.ngheNghiep ? String(rawData.ngheNghiep) : null,
                danToc: rawData.danToc ? String(rawData.danToc) : null,
                tonGiao: rawData.tonGiao ? String(rawData.tonGiao) : null,
                ghiChu: rawData.ghiChu ? String(rawData.ghiChu) : null,
                tinhTrangHonNhan: rawData.tinhTrangHonNhan ? String(rawData.tinhTrangHonNhan) : null,
                ngayCap: rawData.ngayCap ? String(rawData.ngayCap) : null,
                noiCap: rawData.noiCap ? String(rawData.noiCap) : null,
                noiDangKyKhaiSinh: rawData.noiDangKyKhaiSinh ? String(rawData.noiDangKyKhaiSinh) : null,
                maHoKhau: rawData.maHoKhau ? String(rawData.maHoKhau) : null,
                chuHo: rawData.chuHo === 'true',
            }
        });
        revalidatePath('/dashboard/cong-dan');
        return { success: true, message: 'Thêm công dân thành công!' };
    } catch (error) {
        console.error('Create error:', error);
        return { success: false, message: 'Lỗi khi thêm mới công dân.' };
    }
}

export async function updateCongDan(id: string, formData: FormData) {
    const hasPermission = await checkPermission('EDIT_CITIZEN');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền sửa thông tin công dân.' };

    const rawData = Object.fromEntries(formData.entries());
    try {
        await prisma.congDan.update({
            where: { id },
            data: {
                hoTen: String(rawData.hoTen),
                soCMND: rawData.soCMND ? String(rawData.soCMND) : null,
                soCCCD: rawData.soCCCD ? String(rawData.soCCCD) : null,
                gioiTinh: rawData.gioiTinh ? String(rawData.gioiTinh) : null,
                ngaySinh: rawData.ngaySinh ? String(rawData.ngaySinh) : null,
                queQuan: rawData.queQuan ? String(rawData.queQuan) : null,
                noiThuongTru: rawData.noiThuongTru ? String(rawData.noiThuongTru) : null,
                noiOHienTai: rawData.noiOHienTai ? String(rawData.noiOHienTai) : null,
                soDienThoai: rawData.soDienThoai ? String(rawData.soDienThoai) : null,
                ngheNghiep: rawData.ngheNghiep ? String(rawData.ngheNghiep) : null,
                danToc: rawData.danToc ? String(rawData.danToc) : null,
                tonGiao: rawData.tonGiao ? String(rawData.tonGiao) : null,
                ghiChu: rawData.ghiChu ? String(rawData.ghiChu) : null,
                tinhTrangHonNhan: rawData.tinhTrangHonNhan ? String(rawData.tinhTrangHonNhan) : null,
                ngayCap: rawData.ngayCap ? String(rawData.ngayCap) : null,
                noiCap: rawData.noiCap ? String(rawData.noiCap) : null,
                noiDangKyKhaiSinh: rawData.noiDangKyKhaiSinh ? String(rawData.noiDangKyKhaiSinh) : null,
                maHoKhau: rawData.maHoKhau ? String(rawData.maHoKhau) : null,
                chuHo: rawData.chuHo === 'true',
            }
        });
        revalidatePath('/dashboard/cong-dan');
        return { success: true, message: 'Cập nhật thành công!' };
    } catch (error) {
        console.error('Update error:', error);
        return { success: false, message: 'Lỗi khi cập nhật thông tin.' };
    }
}

export async function deleteCongDan(id: string) {
    const hasPermission = await checkPermission('DELETE_CITIZEN');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền xóa công dân.' };

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Delete all family relationships involving this citizen
            await tx.quanHeGiaDinh.deleteMany({
                where: {
                    OR: [
                        { idCongDan1: id },
                        { idCongDan2: id }
                    ]
                }
            });

            // 2. Delete the citizen
            await tx.congDan.delete({ where: { id } });
        });

        revalidatePath('/dashboard/cong-dan');
        return { success: true, message: 'Đã xóa công dân.' };
    } catch (error) {
        console.error('Delete citizen error:', error);
        return { success: false, message: 'Lỗi khi xóa: ' + (error instanceof Error ? error.message : String(error)) };
    }
}

// OCR Data interface
interface OCRCongDanData {
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
    // Family info for notification
    thong_tin_gia_dinh?: Array<{
        ho_ten?: string;
        moi_quan_he?: string;
        so_CMND?: string;
        so_CCCD?: string;
    }>;
    thong_tin_thanh_vien_trong_ho?: Array<{
        quan_he?: string;
        ho_ten?: string;
        so_CMND?: string;
        so_CCCD?: string;
    }>;
}

// Helper to clean OCR data (remove "Chưa xác định" values)
const cleanOCRValue = (value?: string): string | null => {
    if (!value) return null;
    if (value.includes('Chưa xác định') || value.includes('🚩')) return null;
    return value.trim();
};

// Get Zalo access token from setting table
async function getZaloAccessToken(): Promise<string | null> {
    try {
        console.log('[Zalo] Fetching access token from DB...');
        const setting = await prisma.setting.findFirst({
            where: { type: 'access_token' }
        });
        if (setting?.value) {
            console.log('[Zalo] Access token found, length:', setting.value.length);
            return setting.value;
        }
        console.warn('[Zalo] No access_token found in setting table');
        return null;
    } catch (error) {
        console.error('[Zalo] Error getting access token:', error);
        return null;
    }
}

// Get Zalo Group ID from setting table
async function getZaloGroupId(): Promise<string | null> {
    try {
        console.log('[Zalo] Fetching group ID from DB...');
        const setting = await prisma.setting.findFirst({
            where: { type: 'group_ocr_cong_dan' }
        });
        if (setting?.value) {
            console.log('[Zalo] Group ID found:', setting.value);
            return setting.value;
        }
        console.warn('[Zalo] No group_ocr_cong_dan found in setting table');
        return null; // Return null if not found
    } catch (error) {
        console.error('[Zalo] Error getting group ID:', error);
        return null;
    }
}

// Format value for display (show "Chưa xác định 🚩" if empty)
const formatValue = (value?: string | null): string => {
    if (!value || value.includes('Chưa xác định') || value.includes('🚩')) {
        return 'Chưa xác định 🚩';
    }
    return value;
};

// Send Zalo OA notification for new OCR citizen
async function sendZaloOCRNotification(data: OCRCongDanData): Promise<void> {
    try {
        const accessToken = await getZaloAccessToken();
        if (!accessToken) {
            console.warn('[Zalo] Access token not found, skipping notification');
            return;
        }

        const groupId = await getZaloGroupId();
        if (!groupId) {
            console.warn('[Zalo] Group ID not found, skipping notification');
            return;
        }

        // Build family info section
        let familySection = '';
        if (data.thong_tin_gia_dinh && data.thong_tin_gia_dinh.length > 0) {
            familySection = '\n\n👨‍👩‍👧‍👦 THÔNG TIN GIA ĐÌNH:\n';
            data.thong_tin_gia_dinh.forEach((member, index) => {
                const cmndCccd = member.so_CCCD || member.so_CMND || 'N/A';
                familySection += `${index + 1}. 👤 ${member.ho_ten || 'N/A'} - 💼 ${member.moi_quan_he || 'N/A'}\n   🆔 CMND/CCCD: ${cmndCccd}\n`;
            });
        }

        // Build notification message
        const message = `🔔 THÔNG BÁO OCR CÔNG DÂN MỚI 🔔
════════════════════════
📋 THÔNG TIN CÁ NHÂN:
👤 Họ và tên: ${formatValue(data.ho_ten)}
🎂 Ngày sinh: ${formatValue(data.ngay_sinh)}
⚧️ Giới tính: ${formatValue(data.gioi_tinh)}
👥 Dân tộc: ${formatValue(data.dan_toc)}
🙏 Tôn giáo: ${formatValue(data.ton_giao)}
💒 Tình trạng hôn nhân: ${formatValue(data.tinh_trang_hon_nhan)}
💼 Nghề nghiệp: ${formatValue(data.nghe_nghiep)}
📞 Số điện thoại: ${formatValue(data.so_dien_thoai)}

🆔 GIẤY TỜ ĐỊNH DANH:
📇 Số CMND: ${formatValue(data.so_CMND)}
🪪 Số CCCD: ${formatValue(data.so_CCCD)}
📅 Ngày cấp: ${formatValue(data.ngay_cap)}
🏛️ Nơi cấp: ${formatValue(data.noi_cap)}

📍 THÔNG TIN ĐỊA CHỈ:
🏠 Quê quán: ${formatValue(data.que_quan)}
📍 Nơi đăng ký khai sinh: ${formatValue(data.noi_dang_ky_khai_sinh)}
🏘️ Nơi thường trú: ${formatValue(data.noi_thuong_tru)}
📌 Nơi ở hiện tại: ${formatValue(data.noi_o_hien_tai)}${familySection}

✅ Đã cập nhật vào hệ thống thành công!`;

        console.log(`[Zalo] Sending notification to group: ${groupId}`);
        console.log('[Zalo] Message length:', message.length);

        // Send to Zalo OA Group
        const response = await fetch('https://openapi.zalo.me/v3.0/oa/group/message', {
            method: 'POST',
            headers: {
                'access_token': accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipient: {
                    group_id: groupId
                },
                message: {
                    text: message
                }
            })
        });

        console.log('[Zalo] Response status:', response.status);
        const result = await response.json();
        console.log('[Zalo] API Response:', JSON.stringify(result));

        if (result.error !== 0) {
            console.error('[Zalo] Notification error:', result.message || result);
        } else {
            console.log('[Zalo] Notification sent successfully! Message ID:', result.data?.message_id);
        }
    } catch (error) {
        console.error('[Zalo] Error sending notification:', error);
        // Don't throw - notification failure shouldn't break the save
    }
}

export async function createCongDanFromOCR(data: OCRCongDanData) {
    const hasPermission = await checkPermission('CREATE_CITIZEN');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền thêm mới công dân.' };

    const session = await auth();

    // Check for duplicate CCCD
    const normalizedCCCD = cleanOCRValue(data.so_CCCD);
    if (normalizedCCCD) {
        const existing = await prisma.congDan.findFirst({ where: { soCCCD: normalizedCCCD } });
        if (existing) {
            return {
                success: false,
                message: `Công dân với số CCCD ${normalizedCCCD} đã tồn tại trong hệ thống. Không lưu lại.`
            };
        }
    }

    try {
        const newCongDan = await prisma.congDan.create({
            data: {
                id: `CD${Date.now()}`,
                hoTen: data.ho_ten,
                soCMND: cleanOCRValue(data.so_CMND),
                soCCCD: cleanOCRValue(data.so_CCCD),
                gioiTinh: cleanOCRValue(data.gioi_tinh),
                ngaySinh: cleanOCRValue(data.ngay_sinh),
                queQuan: cleanOCRValue(data.que_quan),
                danToc: cleanOCRValue(data.dan_toc),
                tonGiao: cleanOCRValue(data.ton_giao),
                ngheNghiep: cleanOCRValue(data.nghe_nghiep),
                tinhTrangHonNhan: cleanOCRValue(data.tinh_trang_hon_nhan),
                ngayCap: cleanOCRValue(data.ngay_cap),
                noiCap: cleanOCRValue(data.noi_cap),
                noiDangKyKhaiSinh: cleanOCRValue(data.noi_dang_ky_khai_sinh),
                noiThuongTru: cleanOCRValue(data.noi_thuong_tru),
                noiOHienTai: cleanOCRValue(data.noi_o_hien_tai),
                soDienThoai: cleanOCRValue(data.so_dien_thoai),
                nguoiTao: session?.user?.name,

                // Household Management
                chuHo: true, // Defaulting main OCR'd person as head if not specified otherwise? 
                // Or should we infer from content? 
                // For now, let's assume the person being OCR'd is the "Anchor" or Head if they have a household list.
                // Better logic: if `thong_tin_thanh_vien_trong_ho` exists, this person is likely the head or primary contact.
                maHoKhau: `HK${Date.now()}`, // Generate new Household Code
            }
        });

        // --- Process Family & Household Members ---
        const familyMembers = [
            ...(data.thong_tin_gia_dinh || []).map(m => ({ ...m, type: 'family' })),
            ...(data.thong_tin_thanh_vien_trong_ho || []).map(m => ({ ...m, type: 'household' }))
        ];

        for (const member of familyMembers) {
            // Simplify relationship name
            const relationAcc = (member as any).moi_quan_he || (member as any).quan_he || 'Thành viên gia đình';
            const memberName = member.ho_ten;
            const memberCCCD = cleanOCRValue(member.so_CCCD || member.so_CMND); // Normalize ID

            if (!memberName) continue; // Skip if no name

            let relatedCitizenId = null;

            // 1. Check if citizen exists by CCCD (if CCCD present)
            if (memberCCCD) {
                const existing = await prisma.congDan.findFirst({
                    where: {
                        OR: [
                            { soCCCD: memberCCCD },
                            { soCMND: memberCCCD }
                        ]
                    }
                });
                if (existing) {
                    relatedCitizenId = existing.id;
                }
            }

            // 2. If not found, create new citizen (Minimal Info)
            if (!relatedCitizenId) {
                const newMember = await prisma.congDan.create({
                    data: {
                        id: `CD${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                        hoTen: memberName,
                        soCCCD: memberCCCD,
                        ghiChu: `Tạo tự động từ quan hệ với ${newCongDan.hoTen} (${relationAcc})`,
                        nguoiTao: session?.user?.name,

                        // Assign same Household Code
                        maHoKhau: newCongDan.maHoKhau,
                        chuHo: false, // Default family member is not head
                    }
                });
                relatedCitizenId = newMember.id;
            } else {
                // Option: Update existing citizen's household code if they don't have one?
                // For now, let's keep it simple and only update NEW members.
                // Updating existing members might merge households unintentionally.
            }

            // 3. Create Relationship
            if (relatedCitizenId) {
                // Check if relationship already exists
                const existingRelation = await prisma.quanHeGiaDinh.findFirst({
                    where: {
                        OR: [
                            { idCongDan1: newCongDan.id, idCongDan2: relatedCitizenId },
                            { idCongDan1: relatedCitizenId, idCongDan2: newCongDan.id }
                        ]
                    }
                });

                if (!existingRelation) {
                    await prisma.quanHeGiaDinh.create({
                        data: {
                            idCongDan1: newCongDan.id,
                            idCongDan2: relatedCitizenId,
                            moiQuanHe: relationAcc,
                            thongTinThem: { createdFromOCR: true }
                        }
                    });
                    console.log(`Created relationship: ${newCongDan.hoTen} - ${relationAcc} - ${memberName}`);
                } else {
                    console.log(`Relationship already exists: ${newCongDan.hoTen} - ${memberName}`);
                }
            }
        }
        // ------------------------------------------

        // Send Zalo notification - MUST await in serverless environment
        try {
            await sendZaloOCRNotification(data);
            console.log('Zalo notification sent for citizen:', newCongDan.hoTen);
        } catch (zaloError) {
            console.error('Zalo notification failed (non-blocking):', zaloError);
        }

        revalidatePath('/dashboard/cong-dan');
        revalidatePath('/dashboard/cong-dan/ocr');

        return {
            success: true,
            message: 'Thêm công dân từ OCR thành công!',
            data: { id: newCongDan.id, hoTen: newCongDan.hoTen }
        };
    } catch (error) {
        console.error('Create from OCR error:', error);
        return { success: false, message: 'Lỗi khi thêm mới công dân từ OCR.' };
    }
}

// Test Zalo notification function
export async function testZaloNotification() {
    const hasPermission = await checkPermission('CREATE_CITIZEN');
    if (!hasPermission) return { success: false, message: 'Bạn không có quyền test.' };

    try {
        console.log('[Zalo Test] Starting test notification...');

        const accessToken = await getZaloAccessToken();
        if (!accessToken) {
            return {
                success: false,
                message: 'Không tìm thấy access_token trong bảng setting. Vui lòng kiểm tra DB.'
            };
        }
        console.log('[Zalo Test] Access token found, length:', accessToken.length);

        const groupId = await getZaloGroupId();
        if (!groupId) {
            return {
                success: false,
                message: 'Không tìm thấy group_ocr_cong_dan trong bảng setting. Vui lòng kiểm tra DB.'
            };
        }
        console.log('[Zalo Test] Group ID:', groupId);

        // Build test message
        const testMessage = `🧪 TEST THÔNG BÁO ZALO 🧪
════════════════════════
📋 Đây là tin nhắn test từ hệ thống
⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}
✅ Nếu bạn nhận được tin này, tính năng đang hoạt động!`;

        console.log(`[Zalo Test] Sending to group: ${groupId}`);

        // Send to Zalo OA Group
        const response = await fetch('https://openapi.zalo.me/v3.0/oa/group/message', {
            method: 'POST',
            headers: {
                'access_token': accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipient: {
                    group_id: groupId
                },
                message: {
                    text: testMessage
                }
            })
        });

        console.log('[Zalo Test] Response status:', response.status);
        const result = await response.json();
        console.log('[Zalo Test] API Response:', JSON.stringify(result));

        if (result.error === 0) {
            return {
                success: true,
                message: 'Gửi thông báo test thành công! Kiểm tra nhóm Zalo.',
                data: result
            };
        } else {
            return {
                success: false,
                message: `Lỗi Zalo API: ${result.message || JSON.stringify(result)}`,
                data: result
            };
        }
    } catch (error) {
        console.error('[Zalo Test] Error:', error);
        return {
            success: false,
            message: `Lỗi: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
