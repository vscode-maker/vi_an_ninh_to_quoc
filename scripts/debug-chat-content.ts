
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const targetGroup = "Dũng - Hòa";
    console.log(`Checking messages for group: '${targetGroup}'`);

    const exactMatch = await prisma.thongTinChat.findMany({
        where: {
            nhom: targetGroup // Exact match
        }
    });
    console.log(`Exact match count: ${exactMatch.length}`);

    // List all groups
    console.log("\nListing all distinct groups in DB:");
    const groups = await prisma.thongTinChat.groupBy({
        by: ['nhom'],
        _count: true
    });

    groups.forEach(g => {
        console.log(`[${g.nhom}] (Length: ${g.nhom?.length}) - Count: ${g._count}`);
        if (g.nhom?.includes('Dũng')) {
            console.log(`   -> Contains 'Dũng'`);
        }
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
