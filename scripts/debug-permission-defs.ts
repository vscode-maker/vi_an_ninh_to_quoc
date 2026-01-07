
import prisma from '../lib/prisma';

async function main() {
    const permissions = await prisma.permission.findMany({
        where: {
            OR: [
                { code: { contains: '_TASK' } },
                { code: { contains: '_WORK' } }
            ]
        }
    });
    console.log('Task/Work Permission Definitions:');
    console.table(permissions);
}

main();
