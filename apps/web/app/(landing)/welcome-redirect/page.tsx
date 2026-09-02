import { redirect } from "next/navigation";
import { auth } from "@/utils/auth";
import prisma from "@/utils/prisma";
import { redirectToEmailAccountPath } from "@/utils/account";
import { isPremiumRecord, premiumEntitlementSelect } from "@/utils/premium";
import { buildRedirectUrl } from "@/utils/redirect";
import { PREVIEW_POST_ONBOARDING_SORT_PARAM } from "@/utils/preview-onboarding";

export default async function WelcomeRedirectPage(props: {
  searchParams: Promise<{ force?: boolean | string; intent?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();

  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      completedOnboardingAt: true,
      createdAt: true,
      premiumId: true,
    },
  });

  // Session exists but user doesn't - invalid state, log out
  if (!user) redirect("/logout");
  if (searchParams.force) redirect("/onboarding");
  const existingAccountNotice =
    (searchParams.intent === "signup" || searchParams.intent === "login") &&
    (Boolean(user.completedOnboardingAt) ||
      user.createdAt.getTime() < Date.now() - 2 * 60 * 1000)
      ? "existing-account"
      : undefined;

  // Google signs in an existing identity even when the user started from the
  // sign-up screen. Returning users must recover their existing workspace and
  // connected channels instead of being sent through first-run onboarding.
  if (existingAccountNotice) {
    await redirectToEmailAccountPath("/chat", {
      notice: existingAccountNotice,
      onboarding: "complete",
      [PREVIEW_POST_ONBOARDING_SORT_PARAM]: "1",
    });
  }

  if (user.completedOnboardingAt) {
    await redirectToEmailAccountPath("/chat", {
      onboarding: "complete",
      [PREVIEW_POST_ONBOARDING_SORT_PARAM]: "1",
    });
  }

  if (user.premiumId) {
    const premium = await prisma.premium.findUnique({
      where: { id: user.premiumId },
      select: premiumEntitlementSelect,
    });

    if (isPremiumRecord(premium)) {
      await redirectToEmailAccountPath("/setup");
    }
  }

  redirect(buildRedirectUrl("/onboarding"));
}
