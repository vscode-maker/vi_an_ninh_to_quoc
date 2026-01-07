const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting normalization of Chat Groups...');

    const chats = await prisma.thongTinChat.findMany();
    console.log(`Found ${chats.length} chat messages.`);

    for (const chat of chats) {
        if (chat.nguoiGui && chat.nguoiNhan) {
            // Sort names alphabetically
            const [first, second] = [chat.nguoiGui, chat.nguoiNhan].sort();
            const normalizedGroup = `${first} - ${second}`;

            if (chat.nhom !== normalizedGroup) {
                console.log(`Updating ID ${chat.id}: "${chat.nhom}" -> "${normalizedGroup}"`);
                await prisma.thongTinChat.update({
                    where: { id: chat.id },
                    data: { nhom: normalizedGroup }
                });
            }
        }
    }

    console.log('Normalization complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
