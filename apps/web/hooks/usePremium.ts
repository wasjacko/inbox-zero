"use client";

import { useUser } from "@/hooks/useUser";
import {
  getUserTier,
  hasAiAccess,
  hasUnsubscribeAccess,
  isPremiumRecord,
} from "@/utils/premium";

export function usePremium() {
  const swrResponse = useUser();
  const { data } = swrResponse;

  const premium = data?.premium;
  const hasAiApiKey = data?.hasAiApiKey;

  const unsubscribeCreditsRemaining = data?.unsubscribeCreditsRemaining;

  const isTrialActive = data?.productAccess?.state === "active";
  const isUserPremium = isPremiumRecord(premium, { ignoreBypass: true });
  const tier = isTrialActive
    ? "PROFESSIONAL_MONTHLY"
    : isUserPremium
      ? getUserTier(premium, { ignoreBypass: true })
      : null;

  const isProPlanWithoutApiKey =
    (tier === "PRO_MONTHLY" || tier === "PRO_ANNUALLY") && !hasAiApiKey;

  return {
    ...swrResponse,
    premium,
    isPremium: isUserPremium,
    hasUnsubscribeAccess:
      isTrialActive ||
      isUserPremium ||
      hasUnsubscribeAccess(tier || null, unsubscribeCreditsRemaining),
    unsubscribeCreditsRemaining,
    hasAiAccess:
      isTrialActive ||
      (isUserPremium && hasAiAccess(tier || null, hasAiApiKey)),
    isProPlanWithoutApiKey,
    tier,
  };
}
