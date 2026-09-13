import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/utils/prisma";
import { withEmailAccount } from "@/utils/middleware";
import {
  freescaleActivityPeriods,
  summarizeFreescaleActivity,
} from "@/utils/relations/activity";
import { estimateSavingsValueCents } from "@/utils/relations/savings";

const querySchema = z.enum(freescaleActivityPeriods).default("31d");

export type GetFreescaleActivityResponse = Awaited<
  ReturnType<typeof getActivity>
>;

export const GET = withEmailAccount("user/activity", async (request) => {
  const period = querySchema.parse(
    new URL(request.url).searchParams.get("period") ?? undefined,
  );
  return NextResponse.json(
    await getActivity({ emailAccountId: request.auth.emailAccountId, period }),
  );
});

async function getActivity({
  emailAccountId,
  period,
}: {
  emailAccountId: string;
  period: (typeof freescaleActivityPeriods)[number];
}) {
  const now = new Date();
  const oldestStart = new Date(now);
  oldestStart.setDate(oldestStart.getDate() - 89);
  oldestStart.setHours(0, 0, 0, 0);
  const activities = await prisma.freescaleActivity.findMany({
    where: { emailAccountId, createdAt: { gte: oldestStart, lte: now } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      type: true,
      assisted: true,
      demo: true,
      estimatedSeconds: true,
      source: true,
      threadId: true,
      contactName: true,
      contactAddress: true,
      externalId: true,
    },
  });
  const account = await prisma.emailAccount.findUnique({
    where: { id: emailAccountId },
    select: { user: { select: { freescaleDayRateCents: true } } },
  });
  const summarized = summarizeFreescaleActivity({ activities, now, period });
  const dayRateCents = account?.user.freescaleDayRateCents ?? null;
  const assisted = activities.filter((item) => item.assisted);
  return {
    ...summarized,
    dayRateCents,
    valueCents: estimateSavingsValueCents(
      summarized.summary.estimatedSeconds,
      dayRateCents,
    ),
    latestAssistedAt: assisted.at(-1)?.createdAt ?? null,
    recent: assisted
      .filter((item) => item.createdAt >= summarized.start)
      .reverse(),
  };
}
