import Link from "next/link";
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
      premiumId: true,
    },
  });

  // Session exists but user doesn't - invalid state, log out
  if (!user) redirect("/logout");
  if (searchParams.force) redirect("/onboarding");

  // Better Auth sends only returning identities to this callback; brand-new
  // Google users use `signup-new`. Keep the user outside the app until they
  // explicitly confirm that they want to use their existing account.
  if (searchParams.intent === "signup-existing") {
    return <ExistingAccountPrompt />;
  }

  if (searchParams.intent === "login") {
    const existingEmailAccount = await prisma.emailAccount.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (existingEmailAccount) {
      await redirectToEmailAccountPath("/chat");
    }
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

function ExistingAccountPrompt() {
  return (
    <main className="grid min-h-svh place-items-center bg-muted/20 px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border bg-background p-6 text-center shadow-[0_24px_70px_-40px_rgba(15,23,42,0.28)] sm:p-8">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-50 font-semibold text-blue-700 text-xl">
          F
        </div>
        <h1 className="mt-5 font-semibold text-2xl tracking-tight">
          Ce compte existe déjà
        </h1>
        <p className="mt-2 text-muted-foreground text-sm leading-6">
          Vous avez déjà un espace Freescale avec ce compte Google. Voulez-vous
          vous y connecter&nbsp;?
        </p>
        <Link
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-5 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90"
          href="/welcome-redirect?intent=login"
        >
          Oui, me connecter
        </Link>
        <Link
          className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border bg-background px-5 font-medium text-sm hover:bg-muted/50"
          href="/logout"
        >
          Utiliser un autre compte
        </Link>
      </section>
    </main>
  );
}
