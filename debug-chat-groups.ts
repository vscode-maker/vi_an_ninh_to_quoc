
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Chat Groups ---');

    // Group by 'nhom' to see distinct values
    const groups = await prisma.thongTinChat.groupBy({
        by: ['nhom'],
        _count: {
            id: true
        }
    });

    console.log('Distinct Groups found:', groups);

    // Also fetch a few raw messages to see their fields
    const messages = await prisma.thongTinChat.findMany({
        take: 5,
        orderBy: { thoiGian: 'desc' }
    });
    console.log('Sample Messages:', JSON.stringify(messages, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
