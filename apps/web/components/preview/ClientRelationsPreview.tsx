"use client";

import {
  ArrowUpRightIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  CircleDollarSignIcon,
  MailIcon,
  MessageSquareIcon,
  TimerResetIcon,
  UsersRoundIcon,
  ZapIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import useSWR from "swr";
import type { ThreadsListResponse } from "@/app/api/threads/route";
import type { GetFreescaleActivityResponse } from "@/app/api/user/activity/route";
import { PageHeader } from "@/components/PageHeader";
import { PageWrapper } from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/utils";
import {
  MobileRelationsPreview,
  type MobileRelationContact,
} from "@/components/mobile/MobileSimplifiedPages";
import { useAccount } from "@/providers/EmailAccountProvider";
import { useContactPhotos } from "@/hooks/useContactPhotos";
import { toRealChannelConversations } from "@/utils/channels/real-conversations";
import { toRealRelations } from "@/utils/relations/real-relations";

const periodOptions = [
  "7 derniers jours",
  "31 derniers jours",
  "3 derniers mois",
] as const;

type Period = (typeof periodOptions)[number];
type RelationQueue = "reply" | "followup" | "waiting";
type SavingsMetric = "total" | "replies" | "followups";
type ContactKind = "Client" | "Prestataire" | "Collaborateur" | "Fournisseur";

const _savingsByPeriod: Record<
  Period,
  {
    total: string;
    trend: string;
    workdays: string;
    value: string;
    actions: string;
  }
> = {
  "7 derniers jours": {
    total: "25 min",
    trend: "6 min gagnées cette semaine",
    workdays: "l’équivalent d’un rendez-vous client",
    value: "208 €",
    actions: "31",
  },
  "31 derniers jours": {
    total: "1 h 43",
    trend: "26 min gagnées cette semaine",
    workdays: "plus d’une heure et demie",
    value: "858 €",
    actions: "127",
  },
  "3 derniers mois": {
    total: "4 h 50",
    trend: "+18 % par rapport aux 3 mois précédents",
    workdays: "plus d’une demi-journée",
    value: "2 417 €",
    actions: "362",
  },
};

type RelationItem = {
  name: string;
  kind: ContactKind;
  queue: RelationQueue;
  context: string;
  action: string;
  actionClass: string;
  channel: string;
  avatarPosition: string;
};

const _relationPriorities: RelationItem[] = [
  {
    name: "Sarah Lemoine",
    kind: "Client",
    queue: "reply",
    context: "Nouveaux retours sur la page d’accueil",
    action: "Répondre avant 14 h",
    actionClass: "text-blue-700 dark:text-blue-300",
    channel: "WhatsApp · il y a 12 min",
    avatarPosition: "50% 100%",
  },
  {
    name: "Jon Bell",
    kind: "Client",
    queue: "reply",
    context: "Incident d’invitation toujours non résolu",
    action: "En retard d’un jour",
    actionClass: "text-rose-600 dark:text-rose-300",
    channel: "Outlook · il y a 3 h",
    avatarPosition: "100% 100%",
  },
  {
    name: "Alex Morgan",
    kind: "Collaborateur",
    queue: "reply",
    context: "Deux validations requises avant le lancement",
    action: "À traiter aujourd’hui",
    actionClass: "text-blue-700 dark:text-blue-300",
    channel: "Slack · il y a 1 h",
    avatarPosition: "100% 0%",
  },
  {
    name: "Maya Chen",
    kind: "Client",
    queue: "followup",
    context: "Proposition commerciale envoyée il y a 4 jours",
    action: "Relancer aujourd’hui",
    actionClass: "text-orange-700 dark:text-orange-300",
    channel: "Gmail · il y a 4 jours",
    avatarPosition: "50% 0%",
  },
  {
    name: "Capucine Roy",
    kind: "Client",
    queue: "followup",
    context: "Brief mis à jour, prochaine étape non confirmée",
    action: "Relancer demain",
    actionClass: "text-orange-700 dark:text-orange-300",
    channel: "Gmail · mardi",
    avatarPosition: "0% 50%",
  },
  {
    name: "Nora Martin",
    kind: "Collaborateur",
    queue: "followup",
    context: "Mise en relation sans suite planifiée",
    action: "Relance facultative",
    actionClass: "text-muted-foreground",
    channel: "Outlook · lundi",
    avatarPosition: "50% 50%",
  },
  {
    name: "Thomas Aubry",
    kind: "Prestataire",
    queue: "waiting",
    context: "Contrat signé reçu, validation administrative en cours",
    action: "En attente depuis 2 j",
    actionClass: "text-muted-foreground",
    channel: "Telegram · il y a 2 jours",
    avatarPosition: "0% 0%",
  },
  {
    name: "Lina Moreau",
    kind: "Fournisseur",
    queue: "waiting",
    context: "Sélection finale des photos attendue jeudi",
    action: "Échéance jeudi",
    actionClass: "text-muted-foreground",
    channel: "Telegram · hier",
    avatarPosition: "100% 50%",
  },
  {
    name: "Orbital Finance",
    kind: "Fournisseur",
    queue: "waiting",
    context: "Référence du bon de commande à confirmer",
    action: "En attente depuis 1 j",
    actionClass: "text-muted-foreground",
    channel: "Gmail · hier",
    avatarPosition: "0% 100%",
  },
];

const _actionCategories = {
  reply: {
    label: (count: number) =>
      `${count} réponse${count > 1 ? "s" : ""} préparée${count > 1 ? "s" : ""} dans les échanges`,
  },
  summary: {
    label: (count: number) =>
      `${count} conversation${count > 1 ? "s" : ""} résumée${count > 1 ? "s" : ""} avant de répondre`,
  },
  context: {
    label: (count: number) =>
      `Contexte retrouvé dans ${count} échange${count > 1 ? "s" : ""}`,
  },
  followup: {
    label: (count: number) =>
      `${count} relance${count > 1 ? "s" : ""} préparée${count > 1 ? "s" : ""}`,
  },
  filing: {
    label: (count: number) =>
      `${count} conversation${count > 1 ? "s" : ""} classée${count > 1 ? "s" : ""}`,
  },
  attachment: {
    label: (count: number) =>
      `${count} pièce${count > 1 ? "s" : ""} jointe${count > 1 ? "s" : ""} retrouvée${count > 1 ? "s" : ""}`,
  },
} as const;

type GainCategory = keyof typeof _actionCategories;

const _gainRelations: Array<{
  name: string;
  avatarPosition: string;
  total: string;
  actions: Array<{ category: GainCategory; count: number; time: string }>;
}> = [
  {
    name: "Sarah Lemoine",
    avatarPosition: "50% 100%",
    total: "14 min 30",
    actions: [
      { category: "reply", count: 5, time: "2 min 30" },
      { category: "summary", count: 3, time: "4 min" },
      { category: "context", count: 8, time: "6 min 40" },
      { category: "followup", count: 2, time: "1 min 20" },
    ],
  },
  {
    name: "Maya Chen",
    avatarPosition: "50% 0%",
    total: "12 min 20",
    actions: [
      { category: "reply", count: 4, time: "2 min" },
      { category: "summary", count: 2, time: "2 min 40" },
      { category: "context", count: 6, time: "5 min" },
      { category: "followup", count: 4, time: "2 min 40" },
    ],
  },
  {
    name: "Jon Bell",
    avatarPosition: "100% 100%",
    total: "15 min 50",
    actions: [
      { category: "reply", count: 3, time: "1 min 30" },
      { category: "summary", count: 4, time: "5 min 20" },
      { category: "context", count: 9, time: "7 min 30" },
      { category: "filing", count: 3, time: "1 min 30" },
    ],
  },
  {
    name: "Thomas Aubry",
    avatarPosition: "0% 0%",
    total: "12 min 10",
    actions: [
      { category: "reply", count: 2, time: "1 min" },
      { category: "attachment", count: 4, time: "5 min" },
      { category: "context", count: 5, time: "4 min 10" },
      { category: "filing", count: 4, time: "2 min" },
    ],
  },
  {
    name: "Lina Moreau",
    avatarPosition: "100% 50%",
    total: "10 min 55",
    actions: [
      { category: "reply", count: 3, time: "1 min 30" },
      { category: "context", count: 5, time: "4 min 10" },
      { category: "attachment", count: 3, time: "3 min 45" },
      { category: "filing", count: 3, time: "1 min 30" },
    ],
  },
  {
    name: "Capucine Roy",
    avatarPosition: "0% 50%",
    total: "12 min 10",
    actions: [
      { category: "reply", count: 4, time: "2 min" },
      { category: "summary", count: 3, time: "4 min" },
      { category: "context", count: 5, time: "4 min 10" },
      { category: "followup", count: 3, time: "2 min" },
    ],
  },
  {
    name: "Alex Morgan",
    avatarPosition: "100% 0%",
    total: "14 min 40",
    actions: [
      { category: "summary", count: 5, time: "6 min 40" },
      { category: "context", count: 6, time: "5 min" },
      { category: "filing", count: 6, time: "3 min" },
    ],
  },
  {
    name: "Orbital Finance",
    avatarPosition: "0% 100%",
    total: "10 min 05",
    actions: [
      { category: "reply", count: 3, time: "1 min 30" },
      { category: "context", count: 4, time: "3 min 20" },
      { category: "attachment", count: 3, time: "3 min 45" },
      { category: "filing", count: 3, time: "1 min 30" },
    ],
  },
];

export function ClientRelationsPreview() {
  const router = useRouter();
  const { isMobile, state } = useSidebar();
  const { emailAccountId, provider, userEmail } = useAccount();
  const {
    data: realThreads,
    error: relationsError,
    isLoading: relationsLoading,
    mutate: refreshRelations,
  } = useSWR<ThreadsListResponse>(
    emailAccountId ? "/api/threads?type=inbox&limit=50&view=list" : null,
  );
  const realRelations = useMemo(
    () =>
      toRealRelations(
        toRealChannelConversations({
          provider,
          threads: realThreads?.threads ?? [],
          userEmail,
        }),
      ),
    [provider, realThreads, userEmail],
  );
  const contactAddresses = useMemo(
    () => realRelations.map(({ address }) => address),
    [realRelations],
  );
  const { photos: contactPhotos } = useContactPhotos(contactAddresses);
  const mobileRelations = useMemo<MobileRelationContact[]>(
    () =>
      realRelations.map((relation) => ({
        id: relation.latestThreadId,
        name: relation.name,
        initials: relation.initials,
        address: relation.address,
        channel: relation.channel === "outlook" ? "Outlook" : "Gmail",
        subject: relation.latestSubject,
        time: relation.time,
        unreadCount: relation.unreadCount,
        conversationCount: relation.conversationCount,
        avatarUrl: contactPhotos[relation.address.toLowerCase()],
      })),
    [contactPhotos, realRelations],
  );
  const isMueOpen = !isMobile && state.includes("mue-panel");
  const [period, setPeriod] = useState<Period>("31 derniers jours");
  const [activeMetric, setActiveMetric] = useState<SavingsMetric>("total");
  const activityPeriod = {
    "7 derniers jours": "7d",
    "31 derniers jours": "31d",
    "3 derniers mois": "90d",
  }[period] as "7d" | "31d" | "90d";
  const {
    data: activity,
    isLoading: activityLoading,
    mutate: refreshActivity,
  } = useSWR<GetFreescaleActivityResponse>(
    emailAccountId ? `/api/user/activity?period=${activityPeriod}` : null,
  );
  const activitySummary = activity?.summary ?? {
    actions: 0,
    followups: 0,
    messages: 0,
    replies: 0,
    tasks: 0,
  };
  const hasRecordedActivity = activitySummary.actions > 0;
  const savings = {
    total: "0 min",
    trend: hasRecordedActivity
      ? `${activitySummary.actions} action${activitySummary.actions > 1 ? "s" : ""} enregistrée${activitySummary.actions > 1 ? "s" : ""}`
      : "Aucune action terminée",
    value: "0 €",
    actions: String(activitySummary.actions),
  };

  return (
    <>
      <MobileRelationsPreview
        activity={activitySummary}
        contacts={mobileRelations}
        error={Boolean(relationsError)}
        loading={relationsLoading || activityLoading}
        onPeriodChange={(mobilePeriod) =>
          setPeriod(
            mobilePeriod === "7 jours"
              ? "7 derniers jours"
              : mobilePeriod === "3 mois"
                ? "3 derniers mois"
                : "31 derniers jours",
          )
        }
        onRetry={async () => {
          await Promise.all([refreshRelations(), refreshActivity()]);
        }}
        period={
          period === "7 derniers jours"
            ? "7 jours"
            : period === "3 derniers mois"
              ? "3 mois"
              : "30 jours"
        }
      />
      <div className="hidden lg:block">
        <PageWrapper>
          <div
            className={cn(
              "flex flex-col gap-4",
              !isMueOpen && "sm:flex-row sm:items-end sm:justify-between",
            )}
          >
            <PageHeader
              title="Relations clients"
              description="Mesurez le temps que Freescale vous rend et gardez le contrôle sur vos échanges."
            />
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2" variant="outline">
                    <CalendarDaysIcon className="size-4" />
                    {period}
                    <ChevronDownIcon className="size-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {periodOptions.map((option) => (
                    <DropdownMenuItem
                      key={option}
                      onClick={() => setPeriod(option)}
                    >
                      {option}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <section className="mt-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-semibold text-base">Contacts récents</h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  Regroupés à partir de vos vrais échanges connectés.
                </p>
              </div>
              <span className="text-muted-foreground text-xs">
                {realRelations.length} contact
                {realRelations.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border bg-background">
              {relationsLoading ? (
                <div
                  aria-label="Chargement des relations"
                  className="divide-y"
                  role="status"
                >
                  {Array.from({ length: 4 }, (_, index) => (
                    <div
                      className="flex items-center gap-3 px-4 py-3.5"
                      key={index}
                    >
                      <span className="size-9 shrink-0 animate-pulse rounded-full bg-muted" />
                      <span className="min-w-0 flex-1 space-y-2">
                        <span className="block h-3 w-36 animate-pulse rounded-full bg-muted" />
                        <span className="block h-2.5 w-56 max-w-full animate-pulse rounded-full bg-muted" />
                      </span>
                    </div>
                  ))}
                </div>
              ) : relationsError ? (
                <div className="px-5 py-10 text-center">
                  <p className="font-medium text-sm">Contacts indisponibles</p>
                  <Button
                    className="mt-3"
                    onClick={() => refreshRelations()}
                    size="sm"
                    variant="outline"
                  >
                    Réessayer
                  </Button>
                </div>
              ) : realRelations.length ? (
                realRelations.slice(0, 12).map((relation, index) => (
                  <button
                    className={cn(
                      "grid w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40 sm:grid-cols-[minmax(180px,1fr)_minmax(220px,1.4fr)_100px_90px] sm:items-center",
                      index < Math.min(realRelations.length, 12) - 1 &&
                        "border-b",
                    )}
                    key={relation.address}
                    onClick={() =>
                      router.push(
                        `/channels-v4?conversation=${encodeURIComponent(relation.latestThreadId)}`,
                      )
                    }
                    type="button"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-9 shrink-0 font-semibold text-xs">
                        <AvatarImage
                          alt={`Photo de profil de ${relation.name}`}
                          src={contactPhotos[relation.address.toLowerCase()]}
                        />
                        <AvatarFallback>{relation.initials}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <strong className="block truncate text-sm">
                          {relation.name}
                        </strong>
                        <span className="block truncate text-muted-foreground text-xs">
                          {relation.address}
                        </span>
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm">
                        {relation.latestSubject}
                      </span>
                      <span className="mt-0.5 block text-muted-foreground text-xs">
                        {relation.time}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <MessageSquareIcon className="size-3.5" />
                      {relation.conversationCount} échange
                      {relation.conversationCount > 1 ? "s" : ""}
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-1.5 text-xs",
                        relation.unreadCount
                          ? "font-medium text-blue-700"
                          : "text-muted-foreground",
                      )}
                    >
                      <MailIcon className="size-3.5" />
                      {relation.unreadCount} non lu
                      {relation.unreadCount > 1 ? "s" : ""}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-5 py-12 text-center">
                  <UsersRoundIcon className="mx-auto size-6 text-muted-foreground" />
                  <p className="mt-3 font-medium text-sm">
                    Aucun contact synchronisé
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Les contacts apparaîtront après vos premiers échanges.
                  </p>
                </div>
              )}
            </div>
          </section>

          <div
            className={cn(
              "mt-6 grid gap-3 sm:grid-cols-2",
              isMueOpen ? "xl:grid-cols-2" : "xl:grid-cols-4",
            )}
          >
            <Card className="relative overflow-hidden border-blue-100 bg-[linear-gradient(118deg,#ffffff_0%,#f8fbff_48%,#eef4ff_100%)] p-0 shadow-[0_10px_30px_-28px_rgba(37,99,235,.5)] sm:col-span-2 dark:border-blue-950 dark:bg-[linear-gradient(118deg,#09090b_0%,#0d1420_52%,#111b2d_100%)]">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between gap-4 px-5 pt-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-blue-200/80 bg-white/80 text-blue-700 shadow-sm dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                      <TimerResetIcon className="size-6" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Temps gagné</p>
                      <p className="mt-0.5 text-muted-foreground text-xs">
                        grâce à Freescale
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-blue-100 bg-white/60 px-2.5 py-1 text-muted-foreground text-[11px] dark:border-blue-950 dark:bg-black/10">
                    {period === "7 derniers jours"
                      ? "7 jours"
                      : period === "31 derniers jours"
                        ? "31 jours"
                        : "3 mois"}
                  </span>
                </div>

                <div className="flex flex-1 items-end px-5 pb-5 pt-4">
                  <span className="font-normal text-5xl tracking-[-0.045em] sm:text-6xl">
                    {savings.total}
                  </span>
                </div>

                <div className="grid border-blue-100/80 border-t bg-white/45 sm:grid-cols-[1fr_auto] dark:border-blue-950 dark:bg-black/10">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-3 text-[11px]",
                      hasRecordedActivity
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-muted-foreground",
                    )}
                  >
                    {hasRecordedActivity ? (
                      <ArrowUpRightIcon className="size-3.5 shrink-0" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                    )}
                    <span className="whitespace-nowrap">{savings.trend}</span>
                  </div>
                  <div className="border-blue-100/80 px-5 py-3 text-xs sm:border-l dark:border-blue-950">
                    {hasRecordedActivity ? (
                      <span className="font-medium">
                        {activitySummary.replies} réponse
                        {activitySummary.replies > 1 ? "s" : ""} ·{" "}
                        {activitySummary.followups} relance
                        {activitySummary.followups > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Le compteur démarre à la première validation
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <ValueCard
              actionLabel="Informer Mue d’un nouveau TJM"
              actionPrompt="Je souhaite mettre à jour mon TJM utilisé pour calculer la valeur libérée."
              detail={
                hasRecordedActivity
                  ? "Calculée sur la base de votre TJM actuel de 500 €."
                  : "La valeur apparaîtra dès qu’une action aura réellement été terminée."
              }
              icon={CircleDollarSignIcon}
              label="Valeur libérée"
              tone="green"
              value={savings.value}
            />
            <ValueCard
              actionLabel="Demander le détail à Mue"
              actionPrompt="Quelles sont précisément les actions assistées comptabilisées sur cette période ?"
              detail={
                hasRecordedActivity
                  ? "Tris, résumés, brouillons et relances réalisés avec Freescale."
                  : "Les suggestions détectées ne sont pas comptées tant qu’elles ne sont pas validées."
              }
              icon={ZapIcon}
              label="Actions assistées"
              tone="blue"
              value={savings.actions}
            />
          </div>

          {hasRecordedActivity ? (
            <section className="mt-7">
              <div>
                <h2 className="font-semibold text-base">
                  Activité enregistrée
                </h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  Uniquement les actions réellement effectuées dans Freescale.
                </p>
              </div>

              <div className="mt-4 grid overflow-hidden rounded-2xl border bg-background sm:grid-cols-4">
                {[
                  ["Réponses envoyées", activitySummary.replies],
                  ["Relances envoyées", activitySummary.followups],
                  ["Nouveaux messages", activitySummary.messages],
                  ["Tâches terminées", activitySummary.tasks],
                ].map(([label, value]) => (
                  <div
                    className="border-border/70 border-b p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
                    key={label}
                  >
                    <p className="font-semibold text-2xl tabular-nums">
                      {value}
                    </p>
                    <p className="mt-1 text-muted-foreground text-xs">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="mt-7">
              <div>
                <h2 className="font-semibold text-base">
                  Comment le temps gagné sera calculé
                </h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  Le scan prépare le travail. Il ne crée pas encore de résultat.
                </p>
              </div>

              <div className="mt-4 grid overflow-hidden rounded-2xl border bg-background sm:grid-cols-3">
                {[
                  {
                    number: "01",
                    title: "Freescale détecte",
                    description:
                      "Les messages non lus, les relances et le contexte sont regroupés.",
                  },
                  {
                    number: "02",
                    title: "Vous validez",
                    description:
                      "Vous envoyez une réponse, créez une tâche ou terminez une action.",
                  },
                  {
                    number: "03",
                    title: "Le gain apparaît",
                    description:
                      "Le temps et la valeur sont alors ajoutés à vos statistiques.",
                  },
                ].map((item) => (
                  <div
                    className="border-border/70 border-b p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
                    key={item.number}
                  >
                    <span className="font-medium text-blue-600 text-xs tabular-nums">
                      {item.number}
                    </span>
                    <p className="mt-4 font-medium text-sm">{item.title}</p>
                    <p className="mt-1.5 text-muted-foreground text-xs leading-5">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <Card className="mt-4">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">
                    Actions enregistrées dans le temps
                  </CardTitle>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Réponses, relances et autres validations réelles.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["total", "Total", "bg-blue-400"],
                      ["replies", "Réponses", "bg-emerald-500"],
                      ["followups", "Relances", "bg-orange-400"],
                    ] as const
                  ).map(([id, label, color]) => (
                    <button
                      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-muted-foreground text-xs transition-colors hover:bg-muted data-[active=true]:bg-muted data-[active=true]:font-medium data-[active=true]:text-foreground"
                      data-active={activeMetric === id}
                      key={id}
                      onClick={() => setActiveMetric(id)}
                      type="button"
                    >
                      <span className={cn("size-2 rounded-full", color)} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SavingsActivityChart
                data={activity?.series}
                metric={activeMetric}
              />
            </CardContent>
          </Card>
        </PageWrapper>
      </div>
    </>
  );
}

function ValueCard({
  actionLabel,
  actionPrompt,
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  actionLabel: string;
  actionPrompt: string;
  detail: string;
  icon: typeof ZapIcon;
  label: string;
  tone: "blue" | "green";
  value: string;
}) {
  const iconClass = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    green:
      "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  }[tone];
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="mt-2 font-semibold text-3xl tracking-tight">{value}</p>
        </div>
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-lg",
            iconClass,
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-4 text-muted-foreground text-xs leading-5">{detail}</p>
      <button
        className="mt-auto flex items-center gap-1.5 pt-4 text-left font-medium text-blue-700 text-xs transition-colors hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent("freescale:prefill-mue", {
              detail: actionPrompt,
            }),
          )
        }
        type="button"
      >
        <span>{actionLabel}</span>
        <ArrowUpRightIcon className="size-3.5 shrink-0" />
      </button>
    </Card>
  );
}

function SavingsActivityChart({
  data = [],
  metric,
}: {
  data?: Array<{
    label: string;
    total: number;
    replies: number;
    followups: number;
  }>;
  metric: SavingsMetric;
}) {
  const empty = !data.some((item) => item.total > 0);
  const chartData = data.length
    ? data
    : Array.from({ length: 6 }, (_, index) => ({
        label: index === 0 ? "Aujourd’hui" : "",
        total: 0,
        replies: 0,
        followups: 0,
      }));
  const maximum = Math.max(1, ...chartData.map((item) => item[metric]));
  const config = {
    total: { color: "from-blue-400 to-blue-100" },
    replies: { color: "from-emerald-500 to-emerald-100" },
    followups: { color: "from-orange-400 to-orange-100" },
  }[metric];
  return (
    <div className="relative h-56 pl-9 sm:h-64 sm:pl-11">
      {empty ? (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center pl-9 sm:pl-11">
          <div className="rounded-xl border bg-background/90 px-4 py-3 text-center shadow-sm backdrop-blur-sm">
            <p className="font-medium text-sm">
              Aucune activité pour l’instant
            </p>
            <p className="mt-1 text-muted-foreground text-xs">
              Votre courbe commencera après votre première action terminée.
            </p>
          </div>
        </div>
      ) : null}
      <div className="absolute inset-y-0 left-0 flex w-8 flex-col justify-between pb-7 text-right text-muted-foreground text-xs">
        {[maximum, maximum * 0.75, maximum * 0.5, maximum * 0.25, 0].map(
          (tick) => (
            <span key={tick}>{Math.round(tick)}</span>
          ),
        )}
      </div>
      <div className="relative h-full pb-7">
        <div className="absolute inset-x-0 bottom-7 top-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((line) => (
            <div className="border-t" key={line} />
          ))}
        </div>
        <div className="absolute inset-x-3 bottom-7 top-0 flex items-end justify-between gap-3 sm:inset-x-6 sm:gap-6">
          {chartData.map((item, index) => (
            <div
              className="flex h-full flex-1 items-end"
              key={`${item.label}-${index}`}
            >
              <div
                className={cn(
                  "w-full rounded-t bg-gradient-to-b transition-[height] duration-300",
                  config.color,
                )}
                style={{ height: `${(item[metric] / maximum) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-1 bottom-0 flex justify-between text-muted-foreground text-[10px] sm:inset-x-4 sm:text-xs">
          {chartData.map((item, index) => (
            <span className="flex-1 text-center" key={`${item.label}-${index}`}>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
