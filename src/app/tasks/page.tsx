// Show tasks and statistics

import { prisma } from "@/lib/db";
import { TaskList } from "@/components/TaskList";

export default async function TasksPage() {
  const [tasks, groups] = await Promise.all([
    prisma.task.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.task.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const counts = groups.reduce(
    (acc, g) => ({ ...acc, [g.status]: g._count.id }),
    { TODO: 0, DOING: 0, DONE: 0 } as Record<string, number>
  );

  const stats = {
    total: tasks.length,
    todo:  counts.TODO,
    doing: counts.DOING,
    done:  counts.DONE,
    completionRate: tasks.length > 0
      ? Math.round((counts.DONE / tasks.length) * 100)
      : 0,
  };

  return <TaskList initialTasks={tasks} stats={stats} />;
}
