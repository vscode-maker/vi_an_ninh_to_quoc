
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Find and update Admin
    const admin = await prisma.user.findFirst({
        where: { role: 'admin' }
    });

    if (admin) {
        await prisma.user.update({
            where: { id: admin.id },
            data: { password: '1' }
        });
        console.log(`Updated Admin: ${admin.soHieu} / 1`);
    }

    // 2. Find and update Non-Admin with Groups
    const user = await prisma.user.findFirst({
        where: {
            role: { not: 'admin' },
            groupIds: { not: null }
        }
    });

    if (user) {
        await prisma.user.update({
            where: { id: user.id },
            data: { password: '1' }
        });
        console.log(`Updated User: ${user.soHieu} / 1 (Groups: ${user.groupIds})`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
