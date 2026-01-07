
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.permission.count();
    const all = await prisma.permission.findMany();
    console.log(`Total Permissions: ${count}`);
    console.log(all);
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
