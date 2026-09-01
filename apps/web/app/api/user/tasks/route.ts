import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/utils/prisma";
import { withEmailAccount } from "@/utils/middleware";

const statusSchema = z.enum(["scope", "todo", "progress", "waiting", "done"]);
const prioritySchema = z.enum(["low", "medium", "high"]);
const sourceSchema = z.enum(["manual", "ai"]);

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(300),
  status: statusSchema.default("todo"),
  due: z.string().date().nullable().optional(),
  priority: prioritySchema.default("medium"),
  source: sourceSchema.default("manual"),
  assignees: z.array(z.string().trim().max(20)).max(20).default([]),
  context: z.string().trim().max(2000).nullable().optional(),
  sourceThreadId: z.string().trim().max(500).nullable().optional(),
  contactName: z.string().trim().max(200).nullable().optional(),
  contactAvatarPosition: z.string().trim().max(100).nullable().optional(),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().min(1),
});

const deleteTaskSchema = z.object({ id: z.string().min(1) });

const taskSelect = {
  id: true,
  title: true,
  status: true,
  due: true,
  priority: true,
  source: true,
  assignees: true,
  context: true,
  sourceThreadId: true,
  contactName: true,
  contactAvatarPosition: true,
} as const;

export type GetFreescaleTasksResponse = Awaited<ReturnType<typeof getTasks>>;

export const GET = withEmailAccount("user/tasks", async (request) =>
  NextResponse.json(
    await getTasks({ emailAccountId: request.auth.emailAccountId }),
  ),
);

export const POST = withEmailAccount("user/tasks", async (request) => {
  const input = createTaskSchema.parse(await request.json());
  if (input.sourceThreadId) {
    const existingTask = await prisma.freescaleTask.findUnique({
      where: {
        emailAccountId_sourceThreadId: {
          emailAccountId: request.auth.emailAccountId,
          sourceThreadId: input.sourceThreadId,
        },
      },
      select: { id: true },
    });
    if (existingTask)
      return NextResponse.json(
        { error: "Task already exists", taskId: existingTask.id },
        { status: 409 },
      );
  }
  const task = await prisma.freescaleTask.create({
    data: {
      ...input,
      due: input.due ? new Date(`${input.due}T12:00:00.000Z`) : null,
      emailAccountId: request.auth.emailAccountId,
    },
    select: taskSelect,
  });
  return NextResponse.json({ task: serializeTask(task) }, { status: 201 });
});

export const PATCH = withEmailAccount("user/tasks", async (request) => {
  const { id, due, ...input } = updateTaskSchema.parse(await request.json());
  const existing = await prisma.freescaleTask.findFirst({
    where: { id, emailAccountId: request.auth.emailAccountId },
    select: { id: true },
  });
  if (!existing)
    return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const task = await prisma.freescaleTask.update({
    where: { id },
    data: {
      ...input,
      ...(due !== undefined
        ? { due: due ? new Date(`${due}T12:00:00.000Z`) : null }
        : {}),
    },
    select: taskSelect,
  });
  return NextResponse.json({ task: serializeTask(task) });
});

export const DELETE = withEmailAccount("user/tasks", async (request) => {
  const { id } = deleteTaskSchema.parse(await request.json());
  const result = await prisma.freescaleTask.deleteMany({
    where: { id, emailAccountId: request.auth.emailAccountId },
  });
  if (!result.count)
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json({ success: true });
});

async function getTasks({ emailAccountId }: { emailAccountId: string }) {
  const tasks = await prisma.freescaleTask.findMany({
    where: { emailAccountId },
    orderBy: [{ createdAt: "asc" }],
    select: taskSelect,
  });
  return { tasks: tasks.map(serializeTask) };
}

function serializeTask<T extends { due: Date | null }>(task: T) {
  return {
    ...task,
    due: task.due?.toISOString().slice(0, 10) ?? "",
  };
}
