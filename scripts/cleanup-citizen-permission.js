
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Deleting MANAGE_CITIZEN permission...');
    const delegate = prisma.permission || prisma.permissions;
    if (!delegate) return;

    try {
        await delegate.delete({
            where: { code: 'MANAGE_CITIZEN' }
        });
        console.log('Deleted MANAGE_CITIZEN.');
    } catch (e) {
        console.log('MANAGE_CITIZEN not found or already deleted.');
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
