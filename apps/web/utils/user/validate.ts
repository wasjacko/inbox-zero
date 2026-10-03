import { SafeError } from "@/utils/error";
import {
  getUserTier,
  hasAiAccess,
  isPremiumRecord,
  premiumEntitlementSelect,
} from "@/utils/premium";
import prisma from "@/utils/prisma";
import { getTrialStatus } from "@/utils/trial/status";

export async function validateUserAndAiAccess({
  emailAccountId,
}: {
  emailAccountId: string;
}) {
  const emailAccount = await prisma.emailAccount.findUnique({
    where: { id: emailAccountId },
    select: {
      id: true,
      userId: true,
      email: true,
      about: true,
      multiRuleSelectionEnabled: true,
      sensitiveDataPolicy: true,
      timezone: true,
      calendarBookingLink: true,
      user: {
        select: {
          aiProvider: true,
          aiModel: true,
          aiApiKey: true,
          freescaleTrialStartedAt: true,
          premium: {
            select: premiumEntitlementSelect,
          },
        },
      },
      account: { select: { provider: true } },
    },
  });
  if (!emailAccount) throw new SafeError("User not found");

  if (
    getTrialStatus({
      startedAt: emailAccount.user.freescaleTrialStartedAt,
      paid: false,
    }).canUseProduct
  )
    return { emailAccount };
  const isUserPremium = isPremiumRecord(emailAccount.user.premium, {
    ignoreBypass: true,
  });
  if (!isUserPremium) throw new SafeError("Please upgrade for AI access");

  const userHasAiAccess = hasAiAccess(
    getUserTier(emailAccount.user.premium),
    !!emailAccount.user.aiApiKey,
  );
  if (!userHasAiAccess) throw new SafeError("Please upgrade for AI access");

  return { emailAccount };
}
