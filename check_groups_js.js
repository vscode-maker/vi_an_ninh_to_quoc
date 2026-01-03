
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        const groupIds = [
            "64ffb308996970372978",
            "cf1caa215147b819e156",
            "0857a4755f13b64def02"
        ];

        const groups = await prisma.groupZalo.findMany({
            where: {
                groupId: { in: groupIds }
            },
            select: {
                groupId: true,
                name: true
            }
        });
        console.log(JSON.stringify(groups, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
