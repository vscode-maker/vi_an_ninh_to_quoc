
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking Settings...');
    const settings = await prisma.setting.findMany();
    console.log('Settings count:', settings.length);
    console.log('Data:', settings);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
