"use client";

import { ArrowRightIcon, InboxIcon, LoaderCircleIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import type { ThreadsListResponse } from "@/app/api/threads/route";
import { Gmail } from "@/components/new-landing/icons/Gmail";
import { Outlook } from "@/components/new-landing/icons/Outlook";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/providers/EmailAccountProvider";
import { useContactPhotos } from "@/hooks/useContactPhotos";
import { toRealChannelConversations } from "@/utils/channels/real-conversations";
import { getPreviewGreeting } from "@/utils/preview-profile";

export function DesktopRealBrief({
  freelancerName,
}: {
  freelancerName: string;
}) {
  const { emailAccountId, provider, userEmail } = useAccount();
  const [scanStarted, setScanStarted] = useState(false);
  const { data, error, isLoading, mutate } = useSWR<ThreadsListResponse>(
    scanStarted && emailAccountId
      ? "/api/threads?type=inbox&limit=8&view=list&includePlans=false"
      : null,
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
      <div className="flex min-h-[calc(100svh-8rem)] items-center justify-center px-6">
        <section className="max-w-lg text-center">
          <InboxIcon className="mx-auto size-10 text-blue-600" />
          <h1 className="mt-5 font-medium text-4xl tracking-tight">
            {getPreviewGreeting(freelancerName)}
          </h1>
          <h2 className="mt-8 font-semibold text-xl">Messagerie connectée</h2>
          <p className="mt-3 text-muted-foreground leading-6">
            Lancez l’analyse pour préparer un brief à partir de vos vrais
            échanges. Rien ne sera envoyé sans votre accord.
          </p>
          <Button className="mt-6" onClick={() => setScanStarted(true)}>
            Analyser mes emails
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[calc(100svh-8rem)] w-full max-w-3xl px-6 pb-12 pt-16">
      <header className="text-center">
        <h1 className="font-medium text-4xl tracking-tight">
          {getPreviewGreeting(freelancerName)}
        </h1>
        <p className="mt-3 text-muted-foreground">
          Voici les échanges qui méritent votre attention.
        </p>
      </header>

      {isLoading ? (
        <div className="mt-16 flex items-center justify-center text-muted-foreground">
          <LoaderCircleIcon className="mr-2 size-5 animate-spin" />
          Analyse de vos emails…
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
        <div className="mt-12 rounded-2xl border p-8 text-center">
          <p className="font-medium">Aucun échange récent à traiter.</p>
          <p className="mt-2 text-muted-foreground text-sm">
            Le prochain brief utilisera les nouveaux emails reçus.
          </p>
        </div>
      )}
    </div>
  );
}
