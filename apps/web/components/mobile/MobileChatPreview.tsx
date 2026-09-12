"use client";

import { InboxIcon } from "lucide-react";
import { BriefWelcome } from "@/components/preview/BriefWelcome";
import { Button } from "@/components/ui/button";

export function MobileChatPreview({
  freelancerName,
  hasConnectedChannels,
  onConnectChannel,
}: {
  freelancerName: string;
  hasConnectedChannels: boolean;
  onboardingComplete: boolean;
  onConnectChannel: () => void;
}) {
  if (hasConnectedChannels)
    return <BriefWelcome freelancerName={freelancerName} />;

  return (
    <div className="flex min-h-[calc(100dvh-var(--mobile-topbar-height)-var(--mobile-bottombar-height))] items-center justify-center bg-background px-6 pb-10 lg:hidden">
      <section className="w-full max-w-sm text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          <InboxIcon className="size-6" />
        </span>
        <h1 className="mt-5 font-semibold text-3xl tracking-tight">
          {freelancerName.trim()
            ? `Bonjour ${freelancerName.trim()}`
            : "Bonjour"}
        </h1>
        <p className="mt-4 text-muted-foreground text-sm leading-6">
          Connectez votre messagerie pour retrouver votre brief ici.
        </p>
        <Button className="mt-6 min-h-11 rounded-xl" onClick={onConnectChannel}>
          Connecter un canal
        </Button>
      </section>
    </div>
  );
}
