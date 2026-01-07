
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Deleting MANAGE_SYSTEM permission...');

    // Handle both models
    const delegate = prisma.permission || prisma.permissions;
    if (!delegate) {
        console.error('Permission model not found');
        return;
    }

    try {
        await delegate.delete({
            where: { code: 'MANAGE_SYSTEM' }
        });
        console.log('Deleted MANAGE_SYSTEM.');
    } catch (e) {
        console.log('MANAGE_SYSTEM not found or already deleted.');
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
