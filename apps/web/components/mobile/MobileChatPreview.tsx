"use client";

import {
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  Clock3Icon,
  InboxIcon,
  SendHorizontalIcon,
} from "lucide-react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { WhatsAppIcon } from "@/components/BrandIcons";
import { Gmail } from "@/components/new-landing/icons/Gmail";
import { Outlook } from "@/components/new-landing/icons/Outlook";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toastSuccess } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

type MobileBriefChannel = "Gmail" | "Outlook" | "WhatsApp";

type MobileBriefClient = {
  id: string;
  name: string;
  headline: string;
  channel: MobileBriefChannel;
  unread: number;
  time: string;
  avatarPosition: string;
  messages: Array<{ mine?: boolean; body: string; time: string }>;
  suggestion: string;
  shortSuggestion: string;
  warmSuggestion: string;
};

const mobileBriefClients: MobileBriefClient[] = [
  {
    id: "theo-whatsapp",
    name: "Théo Manili",
    headline: "Théo attend la confirmation du planning.",
    channel: "WhatsApp",
    unread: 7,
    time: "Il y a 24 min",
    avatarPosition: "50% 50%",
    messages: [
      {
        mine: true,
        body: "Je finalise le planning avec l’équipe et je reviens vers toi dans la matinée.",
        time: "09:48",
      },
      {
        body: "Bonjour Wacil, peux-tu me confirmer le planning d’intégration et les prochaines étapes ?",
        time: "10:31",
      },
    ],
    suggestion:
      "Bonjour Théo, le planning d’intégration est confirmé. Je t’envoie le détail des prochaines étapes dans la journée.",
    shortSuggestion:
      "Bonjour Théo, le planning est confirmé. Je t’envoie la suite aujourd’hui.",
    warmSuggestion:
      "Bonjour Théo ! Le planning est bien confirmé. Je te partage les prochaines étapes un peu plus tard aujourd’hui.",
  },
  {
    id: "maya-gmail",
    name: "Maya Chen",
    headline: "Maya n’a pas confirmé le règlement.",
    channel: "Gmail",
    unread: 6,
    time: "Hier, 16:42",
    avatarPosition: "50% 0%",
    messages: [
      {
        mine: true,
        body: "Je t’envoie la facture F-2048 correspondant à la prestation de juillet.",
        time: "12 août",
      },
      {
        body: "Je fais le point avec notre service comptable et je reviens vers toi dès que le règlement est programmé.",
        time: "Hier",
      },
    ],
    suggestion:
      "Bonjour Maya, merci pour ton retour. Peux-tu me confirmer la date prévue du règlement de la facture F-2048 ?",
    shortSuggestion:
      "Bonjour Maya, peux-tu me confirmer la date de règlement de la facture F-2048 ? Merci.",
    warmSuggestion:
      "Bonjour Maya, merci pour ton message. Peux-tu me tenir au courant dès que la date de règlement est confirmée ?",
  },
  {
    id: "jon-outlook",
    name: "Jon Bell",
    headline: "Jon attend la confirmation du SEO.",
    channel: "Outlook",
    unread: 5,
    time: "Hier, 14:18",
    avatarPosition: "100% 100%",
    messages: [
      {
        mine: true,
        body: "Les derniers contrôles sont en cours. Je te confirme la finalisation dès que possible.",
        time: "Lundi",
      },
      {
        body: "As-tu une visibilité sur la finalisation des optimisations SEO ?",
        time: "Hier",
      },
    ],
    suggestion:
      "Bonjour Jon, les optimisations SEO sont désormais finalisées et validées. Tu peux les intégrer à ton point d’avancement de vendredi.",
    shortSuggestion:
      "Bonjour Jon, les optimisations SEO sont finalisées et validées.",
    warmSuggestion:
      "Bonjour Jon, bonne nouvelle : les optimisations SEO sont terminées et validées. Tout est prêt pour vendredi.",
  },
];

export function MobileChatPreview({
  freelancerName,
  hasConnectedChannels,
  onboardingComplete,
  onConnectChannel,
}: {
  freelancerName: string;
  hasConnectedChannels: boolean;
  onboardingComplete: boolean;
  onConnectChannel: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sentIds, setSentIds] = useState<Set<string>>(() => new Set());

  const selectedClient = useMemo(
    () => mobileBriefClients.find(({ id }) => id === selectedClientId) ?? null,
    [selectedClientId],
  );

  const openClient = (client: MobileBriefClient) => {
    setDrafts((current) => ({
      ...current,
      [client.id]: current[client.id] ?? client.suggestion,
    }));
    setSelectedClientId(client.id);
  };

  if (!hasConnectedChannels) {
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
          <h2 className="mt-8 font-semibold text-lg">Aucun canal connecté</h2>
          <p className="mt-2 text-muted-foreground text-sm leading-6">
            Connectez votre messagerie pour recevoir vos premiers briefs et
            retrouver vos échanges importants ici.
          </p>
          <Button
            className="mt-6 min-h-11 rounded-xl bg-blue-600 px-5 hover:bg-blue-700"
            onClick={onConnectChannel}
          >
            Connecter un canal
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-var(--mobile-topbar-height)-var(--mobile-bottombar-height))] bg-background lg:hidden">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        aria-label="Accueil IA"
        className="scroll-mt-[calc(var(--mobile-safe-top)+var(--mobile-topbar-height))] pb-6"
        id="mobile-main-content"
        initial={
          onboardingComplete && !reducedMotion ? { opacity: 0, y: 12 } : false
        }
        tabIndex={-1}
        transition={{ duration: reducedMotion ? 0 : 0.45 }}
      >
        <header className="px-5 pb-5 pt-7">
          <p className="text-muted-foreground text-sm">Dimanche 30 août</p>
          <h1 className="mt-1 font-semibold text-3xl tracking-tight">
            Bonjour {freelancerName}
          </h1>
          <p className="mt-2 max-w-sm text-muted-foreground text-sm leading-5">
            <strong className="font-semibold text-foreground">
              18 messages non lus
            </strong>
            , dont 3 demandent votre réponse.
          </p>
        </header>

        <section aria-labelledby="brief-title" className="px-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="font-semibold text-lg" id="brief-title">
              Brief du jour
            </h2>
            <span className="text-muted-foreground text-xs">
              Mis à jour 08:44
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-card">
            {mobileBriefClients.map((client, index) => {
              const sent = sentIds.has(client.id);
              return (
                <button
                  className={cn(
                    "flex min-h-[84px] w-full items-center gap-3 px-3.5 py-3 text-left active:bg-muted",
                    index !== mobileBriefClients.length - 1 && "border-b",
                  )}
                  key={client.id}
                  onClick={() => openClient(client)}
                  type="button"
                >
                  <span className="relative size-11 shrink-0">
                    <span
                      aria-label={`Photo de ${client.name}`}
                      className="block size-11 rounded-full bg-[url('/images/avatars/freescale-contacts-grid.webp')] bg-no-repeat ring-1 ring-border"
                      role="img"
                      style={{
                        backgroundPosition: client.avatarPosition,
                        backgroundSize: "300% 300%",
                      }}
                    />
                    {!sent ? (
                      <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-blue-600 px-1 font-semibold text-[10px] text-white ring-2 ring-background">
                        {client.unread}
                      </span>
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 font-medium text-sm leading-5">
                      {client.headline}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-muted-foreground text-xs">
                      <ChannelIcon channel={client.channel} />
                      {client.name}
                    </span>
                  </span>
                  {sent ? (
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                      <CheckIcon className="size-4" />
                    </span>
                  ) : (
                    <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </motion.section>

      <MobileConversationSheet
        client={selectedClient}
        draft={selectedClient ? (drafts[selectedClient.id] ?? "") : ""}
        onClose={() => setSelectedClientId(null)}
        onDraftChange={(value) => {
          if (!selectedClient) return;
          setDrafts((current) => ({ ...current, [selectedClient.id]: value }));
        }}
        onSend={() => {
          if (!selectedClient) return;
          setSentIds((current) => new Set(current).add(selectedClient.id));
          toastSuccess({
            description: "Réponse envoyée. Conversation traitée.",
          });
          setSelectedClientId(null);
        }}
        open={Boolean(selectedClient)}
      />
    </div>
  );
}

function MobileConversationSheet({
  client,
  open,
  draft,
  onClose,
  onDraftChange,
  onSend,
}: {
  client: MobileBriefClient | null;
  open: boolean;
  draft: string;
  onClose: () => void;
  onDraftChange: (value: string) => void;
  onSend: () => void;
}) {
  if (!client) return null;

  return (
    <Sheet onOpenChange={(nextOpen) => !nextOpen && onClose()} open={open}>
      <SheetContent
        className="inset-0 h-dvh w-screen max-w-none gap-0 overflow-hidden border-0 p-0 lg:hidden [&>button]:hidden"
        side="right"
      >
        <SheetHeader className="mobile-safe-top shrink-0 border-b bg-background px-3 pb-3 pt-2 text-left">
          <div className="flex items-center gap-2">
            <button
              aria-label="Retour au brief"
              className="mobile-touch-target grid size-11 shrink-0 place-items-center rounded-full active:bg-muted"
              onClick={onClose}
              type="button"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <span
              aria-label={`Photo de ${client.name}`}
              className="block size-10 shrink-0 rounded-full bg-[url('/images/avatars/freescale-contacts-grid.webp')] bg-no-repeat ring-1 ring-border"
              role="img"
              style={{
                backgroundPosition: client.avatarPosition,
                backgroundSize: "300% 300%",
              }}
            />
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-sm">
                {client.name}
              </SheetTitle>
              <SheetDescription className="mt-0.5 flex items-center gap-1 text-xs">
                <ChannelIcon channel={client.channel} />
                {client.channel}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/25 px-4 py-5">
          <div className="mb-5 rounded-2xl border bg-background p-4">
            <p className="font-semibold text-sm">{client.headline}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-muted-foreground text-xs">
              <Clock3Icon className="size-3.5" />
              {client.time}
            </p>
          </div>
          <div className="space-y-3">
            {client.messages.map((message) => (
              <div
                className={cn(
                  "max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-5 shadow-sm",
                  message.mine
                    ? "ml-auto rounded-br-md bg-slate-900 text-white"
                    : "rounded-bl-md border bg-background",
                )}
                key={`${message.time}-${message.body}`}
              >
                {message.body}
                <span
                  className={cn(
                    "mt-1.5 block text-[10px]",
                    message.mine ? "text-white/60" : "text-muted-foreground",
                  )}
                >
                  {message.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t bg-background p-3">
          <div className="rounded-2xl border border-violet-100 bg-violet-50/55 p-3 dark:border-violet-900/50 dark:bg-violet-950/20">
            <div className="flex items-center gap-2">
              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/80">
                <Image
                  alt="Mue"
                  className="size-8 object-contain"
                  height={32}
                  loading="lazy"
                  sizes="32px"
                  src="/images/mue/mue-focus.png"
                  width={32}
                />
              </span>
              <div>
                <p className="font-semibold text-sm">
                  Réponse proposée par Mue
                </p>
                <p className="text-muted-foreground text-[11px]">À valider</p>
              </div>
            </div>
            <textarea
              aria-label="Réponse proposée"
              autoCapitalize="sentences"
              autoComplete="off"
              autoCorrect="on"
              className="mt-3 max-h-32 min-h-20 w-full resize-none rounded-xl border bg-background px-3 py-2.5 text-base leading-5 outline-none focus:ring-2 focus:ring-violet-400/40"
              enterKeyHint="enter"
              inputMode="text"
              onChange={(event) => onDraftChange(event.currentTarget.value)}
              spellCheck
              value={draft}
            />
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              <button
                className="mobile-touch-target min-h-8 shrink-0 rounded-full border bg-background px-3 py-1 text-xs"
                onClick={() => onDraftChange(client.shortSuggestion)}
                type="button"
              >
                Plus court
              </button>
              <button
                className="mobile-touch-target min-h-8 shrink-0 rounded-full border bg-background px-3 py-1 text-xs"
                onClick={() => onDraftChange(client.warmSuggestion)}
                type="button"
              >
                Plus chaleureux
              </button>
              <button
                className="mobile-touch-target min-h-8 shrink-0 rounded-full border bg-background px-3 py-1 text-xs"
                onClick={() => onDraftChange(client.suggestion)}
                type="button"
              >
                Autre proposition
              </button>
            </div>
          </div>

          <div className="mobile-safe-bottom pt-3">
            <button
              className="mobile-touch-target flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-sm text-white disabled:opacity-40"
              disabled={!draft.trim()}
              onClick={onSend}
              type="button"
            >
              Envoyer sur {client.channel}
              <SendHorizontalIcon className="size-4" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ChannelIcon({ channel }: { channel: MobileBriefChannel }) {
  if (channel === "Gmail") return <Gmail className="size-3.5" />;
  if (channel === "Outlook") return <Outlook className="size-3.5" />;
  return <WhatsAppIcon className="size-3.5 text-[#22c55e]" />;
}
