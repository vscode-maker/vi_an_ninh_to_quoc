
import prisma from '../lib/prisma';

async function main() {
    console.log('Starting cleanup of legacy _WORK permissions...');

    // 1. Update Users: Remove _WORK permissions from their JSON array
    const users = await prisma.user.findMany();
    console.log(`Checking ${users.length} users...`);

    for (const user of users) {
        const perms = (user.permissions as string[]) || [];
        const newPerms = perms.filter(p => !p.includes('_WORK'));

        if (perms.length !== newPerms.length) {
            console.log(`Updating user ${user.fullName}: removing ${perms.length - newPerms.length} legacy permissions.`);
            await prisma.user.update({
                where: { id: user.id },
                data: { permissions: newPerms }
            });
        }
    }

    // 2. Delete Permission Definitions
    console.log('Deleting legacy permission definitions...');
    const deleteResult = await prisma.permission.deleteMany({
        where: {
            code: { contains: '_WORK' }
        }
    });

    console.log(`Deleted ${deleteResult.count} legacy permission definitions.`);
    console.log('Cleanup complete.');
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
