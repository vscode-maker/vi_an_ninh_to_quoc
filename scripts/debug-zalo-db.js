
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('--- DEBUGGING DB ---');

    // 1. List tables
    try {
        const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log('Tables in public schema:', tables.map(t => t.table_name));
    } catch (e) {
        console.error('Error listing tables:', e.message);
    }

    // 2. Count group_zalo raw
    try {
        const count = await prisma.$queryRaw`SELECT count(*) as count FROM "group_zalo"`;
        console.log('Raw Count group_zalo:', count);
    } catch (e) {
        console.error('Error counting group_zalo:', e.message);
        // Try without quotes if case sensitivity is issue, though Postgres lowercases usually.
        try {
            const count2 = await prisma.$queryRaw`SELECT count(*) as count FROM group_zalo`;
            console.log('Raw Count group_zalo (no quotes):', count2);
        } catch (e2) {
            console.error('Error counting group_zalo (no quotes):', e2.message);
        }
    }

    // 3. Check Prisma Model access
    try {
        const prismaCount = await prisma.groupZalo.count();
        console.log('Prisma Model Count:', prismaCount);
    } catch (e) {
        console.error('Error Prisma Model count:', e.message);
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
