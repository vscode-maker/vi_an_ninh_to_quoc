
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const soHieu = '226-705';
    const newPassword = '892003';

    try {
        const user = await prisma.user.update({
            where: { soHieu: soHieu },
            data: { password: newPassword },
        });
        console.log(`Successfully updated password for ${user.soHieu} to ${newPassword}`);
    } catch (error) {
        console.error('Error updating password:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
