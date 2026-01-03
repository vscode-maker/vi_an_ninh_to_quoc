
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        // Checking the user likely being used based on previous context, or any user
        // The user previously found was 472-258 (Trần Lê Phương)
        const user = await prisma.user.findFirst({
            where: {
                soHieu: '472-258'
            },
            select: {
                soHieu: true,
                fullName: true,
                position: true
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
