
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const total = await prisma.task.count();
    console.log('Total Tasks:', total);

    const byStatus = await prisma.task.groupBy({
        by: ['status'],
        _count: {
            id: true
        }
    });

    console.log('By Status:', JSON.stringify(byStatus, null, 2));

    const nullGroup = await prisma.task.count({ where: { groupId: null } });
    console.log('Tasks with NULL groupId:', nullGroup);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
