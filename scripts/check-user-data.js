
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking user data...');
    const user = await prisma.user.findFirst({
        where: { fullName: { contains: 'Cường' } }
    });
    console.log('User Cường:', user);

    const admin = await prisma.user.findFirst({
        where: { soHieu: '226-705' } // Admin
    });
    console.log('User Admin:', admin);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
