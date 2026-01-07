
import { fetchTasks } from '@/lib/data';
import KanbanBoard from '@/app/ui/dashboard/kanban-board-optimized'; // Path remains valid

export default async function CongViecPage(props: {
    searchParams?: Promise<{
        query?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const query = searchParams?.query || '';
    const { tasks, counts } = await fetchTasks(query);

    return (
        <div className="dashboard-container">
            <KanbanBoard tasks={tasks} initialCounts={counts} />
        </div>
    );
}
