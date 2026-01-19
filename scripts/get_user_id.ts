
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { role: { not: 'admin' } },
        select: { soHieu: true }
    });
    console.log('NON_ADMIN_SOHIEU:', user?.soHieu);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
