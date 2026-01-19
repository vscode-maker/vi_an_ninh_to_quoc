
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Checking GroupZalo table...');
    const count = await prisma.groupZalo.count();
    console.log(`Total records: ${count}`);
    const data = await prisma.groupZalo.findMany();
    console.log('Data:', JSON.stringify(data, null, 2));
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
