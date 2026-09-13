"use server";

import prisma from "@/utils/prisma";
import { actionClient, actionClientUser } from "@/utils/actions/safe-action";
import {
  recordMueDemoReplySchema,
  saveFreescaleDayRateSchema,
} from "@/utils/actions/mue-activity.validation";
import { MUE_REPLY_ESTIMATE_SECONDS } from "@/utils/relations/savings";

export const recordMueDemoReplyAction = actionClient
  .metadata({ name: "recordMueDemoReply" })
  .inputSchema(recordMueDemoReplySchema)
  .action(async ({ ctx: { emailAccountId }, parsedInput }) => {
    const externalId = `mue-demo:${parsedInput.externalId}`;
    return prisma.freescaleActivity.upsert({
      where: { emailAccountId_externalId: { emailAccountId, externalId } },
      update: {},
      create: {
        emailAccountId,
        externalId,
        type: "REPLY_SENT",
        assisted: true,
        demo: true,
        source: "home",
        threadId: parsedInput.conversationId,
        contactName:
          parsedInput.conversationId === "maya" ? "Maya Chen" : "Théo Manili",
        estimatedSeconds: MUE_REPLY_ESTIMATE_SECONDS,
        createdAt:
          parsedInput.sentAt && new Date(parsedInput.sentAt) <= new Date()
            ? new Date(parsedInput.sentAt)
            : undefined,
      },
      select: { id: true, createdAt: true },
    });
  });

export const saveFreescaleDayRateAction = actionClientUser
  .metadata({ name: "saveFreescaleDayRate" })
  .inputSchema(saveFreescaleDayRateSchema)
  .action(async ({ ctx: { userId }, parsedInput }) => {
    await prisma.user.update({
      where: { id: userId },
      data: { freescaleDayRateCents: parsedInput.dayRateCents },
    });
    return { dayRateCents: parsedInput.dayRateCents };
  });
