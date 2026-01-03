
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing database connection...');
    try {
        const userCount = await prisma.user.count();
        console.log(`Successfully connected! Found ${userCount} users.`);
        const taskCount = await prisma.task.count();
        console.log(`Found ${taskCount} tasks.`);
    } catch (error) {
        console.error('Connection failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
