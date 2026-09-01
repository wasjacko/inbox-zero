"use client";

import {
  ArchiveRestoreIcon,
  Building2Icon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronRightIcon,
  Clock3Icon,
  FileTextIcon,
  FilterIcon,
  FolderArchiveIcon,
  HardDriveIcon,
  ListTodoIcon,
  MailIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  SendHorizontalIcon,
  Settings2Icon,
  type TagIcon,
  Trash2Icon,
  UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import type { GetFreescaleTasksResponse } from "@/app/api/user/tasks/route";
import { WhatsAppIcon } from "@/components/BrandIcons";
import { Gmail } from "@/components/new-landing/icons/Gmail";
import { Outlook } from "@/components/new-landing/icons/Outlook";
import { toastError, toastSuccess } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/utils";
import {
  MobileEmptyState,
  MobileFullScreenDialog,
  MobileSheet,
} from "@/components/mobile/MobilePrimitives";
import { MobileArchivePreview } from "@/components/mobile/MobileArchivePreview";
import { MobileSettingsExperience } from "@/components/mobile/MobileSettingsExperience";
import { useAccount } from "@/providers/EmailAccountProvider";
import { EMAIL_ACCOUNT_HEADER } from "@/utils/config";

type MobileTaskGroup = "En retard" | "Aujourd’hui" | "À venir";

type MobileTask = {
  id: string;
  title: string;
  client: string;
  due: string;
  group: MobileTaskGroup;
  urgent: boolean;
  done: boolean;
  dueDate: string;
  sourceThreadId?: string;
};

function getTaskDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  const yesterday = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  yesterday.setDate(today.getDate() - 1);
  return {
    today: today.toISOString().slice(0, 10),
    tomorrow: tomorrow.toISOString().slice(0, 10),
    yesterday: yesterday.toISOString().slice(0, 10),
  };
}

async function mobileTaskRequest(
  emailAccountId: string,
  method: "POST" | "PATCH",
  body: object,
) {
  const response = await fetch("/api/user/tasks", {
    method,
    headers: {
      "Content-Type": "application/json",
      [EMAIL_ACCOUNT_HEADER]: emailAccountId,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("mobile_task_request_failed");
  return response.json();
}

type MobileTaskFilter =
  | "Toutes"
  | "Urgentes"
  | "Aujourd’hui"
  | "À venir"
  | "Terminées";
type MobileTaskSort = "Priorité" | "Échéance" | "Nom";

export function MobileTasksPreview() {
  const { emailAccountId } = useAccount();
  const {
    data: storedTasks,
    error: tasksError,
    isLoading: tasksLoading,
    mutate: refreshTasks,
  } = useSWR<GetFreescaleTasksResponse>(
    emailAccountId ? "/api/user/tasks" : null,
  );
  const [tasks, setTasks] = useState<MobileTask[]>([]);
  const [tasksHydrated, setTasksHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MobileTaskFilter>("Toutes");
  const [sort, setSort] = useState<MobileTaskSort>("Priorité");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftClient, setDraftClient] = useState("");
  const [draftGroup, setDraftGroup] = useState<MobileTaskGroup>("Aujourd’hui");
  const selected = tasks.find(({ id }) => id === selectedId) ?? null;
  const activeCount = tasks.filter(({ done }) => !done).length;
  const visibleTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    return tasks
      .filter((task) => {
        if (filter === "Terminées") return task.done;
        if (task.done) return false;
        if (filter === "Urgentes" && !task.urgent) return false;
        if (filter === "Aujourd’hui" && task.group !== "Aujourd’hui")
          return false;
        if (filter === "À venir" && task.group !== "À venir") return false;
        return (
          !normalizedQuery ||
          `${task.title} ${task.client}`
            .toLocaleLowerCase("fr")
            .includes(normalizedQuery)
        );
      })
      .sort((first, second) => {
        if (sort === "Nom")
          return first.title.localeCompare(second.title, "fr");
        if (sort === "Échéance") {
          const order: MobileTaskGroup[] = [
            "En retard",
            "Aujourd’hui",
            "À venir",
          ];
          return order.indexOf(first.group) - order.indexOf(second.group);
        }
        return Number(second.urgent) - Number(first.urgent);
      });
  }, [filter, query, sort, tasks]);

  useEffect(() => {
    if (!storedTasks) return;
    const { today } = getTaskDates();
    setTasks(
      storedTasks.tasks.map((task) => {
        const group: MobileTaskGroup = task.due
          ? task.due < today
            ? "En retard"
            : task.due === today
              ? "Aujourd’hui"
              : "À venir"
          : "À venir";
        return {
          id: task.id,
          title: task.title,
          client: task.contactName ?? "Sans contact",
          due: group === "À venir" ? "À venir" : group,
          dueDate: task.due,
          group,
          urgent: task.priority === "high",
          done: task.status === "done",
          sourceThreadId: task.sourceThreadId ?? undefined,
        };
      }),
    );
    setTasksHydrated(true);
  }, [storedTasks]);

  useEffect(() => {
    if (tasksError || (!tasksLoading && !storedTasks)) setTasksHydrated(true);
  }, [storedTasks, tasksError, tasksLoading]);

  const updateSelected = async (
    changes: Partial<MobileTask>,
    persistedChanges: object,
  ) => {
    if (!selectedId) return;
    setTasks((current) =>
      current.map((task) =>
        task.id === selectedId ? { ...task, ...changes } : task,
      ),
    );
    try {
      await mobileTaskRequest(emailAccountId, "PATCH", {
        id: selectedId,
        ...persistedChanges,
      });
      await refreshTasks();
    } catch {
      toastError({ description: "La tâche n’a pas pu être enregistrée." });
      await refreshTasks();
    }
  };

  return (
    <MobilePage title="Tâches" subtitle={`${activeCount} à traiter`}>
      <div className="flex gap-2 px-4 pb-4">
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Rechercher une tâche"
            autoComplete="off"
            className="h-11 rounded-xl border-0 bg-muted pl-9 shadow-none"
            enterKeyHint="search"
            inputMode="search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher"
            spellCheck={false}
            type="search"
            value={query}
          />
        </div>
        <button
          aria-label="Filtrer les tâches"
          className={cn(
            "mobile-touch-target relative grid size-11 place-items-center rounded-xl border",
            (filter !== "Toutes" || sort !== "Priorité") &&
              "border-blue-600 bg-blue-50 text-blue-700",
          )}
          onClick={() => setFiltersOpen(true)}
          type="button"
        >
          <FilterIcon className="size-4" />
        </button>
      </div>

      <div className="space-y-6 px-4 pb-24">
        {["En retard", "Aujourd’hui", "À venir"].map((group) => {
          const groupedTasks = visibleTasks.filter(
            (task) => task.group === group,
          );
          return (
            <section key={group}>
              <h2 className="mb-2 px-1 font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
                {group} · {groupedTasks.length}
              </h2>
              <div className="overflow-hidden rounded-2xl border bg-card">
                {groupedTasks.length ? (
                  groupedTasks.map((task, index) => (
                    <button
                      className={cn(
                        "flex min-h-[82px] w-full items-center gap-3 p-3 text-left active:bg-muted",
                        index < groupedTasks.length - 1 && "border-b",
                      )}
                      data-mobile-defer
                      key={task.id}
                      onClick={() => setSelectedId(task.id)}
                      type="button"
                    >
                      {task.done ? (
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                          <CheckIcon className="size-3" />
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            task.urgent ? "bg-rose-500" : "bg-blue-500",
                          )}
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 font-medium text-sm leading-5">
                          {task.title}
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 text-muted-foreground text-xs">
                          <UserRoundIcon className="size-3" /> {task.client}
                          <span aria-hidden="true">·</span> {task.due}
                        </span>
                      </span>
                      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-5 text-center text-muted-foreground text-sm">
                    Aucune tâche dans cette section
                  </p>
                )}
              </div>
            </section>
          );
        })}
        {tasksHydrated && visibleTasks.length === 0 && query ? (
          <MobileEmpty
            icon={SearchIcon}
            title="Aucun résultat"
            detail="Essayez avec un autre mot."
          />
        ) : null}
      </div>

      <button
        aria-label="Créer une tâche"
        className="fixed bottom-[calc(var(--mobile-bottombar-height)+var(--mobile-safe-bottom)+1rem)] right-4 z-30 grid size-14 place-items-center rounded-full bg-blue-600 text-white shadow-xl lg:hidden"
        onClick={() => setCreateOpen(true)}
        type="button"
      >
        <PlusIcon className="size-6" />
      </button>

      <MobileSheet
        footer={
          <Button className="w-full" onClick={() => setFiltersOpen(false)}>
            Afficher les tâches
          </Button>
        }
        onOpenChange={setFiltersOpen}
        open={filtersOpen}
        title="Filtrer"
      >
        <div className="space-y-6">
          <div>
            <p className="mb-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
              Afficher
            </p>
            <div className="space-y-1">
              {(
                [
                  "Toutes",
                  "Urgentes",
                  "Aujourd’hui",
                  "À venir",
                  "Terminées",
                ] as MobileTaskFilter[]
              ).map((option) => (
                <button
                  className={cn(
                    "mobile-touch-target flex w-full items-center justify-between rounded-xl px-3 text-sm active:bg-muted",
                    filter === option && "bg-muted",
                  )}
                  key={option}
                  onClick={() => setFilter(option)}
                  type="button"
                >
                  {option}
                  {filter === option ? (
                    <CheckIcon className="size-4 text-blue-600" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
              Trier par
            </p>
            <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-3">
              {(["Priorité", "Échéance", "Nom"] as MobileTaskSort[]).map(
                (option) => (
                  <button
                    className={cn(
                      "mobile-touch-target rounded-xl border px-2 text-sm",
                      sort === option &&
                        "border-blue-600 bg-blue-50 text-blue-700",
                    )}
                    key={option}
                    onClick={() => setSort(option)}
                    type="button"
                  >
                    {option}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </MobileSheet>

      <MobileSheet
        footer={
          <Button
            className="w-full"
            disabled={!draftTitle.trim()}
            onClick={async () => {
              const { today, tomorrow } = getTaskDates();
              try {
                await mobileTaskRequest(emailAccountId, "POST", {
                  title: draftTitle.trim(),
                  contactName: draftClient.trim() || null,
                  due: draftGroup === "À venir" ? tomorrow : today,
                  status: "todo",
                  priority: "medium",
                  source: "manual",
                  assignees: [],
                });
                await refreshTasks();
                setDraftTitle("");
                setDraftClient("");
                setDraftGroup("Aujourd’hui");
                setCreateOpen(false);
                toastSuccess({ description: "Tâche créée." });
              } catch {
                toastError({ description: "Impossible de créer cette tâche." });
              }
            }}
          >
            Créer la tâche
          </Button>
        }
        onOpenChange={setCreateOpen}
        open={createOpen}
        title="Nouvelle tâche"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="font-medium text-sm" htmlFor="mobile-task-title">
              À faire
            </label>
            <Input
              autoFocus
              autoCapitalize="sentences"
              autoComplete="off"
              enterKeyHint="next"
              id="mobile-task-title"
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="Ex. Envoyer le devis"
              value={draftTitle}
            />
          </div>
          <div className="space-y-2">
            <label className="font-medium text-sm" htmlFor="mobile-task-client">
              Contact{" "}
              <span className="font-normal text-muted-foreground">
                (facultatif)
              </span>
            </label>
            <Input
              autoCapitalize="words"
              autoComplete="off"
              enterKeyHint="done"
              id="mobile-task-client"
              onChange={(event) => setDraftClient(event.target.value)}
              placeholder="Nom du contact"
              value={draftClient}
            />
          </div>
          <div className="space-y-2">
            <p className="font-medium text-sm">Échéance</p>
            <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
              {(["Aujourd’hui", "À venir"] as MobileTaskGroup[]).map(
                (option) => (
                  <button
                    className={cn(
                      "mobile-touch-target rounded-xl border px-3 text-sm",
                      draftGroup === option &&
                        "border-blue-600 bg-blue-50 text-blue-700",
                    )}
                    key={option}
                    onClick={() => setDraftGroup(option)}
                    type="button"
                  >
                    {option === "À venir" ? "Demain" : option}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </MobileSheet>

      <MobileFullScreenDialog
        footer={
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-[1fr_auto]">
            <Button
              onClick={async () => {
                if (!selected) return;
                await updateSelected(
                  { done: !selected.done },
                  { status: selected.done ? "todo" : "done" },
                );
                setSelectedId(null);
                toastSuccess({
                  description: selected.done
                    ? "Tâche remise à traiter."
                    : "Tâche terminée.",
                });
              }}
            >
              <CheckIcon className="size-4" />
              {selected?.done ? "Rouvrir" : "Terminer"}
            </Button>
            <Button
              aria-label="Plus d’actions"
              onClick={() => setActionsOpen(true)}
              size="icon"
              variant="outline"
            >
              <MoreHorizontalIcon className="size-5" />
            </Button>
          </div>
        }
        onOpenChange={(open) => !open && setSelectedId(null)}
        open={Boolean(selected)}
        title="Détail de la tâche"
      >
        {selected ? (
          <div className="space-y-6 px-5 py-6">
            <div>
              <p className="text-muted-foreground text-xs">{selected.group}</p>
              <h2 className="mt-2 font-semibold text-2xl tracking-tight">
                {selected.title}
              </h2>
            </div>
            <div className="space-y-3 rounded-2xl border p-4 text-sm">
              <p className="flex items-center gap-3">
                <UserRoundIcon className="size-4 text-muted-foreground" />{" "}
                {selected.client}
              </p>
              <p className="flex items-center gap-3">
                <CalendarDaysIcon className="size-4 text-muted-foreground" />{" "}
                {selected.due}
              </p>
            </div>
            <button
              className="mobile-touch-target flex w-full items-center justify-between rounded-2xl border px-4 text-sm"
              onClick={() => setActionsOpen(true)}
              type="button"
            >
              Déplacer vers… <ChevronRightIcon className="size-4" />
            </button>
            {selected.sourceThreadId ? (
              <Link
                className="mobile-touch-target flex w-full items-center justify-between rounded-2xl border px-4 text-sm"
                href={`/channels-v4?conversation=${encodeURIComponent(selected.sourceThreadId)}`}
              >
                Ouvrir l’e-mail source
                <ChevronRightIcon className="size-4" />
              </Link>
            ) : null}
          </div>
        ) : null}
      </MobileFullScreenDialog>

      <MobileSheet
        onOpenChange={setActionsOpen}
        open={actionsOpen}
        title="Organiser la tâche"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            {(["En retard", "Aujourd’hui", "À venir"] as MobileTaskGroup[]).map(
              (group) => (
                <button
                  className={cn(
                    "mobile-touch-target flex w-full items-center justify-between rounded-xl px-3 text-sm active:bg-muted",
                    selected?.group === group && "bg-muted",
                  )}
                  key={group}
                  onClick={async () => {
                    const { today, tomorrow, yesterday } = getTaskDates();
                    const dueDate =
                      group === "À venir"
                        ? tomorrow
                        : group === "En retard"
                          ? yesterday
                          : today;
                    await updateSelected(
                      {
                        group,
                        due:
                          group === "En retard"
                            ? "En retard"
                            : group === "À venir"
                              ? "Demain"
                              : "Aujourd’hui",
                        dueDate,
                      },
                      { due: dueDate },
                    );
                    setActionsOpen(false);
                    toastSuccess({
                      description:
                        group === "À venir"
                          ? "Tâche reportée à demain."
                          : "Échéance mise à jour.",
                    });
                  }}
                  type="button"
                >
                  <span>
                    {group === "À venir" ? "Reporter à demain" : group}
                  </span>
                  {selected?.group === group ? (
                    <CheckIcon className="size-4 text-blue-600" />
                  ) : null}
                </button>
              ),
            )}
          </div>
        </div>
      </MobileSheet>
    </MobilePage>
  );
}

export type MobileChannelConversation = {
  id: string;
  name: string;
  subject: string;
  preview: string;
  channel: "Gmail" | "Outlook";
  unread: number;
  time: string;
  tag?: string;
  messages: Array<{
    id: string;
    author: "me" | "contact";
    body: string;
    time: string;
  }>;
};

export function MobileChannelsPreview({
  availableChannels = [],
  conversations = [],
  error = false,
  loading = false,
  onArchive,
  onCompose,
  onCreateTask,
  onMarkRead,
  onOpenConversation,
  onReply,
  onRetry,
  onTrash,
  requestedConversationId,
}: {
  availableChannels?: Array<"gmail" | "outlook">;
  conversations?: MobileChannelConversation[];
  error?: boolean;
  loading?: boolean;
  onArchive?: (id: string) => Promise<boolean>;
  onCompose?: (recipient: string, message: string) => Promise<boolean>;
  onCreateTask?: (id: string) => void;
  onMarkRead?: (id: string) => Promise<boolean>;
  onOpenConversation?: (id: string) => void;
  onReply?: (id: string, message: string) => Promise<boolean>;
  onRetry?: () => void;
  onTrash?: (id: string) => Promise<boolean>;
  requestedConversationId?: string | null;
} = {}) {
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    conversations.some(({ id }) => id === requestedConversationId)
      ? (requestedConversationId ?? null)
      : null,
  );
  const [source, setSource] = useState("Tous");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(
    () => new Set(),
  );
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    () => new Set(),
  );
  const [threadTags, setThreadTags] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      conversations.map((thread) => [
        thread.id,
        thread.tag ? [thread.tag] : [],
      ]),
    ),
  );
  const [draft, setDraft] = useState("");
  const [newRecipient, setNewRecipient] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const selected = conversations.find(({ id }) => id === selectedId) ?? null;
  const channelFilters = useMemo(() => {
    const labels = availableChannels.map((channel) =>
      channel === "gmail" ? "Gmail" : "Outlook",
    );
    return labels.length > 1 ? ["Tous", ...labels] : labels;
  }, [availableChannels]);

  useEffect(() => {
    if (
      requestedConversationId &&
      conversations.some(({ id }) => id === requestedConversationId)
    ) {
      setSelectedId(requestedConversationId);
    }
  }, [conversations, requestedConversationId]);

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return conversations.filter((thread) => {
      const matchesSource = source === "Tous" || thread.channel === source;
      const matchesQuery =
        !normalizedQuery ||
        `${thread.name} ${thread.subject} ${thread.preview}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesUnread = !activeFilters.has("Non lus") || thread.unread > 0;
      const matchesPriority = !activeFilters.has("Prioritaires");
      return matchesSource && matchesQuery && matchesUnread && matchesPriority;
    });
  }, [activeFilters, conversations, query, source]);

  const toggleThreadSelection = (id: string) => {
    setSelectedThreads((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const closeSelection = () => {
    setSelectedThreads(new Set());
    setSelectionMode(false);
  };

  const sendQuickReply = async () => {
    if (!draft.trim()) return;
    if (!selected || !onReply) return;
    const sent = await onReply(selected.id, draft.trim());
    if (!sent) return;
    setDraft("");
  };

  return (
    <MobilePage title="Canaux" subtitle="Vos échanges, au même endroit">
      <div className="px-4">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Rechercher dans les canaux"
              autoComplete="off"
              className="h-11 rounded-xl bg-muted pl-9"
              enterKeyHint="search"
              inputMode="search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher"
              spellCheck={false}
              type="search"
              value={query}
            />
          </div>
          <button
            className="mobile-touch-target grid size-11 place-items-center rounded-xl border"
            onClick={() => setFiltersOpen(true)}
            type="button"
          >
            <FilterIcon className="size-4" />
          </button>
        </div>
        <div className="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-4">
          {channelFilters.map((item) => (
            <button
              className={cn(
                "mobile-touch-target shrink-0 rounded-full border px-4 text-sm",
                source === item && "border-blue-600 bg-blue-600 text-white",
              )}
              key={item}
              onClick={() => setSource(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between pb-3 text-xs">
          <span className="text-muted-foreground">
            {visible.length} conversation{visible.length > 1 ? "s" : ""}
          </span>
          <button
            className="mobile-touch-target px-2 font-medium text-blue-600"
            onClick={() => {
              if (selectionMode) closeSelection();
              else setSelectionMode(true);
            }}
            type="button"
          >
            {selectionMode ? "Annuler" : "Sélectionner"}
          </button>
        </div>
      </div>
      <div className="mx-4 overflow-hidden rounded-2xl border bg-card">
        {visible.map((thread, index) => (
          <button
            className={cn(
              "flex min-h-[92px] w-full items-start gap-3 p-3.5 text-left active:bg-muted",
              index < visible.length - 1 && "border-b",
            )}
            data-mobile-defer
            key={thread.id}
            onClick={() => {
              if (selectionMode) toggleThreadSelection(thread.id);
              else {
                setSelectedId(thread.id);
                onOpenConversation?.(thread.id);
              }
            }}
            type="button"
          >
            {selectionMode ? (
              <span
                className={cn(
                  "mt-2 grid size-6 shrink-0 place-items-center rounded-md border",
                  selectedThreads.has(thread.id) &&
                    "border-blue-600 bg-blue-600 text-white",
                )}
              >
                {selectedThreads.has(thread.id) ? (
                  <CheckIcon className="size-4" />
                ) : null}
              </span>
            ) : null}
            <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-muted font-semibold text-xs">
              {thread.name
                .split(" ")
                .map((word) => word[0])
                .join("")}
              {thread.unread ? (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-blue-600 text-[10px] text-white ring-2 ring-background">
                  {thread.unread}
                </span>
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <strong className="truncate text-sm">{thread.name}</strong>
                <span className="shrink-0 text-muted-foreground text-xs">
                  {thread.time}
                </span>
              </span>
              <span className="mt-0.5 block truncate text-sm">
                {thread.subject}
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-muted-foreground text-xs">
                <ChannelLogo channel={thread.channel} />{" "}
                <span className="truncate">{thread.preview}</span>
              </span>
              {(threadTags[thread.id]?.length ?? 0) > 0 ? (
                <span className="mt-1.5 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px]">
                  {threadTags[thread.id]?.[0]}
                </span>
              ) : null}
              {(threadTags[thread.id]?.length ?? 0) > 1 ? (
                <span className="ml-1 text-muted-foreground text-[10px]">
                  +{(threadTags[thread.id]?.length ?? 1) - 1}
                </span>
              ) : null}
            </span>
          </button>
        ))}
        {loading ? (
          <div className="px-5 py-10 text-center text-muted-foreground text-sm">
            Chargement de vos messages…
          </div>
        ) : null}
        {error ? (
          <div className="px-5 py-10 text-center">
            <p className="font-medium text-sm">Messages indisponibles</p>
            <Button
              className="mt-3"
              onClick={onRetry}
              size="sm"
              variant="outline"
            >
              Réessayer
            </Button>
          </div>
        ) : null}
        {!loading && !error && !visible.length ? (
          <div className="px-5 py-10 text-center">
            <SearchIcon className="mx-auto size-5 text-muted-foreground" />
            <p className="mt-3 font-medium text-sm">Aucun échange trouvé</p>
            <p className="mt-1 text-muted-foreground text-xs">
              Essayez une autre recherche ou retirez un filtre.
            </p>
          </div>
        ) : null}
      </div>

      {!selectionMode ? (
        <button
          aria-label="Nouveau message"
          className="fixed bottom-[calc(var(--mobile-bottombar-height)+var(--mobile-safe-bottom)+1rem)] right-4 z-30 grid size-14 place-items-center rounded-full bg-blue-600 text-white shadow-xl lg:hidden"
          onClick={() => setComposeOpen(true)}
          type="button"
        >
          <PlusIcon className="size-6" />
        </button>
      ) : null}

      {selectionMode && selectedThreads.size ? (
        <div className="fixed inset-x-3 bottom-[calc(var(--mobile-bottombar-height)+var(--mobile-safe-bottom)+.75rem)] z-30 grid grid-cols-2 rounded-2xl border bg-background p-2 shadow-xl lg:hidden max-[239px]:grid-cols-1">
          {[
            [FolderArchiveIcon, "Archiver"],
            [MailIcon, "Marquer lu"],
          ].map(([Icon, label]) => (
            <button
              className="mobile-touch-target flex flex-col items-center justify-center gap-1 rounded-xl text-xs active:bg-muted"
              key={label as string}
              onClick={async () => {
                const action = label === "Archiver" ? onArchive : onMarkRead;
                if (!action) return;
                await Promise.all([...selectedThreads].map((id) => action(id)));
                closeSelection();
              }}
              type="button"
            >
              <Icon className="size-4" />
              {label as string}
            </button>
          ))}
        </div>
      ) : null}

      <MobileSheet
        onOpenChange={setFiltersOpen}
        open={filtersOpen}
        title="Filtres"
      >
        <div className="space-y-2">
          {["Non lus", "Prioritaires"].map((item) => (
            <button
              className="mobile-touch-target flex w-full items-center justify-between rounded-xl px-3 text-sm active:bg-muted"
              key={item}
              onClick={() =>
                setActiveFilters((current) => {
                  const next = new Set(current);
                  if (next.has(item)) next.delete(item);
                  else next.add(item);
                  return next;
                })
              }
              type="button"
            >
              {item}
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-md border",
                  activeFilters.has(item) &&
                    "border-blue-600 bg-blue-600 text-white",
                )}
              >
                {activeFilters.has(item) ? (
                  <CheckIcon className="size-3.5" />
                ) : null}
              </span>
            </button>
          ))}
        </div>
      </MobileSheet>

      <MobileFullScreenDialog
        footer={
          <div className="flex gap-2">
            <Button
              aria-label="Créer une tâche depuis cet e-mail"
              disabled={!selected}
              onClick={() => selected && onCreateTask?.(selected.id)}
              size="icon"
              variant="outline"
            >
              <ListTodoIcon className="size-4" />
            </Button>
            <Input
              aria-label="Répondre au message"
              autoCapitalize="sentences"
              autoComplete="off"
              autoCorrect="on"
              className="h-11 flex-1 rounded-xl"
              enterKeyHint="send"
              inputMode="text"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  sendQuickReply();
                }
              }}
              placeholder="Répondre…"
              spellCheck
              value={draft}
            />
            <Button
              aria-label="Envoyer"
              disabled={!draft.trim()}
              onClick={sendQuickReply}
              size="icon"
            >
              <SendHorizontalIcon className="size-4" />
            </Button>
          </div>
        }
        onOpenChange={(open) => !open && setSelectedId(null)}
        open={Boolean(selected)}
        title={selected?.name ?? "Conversation"}
      >
        {selected ? (
          <div className="flex min-h-full flex-col bg-muted/30">
            <div className="flex items-center justify-between border-b bg-background px-4 py-2">
              <span className="flex items-center gap-2 text-muted-foreground text-xs">
                <ChannelLogo channel={selected.channel} />
                {selected.channel}
              </span>
              <button
                className="mobile-touch-target px-2 text-sm"
                onClick={() => setDetailsOpen(true)}
                type="button"
              >
                Détails
              </button>
            </div>
            <div className="flex-1 space-y-3 px-4 py-6">
              {selected.messages.map((message) => (
                <div
                  className={cn(
                    "max-w-[84%] rounded-2xl p-3 text-sm shadow-sm",
                    message.author === "me"
                      ? "ml-auto rounded-br-md bg-slate-900 text-white"
                      : "rounded-bl-md bg-background",
                  )}
                  key={message.id}
                >
                  <p className="whitespace-pre-wrap">{message.body}</p>
                  <p className="mt-1 text-[10px] opacity-60">{message.time}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </MobileFullScreenDialog>
      <MobileSheet
        onOpenChange={setDetailsOpen}
        open={detailsOpen}
        title="Détails de la conversation"
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
              Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {["Relance", "Urgent", "Finance", "En attente"].map((tag) => {
                const assigned = selected
                  ? (threadTags[selected.id] ?? []).includes(tag)
                  : false;
                return (
                  <button
                    className={cn(
                      "mobile-touch-target rounded-full border px-3 text-sm",
                      assigned && "border-blue-600 bg-blue-50 text-blue-700",
                    )}
                    key={tag}
                    onClick={() => {
                      if (!selected) return;
                      setThreadTags((current) => ({
                        ...current,
                        [selected.id]: assigned
                          ? (current[selected.id] ?? []).filter(
                              (item) => item !== tag,
                            )
                          : [...(current[selected.id] ?? []), tag],
                      }));
                    }}
                    type="button"
                  >
                    {assigned ? (
                      <CheckIcon className="mr-1 inline size-3.5" />
                    ) : null}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border">
            <MobileOption
              icon={FolderArchiveIcon}
              label="Archiver"
              onClick={async () => {
                if (!selected || !onArchive) return;
                if (await onArchive(selected.id)) setSelectedId(null);
              }}
            />
            <MobileOption
              destructive
              icon={Trash2Icon}
              label="Supprimer"
              onClick={async () => {
                if (!selected || !onTrash) return;
                if (await onTrash(selected.id)) setSelectedId(null);
              }}
            />
          </div>
        </div>
      </MobileSheet>
      <MobileSheet
        footer={
          <Button
            className="w-full"
            disabled={!newRecipient.trim() || !newMessage.trim()}
            onClick={async () => {
              if (!onCompose) return;
              const sent = await onCompose(
                newRecipient.trim(),
                newMessage.trim(),
              );
              if (!sent) return;
              setComposeOpen(false);
              setNewRecipient("");
              setNewMessage("");
            }}
          >
            <SendHorizontalIcon className="size-4" /> Envoyer
          </Button>
        }
        onOpenChange={setComposeOpen}
        open={composeOpen}
        title="Nouveau message"
      >
        <div className="space-y-4">
          <div>
            <label className="font-medium text-sm" htmlFor="mobile-recipient">
              Destinataire
            </label>
            <Input
              autoCapitalize="none"
              autoComplete="email"
              className="mt-2 h-11"
              enterKeyHint="next"
              id="mobile-recipient"
              inputMode="email"
              onChange={(event) => setNewRecipient(event.target.value)}
              placeholder="Nom ou adresse"
              value={newRecipient}
            />
          </div>
          <div>
            <label className="font-medium text-sm" htmlFor="mobile-message">
              Message
            </label>
            <textarea
              autoCapitalize="sentences"
              autoComplete="off"
              autoCorrect="on"
              className="mt-2 min-h-32 w-full resize-none rounded-xl border bg-background p-3 text-base outline-none focus:ring-2 focus:ring-ring"
              enterKeyHint="enter"
              id="mobile-message"
              inputMode="text"
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder="Votre message…"
              spellCheck
              value={newMessage}
            />
          </div>
        </div>
      </MobileSheet>
    </MobilePage>
  );
}

type MobileRelationsPeriod = "7 jours" | "30 jours" | "3 mois";

export type MobileRelationContact = {
  id: string;
  name: string;
  initials: string;
  address: string;
  channel: "Gmail" | "Outlook";
  subject: string;
  time: string;
  unreadCount: number;
  conversationCount: number;
};

export type MobileRelationActivity = {
  actions: number;
  followups: number;
  messages: number;
  replies: number;
  tasks: number;
};

export function MobileRelationsPreview({
  activity = { actions: 0, followups: 0, messages: 0, replies: 0, tasks: 0 },
  contacts = [],
  error = false,
  loading = false,
  onPeriodChange,
  onRetry,
  period = "30 jours",
}: {
  activity?: MobileRelationActivity;
  contacts?: MobileRelationContact[];
  error?: boolean;
  loading?: boolean;
  onPeriodChange?: (period: MobileRelationsPeriod) => void;
  onRetry?: () => Promise<unknown> | unknown;
  period?: MobileRelationsPeriod;
} = {}) {
  const [periodOpen, setPeriodOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = contacts.find(({ id }) => id === selectedId) ?? null;

  return (
    <MobilePage
      title="Relations clients"
      subtitle="Votre activité en un coup d’œil"
    >
      <div className="flex justify-end px-4 pb-3">
        <button
          className="mobile-touch-target flex items-center gap-2 rounded-xl border px-3 text-sm"
          onClick={() => setPeriodOpen(true)}
          type="button"
        >
          <CalendarDaysIcon className="size-4" /> {period}
          <ChevronRightIcon className="size-3.5 rotate-90 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 px-4 min-[360px]:grid-cols-2">
        <MetricCard icon={Clock3Icon} label="Temps gagné" value="0 min" />
        <MetricCard icon={MailIcon} label="Valeur libérée" value="0 €" />
        <MetricCard
          icon={CheckIcon}
          label="Actions enregistrées"
          value={String(activity.actions)}
        />
        <MetricCard
          icon={MailIcon}
          label="Réponses envoyées"
          value={String(activity.replies)}
        />
      </div>

      <section className="mt-7 px-4">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-semibold">Contacts récents</h2>
            <p className="mt-1 text-muted-foreground text-xs">
              Issus de vos échanges connectés
            </p>
          </div>
          <span className="text-muted-foreground text-xs">
            {contacts.length} contact{contacts.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border bg-card">
          {loading ? (
            <p className="px-4 py-10 text-center text-muted-foreground text-sm">
              Synchronisation des contacts…
            </p>
          ) : error ? (
            <div className="px-4 py-8 text-center">
              <p className="font-medium text-sm">Contacts indisponibles</p>
              <Button
                className="mt-3"
                onClick={() => onRetry?.()}
                size="sm"
                variant="outline"
              >
                Réessayer
              </Button>
            </div>
          ) : contacts.length ? (
            contacts.map((contact, index) => (
              <button
                className={cn(
                  "flex min-h-[88px] w-full items-center gap-3 p-3 text-left active:bg-muted",
                  index < contacts.length - 1 && "border-b",
                )}
                key={contact.address}
                onClick={() => setSelectedId(contact.id)}
                type="button"
              >
                <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-muted font-medium text-xs">
                  {contact.initials}
                  {contact.unreadCount ? (
                    <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-background bg-blue-600" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm">
                    {contact.name}
                  </strong>
                  <span className="mt-0.5 block truncate text-muted-foreground text-xs">
                    {contact.subject} · {contact.time}
                  </span>
                </span>
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))
          ) : (
            <MobileEmpty
              detail="Ils apparaîtront après vos premiers échanges Gmail ou Outlook."
              icon={UserRoundIcon}
              title="Aucun contact synchronisé"
            />
          )}
        </div>
      </section>

      <section className="px-4 pb-24 pt-4">
        <div className="rounded-2xl bg-muted/60 p-4">
          <p className="font-medium text-sm">Activité réellement enregistrée</p>
          <p className="mt-1 text-muted-foreground text-xs leading-5">
            {activity.followups} relance{activity.followups > 1 ? "s" : ""} ·{" "}
            {activity.messages} nouveau{activity.messages > 1 ? "x" : ""}{" "}
            message
            {activity.messages > 1 ? "s" : ""} · {activity.tasks} tâche
            {activity.tasks > 1 ? "s" : ""} terminée
            {activity.tasks > 1 ? "s" : ""}. Le temps gagné reste à zéro tant
            qu’aucune estimation fiable n’est configurée.
          </p>
        </div>
      </section>

      <MobileSheet
        footer={
          <Button className="w-full" onClick={() => setPeriodOpen(false)}>
            Afficher la période
          </Button>
        }
        onOpenChange={setPeriodOpen}
        open={periodOpen}
        title="Choisir une période"
      >
        <div className="space-y-1">
          {(["7 jours", "30 jours", "3 mois"] as MobileRelationsPeriod[]).map(
            (option) => (
              <button
                className={cn(
                  "mobile-touch-target flex w-full items-center justify-between rounded-xl px-3 text-sm active:bg-muted",
                  period === option && "bg-muted",
                )}
                key={option}
                onClick={() => {
                  onPeriodChange?.(option);
                  setPeriodOpen(false);
                }}
                type="button"
              >
                {option}
                {period === option ? (
                  <CheckIcon className="size-4 text-blue-600" />
                ) : null}
              </button>
            ),
          )}
        </div>
      </MobileSheet>

      <MobileFullScreenDialog
        footer={
          <Button asChild className="w-full">
            <Link
              href={
                selected
                  ? `/channels-v4?conversation=${encodeURIComponent(selected.id)}`
                  : "/channels-v4"
              }
            >
              Voir l’échange
            </Link>
          </Button>
        }
        onOpenChange={(open) => !open && setSelectedId(null)}
        open={Boolean(selected)}
        title={selected?.name ?? "Relation client"}
      >
        {selected ? (
          <div className="space-y-6 px-5 py-6">
            <div className="flex items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-muted font-semibold text-sm">
                {selected.initials}
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-xl">
                  {selected.name}
                </h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  {selected.address} · {selected.channel}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="font-medium text-sm">Dernier échange</p>
              <p className="mt-1 text-muted-foreground text-sm leading-5">
                {selected.subject}
              </p>
              <p className="mt-4 text-muted-foreground text-sm">
                {selected.time}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
              <MetricCard
                icon={MailIcon}
                label="Conversations"
                value={String(selected.conversationCount)}
              />
              <MetricCard
                icon={Clock3Icon}
                label="Non lus"
                value={String(selected.unreadCount)}
              />
            </div>
          </div>
        ) : null}
      </MobileFullScreenDialog>
    </MobilePage>
  );
}

export function MobileCleanupPreview({
  mode,
}: {
  mode: "unsubscribe" | "archive";
}) {
  return mode === "unsubscribe" ? (
    <MobileUnsubscribePreview />
  ) : (
    <MobileArchivePreview />
  );
}

type MobileSenderCategory = "Marketing" | "Réseaux" | "Outils";
type MobileSenderFilter = "Tous" | MobileSenderCategory;
type MobileSenderSort = "Volume" | "Fréquence" | "Nom";

type MobileSender = {
  id: string;
  name: string;
  detail: string;
  monthly: number;
  readRate: number;
  frequency: string;
  category: MobileSenderCategory;
  removed: boolean;
};

const initialMobileSenders: MobileSender[] = [
  {
    id: "acquire",
    name: "Acquire Notifications",
    detail: "Nouveautés produit",
    monthly: 265,
    readRate: 0,
    frequency: "Tous les jours",
    category: "Outils",
    removed: false,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    detail: "Actualités du réseau",
    monthly: 63,
    readRate: 1,
    frequency: "3 fois par semaine",
    category: "Réseaux",
    removed: false,
  },
  {
    id: "systeme",
    name: "Systeme.io",
    detail: "Conseils marketing",
    monthly: 59,
    readRate: 0,
    frequency: "2 fois par semaine",
    category: "Marketing",
    removed: false,
  },
  {
    id: "product-hunt",
    name: "Product Hunt",
    detail: "Produits du jour",
    monthly: 31,
    readRate: 6,
    frequency: "Tous les jours",
    category: "Outils",
    removed: false,
  },
  {
    id: "growth",
    name: "Growth Weekly",
    detail: "Sélection hebdomadaire",
    monthly: 8,
    readRate: 12,
    frequency: "Chaque semaine",
    category: "Marketing",
    removed: true,
  },
];

function MobileUnsubscribePreview() {
  const [senders, setSenders] = useState<MobileSender[]>(initialMobileSenders);
  const [tab, setTab] = useState<"active" | "removed">("active");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filter, setFilter] = useState<MobileSenderFilter>("Tous");
  const [sort, setSort] = useState<MobileSenderSort>("Volume");
  const [protectImportant, setProtectImportant] = useState(true);

  const activeSenders = senders.filter(({ removed }) => !removed);
  const removedSenders = senders.filter(({ removed }) => removed);
  const monthlyVolume = activeSenders.reduce(
    (total, sender) => total + sender.monthly,
    0,
  );
  const visibleSenders = useMemo(() => {
    const source = tab === "active" ? activeSenders : removedSenders;
    return source
      .filter((sender) => filter === "Tous" || sender.category === filter)
      .sort((first, second) => {
        if (sort === "Nom") return first.name.localeCompare(second.name, "fr");
        if (sort === "Fréquence") return first.readRate - second.readRate;
        return second.monthly - first.monthly;
      });
  }, [activeSenders, filter, removedSenders, sort, tab]);

  const toggleSelected = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setActiveTab = (nextTab: "active" | "removed") => {
    setTab(nextTab);
    setSelected(new Set());
  };

  return (
    <MobilePage
      title="Désabonnement"
      subtitle="Gardez seulement ce que vous lisez"
    >
      <section className="px-4">
        <div className="rounded-2xl bg-slate-950 p-4 text-white">
          <p className="text-white/65 text-xs">À nettoyer chaque mois</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <strong className="font-semibold text-3xl tracking-tight">
              {monthlyVolume} emails
            </strong>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">
              ≈ {Math.max(1, Math.round(monthlyVolume / 60))} h évitées
            </span>
          </div>
          <p className="mt-3 text-white/65 text-xs leading-5">
            {activeSenders.length} expéditeurs rarement consultés détectés.
          </p>
        </div>
      </section>

      <div className="mt-5 flex items-center gap-2 px-4">
        <div className="grid min-w-0 flex-1 grid-cols-2 rounded-xl bg-muted p-1">
          <button
            className={cn(
              "mobile-touch-target rounded-lg px-2 text-sm",
              tab === "active" && "bg-background font-medium shadow-sm",
            )}
            onClick={() => setActiveTab("active")}
            type="button"
          >
            À nettoyer · {activeSenders.length}
          </button>
          <button
            className={cn(
              "mobile-touch-target rounded-lg px-2 text-sm",
              tab === "removed" && "bg-background font-medium shadow-sm",
            )}
            onClick={() => setActiveTab("removed")}
            type="button"
          >
            Retirés · {removedSenders.length}
          </button>
        </div>
        <button
          aria-label="Filtres"
          className={cn(
            "mobile-touch-target grid size-11 shrink-0 place-items-center rounded-xl border",
            (filter !== "Tous" || sort !== "Volume") &&
              "border-blue-600 bg-blue-50 text-blue-700",
          )}
          onClick={() => setFiltersOpen(true)}
          type="button"
        >
          <FilterIcon className="size-4" />
        </button>
        <button
          aria-label="Paramètres et historique"
          className="mobile-touch-target grid size-11 shrink-0 place-items-center rounded-xl border"
          onClick={() => setSettingsOpen(true)}
          type="button"
        >
          <Settings2Icon className="size-4" />
        </button>
      </div>

      <section className="px-4 pb-24 pt-4">
        {visibleSenders.length ? (
          <div className="overflow-hidden rounded-2xl border bg-card">
            {visibleSenders.map((sender, index) => {
              const checked = selected.has(sender.id);
              return (
                <div
                  className={cn(
                    "flex min-h-[92px] items-center gap-3 p-3",
                    index < visibleSenders.length - 1 && "border-b",
                  )}
                  data-mobile-defer
                  key={sender.id}
                >
                  {tab === "active" ? (
                    <button
                      aria-label={`${checked ? "Désélectionner" : "Sélectionner"} ${sender.name}`}
                      className={cn(
                        "mobile-touch-target grid size-11 shrink-0 place-items-center rounded-xl border",
                        checked && "border-blue-600 bg-blue-600 text-white",
                      )}
                      onClick={() => toggleSelected(sender.id)}
                      type="button"
                    >
                      {checked ? (
                        <CheckIcon className="size-4" />
                      ) : (
                        <MailIcon className="size-4 text-muted-foreground" />
                      )}
                    </button>
                  ) : (
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted">
                      <MailIcon className="size-4 text-muted-foreground" />
                    </span>
                  )}
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() =>
                      tab === "active" ? toggleSelected(sender.id) : undefined
                    }
                    type="button"
                  >
                    <strong className="block truncate text-sm">
                      {sender.name}
                    </strong>
                    <span className="mt-1 block truncate text-muted-foreground text-xs">
                      {sender.monthly} emails/mois · {sender.readRate}% lus
                    </span>
                    <span className="mt-1 block truncate text-muted-foreground text-[11px]">
                      {sender.frequency} · {sender.category}
                    </span>
                  </button>
                  {tab === "removed" ? (
                    <Button
                      onClick={() => {
                        setSenders((current) =>
                          current.map((item) =>
                            item.id === sender.id
                              ? { ...item, removed: false }
                              : item,
                          ),
                        );
                        toastSuccess({
                          description: `${sender.name} restauré.`,
                        });
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Restaurer
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <MobileEmpty
            icon={tab === "active" ? CheckIcon : ArchiveRestoreIcon}
            title={
              tab === "active" ? "Boîte déjà propre" : "Aucun élément retiré"
            }
            detail={
              tab === "active"
                ? "Aucun expéditeur ne correspond à ces filtres."
                : "Les expéditeurs désabonnés apparaîtront ici."
            }
          />
        )}
      </section>

      {selected.size ? (
        <div className="fixed inset-x-4 bottom-[calc(var(--mobile-bottombar-height)+var(--mobile-safe-bottom)+.75rem)] z-30 rounded-2xl border bg-background p-2 shadow-xl lg:hidden">
          <Button className="w-full" onClick={() => setConfirmOpen(true)}>
            Désabonner ({selected.size})
          </Button>
        </div>
      ) : null}

      <MobileSheet
        footer={
          <Button className="w-full" onClick={() => setFiltersOpen(false)}>
            Afficher les expéditeurs
          </Button>
        }
        onOpenChange={setFiltersOpen}
        open={filtersOpen}
        title="Filtrer et trier"
      >
        <div className="space-y-6">
          <div>
            <p className="mb-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
              Catégorie
            </p>
            <div className="space-y-1">
              {(
                [
                  "Tous",
                  "Marketing",
                  "Réseaux",
                  "Outils",
                ] as MobileSenderFilter[]
              ).map((option) => (
                <button
                  className={cn(
                    "mobile-touch-target flex w-full items-center justify-between rounded-xl px-3 text-sm active:bg-muted",
                    filter === option && "bg-muted",
                  )}
                  key={option}
                  onClick={() => setFilter(option)}
                  type="button"
                >
                  {option}
                  {filter === option ? (
                    <CheckIcon className="size-4 text-blue-600" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
              Trier par
            </p>
            <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-3">
              {(["Volume", "Fréquence", "Nom"] as MobileSenderSort[]).map(
                (option) => (
                  <button
                    className={cn(
                      "mobile-touch-target rounded-xl border px-2 text-sm",
                      sort === option &&
                        "border-blue-600 bg-blue-50 text-blue-700",
                    )}
                    key={option}
                    onClick={() => setSort(option)}
                    type="button"
                  >
                    {option}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </MobileSheet>

      <MobileSheet
        footer={
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
            <Button onClick={() => setConfirmOpen(false)} variant="outline">
              Annuler
            </Button>
            <Button
              onClick={() => {
                setSenders((current) =>
                  current.map((sender) =>
                    selected.has(sender.id)
                      ? { ...sender, removed: true }
                      : sender,
                  ),
                );
                const count = selected.size;
                setSelected(new Set());
                setConfirmOpen(false);
                toastSuccess({
                  description: `${count} expéditeur${count > 1 ? "s" : ""} désabonné${count > 1 ? "s" : ""}.`,
                });
              }}
            >
              Confirmer
            </Button>
          </div>
        }
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        title="Confirmer le désabonnement"
      >
        <div className="rounded-2xl bg-muted p-4">
          <p className="font-medium text-sm">
            {selected.size} expéditeur{selected.size > 1 ? "s" : ""} sélectionné
            {selected.size > 1 ? "s" : ""}
          </p>
          <p className="mt-2 text-muted-foreground text-sm leading-5">
            Leurs prochains emails ne seront plus reçus. Vous pourrez les
            restaurer depuis l’onglet Retirés.
          </p>
        </div>
      </MobileSheet>

      <MobileSheet
        onOpenChange={setSettingsOpen}
        open={settingsOpen}
        title="Paramètres et historique"
      >
        <div className="space-y-4">
          <button
            className="mobile-touch-target flex w-full items-center justify-between rounded-xl border px-3 text-left text-sm"
            onClick={() => setProtectImportant((current) => !current)}
            type="button"
          >
            <span>
              <strong className="block font-medium">
                Protéger les importants
              </strong>
              <span className="mt-0.5 block text-muted-foreground text-xs">
                Masquer les expéditeurs souvent lus
              </span>
            </span>
            <span
              className={cn(
                "grid size-6 place-items-center rounded-full border",
                protectImportant && "border-blue-600 bg-blue-600 text-white",
              )}
            >
              {protectImportant ? <CheckIcon className="size-3.5" /> : null}
            </span>
          </button>
          <div className="rounded-xl border px-3 py-4">
            <p className="font-medium text-sm">Dernière analyse</p>
            <p className="mt-1 text-muted-foreground text-xs">
              Aujourd’hui · 426 emails analysés
            </p>
          </div>
        </div>
      </MobileSheet>
    </MobilePage>
  );
}

export function MobileSettingsPreview() {
  return <MobileSettingsExperience />;
}

export function MobileOrganizationPreview({
  workspaceName,
  onRename,
}: {
  workspaceName: string;
  onRename: () => void;
}) {
  const [timezone, setTimezone] = useState("Europe/Paris");
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const [storageOpen, setStorageOpen] = useState(false);

  return (
    <MobilePage title="Mon espace" subtitle="Organisation et préférences">
      <div className="space-y-6 px-4 pb-24">
        <section>
          <h2 className="mb-2 px-1 font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
            Espace actif
          </h2>
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <Building2Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <strong className="block truncate">{workspaceName}</strong>
                <span className="text-emerald-600 text-xs">Actif</span>
              </div>
              <Button
                className="min-h-11 max-w-full shrink-0"
                onClick={onRename}
                size="sm"
                variant="outline"
              >
                Renommer
              </Button>
            </div>
            <div className="mt-4 rounded-xl bg-muted/60 px-3 py-2.5">
              <p className="text-muted-foreground text-xs leading-5">
                Votre espace personnel Freescale. Aucun autre espace n’est
                configuré pour l’instant.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
            Stockage
          </h2>
          <button
            className="mobile-touch-target w-full rounded-2xl border bg-card p-4 text-left active:bg-muted/40"
            onClick={() => setStorageOpen(true)}
            type="button"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
                <HardDriveIcon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <strong className="text-sm">496,6 Mo utilisés</strong>
                  <span className="shrink-0 text-muted-foreground text-xs">
                    sur 5 Go
                  </span>
                </span>
                <Progress className="mt-3 h-2" value={9.7} />
                <span className="mt-2 block text-muted-foreground text-xs">
                  4,5 Go disponibles
                </span>
              </span>
            </div>
          </button>
        </section>

        <section>
          <h2 className="mb-2 px-1 font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
            Préférences régionales
          </h2>
          <button
            className="mobile-touch-target flex min-h-[68px] w-full items-center gap-3 rounded-2xl border bg-card px-4 text-left active:bg-muted"
            onClick={() => setTimezoneOpen(true)}
            type="button"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
              <Clock3Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm">Fuseau horaire</strong>
              <span className="mt-0.5 block truncate text-muted-foreground text-xs">
                {timezone}
              </span>
            </span>
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </section>
      </div>

      <MobileSheet
        footer={
          <Button className="w-full" onClick={() => setTimezoneOpen(false)}>
            Enregistrer
          </Button>
        }
        onOpenChange={setTimezoneOpen}
        open={timezoneOpen}
        title="Fuseau horaire"
      >
        <div className="space-y-1">
          {[
            "Europe/Paris",
            "Europe/London",
            "America/New_York",
            "Asia/Dubai",
          ].map((option) => (
            <button
              className={cn(
                "mobile-touch-target flex w-full items-center justify-between rounded-xl px-3 text-sm active:bg-muted",
                timezone === option && "bg-muted",
              )}
              key={option}
              onClick={() => setTimezone(option)}
              type="button"
            >
              {option}
              {timezone === option ? (
                <CheckIcon className="size-4 text-blue-600" />
              ) : null}
            </button>
          ))}
        </div>
      </MobileSheet>

      <MobileSheet
        onOpenChange={setStorageOpen}
        open={storageOpen}
        title="Utilisation du stockage"
      >
        <div className="space-y-3">
          {[
            ["Documents et pièces jointes", "307,6 Mo"],
            ["Archives", "189 Mo"],
            ["Contextes Mue", "0 Mo"],
          ].map(([label, value]) => (
            <div
              className="flex min-h-[58px] items-center justify-between gap-4 rounded-xl border px-3 text-sm"
              key={label}
            >
              <span>{label}</span>
              <strong className="shrink-0 font-medium">{value}</strong>
            </div>
          ))}
          <Link
            className="mobile-touch-target flex w-full items-center justify-between rounded-xl border px-3 text-sm"
            href="/bulk-archive"
          >
            Gérer mes archives
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          </Link>
        </div>
      </MobileSheet>
    </MobilePage>
  );
}

export function MobileDrivePreview() {
  return (
    <MobilePage title="Documents" subtitle="496,6 Mo utilisés">
      <div className="flex gap-2 px-4 pb-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Rechercher un document"
            autoComplete="off"
            className="h-11 rounded-xl pl-9"
            enterKeyHint="search"
            inputMode="search"
            placeholder="Rechercher"
            spellCheck={false}
            type="search"
          />
        </div>
        <button
          className="mobile-touch-target grid size-11 place-items-center rounded-xl border"
          type="button"
        >
          <FilterIcon className="size-4" />
        </button>
      </div>
      <div className="mx-4 overflow-hidden rounded-2xl border bg-card">
        {[
          "Facture_2026-084.pdf",
          "Compte-rendu-atelier.pdf",
          "Proposition-Northstar.pdf",
        ].map((file, index) => (
          <button
            className={cn(
              "flex min-h-[68px] w-full items-center gap-3 p-3 text-left",
              index < 2 && "border-b",
            )}
            key={file}
            type="button"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-muted">
              <FileTextIcon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm">{file}</strong>
              <span className="text-muted-foreground text-xs">
                PDF · {index + 1},2 Mo
              </span>
            </span>
            <MoreHorizontalIcon className="size-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </MobilePage>
  );
}

export function MobilePage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="min-h-[calc(100dvh-var(--mobile-topbar-height)-var(--mobile-bottombar-height))] scroll-mt-[calc(var(--mobile-safe-top)+var(--mobile-topbar-height))] bg-background pb-8 lg:hidden"
      id="mobile-main-content"
      tabIndex={-1}
    >
      <header className="px-4 pb-5 pt-6">
        <h1 className="font-semibold text-3xl tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-muted-foreground text-sm">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function MobileEmpty({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof CheckIcon;
  title: string;
  detail: string;
}) {
  return (
    <MobileEmptyState
      description={detail}
      icon={<Icon className="size-5" />}
      title={title}
    />
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3Icon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
        <Icon className="size-4" />
      </span>
      <p className="mt-5 font-semibold text-2xl">{value}</p>
      <p className="mt-1 text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

function MobileOption({
  icon: Icon,
  label,
  onClick,
  value,
  destructive = false,
}: {
  icon: typeof TagIcon;
  label: string;
  onClick?: () => void | Promise<void>;
  value?: string;
  destructive?: boolean;
}) {
  return (
    <button
      className={cn(
        "mobile-touch-target flex min-h-[58px] w-full items-center gap-3 border-b px-3 text-left text-sm last:border-b-0",
        destructive && "text-destructive",
      )}
      onClick={onClick}
      type="button"
    >
      <Icon className="size-4" />
      <span className="min-w-0 flex-1">{label}</span>
      {value ? (
        <span className="max-w-[55%] truncate text-muted-foreground text-xs">
          {value}
        </span>
      ) : null}
      <ChevronRightIcon className="size-4 text-muted-foreground" />
    </button>
  );
}

function ChannelLogo({ channel }: { channel: string }) {
  if (channel === "WhatsApp") return <WhatsAppIcon className="size-3.5" />;
  if (channel === "Outlook") return <Outlook className="size-3.5" />;
  return <Gmail className="size-3.5" />;
}
