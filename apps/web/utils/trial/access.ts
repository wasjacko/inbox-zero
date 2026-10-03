import prisma from "@/utils/prisma";
import { SafeError } from "@/utils/error";
import { isPremiumRecord, premiumEntitlementSelect } from "@/utils/premium";
import { getTrialStatus } from "@/utils/trial/status";

export async function getProductAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      freescaleTrialStartedAt: true,
      premium: { select: premiumEntitlementSelect },
    },
  });
  if (!user) throw new SafeError("User not found", 404);
  return getTrialStatus({
    startedAt: user.freescaleTrialStartedAt,
    paid:
      !!user.premium && isPremiumRecord(user.premium, { ignoreBypass: true }),
  });
}

export async function assertProductAccess(userId: string) {
  const access = await getProductAccess(userId);
  if (!access.canUseProduct) {
    throw new SafeError(
      access.state === "not_started"
        ? "Démarrez votre essai gratuit de 14 jours pour continuer."
        : "Votre essai est terminé. Abonnez-vous pour continuer.",
      402,
    );
  }
}

export function requiresProductAccess(pathname: string) {
  if (!pathname.startsWith("/api/")) return false;
  const exceptions = [
    "/api/user/product-access",
    "/api/user/billing-plans",
    "/api/user/onboarding",
    "/api/user/complete-registration",
    "/api/user/email-accounts",
    "/api/user/email-account",
    "/api/user/settings",
    "/api/user/setup-progress",
    "/api/user/organization-membership",
    "/api/user/trial-preview",
    "/api/admin",
    "/api/stripe",
    "/api/premium",
    "/api/chat/onboarding",
    "/api/google/linking",
    "/api/outlook/linking",
    "/api/outlook/admin-consent",
    "/api/mobile-auth",
  ];
  return !exceptions.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function requiresProductAccessForAction(name: string) {
  return !new Set([
    "startFreescaleTrial",
    "completedOnboarding",
    "saveOnboardingAnswers",
    "saveOnboardingChatAnswers",
    "saveOnboardingFeatures",
    "generateCheckoutSession",
    "getBillingPortalUrl",
    "endStripeTrial",
    "activateLicenseKey",
    "claimPremiumAdmin",
    "updateStripeInvoiceEmails",
    "deleteAccount",
    "deleteEmailAccount",
    "submitFeedback",
    "updateAiSettings",
    "updateSensitiveDataPolicy",
    "updateEmailSettings",
  ]).has(name);
}
