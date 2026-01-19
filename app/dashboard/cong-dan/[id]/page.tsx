import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import CitizenDetailClient from './components/citizen-detail-client';

export const dynamic = 'force-dynamic';

export default async function CongDanDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;

    const congDan = await prisma.congDan.findUnique({
        where: { id },
        include: {
            quanHe1: { include: { congDan2: true } },
            quanHe2: { include: { congDan1: true } }
        }
    });

    if (!congDan) {
        notFound();
    }

    // 1. Fetch ALL Relationships
    const relationships = await prisma.quanHeGiaDinh.findMany({
        where: {
            OR: [
                { idCongDan1: id },
                { idCongDan2: id },
            ]
        },
        include: {
            congDan1: true,
            congDan2: true,
        }
    });

    // Deduplication Logic
    const uniqueRelations = new Map();
    relationships.forEach(rel => {
        const isSelf1 = rel.idCongDan1 === id;
        const target = isSelf1 ? rel.congDan2 : rel.congDan1;

        if (!uniqueRelations.has(target.id)) {
            uniqueRelations.set(target.id, {
                key: rel.id,
                name: target.hoTen,
                cccd: target.soCCCD || target.soCMND,
                relation: rel.moiQuanHe,
                id: target.id,
                avatar: target.hinhAnh
            });
        }
    });
    const relationData = Array.from(uniqueRelations.values());

    // 2. Fetch Household Members
    let householdMembers: any[] = [];
    if (congDan.maHoKhau) {
        householdMembers = await prisma.congDan.findMany({
            where: {
                maHoKhau: congDan.maHoKhau,
                id: { not: id } // Exclude self
            }
        });
    }

    const householdData = householdMembers.map(m => ({
        key: m.id,
        name: m.hoTen,
        relation: m.chuHo ? 'Chủ hộ' : 'Thành viên',
        cccd: m.soCCCD || m.soCMND,
        dob: m.ngaySinh,
        id: m.id
    }));

    // Serialize dates for Client Component
    const serializedCongDan = {
        ...congDan,
        ngayTao: congDan.ngayTao?.toISOString(),
        ngayCapNhat: congDan.ngayCapNhat?.toISOString(),
    };

    return (
        <CitizenDetailClient
            congDan={serializedCongDan}
            relationData={relationData}
            householdData={householdData}
        />
    );
}
