"use server";

import { actionClient } from "@/utils/actions/safe-action";
import { createFreescaleTasksBody } from "@/utils/actions/freescale-task.validation";
import prisma from "@/utils/prisma";

export const createFreescaleTasksAction = actionClient
  .metadata({ name: "createFreescaleTasks" })
  .inputSchema(createFreescaleTasksBody)
  .action(async ({ ctx: { emailAccountId }, parsedInput: { due, tasks } }) => {
    const dueDate = new Date(`${due}T12:00:00.000Z`);
    const savedTasks = await Promise.all(
      tasks.map((task) => {
        const sourceThreadId = `ask-mue-priority:${due}:${task.id}`;
        return prisma.freescaleTask.upsert({
          where: {
            emailAccountId_sourceThreadId: {
              emailAccountId,
              sourceThreadId,
            },
          },
          create: {
            title: task.title,
            status: "scope",
            due: dueDate,
            priority: "medium",
            source: "ai",
            assignees: [],
            sourceThreadId,
            emailAccountId,
          },
          update: {
            title: task.title,
            status: "scope",
            due: dueDate,
          },
          select: { id: true, title: true },
        });
      }),
    );

    return { tasks: savedTasks };
  });
