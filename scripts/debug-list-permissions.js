
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const delegate = prisma.permission || prisma.permissions;
    const perms = await delegate.findMany({
        orderBy: { group: 'asc' }
    });
    console.log('--- JSON Output ---');
    console.log(JSON.stringify(perms.map(p => ({ code: p.code, group: p.group })), null, 2));
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
