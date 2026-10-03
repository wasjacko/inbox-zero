"use server";

import { actionClientUser } from "@/utils/actions/safe-action";
import prisma from "@/utils/prisma";
import { getProductAccess } from "@/utils/trial/access";
import { after } from "next/server";
import { ensureEmailAccountsWatched } from "@/utils/email/watch-manager";

export const startFreescaleTrialAction = actionClientUser
  .metadata({ name: "startFreescaleTrial" })
  .action(async ({ ctx: { userId, logger } }) => {
    // A conditional write prevents concurrent clicks or later requests from extending the trial.
    const started = await prisma.user.updateMany({
      where: { id: userId, freescaleTrialStartedAt: null },
      data: { freescaleTrialStartedAt: new Date() },
    });
    if (started.count > 0)
      after(async () => {
        await ensureEmailAccountsWatched({ userIds: [userId], logger });
      });
    return getProductAccess(userId);
  });
