
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.boLuat.count();
        console.log(`Total BoLuat records: ${count}`);

        const sample = await prisma.boLuat.findFirst({
            orderBy: { idBoLuat: 'asc' }
        });
        console.log('Sample Record:', JSON.stringify(sample, null, 2));
    } catch (e) {
        console.error('Verification Error:', e);
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
