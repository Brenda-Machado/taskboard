// Tasks for dashboard

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
const groups = await prisma.task.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const counts = groups.reduce(
    (acc, group) => ({ ...acc, [group.status]: group._count.id }),
    { TODO: 0, DOING: 0, DONE: 0 } as Record<string, number>
  );

  const total = counts.TODO + counts.DOING + counts.DONE;

  return NextResponse.json({
    total,
    todo:  counts.TODO,
    doing: counts.DOING,
    done:  counts.DONE,
    completionRate: total > 0 ? Math.round((counts.DONE / total) * 100) : 0,
  });
}