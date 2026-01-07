
import prisma from '../lib/prisma';

async function main() {
    const permissions = await prisma.permission.findMany({
        where: {
            group: 'Công Việc'
        }
    });

    console.log('Permissions for group "Công Việc":');
    console.log(JSON.stringify(permissions, null, 2));
}

main();
