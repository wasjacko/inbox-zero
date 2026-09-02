"use client";

import { ArrowRightIcon, InboxIcon, LoaderCircleIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { usePreloadedPageData } from "@/hooks/usePreloadedPageData";
import type { ThreadsListResponse } from "@/app/api/threads/route";
import { PageWrapper } from "@/components/PageWrapper";
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
  const conversations = useMemo(() => {
    if (!data || !Array.isArray(data.threads)) return [];
    return toRealChannelConversations({
      provider,
      threads: data.threads,
      userEmail,
    }).slice(0, 3);
  }, [data, provider, userEmail]);
  const contactAddresses = useMemo(
    () => conversations.map(({ address }) => address),
    [conversations],
  );
  const { photos: contactPhotos } = useContactPhotos(contactAddresses);

  if (!scanStarted) {
    return (
      <PageWrapper className="flex min-h-[calc(100svh-8rem)] flex-col pb-10">
        <header className="mt-4 sm:mt-8">
          <h1 className="font-semibold text-3xl tracking-tight">
            {getPreviewGreeting(freelancerName)}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Retrouvez vos priorités et préparez votre journée avec Mue.
          </p>
        </header>

        <section className="mt-6 flex min-h-[26rem] flex-1 items-center justify-center rounded-2xl border bg-muted/15 px-6 py-12 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="w-full max-w-lg text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/60">
              <InboxIcon className="size-6" />
            </span>
            <h2 className="mt-5 font-semibold text-xl tracking-tight">
              Messagerie connectée
            </h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground text-sm leading-6">
              Lancez l’analyse pour préparer un brief à partir de vos vrais
              échanges. Rien ne sera envoyé sans votre accord.
            </p>
            <Button
              className="mt-6 rounded-[13px] border border-[#5989f0] bg-gradient-to-b from-[#2965ec] to-[#5c89f8] px-5 text-white shadow-[0_2px_10px_rgba(75,131,253,0.2)] transition-[background-image,filter] duration-200 hover:from-[#255ddd] hover:to-[#4d7ced] hover:brightness-[1.03]"
              onClick={() => setScanStarted(true)}
            >
              Analyser mes emails
            </Button>
          </div>
        </section>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="min-h-[calc(100svh-8rem)] pb-12">
      <header className="mt-4 sm:mt-8">
        <h1 className="font-semibold text-3xl tracking-tight">
          {getPreviewGreeting(freelancerName)}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Voici les échanges qui méritent votre attention.
        </p>
      </header>

      {isLoading ? (
        <div className="mt-6 flex min-h-[26rem] items-center justify-center rounded-2xl border bg-muted/15 text-muted-foreground">
          <LoaderCircleIcon className="mr-2 size-5 animate-spin" />
          Analyse de vos emails…
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border bg-muted/15 p-8 text-center">
          <p className="font-medium">Impossible d’analyser vos emails.</p>
          <Button className="mt-4" onClick={() => mutate()} variant="outline">
            Réessayer
          </Button>
        </div>
      ) : conversations.length ? (
        <div className="mt-6 grid gap-3">
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
                  <p className="truncate font-semibold">{conversation.name}</p>
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
        <div className="mt-6 rounded-2xl border bg-muted/15 p-8 text-center">
          <p className="font-medium">Aucun échange récent à traiter.</p>
          <p className="mt-2 text-muted-foreground text-sm">
            Le prochain brief utilisera les nouveaux emails reçus.
          </p>
        </div>
      )}
    </PageWrapper>
  );
}
