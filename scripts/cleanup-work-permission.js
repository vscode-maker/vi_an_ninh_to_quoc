
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Deleting MANAGE_WORK permission...');
    const delegate = prisma.permission || prisma.permissions;
    if (!delegate) return;

    try {
        await delegate.delete({
            where: { code: 'MANAGE_WORK' }
        });
        console.log('Deleted MANAGE_WORK.');
    } catch (e) {
        console.log('MANAGE_WORK not found or already deleted.');
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
