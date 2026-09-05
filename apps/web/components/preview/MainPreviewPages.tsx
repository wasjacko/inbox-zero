"use client";

import {
  ArchiveIcon,
  ArrowUpRightIcon,
  BellIcon,
  BotIcon,
  Building2Icon,
  CalendarClockIcon,
  CalendarIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ClockIcon,
  CreditCardIcon,
  FileIcon,
  FolderIcon,
  InboxIcon,
  LayoutGridIcon,
  ListTodoIcon,
  Loader2Icon,
  MailIcon,
  MessageCircleReplyIcon,
  MessageSquareIcon,
  MoonIcon,
  MoreHorizontalIcon,
  PlusIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SearchIcon,
  SendIcon,
  SettingsIcon,
  ShieldCheckIcon,
  Settings2Icon,
  SparklesIcon,
  SunIcon,
  TimerIcon,
  Trash2Icon,
  ThumbsUpIcon,
  TrendingUpIcon,
  Undo2Icon,
  UsersIcon,
  WebhookIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/Badge";
import { WhatsAppIcon } from "@/components/BrandIcons";
import { PageHeader } from "@/components/PageHeader";
import { PageWrapper } from "@/components/PageWrapper";
import { TooltipExplanation } from "@/components/TooltipExplanation";
import { PageHeading } from "@/components/Typography";
import { BarListCard } from "@/app/(app)/[emailAccountId]/stats/BarListCard";
import { Gmail } from "@/components/new-landing/icons/Gmail";
import { Outlook } from "@/components/new-landing/icons/Outlook";
import type { ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardBasic,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Item,
  ItemActions,
  ItemCard,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/utils";
import {
  DEFAULT_PREVIEW_WORKSPACE_NAME,
  PREVIEW_WORKSPACE_NAME_KEY,
  savePreviewWorkspaceName,
} from "@/utils/preview-workspace";
import { COLORS } from "@/utils/colors";
import { usePreviewSetupProgress } from "@/hooks/usePreviewSetupProgress";
import { useAccounts } from "@/hooks/useAccounts";
import { toastError, toastSuccess } from "@/components/Toast";
import { ButtonCheckbox } from "@/components/ButtonCheckbox";
import { DomainIcon } from "@/components/charts/DomainIcon";
import { DismissibleVideoCard } from "@/components/VideoCard";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MobileCleanupPreview,
  MobileDrivePreview,
  MobileOrganizationPreview,
  MobileSettingsPreview,
} from "@/components/mobile/MobileSimplifiedPages";
import {
  MobileFullScreenDialog,
  MobileSheet,
} from "@/components/mobile/MobilePrimitives";
import { getAccountLinkingUrl } from "@/utils/account-linking";
import { getVerifiedMailboxChannels } from "@/utils/preview-onboarding";
import { redirectToSafeUrl } from "@/utils/redirect";

const mobilePreviewQuery = "(max-width: 1023px)";

function runOnMobile(callback: () => void) {
  if (window.matchMedia(mobilePreviewQuery).matches) callback();
}

const bulkUnsubscribeSenders = [
  {
    name: "Acquire Notifications",
    email: "notifications@acquire.com",
    domain: "acquire.com",
    emails: 265,
    read: 0,
  },
  {
    name: '"emplois trabajo.org"',
    email: "info@trabajo.org",
    domain: "trabajo.org",
    emails: 200,
    read: 1,
  },
  {
    name: "linkedin.com",
    email: "messages-noreply@linkedin.com",
    domain: "linkedin.com",
    emails: 63,
    read: 0,
  },
  {
    name: '"Aurélien de systeme.io"',
    email: "newsletter-fr@systeme.io",
    domain: "systeme.io",
    emails: 59,
    read: 0,
  },
  {
    name: '"Privé by Zalando"',
    email: "message@prive.zalando.fr",
    domain: "zalando.fr",
    emails: 57,
    read: 0,
  },
  {
    name: '"Wass\'s Workspace"',
    email: "notifications@tasks.clickup.com",
    domain: "clickup.com",
    emails: 49,
    read: 0,
    action: "Block",
  },
  {
    name: "github.com",
    email: "notifications@github.com",
    domain: "github.com",
    emails: 46,
    read: 0,
  },
  {
    name: "OKX",
    email: "updates@okx.com",
    domain: "okx.com",
    emails: 37,
    read: 0,
  },
  {
    name: "europa-peptide.de",
    email: "eu@europa-peptide.de",
    domain: "europa-peptide.de",
    emails: 34,
    read: 53,
  },
  {
    name: "Temu",
    email: "temu@eu.temuemail.com",
    domain: "temu.com",
    emails: 31,
    read: 0,
  },
  {
    name: "Doctolib",
    email: "no-reply@doctolib.fr",
    domain: "doctolib.fr",
    emails: 27,
    read: 15,
  },
  {
    name: "Canva",
    email: "updates@canva.com",
    domain: "canva.com",
    emails: 24,
    read: 4,
  },
  {
    name: "Miro",
    email: "notifications@miro.com",
    domain: "miro.com",
    emails: 21,
    read: 8,
  },
  {
    name: "Product Hunt",
    email: "hello@producthunt.com",
    domain: "producthunt.com",
    emails: 18,
    read: 44,
  },
  {
    name: "Dropbox",
    email: "no-reply@dropbox.com",
    domain: "dropbox.com",
    emails: 12,
    read: 25,
  },
];

const BULK_UNSUBSCRIBE_INITIAL_ROWS = 11;
const BULK_UNSUBSCRIBE_STORAGE_KEY = "preview-bulk-unsubscribe-state-v1";

type BulkSenderStatus = "Unsubscribed" | "Blocked" | "Archived" | "Kept";

export function ChannelsPreview() {
  return (
    <PageWrapper>
      <div className="mx-auto max-w-2xl space-y-10">
        <PageHeader
          title="Canaux"
          description="Choisissez ce que Freescale envoie à vos applications de messagerie."
        />

        <div className="space-y-10">
          <section className="rounded-xl border border-blue-100 bg-blue-50/40 p-6 dark:border-blue-950 dark:bg-blue-950/20">
            <h2 className="flex items-start gap-2 font-semibold text-lg tracking-tight">
              <BellIcon className="mt-1 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <span>Freescale, là où vous travaillez.</span>
            </h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Recevez vos messages importants, réponses préparées, briefs et
              résumés quotidiens dans Slack ou Telegram.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { icon: MailIcon, label: "Messages importants" },
                { icon: MessageCircleReplyIcon, label: "Réponses préparées" },
                { icon: CalendarClockIcon, label: "Briefs de réunion" },
                { icon: SunIcon, label: "Résumé quotidien" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 font-medium text-xs"
                >
                  <Icon className="size-3.5 text-muted-foreground" />
                  {label}
                </div>
              ))}
            </div>
          </section>

          <UnconnectedChannel name="Slack" logo="/images/slack.svg" />
          <UnconnectedChannel name="Telegram" logo="/images/telegram.svg" />
        </div>
      </div>
    </PageWrapper>
  );
}

function UnconnectedChannel({ name, logo }: { name: string; logo: string }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Image
          src={logo}
          alt={name}
          width={20}
          height={20}
          className="size-5"
          unoptimized
        />
        <h2 className="font-medium text-sm uppercase tracking-wide">{name}</h2>
      </div>
      <ItemCard>
        <Item size="sm">
          <ItemContent>
            <ItemTitle>Connecter {name}</ItemTitle>
            <ItemDescription>
              Recevez vos notifications dans {name}.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="outline" size="sm">
              Connecter
            </Button>
          </ItemActions>
        </Item>
      </ItemCard>
    </section>
  );
}

export function BulkUnsubscribePreview() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Unhandled");
  const [period, setPeriod] = useState("Last 3 months");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Record<string, BulkSenderStatus>>(
    {},
  );
  const [sortColumn, setSortColumn] = useState<"emails" | "read">("emails");
  const [sortAscending, setSortAscending] = useState(false);
  const [suggestedMode, setSuggestedMode] = useState(false);
  const [loadedCount, setLoadedCount] = useState(BULK_UNSUBSCRIBE_INITIAL_ROWS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    emails: string[];
    action: BulkSenderStatus | "Restore";
  } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(BULK_UNSUBSCRIBE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          statuses?: Record<string, BulkSenderStatus>;
          approved?: string[];
          loadedCount?: number;
        };
        setStatuses(parsed.statuses ?? {});
        setApproved(new Set(parsed.approved ?? []));
        setLoadedCount(
          Math.min(
            Math.max(
              parsed.loadedCount ?? BULK_UNSUBSCRIBE_INITIAL_ROWS,
              BULK_UNSUBSCRIBE_INITIAL_ROWS,
            ),
            bulkUnsubscribeSenders.length,
          ),
        );
      }
    } catch {
      localStorage.removeItem(BULK_UNSUBSCRIBE_STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(
      BULK_UNSUBSCRIBE_STORAGE_KEY,
      JSON.stringify({
        statuses,
        approved: [...approved],
        loadedCount,
      }),
    );
  }, [approved, isHydrated, loadedCount, statuses]);

  const visibleSenders = bulkUnsubscribeSenders
    .slice(0, loadedCount)
    .filter((sender, index) => {
      const matchesQuery = `${sender.name} ${sender.email}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const isHandled = Boolean(statuses[sender.email]);
      const matchesFilter =
        filter === "All" ||
        (filter === "Unhandled" && !isHandled) ||
        (filter === "Handled" && isHandled) ||
        (filter === "Removed" &&
          isHandled &&
          statuses[sender.email] !== "Kept");
      const matchesSuggested = !suggestedMode || sender.read < 20;
      const periodLimit =
        period === "Last month"
          ? 1
          : period === "Last 3 months"
            ? 3
            : period === "Last 6 months"
              ? 6
              : 12;
      const senderAgeInMonths = index < 11 ? (index % 3) + 1 : index - 7;
      const matchesPeriod = senderAgeInMonths <= periodLimit;
      return matchesQuery && matchesFilter && matchesSuggested && matchesPeriod;
    })
    .sort((a, b) => {
      const difference =
        sortColumn === "emails" ? a.emails - b.emails : a.read - b.read;
      return sortAscending ? difference : -difference;
    });

  const removedSenders = bulkUnsubscribeSenders.filter((sender) => {
    const status = statuses[sender.email];
    return status && status !== "Kept";
  });
  const isRecoveryMode = filter === "Removed";

  const allVisibleSelected =
    visibleSenders.length > 0 &&
    visibleSenders.every((sender) => selected.has(sender.email));
  const someVisibleSelected = visibleSenders.some((sender) =>
    selected.has(sender.email),
  );

  const toggleSelected = (email: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const confirmPendingAction = () => {
    if (!pendingAction) return;
    const { action, emails } = pendingAction;
    setStatuses((current) => {
      const next = { ...current };
      for (const email of emails) {
        if (action === "Restore") delete next[email];
        else next[email] = action;
      }
      return next;
    });
    setSelected((current) => {
      const next = new Set(current);
      emails.forEach((email) => next.delete(email));
      return next;
    });
    setPendingAction(null);
    toastSuccess({
      description:
        action === "Restore"
          ? `${emails.length} expéditeur${emails.length > 1 ? "s" : ""} restauré${emails.length > 1 ? "s" : ""}`
          : `${emails.length} expéditeur${emails.length > 1 ? "s" : ""} mis à jour`,
    });
  };

  const loadMore = () => {
    if (isLoadingMore || loadedCount >= bulkUnsubscribeSenders.length) return;
    setIsLoadingMore(true);
    window.setTimeout(() => {
      setLoadedCount((count) =>
        Math.min(count + 4, bulkUnsubscribeSenders.length),
      );
      setIsLoadingMore(false);
      toastSuccess({ description: "Expéditeurs supplémentaires chargés" });
    }, 500);
  };

  return (
    <>
      <MobileCleanupPreview mode="unsubscribe" />
      <div className="hidden lg:block">
        <PageWrapper>
          <PageHeader
            title="Désabonnement"
            videoButtonLabel="Regarder la vidéo"
            video={{
              title: "Bien démarrer avec le désabonnement",
              description:
                "Découvrez comment vous désabonner rapidement des e-mails indésirables et les archiver.",
              youtubeVideoId: "T1rnooV4OYc",
            }}
            actions={
              <div className="flex items-center gap-2">
                <Button
                  disabled={removedSenders.length === 0}
                  onClick={() => {
                    setFilter("Removed");
                    setSuggestedMode(false);
                    setQuery("");
                    setSelected(new Set());
                    setLoadedCount(bulkUnsubscribeSenders.length);
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Undo2Icon className="size-4" />
                  Voir mes suppressions ({removedSenders.length})
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      aria-label="Options de désabonnement"
                    >
                      <MoreHorizontalIcon className="size-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      disabled={removedSenders.length === 0}
                      onClick={() => {
                        setFilter("Removed");
                        setSuggestedMode(false);
                        setQuery("");
                        setSelected(new Set());
                        setLoadedCount(bulkUnsubscribeSenders.length);
                      }}
                    >
                      <Undo2Icon />
                      Éléments retirés
                      {removedSenders.length > 0 && (
                        <span className="ml-auto text-muted-foreground">
                          {removedSenders.length}
                        </span>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={removedSenders.length === 0}
                      onClick={() =>
                        setPendingAction({
                          emails: removedSenders.map((sender) => sender.email),
                          action: "Restore",
                        })
                      }
                    >
                      <RotateCcwIcon />
                      Tout restaurer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            }
          />

          <DismissibleVideoCard
            className="my-4"
            icon={<ArchiveIcon className="size-5" />}
            title="Bien démarrer avec le désabonnement"
            description="Découvrez comment vous désabonner des e-mails indésirables et les archiver."
            videoSrc="https://www.youtube.com/embed/T1rnooV4OYc"
            youtubeVideoId="T1rnooV4OYc"
            thumbnailSrc="https://img.youtube.com/vi/T1rnooV4OYc/0.jpg"
            storageKey="preview-bulk-unsubscribe-onboarding-video-v2"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 min-w-[136px] justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <InboxIcon className="size-4" />
                      {filter === "Unhandled"
                        ? "À traiter"
                        : filter === "Handled"
                          ? "Traités"
                          : filter === "Removed"
                            ? "Éléments retirés"
                            : "Tous"}
                    </span>
                    <ChevronDownIcon className="size-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[170px]">
                  {["Unhandled", "Handled", "All"].map((option) => (
                    <DropdownMenuItem
                      key={option}
                      onClick={() => {
                        setFilter(option);
                        setSelected(new Set());
                      }}
                    >
                      {option === "Unhandled"
                        ? "À traiter"
                        : option === "Handled"
                          ? "Traités"
                          : "Tous"}
                      {filter === option && (
                        <CheckIcon className="ml-auto size-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 min-w-[194px] justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <CalendarIcon className="size-4" />
                      {period === "Last month"
                        ? "Le mois dernier"
                        : period === "Last 3 months"
                          ? "Les 3 derniers mois"
                          : period === "Last 6 months"
                            ? "Les 6 derniers mois"
                            : "L’année dernière"}
                    </span>
                    <ChevronDownIcon className="size-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[194px]">
                  {[
                    "Last month",
                    "Last 3 months",
                    "Last 6 months",
                    "Last year",
                  ].map((option) => (
                    <DropdownMenuItem
                      key={option}
                      onClick={() => setPeriod(option)}
                    >
                      {option === "Last month"
                        ? "Le mois dernier"
                        : option === "Last 3 months"
                          ? "Les 3 derniers mois"
                          : option === "Last 6 months"
                            ? "Les 6 derniers mois"
                            : "L’année dernière"}
                      {period === option && (
                        <CheckIcon className="ml-auto size-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="relative w-full sm:w-[196px]">
                <SearchIcon className="absolute top-3 left-3 size-4 text-muted-foreground" />
                <Input
                  className="h-10 pl-9"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher…"
                />
              </div>

              <Button
                variant={suggestedMode ? "secondary" : "outline"}
                size="sm"
                className="h-10"
                aria-pressed={suggestedMode}
                onClick={() => {
                  if (suggestedMode) {
                    setSuggestedMode(false);
                    setSelected(new Set());
                  } else {
                    setSuggestedMode(true);
                    setSelected(
                      new Set(
                        bulkUnsubscribeSenders
                          .slice(0, loadedCount)
                          .filter(
                            (sender) =>
                              sender.read < 20 && !statuses[sender.email],
                          )
                          .map((sender) => sender.email),
                      ),
                    );
                  }
                }}
              >
                <SparklesIcon className="size-4 text-amber-500" />
                {suggestedMode
                  ? "46 suggestions affichées"
                  : "Sélectionner 46 suggestions"}
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-10"
              disabled={
                isLoadingMore || loadedCount >= bulkUnsubscribeSenders.length
              }
              onClick={loadMore}
            >
              {isLoadingMore ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <RefreshCwIcon className="size-4" />
              )}
              {loadedCount >= bulkUnsubscribeSenders.length
                ? "Tout est chargé"
                : "Charger plus"}
            </Button>
          </div>

          {selected.size > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2 text-sm">
              <span className="font-medium">
                {selected.size} expéditeur{selected.size > 1 ? "s" : ""}{" "}
                sélectionné
                {selected.size > 1 ? "s" : ""}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelected(new Set())}
                >
                  Effacer
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    setPendingAction({
                      emails: [...selected],
                      action: isRecoveryMode ? "Restore" : "Unsubscribed",
                    })
                  }
                >
                  {isRecoveryMode ? <Undo2Icon className="size-4" /> : null}
                  {isRecoveryMode
                    ? "Restaurer la sélection"
                    : "Désabonner la sélection"}
                </Button>
              </div>
            </div>
          )}

          <Card className="mt-4 overflow-x-auto">
            <Table className="min-w-[880px] bulk-unsub-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pr-0">
                    <ButtonCheckbox
                      label={
                        allVisibleSelected
                          ? "Désélectionner tous les expéditeurs"
                          : "Sélectionner tous les expéditeurs"
                      }
                      checked={allVisibleSelected}
                      indeterminate={someVisibleSelected && !allVisibleSelected}
                      onChange={() =>
                        setSelected((current) => {
                          const next = new Set(current);
                          if (allVisibleSelected) {
                            visibleSenders.forEach((sender) =>
                              next.delete(sender.email),
                            );
                          } else {
                            visibleSenders.forEach((sender) =>
                              next.add(sender.email),
                            );
                          }
                          return next;
                        })
                      }
                    />
                  </TableHead>
                  <TableHead className="pl-8 font-medium">Expéditeur</TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="flex items-center gap-2 font-medium"
                      onClick={() => {
                        if (sortColumn === "emails") {
                          setSortAscending((value) => !value);
                        } else {
                          setSortColumn("emails");
                          setSortAscending(false);
                        }
                      }}
                    >
                      E-mails
                      <ChevronDownIcon
                        className={cn(
                          "size-4 transition-transform",
                          sortColumn === "emails" &&
                            sortAscending &&
                            "rotate-180",
                        )}
                      />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="flex items-center gap-2 font-medium"
                      onClick={() => {
                        if (sortColumn === "read") {
                          setSortAscending((value) => !value);
                        } else {
                          setSortColumn("read");
                          setSortAscending(false);
                        }
                      }}
                    >
                      Lus
                      <ChevronDownIcon
                        className={cn(
                          "size-4 transition-transform",
                          sortColumn === "read" &&
                            sortAscending &&
                            "rotate-180",
                        )}
                      />
                    </button>
                  </TableHead>
                  <TableHead className="w-[220px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleSenders.map((sender) => {
                  const isSuggested = sender.read < 20;
                  const isApproved = approved.has(sender.email);
                  const status = statuses[sender.email];
                  const isHandled = Boolean(status);

                  return (
                    <TableRow
                      key={sender.email}
                      className="hover:bg-transparent dark:hover:bg-transparent"
                    >
                      <TableCell className="w-10 pr-0">
                        <ButtonCheckbox
                          label={`Sélectionner ${sender.name}`}
                          checked={selected.has(sender.email)}
                          onChange={() => toggleSelected(sender.email)}
                        />
                      </TableCell>
                      <TableCell className="max-w-[350px] min-w-0 py-3 pl-8">
                        <div className="flex min-w-0 items-center gap-2">
                          <DomainIcon
                            domain={sender.domain}
                            size={32}
                            variant="circular"
                          />
                          <div className="min-w-0 lg:flex lg:items-baseline lg:gap-2">
                            <div className="truncate font-medium">
                              {sender.name}
                            </div>
                            <div className="truncate text-xs text-muted-foreground lg:text-sm">
                              {sender.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="font-medium text-foreground/80">
                          {sender.emails}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={sender.read}
                            className={cn(
                              "h-1.5 w-16",
                              isSuggested
                                ? "bg-amber-100 dark:bg-amber-950"
                                : "bg-muted",
                            )}
                            innerClassName={
                              isSuggested
                                ? "bg-amber-400"
                                : "bg-slate-300 dark:bg-slate-500"
                            }
                          />
                          <span
                            className={cn(
                              "font-medium",
                              isSuggested
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-foreground/80",
                            )}
                          >
                            {sender.read}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="w-[220px] p-1">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "size-8 text-muted-foreground",
                              isApproved && "text-green-600",
                            )}
                            aria-label={`Conserver ${sender.name}`}
                            onClick={() => {
                              setApproved((current) => {
                                const next = new Set(current);
                                if (isApproved) next.delete(sender.email);
                                else next.add(sender.email);
                                return next;
                              });
                              setStatuses((statusCurrent) => {
                                const statusNext = { ...statusCurrent };
                                if (isApproved) {
                                  if (statusNext[sender.email] === "Kept") {
                                    delete statusNext[sender.email];
                                  }
                                } else {
                                  statusNext[sender.email] = "Kept";
                                }
                                return statusNext;
                              });
                              toastSuccess({
                                description: isApproved
                                  ? `${sender.email} est de nouveau à traiter`
                                  : `${sender.email} est marqué comme sûr`,
                              });
                            }}
                          >
                            <ThumbsUpIcon
                              className={cn(
                                "size-4",
                                isApproved && "fill-current",
                              )}
                            />
                          </Button>
                          <Button
                            variant={isRecoveryMode ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "w-[110px] justify-center",
                              isRecoveryMode && "shadow-sm",
                            )}
                            onClick={() =>
                              setPendingAction({
                                emails: [sender.email],
                                action: isHandled
                                  ? "Restore"
                                  : sender.action === "Block"
                                    ? "Blocked"
                                    : "Unsubscribed",
                              })
                            }
                          >
                            {isHandled ? (
                              <>
                                {isRecoveryMode && (
                                  <Undo2Icon className="size-4" />
                                )}
                                Restaurer
                              </>
                            ) : sender.action === "Block" ? (
                              "Bloquer"
                            ) : (
                              "Se désabonner"
                            )}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                              >
                                <MoreHorizontalIcon className="size-4" />
                                <span className="sr-only">Plus d’actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  setPendingAction({
                                    emails: [sender.email],
                                    action: "Archived",
                                  })
                                }
                              >
                                <ArchiveIcon /> Archiver l’expéditeur
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setPendingAction({
                                    emails: [sender.email],
                                    action: "Archived",
                                  })
                                }
                              >
                                <RefreshCwIcon /> Archiver automatiquement
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  toastSuccess({
                                    description: `Opened emails from ${sender.email}`,
                                  })
                                }
                              >
                                <MailIcon /> Voir les e-mails
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!visibleSenders.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <InboxIcon className="mx-auto mb-3 size-10 text-muted-foreground/40" />
                      <p className="font-medium">Aucun e-mail trouvé</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Modifiez les filtres ou recherchez un autre expéditeur.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          <Dialog
            open={Boolean(pendingAction)}
            onOpenChange={(open) => !open && setPendingAction(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {pendingAction?.action === "Restore"
                    ? `Restaurer ${(pendingAction?.emails.length ?? 0) > 1 ? "les expéditeurs" : "l’expéditeur"} ?`
                    : `Confirmer la modification ${(pendingAction?.emails.length ?? 0) > 1 ? "des expéditeurs" : "de l’expéditeur"} ?`}
                </DialogTitle>
                <DialogDescription>
                  {pendingAction?.action === "Restore"
                    ? `${(pendingAction?.emails.length ?? 0) > 1 ? "Ces expéditeurs retrouveront" : "Cet expéditeur retrouvera"} la liste « À traiter ».`
                    : `Cette action mettra à jour ${(pendingAction?.emails.length ?? 0) > 1 ? `${pendingAction?.emails.length} expéditeurs` : pendingAction?.emails[0]} localement. Aucun service de messagerie ne sera contacté.`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPendingAction(null)}
                >
                  Annuler
                </Button>
                <Button onClick={confirmPendingAction}>
                  {pendingAction?.action === "Restore" ? (
                    <Undo2Icon className="size-4" />
                  ) : (
                    <CheckIcon className="size-4" />
                  )}
                  Confirmer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </PageWrapper>
      </div>
    </>
  );
}

export function BulkArchivePreview() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [removedGroups, setRemovedGroups] = useState<Set<string>>(new Set());
  const [pendingPermanentDelete, setPendingPermanentDelete] = useState<
    string | null
  >(null);
  const archiveGroups = [
    {
      name: "Conversations supprimées",
      description: "Échanges retirés de vos canaux et encore récupérables.",
      count: 24,
      unit: "conversations",
      storage: "18,6 Mo",
      icon: MessageSquareIcon,
      iconColor: "text-blue-600",
      borderColor: "from-blue-200 to-blue-300",
      gradient: "from-blue-50 to-blue-100",
      examples: [
        "Conversation supprimée — Studio Noma",
        "Conversation supprimée — Maison Orbe",
        "Conversation supprimée — Atelier 17",
      ],
    },
    {
      name: "Documents",
      description: "PDF, contrats, briefs, devis, factures et justificatifs.",
      count: 55,
      unit: "documents",
      storage: "168 Mo",
      icon: FileIcon,
      iconColor: "text-purple-600",
      borderColor: "from-purple-200 to-purple-300",
      gradient: "from-purple-50 to-purple-100",
      examples: [
        "Contrat_Maison-Orbe_signé.pdf",
        "Facture_2026-084.pdf",
        "Devis_Noma_042.pdf",
      ],
    },
    {
      name: "Contextes de projets inactifs",
      description:
        "Synthèses créées par Mue pour retrouver l’historique d’un projet.",
      count: 6,
      unit: "contextes Mue",
      storage: "2,4 Mo",
      icon: BotIcon,
      iconColor: "text-amber-600",
      borderColor: "from-amber-200 to-amber-300",
      gradient: "from-amber-50 to-amber-100",
      examples: [
        "Refonte Maison Orbe",
        "Campagne Noma Été",
        "Audit Atelier 17",
      ],
    },
  ];

  return (
    <>
      <MobileCleanupPreview mode="archive" />
      <div className="hidden lg:block">
        <PageWrapper className="pt-6 sm:pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PageHeading>Archives</PageHeading>
              <TooltipExplanation text="Rangez les échanges et documents qui ne demandent plus d’action, sans perdre leur contexte." />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <SettingsIcon className="mr-2 size-4" />
                Paramètres
              </Button>
              <Button variant="outline" size="sm" disabled>
                <SparklesIcon className="mr-2 size-4" />
                Classer automatiquement
              </Button>
            </div>
          </div>
          <Card className="mt-5 border-blue-200 bg-blue-50/40 p-5 dark:border-blue-900 dark:bg-blue-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  <FolderIcon className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">
                    Stockage Freescale · 5 Go inclus
                  </p>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Utilisé par vos pièces jointes, documents et contextes créés
                    par Mue.
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Les archives occupent actuellement 189 Mo sur 496,6 Mo
                    utilisés au total.
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-56">
                <Progress value={9.7} className="h-2" />
                <p className="mt-1.5 text-right text-muted-foreground text-xs">
                  4,5 Go disponibles
                </p>
              </div>
            </div>
          </Card>
          <div className="space-y-3 py-4">
            {archiveGroups
              .filter((group) => !removedGroups.has(group.name))
              .map((group) => {
                const CategoryIcon = group.icon;
                const isExpanded = expandedCategory === group.name;

                return (
                  <Card key={group.name} className="overflow-hidden">
                    <div
                      className="cursor-pointer p-4 transition-colors hover:bg-muted/50"
                      onClick={() =>
                        setExpandedCategory(isExpanded ? null : group.name)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setExpandedCategory(isExpanded ? null : group.name);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "shrink-0 rounded-lg bg-gradient-to-b p-px shadow-sm",
                              group.borderColor,
                            )}
                          >
                            <div
                              className={cn(
                                "flex size-9 items-center justify-center rounded-[7px] bg-gradient-to-b",
                                group.gradient,
                              )}
                            >
                              <CategoryIcon
                                className={cn("size-5", group.iconColor)}
                              />
                            </div>
                          </div>
                          <div>
                            <h2 className="font-medium">{group.name}</h2>
                            <p className="text-muted-foreground text-sm">
                              {group.description}
                            </p>
                            <p className="mt-1 text-muted-foreground text-xs">
                              {group.count} {group.unit} · {group.storage}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(event) => event.stopPropagation()}
                              >
                                Gérer
                                <ChevronDownIcon className="ml-1 size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setRemovedGroups((current) => {
                                    const next = new Set(current);
                                    next.add(group.name);
                                    return next;
                                  });
                                  toastSuccess({
                                    description: `${group.name} restaurés`,
                                  });
                                }}
                              >
                                <Undo2Icon />
                                Restaurer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() =>
                                  setPendingPermanentDelete(group.name)
                                }
                              >
                                <Trash2Icon />
                                Supprimer définitivement
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <ChevronDownIcon
                            className={cn(
                              "size-5 text-muted-foreground transition-transform",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <div className="border-t bg-muted/20 px-4 py-2">
                        {group.examples.map((example) => (
                          <div
                            key={example}
                            className="flex items-center gap-3 border-b py-3 text-sm last:border-b-0"
                          >
                            <CategoryIcon className="size-4 text-muted-foreground" />
                            <span className="min-w-0 flex-1 truncate">
                              {example}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              Dans les archives
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </Card>
                );
              })}
          </div>
          <Dialog
            open={Boolean(pendingPermanentDelete)}
            onOpenChange={(open) => !open && setPendingPermanentDelete(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Supprimer définitivement ?</DialogTitle>
                <DialogDescription>
                  « {pendingPermanentDelete} » sera supprimé de Freescale. Cette
                  action est irréversible et libérera l’espace de stockage
                  correspondant.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPendingPermanentDelete(null)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!pendingPermanentDelete) return;
                    setRemovedGroups((current) => {
                      const next = new Set(current);
                      next.add(pendingPermanentDelete);
                      return next;
                    });
                    toastSuccess({
                      description: "Suppression définitive effectuée",
                    });
                    setPendingPermanentDelete(null);
                  }}
                >
                  <Trash2Icon className="size-4" />
                  Supprimer définitivement
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </PageWrapper>
      </div>
    </>
  );
}

export function AnalyticsPreview() {
  const [activeChart, setActiveChart] = useState<
    "received" | "sent" | "read" | "archived"
  >("received");
  const chartConfig = {
    received: { label: "Reçus", color: COLORS.analytics.blue },
    sent: { label: "Envoyés", color: COLORS.analytics.purple },
    read: { label: "Lus", color: COLORS.analytics.pink },
    archived: { label: "Archivés", color: COLORS.analytics.green },
  } satisfies ChartConfig;
  const summary = { received: 1013, sent: 6, read: 57, archived: 3 };
  const chartData = [
    { date: "2026-07-13", received: 219, sent: 1, read: 12, archived: 1 },
    { date: "2026-07-20", received: 239, sent: 2, read: 15, archived: 0 },
    { date: "2026-07-27", received: 249, sent: 1, read: 14, archived: 1 },
    { date: "2026-08-03", received: 205, sent: 1, read: 10, archived: 1 },
    { date: "2026-08-10", received: 101, sent: 1, read: 6, archived: 0 },
  ];

  return (
    <PageWrapper>
      <PageHeading>Statistiques</PageHeading>
      <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline">
            <CalendarDaysIcon className="mr-2 size-4" />
            Le mois dernier
            <ChevronDownIcon className="ml-8 size-4 text-muted-foreground" />
          </Button>
          <Button variant="outline">
            <LayoutGridIcon className="mr-2 size-4" />
            Grouper par semaine
            <ChevronDownIcon className="ml-4 size-4 text-muted-foreground" />
          </Button>
        </div>
        <Button variant="outline">
          <RotateCcwIcon className="mr-2 size-4" />
          Charger plus
        </Button>
      </div>
      <div className="mt-4 grid gap-2 sm:gap-4">
        <Card className="py-0">
          <div className="grid grid-cols-2 border-b sm:flex sm:flex-row">
            {(["received", "sent", "read", "archived"] as const).map(
              (chart) => (
                <button
                  type="button"
                  key={chart}
                  data-active={activeChart === chart}
                  className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-6 py-4 text-left data-[active=true]:bg-muted/50 sm:px-8 sm:py-6 [&:nth-child(even)]:border-l [&:nth-child(n+3)]:border-t sm:[&:nth-child(2)]:border-l sm:[&:nth-child(3)]:border-l sm:[&:nth-child(4)]:border-l sm:[&:nth-child(n+3)]:border-t-0"
                  onClick={() => setActiveChart(chart)}
                >
                  <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: chartConfig[chart].color }}
                    />
                    {chartConfig[chart].label}
                  </span>
                  <span className="font-bold text-lg leading-none sm:text-3xl">
                    {summary[chart].toLocaleString()}
                  </span>
                </button>
              ),
            )}
          </div>
          <CardContent className="p-6 pl-0 sm:px-2">
            <AnalyticsBars
              data={chartData}
              activeChart={activeChart}
              color={chartConfig[activeChart].color as string}
            />
          </CardContent>
        </Card>
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
          <BarListCard
            icon={
              <MailIcon className="size-4 -translate-y-[0.5px] text-neutral-500" />
            }
            title="Reçus"
            tabs={[
              {
                id: "emailAddress",
                label: "Adresse e-mail",
                data: [
                  { name: "notifications@acquire.com", value: 137 },
                  { name: "info@trabajo.org", value: 68 },
                  { name: "messages-noreply@linkedin.com", value: 35 },
                  { name: "notifications@github.com", value: 33 },
                  { name: "eu@europa-peptide.de", value: 32 },
                  { name: "temu@eu.temuemail.com", value: 31 },
                  { name: "message@prive.zalando.fr", value: 30 },
                ],
              },
              { id: "domain", label: "Domaine", data: [] },
            ]}
          />
          <BarListCard
            icon={<SendIcon className="size-4 text-neutral-500" />}
            title="Envoyés"
            tabs={[
              {
                id: "emailAddress",
                label: "Adresse e-mail",
                data: [
                  { name: "webwacilait@gmail.com", value: 3 },
                  { name: "annayunimartet01@gmail.com", value: 1 },
                  { name: "capucine.spohn@gmail.com", value: 1 },
                  { name: "s.ezzeddine@hetic.fr", value: 1 },
                ],
              },
            ]}
          />
        </div>
        <ResponseTimePreview />
        <AssistantProcessedPreview />
        <EmailActionsPreview />
      </div>
    </PageWrapper>
  );
}

function ResponseTimePreview() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { title: "Median Response", value: "0m", icon: ClockIcon },
          { title: "Average Response", value: "0m", icon: TimerIcon },
          { title: "Within 1 Hour", value: "0%", icon: TrendingUpIcon },
        ].map(({ title, value, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-muted-foreground text-sm">
                {title}
              </CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <CardBasic>
        <p>Temps de réponse</p>
        <div className="mt-4 flex h-32 items-center justify-center text-muted-foreground">
          <p>Aucune donnée disponible pour cette période.</p>
        </div>
      </CardBasic>
    </div>
  );
}

function AssistantProcessedPreview() {
  const [mode, setMode] = useState<"bar" | "pie">("bar");
  const rules = [
    { name: "Notification", value: 12 },
    { name: "Marketing", value: 5 },
    { name: "Newsletter", value: 1 },
    { name: "Sans règle", value: 1 },
  ];

  return (
    <CardBasic>
      <div className="flex items-center justify-between">
        <p>Messages traités par l’assistant</p>
        <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <button
            type="button"
            data-active={mode === "bar"}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 font-medium text-sm transition-all data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm"
            onClick={() => setMode("bar")}
          >
            Barres
          </button>
          <button
            type="button"
            data-active={mode === "pie"}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 font-medium text-sm transition-all data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm"
            onClick={() => setMode("pie")}
          >
            Secteurs
          </button>
        </div>
      </div>
      {mode === "bar" ? (
        <CategoryBars data={rules} />
      ) : (
        <RulePie data={rules} />
      )}
    </CardBasic>
  );
}

function CategoryBars({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  return (
    <div className="relative mt-4 h-[250px] pl-10">
      <div className="absolute inset-y-0 left-0 flex w-8 flex-col justify-between pb-7 text-right text-muted-foreground text-xs">
        {[12, 9, 6, 3, 0].map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
      <div className="relative h-full pb-7">
        <div className="absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((line) => (
            <div key={line} className="border-t" />
          ))}
        </div>
        <div className="absolute inset-x-6 top-0 bottom-7 flex items-end justify-between gap-10">
          {data.map((item) => (
            <div key={item.name} className="flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-gradient-to-b from-blue-300 to-blue-100"
                style={{ height: `${Math.max((item.value / 12) * 100, 8)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-6 bottom-0 flex justify-between text-muted-foreground text-xs">
          {data.map((item) => (
            <span key={item.name} className="flex-1 text-center">
              {item.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function RulePie({ data }: { data: Array<{ name: string; value: number }> }) {
  const colors = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b"];
  let cursor = 0;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const stops = data.map((item, index) => {
    const start = (cursor / total) * 100;
    cursor += item.value;
    return `${colors[index]} ${start}% ${(cursor / total) * 100}%`;
  });
  return (
    <div className="flex h-[250px] items-center justify-center gap-8">
      <div
        className="size-44 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      />
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: colors[index] }}
            />
            {item.name} · {item.value}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmailActionsPreview() {
  const data = [
    { date: "Jul 13", archived: 148, deleted: 4 },
    { date: "Jul 20", archived: 176, deleted: 5 },
    { date: "Jul 27", archived: 191, deleted: 3 },
    { date: "Aug 3", archived: 152, deleted: 4 },
    { date: "Aug 10", archived: 75, deleted: 2 },
  ];

  return (
    <CardBasic>
      <p>Emails archivés et supprimés avec Freescale</p>
      <div className="mt-3 flex justify-end gap-4 text-muted-foreground text-xs">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-600" /> Archived
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-fuchsia-600" /> Deleted
        </span>
      </div>
      <div className="relative mt-2 h-[250px] pl-10">
        <div className="absolute inset-y-0 left-0 flex w-8 flex-col justify-between pb-7 text-right text-muted-foreground text-xs">
          {[200, 150, 100, 50, 0].map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <div className="relative h-full pb-7">
          <div className="absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((line) => (
              <div key={line} className="border-t" />
            ))}
          </div>
          <div className="absolute inset-x-6 top-0 bottom-7 flex items-end justify-between gap-10">
            {data.map((item) => (
              <div
                key={item.date}
                className="flex h-full flex-1 items-end justify-center gap-1"
              >
                <div
                  className="w-[42%] rounded-t bg-gradient-to-b from-emerald-500 to-emerald-200"
                  style={{ height: `${(item.archived / 200) * 100}%` }}
                />
                <div
                  className="w-[42%] rounded-t bg-gradient-to-b from-fuchsia-500 to-fuchsia-200"
                  style={{
                    height: `${Math.max((item.deleted / 200) * 100, 3)}%`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-x-6 bottom-0 flex justify-between text-muted-foreground text-xs">
            {data.map((item) => (
              <span key={item.date} className="flex-1 text-center">
                {item.date}
              </span>
            ))}
          </div>
        </div>
      </div>
    </CardBasic>
  );
}

function AnalyticsBars({
  data,
  activeChart,
  color,
}: {
  data: Array<{
    date: string;
    received: number;
    sent: number;
    read: number;
    archived: number;
  }>;
  activeChart: "received" | "sent" | "read" | "archived";
  color: string;
}) {
  const values = data.map((item) => item[activeChart]);
  const maximum = activeChart === "received" ? 260 : Math.max(...values, 1);

  return (
    <div className="relative h-[250px] w-full pl-12">
      <div className="absolute inset-y-0 left-0 flex w-10 flex-col justify-between pb-7 text-right text-muted-foreground text-xs">
        {[260, 195, 130, 65, 0].map((tick) => (
          <span key={tick}>{activeChart === "received" ? tick : ""}</span>
        ))}
      </div>
      <div className="relative h-full pb-7">
        <div className="absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((line) => (
            <div key={line} className="border-t" />
          ))}
        </div>
        <div className="absolute inset-x-6 top-0 bottom-7 flex items-end justify-between gap-8">
          {values.map((value, index) => (
            <div
              key={data[index].date}
              className="h-full flex-1"
              style={{
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              <div
                className="w-full rounded-t"
                style={{
                  height: `${Math.max((value / maximum) * 100, value ? 8 : 0)}%`,
                  background: `linear-gradient(to bottom, ${color}, color-mix(in srgb, ${color} 38%, transparent))`,
                }}
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-6 bottom-0 flex justify-between text-muted-foreground text-xs">
          {data.map((item) => (
            <span key={item.date} className="flex-1 text-center">
              {new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

type MobileAvailability = {
  id: string;
  label: string;
  enabled: boolean;
  start: string;
  end: string;
};

const defaultMobileAvailability: MobileAvailability[] = [
  { id: "monday", label: "Lundi", enabled: true, start: "09:00", end: "17:00" },
  {
    id: "tuesday",
    label: "Mardi",
    enabled: true,
    start: "09:00",
    end: "17:00",
  },
  {
    id: "wednesday",
    label: "Mercredi",
    enabled: true,
    start: "09:00",
    end: "17:00",
  },
  {
    id: "thursday",
    label: "Jeudi",
    enabled: true,
    start: "09:00",
    end: "17:00",
  },
  {
    id: "friday",
    label: "Vendredi",
    enabled: true,
    start: "09:00",
    end: "17:00",
  },
];

const mobileAvailabilityStorageKey = "freescale:calendar-availability:v1";

function readMobileAvailability() {
  try {
    const saved = window.localStorage.getItem(mobileAvailabilityStorageKey);
    if (!saved) return defaultMobileAvailability;
    const value = JSON.parse(saved) as MobileAvailability[];
    if (
      !Array.isArray(value) ||
      value.length !== defaultMobileAvailability.length
    ) {
      return defaultMobileAvailability;
    }
    return defaultMobileAvailability.map((day) => {
      const savedDay = value.find(({ id }) => id === day.id);
      return savedDay &&
        typeof savedDay.enabled === "boolean" &&
        typeof savedDay.start === "string" &&
        typeof savedDay.end === "string"
        ? { ...day, ...savedDay, label: day.label }
        : day;
    });
  } catch {
    return defaultMobileAvailability;
  }
}

export function CalendarsPreview() {
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [availability, setAvailability] = useState(defaultMobileAvailability);
  const [savedAvailability, setSavedAvailability] = useState(
    JSON.stringify(defaultMobileAvailability),
  );

  useEffect(() => {
    const saved = readMobileAvailability();
    setAvailability(saved);
    setSavedAvailability(JSON.stringify(saved));
  }, []);

  const updateAvailability = (
    id: string,
    patch: Partial<Pick<MobileAvailability, "enabled" | "start" | "end">>,
  ) => {
    setAvailability((current) =>
      current.map((day) => (day.id === id ? { ...day, ...patch } : day)),
    );
  };

  const saveAvailability = () => {
    const snapshot = JSON.stringify(availability);
    try {
      window.localStorage.setItem(mobileAvailabilityStorageKey, snapshot);
      setSavedAvailability(snapshot);
      toastSuccess({ description: "Disponibilités enregistrées." });
    } catch {
      toastError({
        description: "Les disponibilités n’ont pas pu être enregistrées.",
      });
    }
  };

  const connectOutlook = () => {
    setOutlookConnected(true);
    setConnectionOpen(false);
    toastSuccess({ description: "Outlook Calendar est maintenant connecté." });
  };

  return (
    <>
      <main className="px-4 pb-28 pt-6 lg:hidden">
        <div className="mx-auto max-w-2xl">
          <p className="max-w-lg text-muted-foreground text-sm leading-5">
            Synchronisez vos rendez-vous et choisissez les horaires où vous êtes
            disponible.
          </p>

          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h1 className="font-semibold text-xl tracking-tight">
                  Vos calendriers
                </h1>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  {outlookConnected
                    ? "2 calendriers connectés"
                    : "1 calendrier connecté"}
                </p>
              </div>
              <Button
                aria-label="Ajouter un calendrier"
                className="min-h-11 min-w-11 shrink-0 rounded-xl"
                onClick={() => setConnectionOpen(true)}
                size="icon"
                variant="outline"
              >
                <PlusIcon className="size-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <MobileCalendarConnection
                detail="webwacilait@gmail.com"
                name="Google Calendar"
              />
              {outlookConnected ? (
                <MobileCalendarConnection
                  detail="Synchronisé à l’instant"
                  name="Outlook Calendar"
                />
              ) : null}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="font-semibold text-xl tracking-tight">
              Disponibilités
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Vos horaires habituels pour la semaine.
            </p>

            <div className="mt-4 space-y-3">
              {availability.map((day) => (
                <div className="rounded-2xl border bg-card p-4" key={day.id}>
                  <div className="flex min-h-11 items-center justify-between gap-3">
                    <label
                      className="font-medium text-sm"
                      htmlFor={`calendar-${day.id}-enabled`}
                    >
                      {day.label}
                    </label>
                    <span className="grid min-h-11 min-w-11 place-items-center">
                      <Switch
                        checked={day.enabled}
                        id={`calendar-${day.id}-enabled`}
                        onCheckedChange={(enabled) =>
                          updateAvailability(day.id, { enabled })
                        }
                      />
                    </span>
                  </div>
                  {day.enabled ? (
                    <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                      <label className="sr-only" htmlFor={`${day.id}-start`}>
                        Début pour {day.label}
                      </label>
                      <Input
                        className="min-h-11 min-w-0 px-2 text-center"
                        id={`${day.id}-start`}
                        onChange={(event) =>
                          updateAvailability(day.id, {
                            start: event.target.value,
                          })
                        }
                        type="time"
                        value={day.start}
                      />
                      <span className="text-muted-foreground text-sm">à</span>
                      <label className="sr-only" htmlFor={`${day.id}-end`}>
                        Fin pour {day.label}
                      </label>
                      <Input
                        className="min-h-11 min-w-0 px-2 text-center"
                        id={`${day.id}-end`}
                        onChange={(event) =>
                          updateAvailability(day.id, {
                            end: event.target.value,
                          })
                        }
                        type="time"
                        value={day.end}
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-muted-foreground text-sm">
                      Indisponible
                    </p>
                  )}
                </div>
              ))}
            </div>

            <Button
              className="mt-4 min-h-11 w-full"
              disabled={JSON.stringify(availability) === savedAvailability}
              onClick={saveAvailability}
            >
              {JSON.stringify(availability) === savedAvailability
                ? "Disponibilités enregistrées"
                : "Enregistrer les disponibilités"}
            </Button>
          </section>
        </div>
      </main>

      <div className="hidden lg:block">
        <PageWrapper>
          <div className="mx-auto max-w-3xl">
            <PageHeader
              title="Calendriers"
              description="Connectez vos calendriers et gérez vos disponibilités."
            />
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">
                  Calendriers connectés
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ConnectedRow
                  icon={<CalendarDaysIcon />}
                  title="Google Calendar"
                  detail="webwacilait@gmail.com"
                />
                <Button size="sm" variant="outline">
                  <PlusIcon className="mr-2 size-4" />
                  Connecter un calendrier
                </Button>
              </CardContent>
            </Card>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">
                  Disponibilités habituelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"].map(
                  (day) => (
                    <div className="flex items-center gap-4" key={day}>
                      <Switch defaultChecked />
                      <span className="w-24 text-sm">{day}</span>
                      <Input className="w-28" defaultValue="09:00" />
                      <span className="text-muted-foreground">–</span>
                      <Input className="w-28" defaultValue="17:00" />
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          </div>
        </PageWrapper>
      </div>

      <MobileSheet
        description="Freescale lira uniquement les événements nécessaires à vos briefs et disponibilités."
        footer={
          <Button className="min-h-11 w-full" onClick={connectOutlook}>
            Connecter Outlook Calendar
          </Button>
        }
        onOpenChange={setConnectionOpen}
        open={connectionOpen}
        title="Ajouter un calendrier"
      >
        <div className="rounded-2xl border p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <CalendarDaysIcon className="size-5" />
            </span>
            <div>
              <p className="font-medium">Outlook Calendar</p>
              <p className="text-muted-foreground text-xs">
                Événements, horaires et participants
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-muted-foreground text-sm">
            <p>• Lire vos prochains rendez-vous</p>
            <p>• Préparer le contexte avant une réunion</p>
            <p>• Respecter vos plages de disponibilité</p>
          </div>
        </div>
      </MobileSheet>
    </>
  );
}

function MobileCalendarConnection({
  name,
  detail,
}: {
  name: string;
  detail: string;
}) {
  return (
    <div className="flex min-h-[72px] items-center gap-3 rounded-2xl border bg-card p-3 lg:hidden">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
        <CalendarDaysIcon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate font-medium text-sm">{name}</strong>
        <span className="mt-0.5 block truncate text-muted-foreground text-xs">
          {detail}
        </span>
      </span>
      <span className="flex items-center gap-1.5 text-emerald-700 text-xs">
        <CheckCircle2Icon className="size-4" />
        Connecté
      </span>
    </div>
  );
}

export function DrivePreview() {
  return (
    <>
      <MobileDrivePreview />
      <div className="hidden lg:block">
        <PageWrapper>
          <div className="mx-auto max-w-3xl">
            <PageHeader
              title="Drive"
              description="Classez automatiquement vos pièces jointes dans Google Drive."
            />
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Google Drive</CardTitle>
              </CardHeader>
              <CardContent>
                <ConnectedRow
                  icon={<FolderIcon />}
                  title="Mon Drive"
                  detail="Connecté avec webwacilait@gmail.com"
                />
              </CardContent>
            </Card>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">
                  Règles de classement
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {[
                  ["Factures", "Finance / Factures"],
                  ["Reçus", "Finance / Reçus"],
                  ["Contrats", "Juridique / Contrats"],
                ].map(([name, folder]) => (
                  <div className="flex items-center gap-4 py-4" key={name}>
                    <FileIcon className="size-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{name}</div>
                      <div className="text-muted-foreground text-xs">
                        {folder}
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </PageWrapper>
      </div>
    </>
  );
}

export function IntegrationsPreview() {
  const integrations = [
    {
      id: "slack",
      name: "Slack",
      description: "Envoyez vos résumés et rappels dans Slack",
      icon: <MessageSquareIcon key="slack" />,
    },
    {
      id: "google-calendar",
      name: "Google Calendar",
      description: "Préparez automatiquement vos briefs de réunion",
      icon: <CalendarDaysIcon key="calendar" />,
    },
    {
      id: "google-drive",
      name: "Google Drive",
      description: "Classez vos pièces jointes dans les bons dossiers",
      icon: <FolderIcon key="drive" />,
    },
    {
      id: "webhook",
      name: "Webhook",
      description: "Envoyez les événements Freescale à vos applications",
      icon: <ArrowUpRightIcon key="webhook" />,
    },
  ];
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<
    string | null
  >(null);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const selectedIntegration = integrations.find(
    ({ id }) => id === selectedIntegrationId,
  );

  const connectIntegration = () => {
    if (!selectedIntegration) return;
    setConnectedIds((current) => new Set(current).add(selectedIntegration.id));
    setSelectedIntegrationId(null);
    toastSuccess({
      description: `${selectedIntegration.name} est maintenant connecté.`,
    });
  };

  return (
    <>
      <PageWrapper>
        <PageHeader
          title="Intégrations"
          description="Connectez les outils que vous utilisez avec Freescale."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {integrations.map(({ id, name, description, icon }) => (
            <Card key={id}>
              <CardContent className="p-5">
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg border [&>svg]:size-5">
                  {icon}
                </div>
                <div className="font-medium">{name}</div>
                <div className="mt-1 min-h-10 text-muted-foreground text-sm">
                  {description}
                </div>
                <Button
                  className="mt-4 max-lg:min-h-11"
                  onClick={() =>
                    runOnMobile(() => setSelectedIntegrationId(id))
                  }
                  size="sm"
                  variant="outline"
                >
                  {connectedIds.has(id) ? "Connecté" : "Connecter"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageWrapper>

      <MobileSheet
        description="Vous gardez le contrôle sur les données partagées avec Freescale."
        footer={
          <Button className="min-h-11 w-full" onClick={connectIntegration}>
            Autoriser et connecter
          </Button>
        }
        onOpenChange={(open) => !open && setSelectedIntegrationId(null)}
        open={Boolean(selectedIntegration)}
        title={`Connecter ${selectedIntegration?.name ?? "un service"}`}
      >
        <div className="rounded-2xl border p-4">
          <p className="font-medium">Autorisations demandées</p>
          <div className="mt-3 space-y-2 text-muted-foreground text-sm">
            <p>• Lire les informations utiles à vos échanges</p>
            <p>• Créer uniquement les éléments que vous validez</p>
            <p>• Révoquer la connexion depuis les paramètres</p>
          </div>
        </div>
      </MobileSheet>
    </>
  );
}

export function BriefsPreview() {
  const [briefs, setBriefs] = useState([
    {
      id: "product-review",
      title: "Revue produit",
      time: "Aujourd’hui, 14:00",
      people: "Sarah, Marc et 3 autres personnes",
      status: "ready" as const,
      mobileOnly: false,
    },
    {
      id: "customer-onboarding",
      title: "Onboarding client",
      time: "Demain, 10:30",
      people: "Équipe Acme Inc.",
      status: "scheduled" as const,
      mobileOnly: false,
    },
    {
      id: "weekly-planning",
      title: "Planification hebdomadaire",
      time: "Vendredi, 09:00",
      people: "Produit et ingénierie",
      status: "scheduled" as const,
      mobileOnly: false,
    },
  ]);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null);
  const [briefTitle, setBriefTitle] = useState("");
  const [briefDate, setBriefDate] = useState("");
  const selectedBrief = briefs.find(({ id }) => id === selectedBriefId);

  const createBrief = () => {
    const title = briefTitle.trim();
    if (!title || !briefDate) return;

    setBriefs((current) => [
      ...current,
      {
        id: `mobile-brief-${Date.now()}`,
        title,
        time: new Intl.DateTimeFormat("fr-FR", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(briefDate)),
        people: "Participants à ajouter",
        status: "scheduled",
        mobileOnly: true,
      },
    ]);
    setBriefTitle("");
    setBriefDate("");
    setCreateOpen(false);
    toastSuccess({ description: "Le brief a été planifié." });
  };

  return (
    <>
      <PageWrapper>
        <div className="flex items-center justify-between gap-3">
          <PageHeader
            title="Briefs de réunion"
            description="Arrivez préparé à chaque réunion avec le bon contexte."
          />
          <Button
            className="min-h-11 shrink-0 lg:min-h-0"
            onClick={() => runOnMobile(() => setCreateOpen(true))}
            size="sm"
          >
            <PlusIcon className="mr-2 size-4" />
            Nouveau brief
          </Button>
        </div>
        <div className="mt-6 space-y-3">
          {briefs.map(({ id, title, time, people, status, mobileOnly }) => (
            <Card className={cn(mobileOnly && "lg:hidden")} key={id}>
              <CardContent className="flex items-center gap-3 p-4 sm:gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <UsersIcon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{title}</div>
                  <div className="truncate text-muted-foreground text-sm">
                    {time} · {people}
                  </div>
                </div>
                <div className="hidden sm:block">
                  {status === "ready" ? (
                    <Badge color="green">
                      <CheckCircle2Icon className="mr-1 size-3" />
                      Prêt
                    </Badge>
                  ) : (
                    <Badge>Planifié</Badge>
                  )}
                </div>
                <Button
                  aria-label={`Ouvrir le brief ${title}`}
                  className="min-h-11 min-w-11 lg:min-h-0 lg:min-w-0"
                  onClick={() => runOnMobile(() => setSelectedBriefId(id))}
                  size="icon"
                  variant="ghost"
                >
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageWrapper>

      <MobileSheet
        description="Ajoutez une réunion. Mue rassemblera le contexte utile avant qu’elle commence."
        footer={
          <Button
            className="min-h-11 w-full"
            disabled={!briefTitle.trim() || !briefDate}
            onClick={createBrief}
          >
            Planifier le brief
          </Button>
        }
        onOpenChange={setCreateOpen}
        open={createOpen}
        title="Nouveau brief"
      >
        <div className="space-y-4">
          <label className="block space-y-2" htmlFor="mobile-brief-title">
            <span className="font-medium text-sm">Nom de la réunion</span>
            <Input
              className="min-h-11"
              id="mobile-brief-title"
              onChange={(event) => setBriefTitle(event.target.value)}
              placeholder="Ex. Point projet Atlas"
              value={briefTitle}
            />
          </label>
          <label className="block space-y-2" htmlFor="mobile-brief-date">
            <span className="font-medium text-sm">Date et heure</span>
            <Input
              className="min-h-11"
              id="mobile-brief-date"
              onChange={(event) => setBriefDate(event.target.value)}
              type="datetime-local"
              value={briefDate}
            />
          </label>
        </div>
      </MobileSheet>

      <MobileFullScreenDialog
        footer={
          <Button
            className="min-h-11 w-full"
            onClick={() => {
              setSelectedBriefId(null);
              toastSuccess({
                description: "Le brief est prêt à être partagé.",
              });
            }}
          >
            Partager le brief
          </Button>
        }
        onOpenChange={(open) => !open && setSelectedBriefId(null)}
        open={Boolean(selectedBrief)}
        title={selectedBrief?.title ?? "Brief"}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border p-4">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              Réunion
            </p>
            <p className="mt-2 font-medium">{selectedBrief?.time}</p>
            <p className="mt-1 text-muted-foreground text-sm">
              {selectedBrief?.people}
            </p>
          </div>
          <div className="rounded-2xl bg-muted/50 p-4">
            <p className="font-medium">Contexte rassemblé par Mue</p>
            <p className="mt-2 text-muted-foreground text-sm">
              Les échanges récents, les décisions ouvertes et les prochaines
              actions seront réunis ici avant la réunion.
            </p>
          </div>
        </div>
      </MobileFullScreenDialog>
    </>
  );
}

function ConnectedRow({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border p-4">
      <div className="flex size-10 items-center justify-center rounded-lg bg-muted [&>svg]:size-5">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-muted-foreground text-sm">{detail}</div>
      </div>
      <Badge color="green">Connecté</Badge>
      <Button variant="ghost" size="icon">
        <MoreHorizontalIcon className="size-4" />
      </Button>
    </div>
  );
}

export function SettingsPreview() {
  return (
    <>
      <MobileSettingsPreview />
      <div className="hidden lg:block">
        <PageWrapper>
          <div className="mx-auto max-w-5xl space-y-10">
            <PageHeader
              title="Paramètres"
              description="Gérez votre compte et vos préférences Freescale."
            />
            <SettingsSection icon={<MailIcon />} title="Comptes de messagerie">
              <div className="flex items-center gap-4 p-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-orange-700 text-lg text-white">
                  W
                </div>
                <div className="flex-1">
                  <div className="font-medium">Wacil ait</div>
                  <div className="text-muted-foreground text-sm">
                    webwacilait@gmail.com
                  </div>
                </div>
                <Badge color="green">Connecté</Badge>
                <Button variant="outline" size="sm">
                  Gérer
                </Button>
              </div>
            </SettingsSection>
            <SettingsSection icon={<CreditCardIcon />} title="Facturation">
              <SettingRow
                title="Plan Freescale annuel"
                description="19 € par mois, facturés 228 € une fois par an."
                action={<Button size="sm">Gérer le plan</Button>}
              />
            </SettingsSection>
            <SettingsSection icon={<UsersIcon />} title="Équipe">
              <SettingRow
                title="Membres de l’équipe"
                description="Invitez des collaborateurs dans votre organisation."
                action={
                  <Button variant="outline" size="sm">
                    Gérer l’équipe
                  </Button>
                }
              />
            </SettingsSection>
            <SettingsSection
              icon={<SparklesIcon />}
              title="Intelligence artificielle"
            >
              <SettingRow
                title="Modèle de Mue"
                description="Modèle recommandé par Freescale"
                action={
                  <Button variant="outline" size="sm">
                    Modifier
                  </Button>
                }
              />
            </SettingsSection>
            <SettingsSection icon={<WebhookIcon />} title="Développeurs">
              <SettingRow
                title="Webhooks"
                description="Envoyez les événements Freescale vers votre application."
                action={<Switch />}
              />
              <div className="border-t">
                <SettingRow
                  title="Clés API"
                  description="Créez des clés pour accéder à votre compte Freescale."
                  action={
                    <Button variant="outline" size="sm">
                      Gérer
                    </Button>
                  }
                />
              </div>
            </SettingsSection>
            <SettingsSection icon={<Settings2Icon />} title="Compte">
              <SettingRow
                title="Apparence"
                description="Thème utilisé par l’interface"
                action={
                  <Button variant="outline" size="sm">
                    <MoonIcon className="mr-2 size-4" />
                    Thème
                  </Button>
                }
              />
              <div className="border-t">
                <SettingRow
                  title="Fonctionnalités bêta"
                  description="Essayez les nouveautés encore en cours de développement."
                  action={
                    <Button variant="outline" size="sm">
                      Ouvrir
                    </Button>
                  }
                />
              </div>
            </SettingsSection>
          </div>
        </PageWrapper>
      </div>
    </>
  );
}

export function OrganizationPreview() {
  const [workspaceName, setWorkspaceName] = useState(
    DEFAULT_PREVIEW_WORKSPACE_NAME,
  );
  const [draftName, setDraftName] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);

  useEffect(() => {
    setWorkspaceName(
      window.localStorage.getItem(PREVIEW_WORKSPACE_NAME_KEY) ??
        DEFAULT_PREVIEW_WORKSPACE_NAME,
    );
  }, []);

  const openRename = () => {
    setDraftName(workspaceName);
    setRenameOpen(true);
  };

  const renameWorkspace = () => {
    const nextName = draftName.trim();
    if (!nextName) return;
    savePreviewWorkspaceName(nextName);
    setWorkspaceName(nextName);
    setRenameOpen(false);
    toastSuccess({ description: "Le nom de votre espace a été mis à jour." });
  };

  return (
    <>
      <MobileOrganizationPreview
        onRename={openRename}
        workspaceName={workspaceName}
      />
      <div className="hidden lg:block">
        <PageWrapper>
          <div className="mx-auto max-w-5xl space-y-8">
            <PageHeader
              title="Organisation"
              description="Gérez vos espaces de travail Freescale."
            />
            <SettingsSection
              icon={<Building2Icon />}
              title="Vos espaces de travail"
            >
              <div className="flex items-center gap-4 p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Building2Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{workspaceName}</p>
                    <Badge color="green">Actif</Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground text-sm">
                    4 canaux connectés · 496,6 Mo utilisés
                  </p>
                </div>
                <Button onClick={openRename} variant="outline" size="sm">
                  Gérer
                </Button>
              </div>
            </SettingsSection>
            <SettingsSection
              icon={<Settings2Icon />}
              title="Paramètres de l’espace actif"
            >
              <SettingRow
                title="Nom de l’espace"
                description={workspaceName}
                action={
                  <Button onClick={openRename} variant="outline" size="sm">
                    Modifier
                  </Button>
                }
              />
              <div className="border-t">
                <SettingRow
                  title="Stockage de l’espace"
                  description="496,6 Mo utilisés sur les 5 Go inclus"
                  action={
                    <Button variant="outline" size="sm">
                      Voir le stockage
                    </Button>
                  }
                />
              </div>
              <div className="border-t">
                <SettingRow
                  title="Fuseau horaire"
                  description="Europe/Paris"
                  action={
                    <Button variant="outline" size="sm">
                      Modifier
                    </Button>
                  }
                />
              </div>
            </SettingsSection>
          </div>
        </PageWrapper>
      </div>
      <Dialog onOpenChange={setRenameOpen} open={renameOpen}>
        <DialogContent className="max-lg:inset-x-0 max-lg:bottom-0 max-lg:top-auto max-lg:w-full max-lg:max-w-none max-lg:translate-x-0 max-lg:translate-y-0 max-lg:rounded-b-none max-lg:rounded-t-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renommer l’espace</DialogTitle>
            <DialogDescription>
              Ce nom apparaît dans votre barre de navigation et vos paramètres.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <span className="font-medium text-sm">Nom de l’espace</span>
            <Input
              autoFocus
              aria-label="Nom de l’espace"
              maxLength={48}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") renameWorkspace();
              }}
              value={draftName}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setRenameOpen(false)} variant="outline">
              Annuler
            </Button>
            <Button disabled={!draftName.trim()} onClick={renameWorkspace}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function HelpCenterPreview() {
  const [helpQuery, setHelpQuery] = useState("");
  const [helpCategory, setHelpCategory] = useState("Tout");
  const [selectedArticleTitle, setSelectedArticleTitle] = useState<
    string | null
  >(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const articles = [
    {
      title: "Connecter mes canaux",
      description:
        "Ajoutez Gmail, Outlook, Slack ou vos autres sources à Freescale.",
      icon: MessageSquareIcon,
      category: "Démarrage",
    },
    {
      title: "Comprendre Mue",
      description:
        "Découvrez comment Mue analyse, résume et prépare vos prochaines actions.",
      icon: BotIcon,
      category: "Mue",
    },
    {
      title: "Gérer mes documents",
      description: "Retrouvez vos PDF, factures, pièces jointes et archives.",
      icon: FileIcon,
      category: "Utilisation",
    },
    {
      title: "Configurer mon espace",
      description:
        "Modifiez le nom, le stockage et les préférences de votre espace de travail.",
      icon: Settings2Icon,
      category: "Compte",
    },
    {
      title: "Gérer mon abonnement",
      description:
        "Consultez votre plan, vos factures et votre moyen de paiement.",
      icon: CreditCardIcon,
      category: "Compte",
    },
    {
      title: "Sécurité et confidentialité",
      description:
        "Comprenez comment vos données et vos connexions sont protégées.",
      icon: ShieldCheckIcon,
      category: "Compte",
    },
  ];
  const filteredArticles = articles.filter(
    (article) =>
      (helpCategory === "Tout" || article.category === helpCategory) &&
      `${article.title} ${article.description}`
        .toLowerCase()
        .includes(helpQuery.toLowerCase()),
  );
  const selectedArticle = articles.find(
    ({ title }) => title === selectedArticleTitle,
  );

  const sendSupportMessage = () => {
    if (!supportMessage.trim()) return;
    setSupportMessage("");
    setSupportOpen(false);
    toastSuccess({ description: "Votre message a été envoyé au support." });
  };

  return (
    <>
      <main className="min-h-[calc(100dvh-var(--mobile-topbar-height)-var(--mobile-bottombar-height))] px-4 pb-8 pt-5 lg:hidden">
        <section>
          <p className="font-medium text-blue-600 text-sm">Aide Freescale</p>
          <h1 className="mt-1 font-semibold text-3xl tracking-tight">
            Comment pouvons-nous vous aider ?
          </h1>
          <p className="mt-2 text-muted-foreground text-sm leading-6">
            Trouvez une réponse ou écrivez-nous depuis le même endroit.
          </p>
        </section>

        <div className="relative mt-5">
          <SearchIcon className="pointer-events-none absolute left-4 top-3.5 size-5 text-muted-foreground" />
          <Input
            aria-label="Rechercher dans l’aide"
            className="h-12 rounded-2xl pl-12 text-base"
            onChange={(event) => setHelpQuery(event.target.value)}
            placeholder="Rechercher une réponse…"
            type="search"
            value={helpQuery}
          />
        </div>

        <div
          aria-label="Catégories d’aide"
          className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
        >
          {["Tout", "Démarrage", "Mue", "Utilisation", "Compte"].map(
            (category) => (
              <button
                aria-pressed={helpCategory === category}
                className={cn(
                  "min-h-11 shrink-0 rounded-full border px-4 font-medium text-sm transition-colors",
                  helpCategory === category
                    ? "border-foreground bg-foreground text-background"
                    : "bg-background text-muted-foreground active:bg-muted",
                )}
                key={category}
                onClick={() => setHelpCategory(category)}
                type="button"
              >
                {category}
              </button>
            ),
          )}
        </div>

        <section className="mt-6">
          <h2 className="font-semibold text-sm">Guides</h2>
          <div className="mt-2 overflow-hidden rounded-2xl border bg-card">
            {filteredArticles.map(
              ({ title, description, icon: Icon }, index) => (
                <button
                  className={cn(
                    "flex min-h-[76px] w-full items-center gap-3 px-4 py-3 text-left active:bg-muted",
                    index !== filteredArticles.length - 1 && "border-b",
                  )}
                  key={title}
                  onClick={() => setSelectedArticleTitle(title)}
                  type="button"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted/70">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block font-medium text-sm">
                      {title}
                    </strong>
                    <span className="mt-0.5 line-clamp-2 block text-muted-foreground text-xs leading-5">
                      {description}
                    </span>
                  </span>
                  <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ),
            )}
            {!filteredArticles.length ? (
              <div className="px-5 py-8 text-center">
                <p className="font-medium text-sm">Aucune réponse trouvée</p>
                <p className="mt-1 text-muted-foreground text-xs">
                  Essayez un autre mot ou écrivez-nous.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-5 rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/30">
          <h2 className="font-semibold">Besoin d’une réponse humaine ?</h2>
          <p className="mt-1 text-muted-foreground text-sm leading-6">
            Décrivez ce qui vous bloque. Notre équipe vous répondra par e-mail.
          </p>
          <Button
            className="mt-4 min-h-11 w-full"
            onClick={() => setSupportOpen(true)}
          >
            <MessageCircleReplyIcon className="size-4" />
            Écrire au support
          </Button>
        </section>
      </main>

      <div className="hidden lg:block">
        <PageWrapper>
          <div className="mx-auto max-w-5xl">
            <PageHeader
              title="Centre d’aide"
              description="Trouvez rapidement une réponse ou contactez le support Freescale."
            />
            <div className="mt-6 max-w-2xl">
              <div className="relative">
                <SearchIcon className="absolute left-4 top-3.5 size-5 text-muted-foreground" />
                <Input
                  className="h-12 pl-12 text-base"
                  onChange={(event) => setHelpQuery(event.target.value)}
                  placeholder="Rechercher dans le centre d’aide…"
                  value={helpQuery}
                />
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map(({ title, description, icon: Icon }) => (
                <Card
                  className="transition-colors hover:bg-muted/30"
                  key={title}
                >
                  <CardContent className="p-5">
                    <div className="flex size-9 items-center justify-center rounded-lg border bg-background">
                      <Icon className="size-4" />
                    </div>
                    <h2 className="mt-4 font-medium">{title}</h2>
                    <p className="mt-1 text-muted-foreground text-sm">
                      {description}
                    </p>
                    <Button
                      className="mt-3 min-h-11 p-0 text-sm lg:h-auto lg:min-h-0"
                      onClick={() =>
                        runOnMobile(() => setSelectedArticleTitle(title))
                      }
                      variant="link"
                    >
                      Consulter le guide
                      <ChevronRightIcon className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {!filteredArticles.length && (
              <div className="mt-10 rounded-xl border border-dashed p-10 text-center">
                <p className="font-medium">Aucun guide trouvé</p>
                <p className="mt-1 text-muted-foreground text-sm">
                  Essayez une autre recherche ou contactez notre support.
                </p>
              </div>
            )}

            <Card className="mt-8 bg-muted/30">
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold">
                    Vous n’avez pas trouvé votre réponse ?
                  </h2>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Écrivez au support Freescale. Nous vous répondrons en
                    français.
                  </p>
                </div>
                <Button
                  className="min-h-11"
                  onClick={() => runOnMobile(() => setSupportOpen(true))}
                >
                  <MessageCircleReplyIcon className="size-4" />
                  Contacter le support
                </Button>
              </CardContent>
            </Card>
          </div>
        </PageWrapper>
      </div>

      <MobileFullScreenDialog
        footer={
          <Button
            className="min-h-11 w-full"
            onClick={() => setSelectedArticleTitle(null)}
          >
            J’ai compris
          </Button>
        }
        onOpenChange={(open) => !open && setSelectedArticleTitle(null)}
        open={Boolean(selectedArticle)}
        title={selectedArticle?.title ?? "Guide"}
      >
        <div className="space-y-5">
          <p className="text-muted-foreground">
            {selectedArticle?.description}
          </p>
          {[
            "Ouvrez la section concernée depuis la navigation mobile.",
            "Vérifiez les informations et choisissez l’action souhaitée.",
            "Validez : une confirmation apparaît immédiatement.",
          ].map((step, index) => (
            <div className="flex gap-3" key={step}>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                {index + 1}
              </div>
              <p className="pt-1 text-sm">{step}</p>
            </div>
          ))}
        </div>
      </MobileFullScreenDialog>

      <MobileSheet
        description="Décrivez votre problème. Notre équipe vous répondra directement par e-mail."
        footer={
          <Button
            className="min-h-11 w-full"
            disabled={!supportMessage.trim()}
            onClick={sendSupportMessage}
          >
            Envoyer au support
          </Button>
        }
        onOpenChange={setSupportOpen}
        open={supportOpen}
        title="Contacter le support"
      >
        <label className="block space-y-2">
          <span className="font-medium text-sm">Votre message</span>
          <textarea
            className="min-h-36 w-full resize-none rounded-xl border bg-background px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => setSupportMessage(event.target.value)}
            placeholder="Expliquez-nous ce qui vous bloque…"
            value={supportMessage}
          />
        </label>
      </MobileSheet>
    </>
  );
}

function SettingsSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 [&>svg]:size-5">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="font-medium text-lg">{title}</h2>
      </div>
      <Card>{children}</Card>
    </section>
  );
}

function SettingRow({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="flex-1">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-muted-foreground text-sm">{description}</div>
      </div>
      {action}
    </div>
  );
}

export function AccountsPreview() {
  return (
    <PageWrapper>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Comptes de messagerie"
          description="Gérez les boîtes de réception connectées à Freescale."
        />
        <Card className="mt-6">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-orange-700 text-lg text-white">
                W
              </div>
              <div className="flex-1">
                <div className="font-medium">webwacilait@gmail.com</div>
                <div className="text-muted-foreground text-sm">
                  Google · Connecté
                </div>
              </div>
              <Badge color="green">Actif</Badge>
              <Button variant="ghost" size="icon">
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        <Button className="mt-4" variant="outline">
          <PlusIcon className="mr-2 size-4" />
          Ajouter un compte
        </Button>
      </div>
    </PageWrapper>
  );
}

export function PremiumPreview() {
  const [planOpen, setPlanOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancellationScheduled, setCancellationScheduled] = useState(false);

  const openBillingPortal = (description: string) => {
    setPlanOpen(false);
    toastSuccess({ description });
  };

  const cancelSubscription = () => {
    setCancelOpen(false);
    setCancellationScheduled(true);
    toastSuccess({
      description: "Votre abonnement prendra fin le 30 août 2027.",
    });
  };

  return (
    <>
      <PageWrapper>
        <div className="mx-auto max-w-4xl">
          <PageHeader
            actions={
              <>
                <Button
                  className="min-h-11 lg:hidden"
                  onClick={() => setPlanOpen(true)}
                  size="sm"
                  variant="outline"
                >
                  Gérer le plan
                  <ChevronRightIcon className="ml-1 size-4" />
                </Button>
                <div className="hidden lg:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        Gérer le plan
                        <ChevronDownIcon className="ml-1 size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem>
                        <RefreshCwIcon /> Modifier la facturation
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <CreditCardIcon /> Modifier le moyen de paiement
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileIcon /> Télécharger les factures
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        Annuler l’abonnement
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            }
            description="Consultez et gérez votre abonnement Freescale."
            title="Plan et facturation"
          />

          <Card className="mt-6 border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/25">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <SparklesIcon className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold">Essai gratuit en cours</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Il vous reste 14 jours pour tester Freescale sans
                      engagement.
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Quota d’essai :{" "}
                      <span className="font-medium text-foreground">
                        0 / 100 actions IA
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1 sm:text-right">
                  <span className="text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300">
                    Après l’essai
                  </span>
                  <span className="text-sm font-medium">
                    19 € ou 29 € / mois
                  </span>
                </div>
              </div>
              <p className="mt-4 border-t border-blue-200/70 pt-3 text-xs text-muted-foreground dark:border-blue-900/70">
                Aucune facturation automatique pendant l’essai : choisissez
                votre plan avant son expiration.
              </p>
            </CardContent>
          </Card>

          {cancellationScheduled && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 text-sm lg:hidden">
              L’abonnement restera actif jusqu’au 30 août 2027, puis prendra fin
              automatiquement.
            </div>
          )}

          <Card className="mt-8 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-xl">Freescale</h2>
                    <Badge color="green">Actif</Badge>
                  </div>
                  <p className="mt-2 text-muted-foreground text-sm">
                    Toutes les fonctionnalités, Mue et 5 Go de stockage inclus.
                  </p>
                </div>
                <div className="sm:text-right">
                  <p>
                    <span className="font-semibold text-3xl">19 €</span>
                    <span className="text-muted-foreground text-sm">
                      {" "}
                      / mois
                    </span>
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    228 € facturés une fois par an
                  </p>
                </div>
              </div>
              <div className="grid border-t bg-muted/20 sm:grid-cols-3">
                <div className="p-4 sm:border-r">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Facturation
                  </p>
                  <p className="mt-1 font-medium text-sm">Annuelle</p>
                </div>
                <div className="border-t p-4 sm:border-r sm:border-t-0">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Prochaine échéance
                  </p>
                  <p className="mt-1 font-medium text-sm">30 août 2027</p>
                </div>
                <div className="border-t p-4 sm:border-t-0">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Moyen de paiement
                  </p>
                  <p className="mt-1 font-medium text-sm">Visa •••• 4242</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>

      <MobileSheet
        description="Modifiez votre facturation, votre moyen de paiement ou votre abonnement."
        onOpenChange={setPlanOpen}
        open={planOpen}
        title="Gérer le plan"
      >
        <div className="space-y-2">
          <Button
            className="min-h-12 w-full justify-between"
            onClick={() =>
              openBillingPortal("Le portail de facturation est prêt.")
            }
            variant="outline"
          >
            <span className="flex items-center gap-3">
              <RefreshCwIcon className="size-4" />
              Modifier la facturation
            </span>
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button
            className="min-h-12 w-full justify-between"
            onClick={() =>
              openBillingPortal("Le portail de paiement est prêt.")
            }
            variant="outline"
          >
            <span className="flex items-center gap-3">
              <CreditCardIcon className="size-4" />
              Modifier le moyen de paiement
            </span>
            <ChevronRightIcon className="size-4" />
          </Button>
          <a
            className="flex min-h-12 w-full items-center justify-between rounded-md border px-4 font-medium text-sm"
            download="facture-freescale.txt"
            href="data:text/plain;charset=utf-8,Facture%20Freescale%20-%20228%20EUR"
            onClick={() => setPlanOpen(false)}
          >
            <span className="flex items-center gap-3">
              <FileIcon className="size-4" />
              Télécharger les factures
            </span>
            <ChevronRightIcon className="size-4" />
          </a>
          <Button
            className="min-h-12 w-full justify-between text-destructive"
            disabled={cancellationScheduled}
            onClick={() => {
              setPlanOpen(false);
              setCancelOpen(true);
            }}
            variant="ghost"
          >
            {cancellationScheduled
              ? "Annulation programmée"
              : "Annuler l’abonnement"}
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </MobileSheet>

      <MobileSheet
        description="Votre plan restera disponible jusqu’au 30 août 2027. Cette action n’efface aucune donnée."
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="min-h-11"
              onClick={() => setCancelOpen(false)}
              variant="outline"
            >
              Garder mon plan
            </Button>
            <Button
              className="min-h-11"
              onClick={cancelSubscription}
              variant="destructive"
            >
              Confirmer
            </Button>
          </div>
        }
        onOpenChange={setCancelOpen}
        open={cancelOpen}
        title="Annuler l’abonnement ?"
      >
        <div className="rounded-2xl bg-muted/50 p-4 text-muted-foreground text-sm">
          Vous pourrez revenir sur cette décision avant la prochaine échéance.
        </div>
      </MobileSheet>
    </>
  );
}

export function ColdEmailBlockerPreview() {
  return (
    <PageWrapper>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Filtre anti-prospection"
          description="Écartez automatiquement les e-mails commerciaux non sollicités."
        />
        <Card className="mt-6">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheckIcon className="size-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium">
                Protection contre la prospection
              </div>
              <div className="mt-1 text-muted-foreground text-sm">
                Sortez les messages de prospection probables de votre boîte
                principale.
              </div>
            </div>
            <Switch defaultChecked />
          </CardContent>
        </Card>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Activité récente</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {[
              "Proposition de partenariat pour Wacil",
              "Question rapide sur votre feuille de route",
              "Développez votre prospection commerciale",
            ].map((subject, index) => (
              <div className="flex items-center gap-3 py-3" key={subject}>
                <MailIcon className="size-4 text-muted-foreground" />
                <div className="flex-1 text-sm">{subject}</div>
                <Badge>Il y a {index + 1} j</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}

export function ReplyZeroPreview() {
  return (
    <PageWrapper>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Réponses à suivre"
          description="Gardez sous les yeux les messages qui attendent votre réponse."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["À répondre", "7"],
            ["En attente", "4"],
            ["Terminés cette semaine", "23"],
          ].map(([label, value]) => (
            <Card key={label}>
              <CardContent className="p-5">
                <div className="text-muted-foreground text-sm">{label}</div>
                <div className="mt-2 text-3xl font-semibold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Attend votre réponse</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {[
              "Calendrier de lancement du T3",
              "Re : revue du contrat",
              "Suivi de l’onboarding client",
            ].map((subject, index) => (
              <div className="flex items-center gap-3 py-4" key={subject}>
                <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs">
                  {["SA", "MK", "AC"][index]}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{subject}</div>
                  <div className="text-muted-foreground text-xs">
                    {["Sarah Allen", "Marc Klein", "Équipe Acme"][index]}
                  </div>
                </div>
                <Badge>{index + 1}d</Badge>
                <Button variant="ghost" size="icon">
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}

const SETUP_NEWSLETTERS = bulkUnsubscribeSenders.slice(0, 8);

const SETUP_CHANNELS = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Messagerie Google",
  },
  {
    id: "outlook",
    name: "Outlook",
    description: "Messages professionnels",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Bientôt disponible",
  },
] as const;

const SETUP_TASK_RULES = [
  {
    id: "request",
    title: "Demandes explicites",
    description: "« Peux-tu me renvoyer le devis ? »",
  },
  {
    id: "commitment",
    title: "Engagements pris",
    description: "« Je vous envoie la version finale demain. »",
  },
  {
    id: "deadline",
    title: "Échéances détectées",
    description: "« À valider avant vendredi. »",
  },
] as const;

function SetupChannelLogo({
  id,
}: {
  id: (typeof SETUP_CHANNELS)[number]["id"];
}) {
  if (id === "gmail") return <Gmail height={25} width={29} />;
  if (id === "outlook") return <Outlook height={29} width={30} />;

  return <WhatsAppIcon className="size-6 text-[#25D366]" />;
}

export function SetupPreview() {
  const router = useRouter();
  const setup = usePreviewSetupProgress();
  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [assistantDraft, setAssistantDraft] = useState(setup.assistant);
  const [newsletterDraft, setNewsletterDraft] = useState(setup.newsletters);
  const [newsletterQuery, setNewsletterQuery] = useState("");
  const [newsletterSelection, setNewsletterSelection] = useState<Set<string>>(
    new Set(),
  );
  const [showSuggestedNewsletters, setShowSuggestedNewsletters] =
    useState(false);
  const [connectingChannel, setConnectingChannel] = useState<string | null>(
    null,
  );
  const [taskAutomationDraft, setTaskAutomationDraft] = useState(
    setup.taskAutomation,
  );

  const visibleSetupNewsletters = useMemo(() => {
    const query = newsletterQuery.trim().toLocaleLowerCase("fr");
    return SETUP_NEWSLETTERS.filter((sender) => {
      const matchesQuery =
        !query ||
        `${sender.name} ${sender.email}`
          .toLocaleLowerCase("fr")
          .includes(query);
      return matchesQuery && (!showSuggestedNewsletters || sender.read < 20);
    });
  }, [newsletterQuery, showSuggestedNewsletters]);

  const allVisibleNewslettersSelected =
    visibleSetupNewsletters.length > 0 &&
    visibleSetupNewsletters.every((sender) =>
      newsletterSelection.has(sender.email),
    );

  const connectedChannels = useMemo(
    () => getVerifiedMailboxChannels(accountsData?.emailAccounts ?? []),
    [accountsData?.emailAccounts],
  );

  useEffect(() => {
    if (accountsLoading || !setup.hydrated) return;

    const savedChannels = [...setup.channels].sort().join(",");
    const verifiedChannels = [...connectedChannels].sort().join(",");
    const channelStepIsAccurate =
      setup.steps[0] === connectedChannels.length > 0;
    if (savedChannels !== verifiedChannels || !channelStepIsAccurate) {
      setup.saveChannels(connectedChannels);
    }
  }, [
    accountsLoading,
    connectedChannels,
    setup.channels,
    setup.hydrated,
    setup.saveChannels,
    setup.steps,
  ]);

  const stepDefinitions = [
    {
      icon: MessageSquareIcon,
      title: "Connecter vos canaux",
      description: "Rassemblez vos échanges au même endroit.",
      time: "2 min",
    },
    {
      icon: ArchiveIcon,
      title: "Trier vos newsletters",
      description: "Décidez lesquelles conserver ou retirer.",
      time: "1 min",
    },
    {
      icon: BotIcon,
      title: "Configurer votre assistant personnel",
      description: "Choisissez comment Mue vous aide et vous répond.",
      time: "2 min",
    },
    {
      icon: ListTodoIcon,
      title: "Créer des tâches depuis vos messages",
      description: "Demandez à Mue de détecter les actions clients.",
      time: "1 min",
    },
  ];

  const openStep = (index: number) => {
    if (index === 3) {
      router.push("/tasks?tutorial=mue-tasks");
      return;
    }

    setAssistantDraft({ ...setup.assistant });
    setNewsletterDraft({ ...setup.newsletters });
    setNewsletterQuery("");
    setNewsletterSelection(new Set());
    setShowSuggestedNewsletters(false);
    setTaskAutomationDraft({
      ...setup.taskAutomation,
      rules: [...setup.taskAutomation.rules],
    });
    setActiveStep(index);
  };

  const closeStep = () => setActiveStep(null);

  const connectSetupChannel = async (channel: string) => {
    if (connectedChannels.includes(channel) || connectingChannel) return;

    const provider =
      channel === "gmail"
        ? "google"
        : channel === "outlook"
          ? "microsoft"
          : null;
    if (!provider) {
      toastError({
        title: "WhatsApp bientôt disponible",
        description:
          "Ce canal ne sera proposé que lorsque sa connexion réelle sera prête.",
      });
      return;
    }

    setConnectingChannel(channel);
    try {
      const url = await getAccountLinkingUrl(provider, {
        returnTo: `/setup?channelConnected=${channel}`,
      });
      redirectToSafeUrl(url, { allowExternal: true });
    } catch (error) {
      console.error(`Error initiating ${provider} account linking:`, error);
      setConnectingChannel(null);
      toastError({
        title: `Impossible de connecter ${channel === "gmail" ? "Gmail" : "Outlook"}`,
        description: "Réessayez dans quelques instants.",
      });
    }
  };

  const applyNewsletterDecision = (
    decision: "keep" | "unsubscribe",
    emails: string[],
  ) => {
    setNewsletterDraft((current) => {
      const next = { ...current };
      emails.forEach((email) => {
        next[email] = decision;
      });
      return next;
    });
    setNewsletterSelection(new Set());
  };

  const saveActiveStep = () => {
    if (activeStep === 1) {
      setup.saveNewsletters(newsletterDraft);
      toastSuccess({
        title: "Newsletters triées",
        description: "Vos choix ont été enregistrés.",
      });
    }

    if (activeStep === 2) {
      const name = assistantDraft.name.trim();
      if (!name) return;
      setup.saveAssistant({ ...assistantDraft, name });
      toastSuccess({
        title: "Assistant configuré",
        description: `${name} utilisera désormais vos préférences de réponse.`,
      });
    }

    if (activeStep === 3) {
      setup.saveTaskAutomation(taskAutomationDraft);
      toastSuccess({
        title: "Création de tâches configurée",
        description:
          "Mue détectera les actions dans vos messages et vous demandera confirmation.",
      });
    }

    closeStep();
  };

  const isStepValid =
    activeStep === 0
      ? connectedChannels.length > 0
      : activeStep === 1
        ? Object.keys(newsletterDraft).length > 0
        : activeStep === 2
          ? assistantDraft.name.trim().length > 0
          : activeStep === 3
            ? taskAutomationDraft.enabled &&
              taskAutomationDraft.rules.length > 0
            : false;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 pb-12 pt-12 sm:px-6 sm:pt-16">
      <header className="mb-9 text-center">
        {setup.completed === 0 ? (
          <div className="mx-auto mb-5 grid size-20 place-items-center overflow-hidden rounded-[1.6rem] border border-blue-100 bg-[radial-gradient(circle_at_50%_30%,#f5f3ff_0%,#eef2ff_58%,#e0e7ff_100%)] shadow-[0_18px_45px_-25px_rgba(79,70,229,0.7)] dark:border-blue-950 dark:bg-blue-950/30">
            <Image
              alt="Mue, votre copilote Freescale"
              className="h-full w-full scale-[1.22] object-cover"
              height={96}
              priority
              src="/images/mue/mue-setup-icon.png"
              width={96}
            />
          </div>
        ) : null}
        <PageHeading>
          {setup.completed === 0
            ? "Configurons votre espace"
            : "Configuration Freescale"}
        </PageHeading>
        <p className="mx-auto mt-2 max-w-xl text-base text-slate-600 dark:text-slate-300">
          {setup.isComplete
            ? "Votre espace est prêt. Vous pouvez modifier vos choix à tout moment."
            : setup.completed === 0
              ? "Mue vous accompagne dans quatre réglages simples, en commençant par vos canaux."
              : "Continuez à votre rythme. Chaque réglage peut être modifié plus tard."}
        </p>
        {setup.completed === 0 ? (
          <Button
            className="mt-5 gap-2 rounded-xl bg-blue-600 px-5 shadow-[0_12px_28px_-14px_rgba(37,99,235,0.8)] hover:bg-blue-700"
            onClick={() => openStep(0)}
            size="lg"
          >
            Commencer la configuration
            <ChevronRightIcon className="size-4" />
          </Button>
        ) : null}
      </header>

      <section className="mb-4 rounded-2xl border border-border/70 bg-background p-4 shadow-[0_16px_45px_-38px_rgba(15,23,42,0.6)] sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground">
              {setup.isComplete
                ? "Configuration terminée"
                : "Configurer votre espace"}
            </h2>
            <p className="mt-1 text-muted-foreground text-xs">
              {setup.completed} étape{setup.completed > 1 ? "s" : ""} sur{" "}
              {setup.total}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium text-muted-foreground text-xs">
              {Math.round((setup.completed / setup.total) * 100)} %
            </span>
            <div className="h-2 w-28 overflow-hidden rounded-full bg-muted sm:w-36">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 transition-[width] duration-500 ease-out"
                style={{ width: `${(setup.completed / setup.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3">
        {stepDefinitions.map(
          ({ icon: Icon, title, description, time }, index) => {
            const completed = setup.steps[index];
            return (
              <button
                className={cn(
                  "group flex w-full items-center gap-4 rounded-2xl border bg-background p-4 text-left shadow-[0_14px_38px_-34px_rgba(15,23,42,0.7)] transition-colors sm:p-5",
                  completed
                    ? "border-emerald-200/80 hover:bg-emerald-50/35 dark:border-emerald-900/60 dark:hover:bg-emerald-950/15"
                    : "border-border/70 hover:border-blue-200 hover:bg-blue-50/20 dark:hover:border-blue-900/70 dark:hover:bg-blue-950/10",
                )}
                key={title}
                onClick={() => openStep(index)}
                type="button"
              >
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    completed
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
                  )}
                >
                  {completed ? (
                    <CheckIcon className="size-5" />
                  ) : (
                    <Icon className="size-5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">
                    {title}
                  </span>
                  <span className="mt-1 block text-muted-foreground text-xs leading-5">
                    {description} · {time}
                  </span>
                </span>
                <span className="hidden items-center gap-1.5 font-medium text-muted-foreground text-xs sm:flex">
                  {completed
                    ? "Modifier"
                    : index === setup.completed
                      ? index === 0
                        ? "Commencer la configuration"
                        : "Continuer"
                      : "Configurer"}
                  <ChevronRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            );
          },
        )}
      </div>

      {setup.completed > 0 ? (
        <button
          className="mx-auto mt-6 text-muted-foreground text-xs underline-offset-4 hover:text-foreground hover:underline"
          onClick={() => {
            setup.resetSetup();
            toastSuccess({
              title: "Configuration réinitialisée",
              description: "La progression est revenue à 0 sur 4.",
            });
          }}
          type="button"
        >
          Recommencer la configuration
        </button>
      ) : null}

      {activeStep !== null ? (
        <Dialog
          onOpenChange={(open) => {
            if (!open) closeStep();
          }}
          open
        >
          <DialogContent
            className={cn(
              "overflow-hidden p-0",
              activeStep === 1 ? "sm:max-w-5xl" : "sm:max-w-xl",
            )}
          >
            <DialogHeader className="border-b px-6 pb-5 pt-6 text-left">
              <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                {activeStep === 0 ? (
                  <MessageSquareIcon className="size-5" />
                ) : null}
                {activeStep === 1 ? <ArchiveIcon className="size-5" /> : null}
                {activeStep === 2 ? <BotIcon className="size-5" /> : null}
                {activeStep === 3 ? <ListTodoIcon className="size-5" /> : null}
              </div>
              <DialogTitle>{stepDefinitions[activeStep].title}</DialogTitle>
              <DialogDescription>
                {activeStep === 0
                  ? "Choisissez au moins un canal à centraliser dans Freescale."
                  : null}
                {activeStep === 1
                  ? "Traitez chaque source pour garder une boîte de réception utile."
                  : null}
                {activeStep === 2
                  ? "Définissez le comportement de Mue dans vos conversations."
                  : null}
                {activeStep === 3
                  ? "Autorisez Mue à transformer les demandes clients en tâches à valider."
                  : null}
              </DialogDescription>
            </DialogHeader>

            <div
              className={cn(
                "overflow-y-auto px-6 py-5",
                activeStep === 1 ? "max-h-[68vh]" : "max-h-[66vh]",
              )}
            >
              {activeStep === 2 ? (
                <div className="space-y-4">
                  <label className="block" htmlFor="setup-assistant-name">
                    <span className="mb-2 block font-medium text-sm">
                      Nom de l’assistant
                    </span>
                    <Input
                      autoFocus
                      id="setup-assistant-name"
                      onChange={(event) =>
                        setAssistantDraft((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Mue"
                      value={assistantDraft.name}
                    />
                  </label>
                  <fieldset>
                    <legend className="mb-2 font-medium text-sm">
                      Ton des réponses
                    </legend>
                    <div className="grid grid-cols-3 gap-2">
                      {(["direct", "cordial", "professionnel"] as const).map(
                        (tone) => (
                          <button
                            className={cn(
                              "rounded-xl border px-3 py-2.5 text-sm capitalize transition-colors",
                              assistantDraft.tone === tone
                                ? "border-blue-500 bg-blue-50 font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                                : "border-border hover:bg-muted/50",
                            )}
                            key={tone}
                            onClick={() =>
                              setAssistantDraft((current) => ({
                                ...current,
                                tone,
                              }))
                            }
                            type="button"
                          >
                            {tone}
                          </button>
                        ),
                      )}
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend className="mb-2 font-medium text-sm">
                      Longueur par défaut
                    </legend>
                    <div className="grid grid-cols-3 gap-2">
                      {(["courte", "equilibree", "detaillee"] as const).map(
                        (length) => (
                          <button
                            className={cn(
                              "rounded-xl border px-3 py-2.5 text-sm transition-colors",
                              assistantDraft.responseLength === length
                                ? "border-blue-500 bg-blue-50 font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                                : "border-border hover:bg-muted/50",
                            )}
                            key={length}
                            onClick={() =>
                              setAssistantDraft((current) => ({
                                ...current,
                                responseLength: length,
                              }))
                            }
                            type="button"
                          >
                            {length === "equilibree"
                              ? "Équilibrée"
                              : length === "detaillee"
                                ? "Détaillée"
                                : "Courte"}
                          </button>
                        ),
                      )}
                    </div>
                  </fieldset>

                  <div>
                    <p className="mb-2 font-medium text-sm">
                      Comportement et autorisations
                    </p>
                    <div className="overflow-hidden rounded-xl border border-border/70">
                      {[
                        {
                          key: "autoSuggest" as const,
                          title: "Suggestions automatiques",
                          description:
                            "Mue prépare une réponse, sans jamais l’envoyer sans votre accord.",
                        },
                        {
                          key: "canLearnFromMessages" as const,
                          title: "Enrichir la connaissance client",
                          description:
                            "Autorise Mue à utiliser vos messages connectés pour mieux comprendre vos clients.",
                        },
                      ].map(({ key, title, description }, index) => (
                        <div
                          className={cn(
                            "flex items-center justify-between gap-4 bg-muted/20 px-4 py-3.5",
                            index > 0 && "border-t border-border/60",
                          )}
                          key={key}
                        >
                          <div>
                            <p className="font-medium text-sm">{title}</p>
                            <p className="mt-1 max-w-sm text-muted-foreground text-xs leading-5">
                              {description}
                            </p>
                          </div>
                          <Switch
                            aria-label={title}
                            checked={assistantDraft[key]}
                            onCheckedChange={(checked) =>
                              setAssistantDraft((current) => ({
                                ...current,
                                [key]: checked,
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {activeStep === 1 ? (
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button className="h-9 gap-2" size="sm" variant="outline">
                      <InboxIcon className="size-4" /> À traiter
                      <ChevronDownIcon className="size-3.5 text-muted-foreground" />
                    </Button>
                    <Button className="h-9 gap-2" size="sm" variant="outline">
                      <CalendarIcon className="size-4" /> 3 derniers mois
                      <ChevronDownIcon className="size-3.5 text-muted-foreground" />
                    </Button>
                    <div className="relative min-w-48 flex-1">
                      <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        className="h-9 pl-9"
                        onChange={(event) =>
                          setNewsletterQuery(event.target.value)
                        }
                        placeholder="Rechercher un expéditeur…"
                        value={newsletterQuery}
                      />
                    </div>
                    <Button
                      aria-pressed={showSuggestedNewsletters}
                      className="h-9 gap-2"
                      onClick={() => {
                        const next = !showSuggestedNewsletters;
                        setShowSuggestedNewsletters(next);
                        setNewsletterSelection(
                          next
                            ? new Set(
                                SETUP_NEWSLETTERS.filter(
                                  (sender) => sender.read < 20,
                                ).map((sender) => sender.email),
                              )
                            : new Set(),
                        );
                      }}
                      size="sm"
                      variant={
                        showSuggestedNewsletters ? "secondary" : "outline"
                      }
                    >
                      <SparklesIcon className="size-4 text-amber-500" />
                      {showSuggestedNewsletters
                        ? "Suggestions affichées"
                        : "Sélectionner les suggestions Mue"}
                    </Button>
                  </div>

                  {newsletterSelection.size > 0 ? (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/25 px-4 py-2.5">
                      <span className="font-medium text-sm">
                        {newsletterSelection.size} expéditeur
                        {newsletterSelection.size > 1 ? "s" : ""} sélectionné
                        {newsletterSelection.size > 1 ? "s" : ""}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            applyNewsletterDecision("keep", [
                              ...newsletterSelection,
                            ])
                          }
                          size="sm"
                          variant="outline"
                        >
                          Conserver
                        </Button>
                        <Button
                          onClick={() =>
                            applyNewsletterDecision("unsubscribe", [
                              ...newsletterSelection,
                            ])
                          }
                          size="sm"
                        >
                          Se désabonner
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-3 overflow-x-auto rounded-xl border">
                    <Table className="min-w-[780px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-11 pr-0">
                            <ButtonCheckbox
                              checked={allVisibleNewslettersSelected}
                              label={
                                allVisibleNewslettersSelected
                                  ? "Tout désélectionner"
                                  : "Tout sélectionner"
                              }
                              onChange={() =>
                                setNewsletterSelection((current) => {
                                  const next = new Set(current);
                                  visibleSetupNewsletters.forEach((sender) => {
                                    if (allVisibleNewslettersSelected) {
                                      next.delete(sender.email);
                                    } else {
                                      next.add(sender.email);
                                    }
                                  });
                                  return next;
                                })
                              }
                            />
                          </TableHead>
                          <TableHead>Expéditeur</TableHead>
                          <TableHead className="w-24">E-mails</TableHead>
                          <TableHead className="w-36">Lus</TableHead>
                          <TableHead className="w-64" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleSetupNewsletters.map((sender) => {
                          const decision = newsletterDraft[sender.email];
                          return (
                            <TableRow key={sender.email}>
                              <TableCell className="pr-0">
                                <ButtonCheckbox
                                  checked={newsletterSelection.has(
                                    sender.email,
                                  )}
                                  label={`Sélectionner ${sender.name}`}
                                  onChange={() =>
                                    setNewsletterSelection((current) => {
                                      const next = new Set(current);
                                      if (next.has(sender.email)) {
                                        next.delete(sender.email);
                                      } else {
                                        next.add(sender.email);
                                      }
                                      return next;
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="flex min-w-0 items-center gap-3">
                                  <DomainIcon
                                    domain={sender.domain}
                                    size={32}
                                    variant="circular"
                                  />
                                  <div className="min-w-0">
                                    <p className="truncate font-medium text-sm">
                                      {sender.name}
                                    </p>
                                    <p className="truncate text-muted-foreground text-xs">
                                      {sender.email}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium text-sm">
                                {sender.emails}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress
                                    className="h-1.5 w-14"
                                    innerClassName={
                                      sender.read < 20
                                        ? "bg-amber-400"
                                        : "bg-slate-300"
                                    }
                                    value={sender.read}
                                  />
                                  <span
                                    className={cn(
                                      "font-medium text-xs",
                                      sender.read < 20 && "text-amber-600",
                                    )}
                                  >
                                    {sender.read}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    className={cn(
                                      "h-8",
                                      decision === "keep" &&
                                        "border-emerald-200 bg-emerald-50 text-emerald-700",
                                    )}
                                    onClick={() =>
                                      applyNewsletterDecision("keep", [
                                        sender.email,
                                      ])
                                    }
                                    size="sm"
                                    variant="outline"
                                  >
                                    <ThumbsUpIcon className="size-3.5" />
                                    {decision === "keep"
                                      ? "Conservé"
                                      : "Conserver"}
                                  </Button>
                                  <Button
                                    className="h-8 min-w-28"
                                    onClick={() =>
                                      applyNewsletterDecision("unsubscribe", [
                                        sender.email,
                                      ])
                                    }
                                    size="sm"
                                    variant={
                                      decision === "unsubscribe"
                                        ? "secondary"
                                        : "outline"
                                    }
                                  >
                                    {decision === "unsubscribe"
                                      ? "Désabonné"
                                      : "Se désabonner"}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : null}

              {activeStep === 0 ? (
                <div className="space-y-2">
                  {SETUP_CHANNELS.map(({ id, name, description }) => {
                    const connected = connectedChannels.includes(id);
                    const provider =
                      id === "gmail"
                        ? "google"
                        : id === "outlook"
                          ? "microsoft"
                          : null;
                    const connectedAccount = provider
                      ? accountsData?.emailAccounts.find(
                          ({ account }) => account.provider === provider,
                        )
                      : undefined;
                    const isConnecting = connectingChannel === id;
                    const isAvailable = id !== "whatsapp";
                    return (
                      <button
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                          connected
                            ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20"
                            : "border-border hover:bg-muted/35",
                        )}
                        key={id}
                        disabled={connected || isConnecting || accountsLoading}
                        onClick={() => connectSetupChannel(id)}
                        type="button"
                      >
                        <span className="flex size-10 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-black/[0.04]">
                          <SetupChannelLogo id={id} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-sm">
                            {name}
                          </span>
                          <span className="mt-0.5 block text-muted-foreground text-xs">
                            {connectedAccount?.email ?? description}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1.5 font-medium text-xs",
                            connected
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {connected
                            ? "Connecté"
                            : isConnecting
                              ? "Ouverture…"
                              : isAvailable
                                ? "Connecter"
                                : "Bientôt"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {activeStep === 3 ? (
                <div className="space-y-4">
                  <div
                    className={cn(
                      "flex items-center justify-between gap-5 rounded-xl border p-4 transition-colors",
                      taskAutomationDraft.enabled
                        ? "border-blue-200 bg-blue-50/55 dark:border-blue-900 dark:bg-blue-950/20"
                        : "border-border bg-muted/20",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-xl",
                          taskAutomationDraft.enabled
                            ? "bg-blue-600 text-white"
                            : "bg-background text-muted-foreground shadow-sm",
                        )}
                      >
                        <ListTodoIcon className="size-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-sm">
                          Créer des tâches avec Mue
                        </p>
                        <p className="mt-1 max-w-sm text-muted-foreground text-xs leading-5">
                          Mue analyse les nouveaux messages clients et prépare
                          une tâche lorsqu’une action est détectée.
                        </p>
                      </div>
                    </div>
                    <Switch
                      aria-label="Créer des tâches avec Mue"
                      checked={taskAutomationDraft.enabled}
                      onCheckedChange={(enabled) =>
                        setTaskAutomationDraft((current) => ({
                          ...current,
                          enabled,
                        }))
                      }
                    />
                  </div>

                  <fieldset
                    className={cn(
                      "transition-opacity",
                      !taskAutomationDraft.enabled && "opacity-45",
                    )}
                    disabled={!taskAutomationDraft.enabled}
                  >
                    <legend className="mb-2 font-medium text-sm">
                      Quand proposer une tâche
                    </legend>
                    <div className="grid gap-2">
                      {SETUP_TASK_RULES.map(({ id, title, description }) => {
                        const selected = taskAutomationDraft.rules.includes(id);
                        return (
                          <button
                            aria-pressed={selected}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                              selected
                                ? "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20"
                                : "border-border hover:bg-muted/35",
                            )}
                            key={id}
                            onClick={() =>
                              setTaskAutomationDraft((current) => ({
                                ...current,
                                rules: current.rules.includes(id)
                                  ? current.rules.filter((rule) => rule !== id)
                                  : [...current.rules, id],
                              }))
                            }
                            type="button"
                          >
                            <span
                              className={cn(
                                "grid size-5 shrink-0 place-items-center rounded-md border",
                                selected
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-border bg-background",
                              )}
                            >
                              {selected ? (
                                <CheckIcon className="size-3.5" />
                              ) : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium text-sm">
                                {title}
                              </span>
                              <span className="mt-0.5 block text-muted-foreground text-xs">
                                {description}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div
                    className={cn(
                      "flex items-center justify-between gap-4 rounded-xl border bg-muted/20 px-4 py-3.5 transition-opacity",
                      !taskAutomationDraft.enabled && "opacity-45",
                    )}
                  >
                    <div>
                      <p className="font-medium text-sm">
                        Demander votre confirmation
                      </p>
                      <p className="mt-1 text-muted-foreground text-xs leading-5">
                        La tâche reste une suggestion tant que vous ne l’avez
                        pas validée.
                      </p>
                    </div>
                    <Switch
                      aria-label="Demander votre confirmation"
                      checked={taskAutomationDraft.requireApproval}
                      disabled={!taskAutomationDraft.enabled}
                      onCheckedChange={(requireApproval) =>
                        setTaskAutomationDraft((current) => ({
                          ...current,
                          requireApproval,
                        }))
                      }
                    />
                  </div>

                  <div className="rounded-xl border border-dashed bg-background px-4 py-3.5">
                    <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                      <MessageSquareIcon className="size-3.5" />
                      Message client
                      <ChevronRightIcon className="size-3.5" />
                      <SparklesIcon className="size-3.5 text-blue-600" />
                      Détection Mue
                      <ChevronRightIcon className="size-3.5" />
                      <ListTodoIcon className="size-3.5 text-emerald-600" />
                      Tâche à valider
                    </div>
                    <p className="mt-2 font-medium text-sm">
                      Envoyer la version finale à Sarah
                    </p>
                    <p className="mt-1 text-muted-foreground text-xs">
                      Échéance détectée : demain
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <DialogFooter className="border-t bg-muted/20 px-6 py-4">
              {activeStep === 0 ? (
                <Button onClick={closeStep} variant="outline">
                  Fermer
                </Button>
              ) : (
                <>
                  <Button onClick={closeStep} variant="ghost">
                    Annuler
                  </Button>
                  <Button disabled={!isStepValid} onClick={saveActiveStep}>
                    {setup.steps[activeStep]
                      ? "Enregistrer les modifications"
                      : "Valider cette étape"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}

export function LegacySetupPreview() {
  const router = useRouter();
  const {
    steps: completed,
    completed: completedRequired,
    total,
    isComplete,
    completeStep,
  } = usePreviewSetupProgress();
  const steps = [
    {
      icon: BotIcon,
      title: "Configurer votre assistant personnel",
      description: "Apprenez à Mue votre façon de travailler",
      time: "5 min",
      action: "Configurer",
      href: "/onboarding",
    },
    {
      icon: ArchiveIcon,
      title: "Trier vos newsletters",
      description: "Identifiez et retirez les abonnements inutiles",
      time: "2 min",
      action: "Trier",
      href: "/bulk-unsubscribe",
    },
    {
      icon: MessageSquareIcon,
      title: "Connecter vos canaux",
      description: "Regroupez Gmail, Outlook et WhatsApp",
      time: "2 min",
      action: "Connecter",
      href: "/channels-v4",
    },
  ];

  const runStepAction = (href: string) => {
    router.push(href);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 pb-10 pt-12 sm:px-6 sm:pt-16">
      <div className="mb-8 sm:mb-10">
        <PageHeading className="text-center">
          Bienvenue sur Freescale
        </PageHeading>
        <p className="mx-auto mt-2 max-w-xl text-center text-base text-slate-600 dark:text-slate-300">
          {isComplete
            ? "Votre espace Freescale est prêt. Que souhaitez-vous faire ?"
            : "Finalisez ces trois étapes pour profiter pleinement de Freescale."}
        </p>
      </div>

      <div className="mb-6">
        <div className="mb-4 rounded-2xl border border-border/70 bg-muted/15 px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-foreground">
                {isComplete
                  ? "Configuration terminée"
                  : "Finaliser votre configuration"}
              </h2>
              <p className="mt-0.5 text-muted-foreground text-xs">
                {completedRequired} étape
                {completedRequired > 1 ? "s" : ""} sur {total} terminée
                {completedRequired > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-muted-foreground text-sm sm:block">
                {Math.round((completedRequired / total) * 100)} %
              </span>
              <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 transition-[width] duration-500 ease-out"
                  style={{
                    width: `${(completedRequired / total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {steps.map(
            ({ icon: Icon, title, description, time, action, href }, index) => {
              const isCompleted = completed[index];
              return (
                <article
                  className={cn(
                    "group overflow-hidden rounded-2xl border bg-background shadow-[0_12px_34px_-26px_rgba(15,23,42,0.35)] transition-[background-color,border-color] duration-150",
                    isCompleted
                      ? "border-emerald-200/80 bg-emerald-50/25 dark:border-emerald-900/60 dark:bg-emerald-950/10"
                      : "border-border/70 hover:border-blue-200 hover:bg-blue-50/20 dark:hover:border-blue-900/70 dark:hover:bg-blue-950/10",
                  )}
                  key={title}
                >
                  <div className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
                    <button
                      className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4"
                      onClick={() => runStepAction(href)}
                      type="button"
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-foreground">
                          {title}
                        </span>
                        <span className="mt-1 block text-muted-foreground text-xs leading-5">
                          {description} · {time}
                        </span>
                      </span>
                    </button>

                    {isCompleted ? (
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckIcon className="size-4" />
                      </span>
                    ) : (
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          className="hidden rounded-xl sm:inline-flex"
                          onClick={() => runStepAction(href)}
                          size="sm"
                          variant="outline"
                        >
                          {action}
                        </Button>
                        <button
                          aria-label={`Marquer « ${title} » comme terminée`}
                          className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                          onClick={() => completeStep(index)}
                          title="Marquer comme terminée"
                          type="button"
                        >
                          <CheckIcon className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}
