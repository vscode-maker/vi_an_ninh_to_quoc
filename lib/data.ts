import prisma from './prisma';
import { auth } from '@/auth';
import { Task } from '@prisma/client';

export async function fetchTasks(query?: string): Promise<{ tasks: Task[], counts: { [key: string]: number } }> {
    try {
        const session = await auth();
        // If no session, return empty
        if (!session?.user) return { tasks: [], counts: {} };

        const { role, groupIds } = session.user;

        const baseWhere: any = {};

        // Filter by Groups (if not admin)
        if (role !== 'admin') {
            if (!groupIds) return { tasks: [], counts: {} };
            const groupIdArray = groupIds.split(',').map((id: string) => id.trim());
            baseWhere.groupId = { in: groupIdArray };
        }

        // Filter by Search Query
        if (query) {
            const whereClause = {
                ...baseWhere,
                OR: [
                    { targetName: { contains: query, mode: 'insensitive' } }, // Tên đối tượng
                    { requesterName: { contains: query, mode: 'insensitive' } }, // Người yêu cầu
                    { content: { contains: query, mode: 'insensitive' } }, // Nội dung
                    { phoneNumber: { contains: query, mode: 'insensitive' } }, // SĐT
                    { bankName: { contains: query, mode: 'insensitive' } }, // Ngân hàng
                    { accountNumber: { contains: query, mode: 'insensitive' } }, // Số tài khoản
                ]
            };
            const tasks = await prisma.task.findMany({
                where: whereClause,
                orderBy: {
                    updatedAt: 'desc'
                }
            });

            // For search, counts match the results (or we could groupCount, but for now simple length is fine for the filtered set)
            // But to be consistent with Kanban board structure which might expect counts per status for the *search result*:
            const counts = {
                'Chưa thực hiện': tasks.filter(t => t.status === 'Chưa thực hiện').length,
                'Chờ kết quả': tasks.filter(t => t.status === 'Chờ kết quả').length,
                'Hoàn thành': tasks.filter(t => t.status === 'Hoàn thành').length,
            };
            return { tasks, counts };

        } else {
            // Initial Load: Limit to 20 tasks per status AND get totals
            const statuses = ['Chưa thực hiện', 'Chờ kết quả', 'Hoàn thành'];

            // Run queries in parallel
            // We need both the tasks (limit 20) AND the count (total) for each status
            const promises = statuses.map(async status => {
                const [tasks, count] = await Promise.all([
                    prisma.task.findMany({
                        where: { ...baseWhere, status },
                        orderBy: { updatedAt: 'desc' },
                        take: 20
                    }),
                    prisma.task.count({
                        where: { ...baseWhere, status }
                    })
                ]);
                return { status, tasks, count };
            });

            const results = await Promise.all(promises);

            const allTasks = results.flatMap(r => r.tasks);
            const counts = results.reduce((acc, curr) => {
                acc[curr.status] = curr.count;
                return acc;
            }, {} as { [key: string]: number });

            return { tasks: allTasks, counts };
        }

    } catch (error) {
        console.error('Failed to fetch tasks:', error);
        throw new Error('Failed to fetch tasks.');
    }
}


