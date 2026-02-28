// By id, update and delete task

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: { id: string } };

// Update task
export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Invalid body." },
      { status: 400 }
    );
  }

  const existing = await prisma.task.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Task not found." },
      { status: 404 }
    );
  }

  const { title, status, priority } = body;

  const updated = await prisma.task.update({
    where: { id: params.id },
    data: {
      ...(title    !== undefined && { title: String(title).trim() }),
      ...(status   !== undefined && { status }),
      ...(priority !== undefined && { priority }),
    },
  });

  return NextResponse.json(updated);
}

// Remove task
export async function DELETE(_request: NextRequest, { params }: Params) {
  const existing = await prisma.task.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Task not found." },
      { status: 404 }
    );
  }

  await prisma.task.delete({ where: { id: params.id } });

  return new NextResponse(null, { status: 204 });
}
