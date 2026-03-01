// By id, update and delete task

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Context = { params: { id: string } };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { id } = context.params;
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body." }, { status: 400 });
    }

    const { title, status, priority } = body;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title    !== undefined && { title: String(title).trim() }),
        ...(status   !== undefined && { status }),
        ...(priority !== undefined && { priority }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/tasks/:id]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { id } = context.params;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/tasks/:id]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}