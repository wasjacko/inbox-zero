"use client";

import { ArrowRightIcon, LoaderCircleIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { usePreloadedPageData } from "@/hooks/usePreloadedPageData";
import type { ThreadsListResponse } from "@/app/api/threads/route";
import { Gmail } from "@/components/new-landing/icons/Gmail";
import { Outlook } from "@/components/new-landing/icons/Outlook";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/providers/EmailAccountProvider";
import { useContactPhotos } from "@/hooks/useContactPhotos";
import { toRealChannelConversations } from "@/utils/channels/real-conversations";
import { getPreviewGreeting } from "@/utils/preview-profile";
import { CHANNELS_THREADS_CACHE_KEY } from "@/utils/preview-data";

export function DesktopRealBrief({
  freelancerName,
}: {
  freelancerName: string;
}) {
  const { emailAccountId, provider, userEmail } = useAccount();
  const [scanStarted, setScanStarted] = useState(false);
  const { data, error, isLoading, mutate } =
    usePreloadedPageData<ThreadsListResponse>(
      emailAccountId ? CHANNELS_THREADS_CACHE_KEY : null,
      { dedupingInterval: 60_000, revalidateOnFocus: false },
    );
  const allConversations = useMemo(() => {
    if (!data || !Array.isArray(data.threads)) return [];
    return toRealChannelConversations({
      provider,
      threads: data.threads,
      userEmail,
    });
  }, [data, provider, userEmail]);
  const conversations = allConversations.slice(0, 3);
  const unreadCount = allConversations.filter(
    (conversation) => conversation.unread,
  ).length;
  const replyCount = allConversations.filter(
    (conversation) =>
      conversation.unread && conversation.messages.at(-1)?.author === "contact",
  ).length;
  const contactAddresses = useMemo(
    () => conversations.map(({ address }) => address),
    [conversations],
  );
  const { photos: contactPhotos } = useContactPhotos(contactAddresses);

  if (!scanStarted) {
    return (
      <div className="relative flex min-h-[calc(100svh-8rem)] w-full items-center justify-center overflow-hidden px-6 py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-80 opacity-60 dark:opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 62% 72% at 50% 0%, rgba(96,165,250,0.11), rgba(251,191,36,0.045) 52%, transparent 78%)",
          }}
        />
        <section className="relative w-full max-w-lg text-center">
          <h1 className="font-medium text-4xl tracking-tight">
            {getPreviewGreeting(freelancerName)}
          </h1>
          <h2 className="mt-8 font-semibold text-xl">Messagerie connectée</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground leading-6">
            Lancez l’analyse pour préparer un brief à partir de vos vrais
            échanges. Rien ne sera envoyé sans votre accord.
          </p>
          <Button
            className="mt-6 rounded-[13px] border border-[#5989f0] bg-gradient-to-b from-[#2965ec] to-[#5c89f8] px-5 text-white shadow-[0_2px_10px_rgba(75,131,253,0.2)] transition-[background-image,filter] duration-200 hover:from-[#255ddd] hover:to-[#4d7ced] hover:brightness-[1.03]"
            onClick={() => setScanStarted(true)}
          >
            Analyser mes emails
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[calc(100svh-8rem)] w-full items-center justify-center overflow-y-auto px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 opacity-60 dark:opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 62% 72% at 50% 0%, rgba(96,165,250,0.11), rgba(251,191,36,0.045) 52%, transparent 78%)",
        }}
      />
      <main className="relative w-full max-w-3xl">
        <header className="text-center">
          <h1 className="font-medium text-4xl tracking-tight">
            {getPreviewGreeting(freelancerName)}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground leading-6">
            Vous avez{" "}
            <span className="font-semibold text-foreground">
              {unreadCount} nouveau{unreadCount === 1 ? "" : "x"} message
              {unreadCount === 1 ? "" : "s"}.
            </span>
            {replyCount > 0 ? (
              <>
                <br />
                {replyCount} demande{replyCount === 1 ? "" : "nt"} votre réponse
                aujourd’hui.
              </>
            ) : (
              <>
                <br />
                Aucune réponse urgente détectée aujourd’hui.
              </>
            )}
          </p>
        </header>

        {isLoading ? (
          <div aria-live="polite" className="mt-10 grid gap-3">
            {[0, 1, 2].map((item) => (
              <div
                className="flex min-h-[86px] animate-pulse items-center gap-4 rounded-2xl border bg-background p-5 shadow-sm"
                key={item}
              >
                <span className="size-11 shrink-0 rounded-full bg-muted" />
                <span className="min-w-0 flex-1 space-y-2.5">
                  <span className="block h-3 w-1/3 rounded-full bg-muted" />
                  <span className="block h-3 w-2/3 rounded-full bg-muted" />
                  <span className="block h-2.5 w-full rounded-full bg-muted/70" />
                </span>
              </div>
            ))}
            <p className="mt-1 flex items-center justify-center text-muted-foreground text-sm">
              <LoaderCircleIcon className="mr-2 size-4 animate-spin" />
              Analyse de vos emails…
            </p>
          </div>
        ) : error ? (
          <div className="mt-12 rounded-2xl border p-8 text-center">
            <p className="font-medium">Impossible d’analyser vos emails.</p>
            <Button className="mt-4" onClick={() => mutate()} variant="outline">
              Réessayer
            </Button>
          </div>
        ) : conversations.length ? (
          <div className="mt-10 grid gap-3">
            {conversations.map((conversation) => (
              <Link
                className="group flex items-center gap-4 rounded-2xl border bg-background p-5 shadow-sm transition-colors hover:bg-muted/40"
                href={`/channels-v4?conversation=${encodeURIComponent(conversation.id)}`}
                key={conversation.id}
              >
                <Avatar className="size-11 shrink-0">
                  <AvatarImage
                    alt={`Photo de profil de ${conversation.name}`}
                    src={contactPhotos[conversation.address.toLowerCase()]}
                  />
                  <AvatarFallback>{conversation.initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">
                      {conversation.name}
                    </p>
                    {conversation.channel === "outlook" ? (
                      <Outlook height={15} width={15} />
                    ) : (
                      <Gmail height={15} width={17} />
                    )}
                  </div>
                  <p className="mt-1 truncate font-medium text-sm">
                    {conversation.subject}
                  </p>
                  <p className="mt-1 line-clamp-1 text-muted-foreground text-sm">
                    {conversation.preview}
                  </p>
                </div>
                <span className="text-muted-foreground text-xs">
                  {conversation.time}
                </span>
                <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border p-8 text-center">
            <p className="font-medium">Aucun échange récent à traiter.</p>
            <p className="mt-2 text-muted-foreground text-sm">
              Le prochain brief utilisera les nouveaux emails reçus.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
