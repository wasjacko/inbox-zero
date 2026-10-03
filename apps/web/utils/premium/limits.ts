import { SafeError } from "@/utils/error";
import {
  getUserTier,
  hasAiAccess,
  isPremiumRecord,
  premiumEntitlementSelect,
} from "@/utils/premium";
import prisma from "@/utils/prisma";
import { getTrialStatus } from "@/utils/trial/status";

export async function assertHasAiAccess({
  userId,
  hasUserApiKey,
}: {
  userId: string;
  hasUserApiKey?: boolean | null;
}) {
  const user = await getUserPremiumForLimits({ userId });
  const premium = user.premium;
  if (
    getTrialStatus({
      startedAt: user.freescaleTrialStartedAt ?? null,
      paid: false,
    }).canUseProduct
  )
    return;

  if (!isPremiumRecord(premium)) {
    throw new SafeError("Please upgrade for AI access", 403);
  }

  const userHasAiAccess = hasAiAccess(getUserTier(premium), !!hasUserApiKey);

  if (!userHasAiAccess) {
    throw new SafeError("Please upgrade for AI access", 403);
  }
}

async function getUserPremiumForLimits({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      freescaleTrialStartedAt: true,
      premium: {
        select: premiumEntitlementSelect,
      },
    },
  });

  if (!user) throw new SafeError("User not found", 404);

  return user;
}
