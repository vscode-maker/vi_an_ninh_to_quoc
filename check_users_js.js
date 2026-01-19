
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findFirst({
            where: {
                role: {
                    not: 'Admin'
                }
            },
            select: {
                soHieu: true,
                fullName: true,
                role: true,
                groupIds: true
            }
        });
        console.log(JSON.stringify(user, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
