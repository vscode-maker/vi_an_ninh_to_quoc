
import prisma from '../lib/prisma';

async function main() {
    const user = await prisma.user.findFirst({
        where: { fullName: { contains: 'Phan Công Thắng' } }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log(`User: ${user.fullName} (${user.soHieu})`);
    console.log(`Permissions Count: ${Array.isArray(user.permissions) ? user.permissions.length : 0}`);
    console.log('Permissions:', JSON.stringify(user.permissions, null, 2));
}

main();
