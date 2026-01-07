
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Normalizing permission groups...');
    const delegate = prisma.permission || prisma.permissions;
    if (!delegate) return;

    // Normalize Công Dân
    const res1 = await delegate.updateMany({
        where: {
            group: {
                equals: 'Công dân' // exact match for the likely culprit
            }
        },
        data: {
            group: 'Công Dân'
        }
    });
    console.log(`Updated ${res1.count} 'Công dân' -> 'Công Dân'`);

    // Normalize Công Việc
    const res2 = await delegate.updateMany({
        where: {
            group: {
                equals: 'Công việc'
            }
        },
        data: {
            group: 'Công Việc'
        }
    });
    console.log(`Updated ${res2.count} 'Công việc' -> 'Công Việc'`);

    // Also fix any others?
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
