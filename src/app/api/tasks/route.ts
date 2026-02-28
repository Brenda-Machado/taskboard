// App router, create and list tasks

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Return Task list
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const validStatuses = ["TODO", "DOING", "DONE"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Invalid Status. Usage: TODO, DOING or DONE." },
      { status: 400 }
    );
  }

  const tasks = await prisma.task.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
}

// Create new task
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json(
      { error: "The field 'title' is required." },
      { status: 400 }
    );
  }

  const task = await prisma.task.create({
    data: {
      title: body.title.trim(),
      priority: body.priority ?? undefined,
    },
  });

  return NextResponse.json(task, { status: 201 });
}