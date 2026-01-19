
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching users...');

    // Find an admin
    const admin = await prisma.user.findFirst({
        where: { role: 'admin' },
        select: { soHieu: true, role: true, groupIds: true, password: true }
    });

    // Find a non-admin
    const user = await prisma.user.findFirst({
        where: {
            role: { not: 'admin' },
            groupIds: { not: null }
        },
        select: { soHieu: true, role: true, groupIds: true, password: true }
    });

    console.log('Admin:', admin);
    console.log('User:', user);

    // Also count tasks for context
    const totalTasks = await prisma.task.count();
    console.log('Total Tasks:', totalTasks);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
