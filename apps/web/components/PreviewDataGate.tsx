"use client";

import { InboxIcon, LinkIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/providers/EmailAccountProvider";

const routesAvailableWithoutConnections = [
  "/onboarding",
  "/setup",
  "/onboarding-brief",
  "/settings",
  "/integrations",
  "/help",
  "/support",
  "/tasks",
];

const emptyStateCopy = [
  {
    paths: ["/channels", "/channels-v2", "/channels-v3", "/channels-v4"],
    title: "Aucun canal connecté",
    description:
      "Connectez une messagerie pour retrouver vos conversations ici.",
  },
  {
    paths: ["/chat", "/assistant"],
    title: "Aucun échange à analyser",
    description:
      "Connectez une messagerie pour que Mue puisse préparer vos premiers briefs.",
  },
  {
    paths: ["/stats", "/organization"],
    title: "Aucune donnée client",
    description:
      "Connectez un canal pour commencer à construire une vue réelle de vos relations clients.",
  },
  {
    paths: ["/briefs", "/calendars"],
    title: "Aucune source de brief connectée",
    description:
      "Connectez votre messagerie ou votre calendrier pour préparer vos premiers briefs.",
  },
  {
    paths: [
      "/bulk-archive",
      "/quick-bulk-archive",
      "/bulk-unsubscribe",
      "/clean",
      "/smart-categories",
      "/reply-zero",
      "/cold-email-blocker",
    ],
    title: "Aucun message à traiter",
    description:
      "Les outils de tri et de nettoyage seront disponibles après la connexion d’une messagerie.",
  },
  {
    paths: ["/drive"],
    title: "Aucun document connecté",
    description:
      "Connectez une source pour retrouver vos documents et pièces jointes ici.",
  },
  {
    paths: ["/automation"],
    title: "Aucune source connectée",
    description:
      "Connectez un canal avant de créer des automatisations basées sur vos échanges.",
  },
] as const;

export function PreviewDataGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { emailAccount, isLoading } = useAccount();
  const routeIsAvailable = routesAvailableWithoutConnections.some((path) =>
    pathname.startsWith(path),
  );

  if (routeIsAvailable) return children;

  if (isLoading) return children;

  if (emailAccount) return children;

  const copy = emptyStateCopy.find(({ paths }) =>
    paths.some((path) => pathname === path || pathname.startsWith(`${path}/`)),
  ) ?? {
    title: "Aucune donnée disponible",
    description:
      "Connectez un canal pour commencer à utiliser cet espace avec vos propres données.",
  };

  return (
    <main className="flex min-h-[calc(100dvh-var(--mobile-topbar-height)-var(--mobile-bottombar-height)-4rem)] items-center justify-center bg-background px-6 py-16 lg:min-h-[calc(100svh-4rem)]">
      <section className="w-full max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          {pathname.startsWith("/channels") ? (
            <LinkIcon className="size-6" />
          ) : (
            <InboxIcon className="size-6" />
          )}
        </span>
        <h1 className="mt-6 font-semibold text-2xl tracking-tight sm:text-3xl">
          {copy.title}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-muted-foreground text-sm leading-6 sm:text-base">
          {copy.description}
        </p>
        <Button
          asChild
          className="mt-7 min-h-11 rounded-xl bg-blue-600 px-5 hover:bg-blue-700"
        >
          <Link href="/onboarding">Connecter un canal</Link>
        </Button>
      </section>
    </main>
  );
}
