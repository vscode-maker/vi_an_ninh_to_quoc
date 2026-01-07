
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up obsolete permissions...');
    const obsolete = ['MANAGE_DATA_DON_AN', 'MANAGE_DANH_MUC'];

    // Try plural first
    try {
        if (prisma.permissions) {
            const result = await prisma.permissions.deleteMany({
                where: { code: { in: obsolete } }
            });
            console.log(`Deleted ${result.count} obsolete permissions using 'permissions' model.`);
        } else if (prisma.permission) {
            const result = await prisma.permission.deleteMany({
                where: { code: { in: obsolete } }
            });
            console.log(`Deleted ${result.count} obsolete permissions using 'permission' model.`);
        } else {
            console.error('Could not find permission model on prisma client');
        }
    } catch (e) {
        console.error('Error during cleanup:', e);
    }
    console.log('Cleanup done.');
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
