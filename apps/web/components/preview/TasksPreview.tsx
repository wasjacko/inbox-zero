"use client";

import {
  ArrowDownUpIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
  Clock3Icon,
  Columns3Icon,
  FilterIcon,
  ListIcon,
  MessageSquareTextIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { toastSuccess } from "@/components/Toast";
import { WhatsAppIcon } from "@/components/BrandIcons";
import { Gmail } from "@/components/new-landing/icons/Gmail";
import { MueIcon } from "@/components/MueIcon";
import { Outlook } from "@/components/new-landing/icons/Outlook";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/utils";
import { usePreviewSetupProgress } from "@/hooks/usePreviewSetupProgress";

export type TaskStatus = "scope" | "todo" | "progress" | "waiting" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type TaskSource = "ai" | "manual";
export type QuickActionChange = "new" | "updated" | "closable";
export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  due: string;
  priority: TaskPriority;
  source: TaskSource;
  assignees: string[];
  context?: string;
  contact?: {
    name: string;
    avatarPosition: string;
  };
};

type MueTaskEventDetail = Array<{
  id: string;
  title: string;
  status: "scope" | "todo" | "waiting";
  due: string;
}>;

type MueWorkflowProjection = {
  state: "running" | "revealing" | "review" | "editing";
  tasks: MueTaskEventDetail;
  revealedTaskCount: number;
};

type ProjectedMueTask = MueTaskEventDetail[number] & { revealed: boolean };
type PendingTaskMove = { id: string; status: TaskStatus };

export const TASKS_TODAY = "2026-08-17";
export const TASKS_STORAGE_KEY = "freescale-preview-tasks-v4";
const statuses: Array<{
  id: TaskStatus;
  label: string;
  toneClass: string;
}> = [
  {
    id: "scope",
    label: "À cadrer",
    toneClass:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300",
  },
  {
    id: "todo",
    label: "À faire",
    toneClass:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
  },
  {
    id: "progress",
    label: "En cours",
    toneClass:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  },
  {
    id: "waiting",
    label: "En attente client",
    toneClass:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
  },
  {
    id: "done",
    label: "Terminé",
    toneClass:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
];

export const seedTasks: Task[] = [
  {
    id: "task-1",
    title: "Cadrer le brief de la refonte de la landing page",
    status: "scope",
    due: "2026-08-20",
    priority: "low",
    source: "manual",
    assignees: [],
  },
  {
    id: "task-2",
    title: "Envoyer la V2 des maquettes à Sarah",
    status: "todo",
    due: TASKS_TODAY,
    priority: "high",
    source: "ai",
    assignees: ["WA"],
    context: "Sarah attend la V2 avant son point de 14 h",
    contact: { name: "Sarah Lemoine", avatarPosition: "50% 100%" },
  },
  {
    id: "task-3",
    title: "Préparer la déclaration trimestrielle",
    status: "todo",
    due: "2026-08-18",
    priority: "high",
    source: "manual",
    assignees: [],
  },
  {
    id: "task-4",
    title: "Mettre à jour le portfolio en ligne",
    status: "todo",
    due: "2026-08-20",
    priority: "low",
    source: "manual",
    assignees: [],
  },
  {
    id: "task-5",
    title: "Relancer Maya pour la facture de juillet",
    status: "progress",
    due: "2026-08-16",
    priority: "high",
    source: "ai",
    assignees: ["WA"],
    context: "La facture F-2048 est arrivée à échéance hier",
    contact: { name: "Maya Chen", avatarPosition: "50% 0%" },
  },
  {
    id: "task-6",
    title: "Signer et renvoyer le contrat ITWA",
    status: "progress",
    due: "2026-08-18",
    priority: "high",
    source: "ai",
    assignees: ["WA", "SA"],
    contact: { name: "Thomas Aubry", avatarPosition: "0% 0%" },
  },
  {
    id: "task-7",
    title: "Réserver le coworking pour la semaine prochaine",
    status: "progress",
    due: "2026-08-19",
    priority: "medium",
    source: "manual",
    assignees: [],
  },
  {
    id: "task-8",
    title: "Préparer la proposition commerciale pour Sophie",
    status: "progress",
    due: "2026-08-20",
    priority: "medium",
    source: "manual",
    assignees: [],
    contact: { name: "Sophie Martin", avatarPosition: "0% 0%" },
  },
  {
    id: "task-11",
    title: "Prévenir Jon que les optimisations SEO sont terminées",
    status: "progress",
    due: TASKS_TODAY,
    priority: "high",
    source: "ai",
    assignees: ["WA"],
    context: "Les corrections SEO validées ce matin peuvent être communiquées",
    contact: { name: "Jon Bell", avatarPosition: "100% 100%" },
  },
  {
    id: "task-12",
    title: "Répondre à Théo Manili sur le planning d’intégration",
    status: "todo",
    due: TASKS_TODAY,
    priority: "high",
    source: "ai",
    assignees: ["WA"],
    context: "Théo attend une confirmation sur le créneau de jeudi",
    contact: { name: "Théo Manili", avatarPosition: "50% 50%" },
  },
  {
    id: "task-9",
    title: "Faire valider le devis de Capucine",
    status: "waiting",
    due: "2026-08-15",
    priority: "medium",
    source: "ai",
    assignees: ["CA"],
    contact: { name: "Capucine Roy", avatarPosition: "0% 50%" },
  },
  {
    id: "task-10",
    title: "Livrer les wireframes V1 à Sarah",
    status: "done",
    due: "2026-06-12",
    priority: "medium",
    source: "ai",
    assignees: ["SA"],
    contact: { name: "Sarah Lemoine", avatarPosition: "50% 100%" },
  },
];

const avatarStyles: Record<string, string> = {
  WA: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  SA: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  CA: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
};

export function TasksPreview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { saveTaskAutomation } = usePreviewSetupProgress();
  const taskTutorialRequested = searchParams.get("tutorial") === "mue-tasks";
  const [tasks, setTasks] = useState<Task[]>([]);
  const [query, setQuery] = useState("");
  const [priorities, setPriorities] = useState<TaskPriority[]>([]);
  const [sort, setSort] = useState<"manual" | "due" | "priority">("manual");
  const [createOpen, setCreateOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");
  const [hydrated, setHydrated] = useState(false);
  const [mueProjection, setMueProjection] =
    useState<MueWorkflowProjection | null>(null);
  const [highlightedTaskIds, setHighlightedTaskIds] = useState<string[]>([]);
  const [pendingTaskMove, setPendingTaskMove] =
    useState<PendingTaskMove | null>(null);
  const [recentlyMovedTaskId, setRecentlyMovedTaskId] = useState<string | null>(
    null,
  );
  const [taskTutorialStep, setTaskTutorialStep] = useState<number | null>(
    taskTutorialRequested ? 1 : null,
  );
  const moveTimerRef = useRef<number | undefined>(undefined);
  const arrivalTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!taskTutorialRequested) return;

    setTaskTutorialStep((current) => current ?? 1);
    const handleMueOpened = () => setTaskTutorialStep(2);
    const handleResults = () => setTaskTutorialStep(3);
    const handleComplete = () => {
      saveTaskAutomation({
        enabled: true,
        requireApproval: true,
        rules: ["request", "commitment", "deadline"],
      });
      setTaskTutorialStep(4);
    };

    window.addEventListener(
      "freescale:task-tutorial-mue-opened",
      handleMueOpened,
    );
    window.addEventListener("freescale:task-tutorial-results", handleResults);
    window.addEventListener("freescale:task-tutorial-complete", handleComplete);
    return () => {
      window.removeEventListener(
        "freescale:task-tutorial-mue-opened",
        handleMueOpened,
      );
      window.removeEventListener(
        "freescale:task-tutorial-results",
        handleResults,
      );
      window.removeEventListener(
        "freescale:task-tutorial-complete",
        handleComplete,
      );
    };
  }, [saveTaskAutomation, taskTutorialRequested]);

  useEffect(() => {
    if (taskTutorialStep === null) return;
    window.dispatchEvent(
      new CustomEvent("freescale:task-tutorial-step", {
        detail: taskTutorialStep,
      }),
    );
  }, [taskTutorialStep]);

  useEffect(() => {
    if (taskTutorialRequested) {
      window.localStorage.setItem(TASKS_STORAGE_KEY, "[]");
      setTasks([]);
      setHydrated(true);
      return;
    }

    const saved = window.localStorage.getItem(TASKS_STORAGE_KEY);
    if (saved) {
      try {
        const savedTasks = JSON.parse(saved) as Task[];
        setTasks(savedTasks);
      } catch {
        window.localStorage.removeItem(TASKS_STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, [taskTutorialRequested]);

  useEffect(() => {
    if (hydrated)
      window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [hydrated, tasks]);

  useEffect(() => {
    let highlightTimer: number | undefined;

    const handleMueTasks = (event: Event) => {
      const suggestions = (event as CustomEvent<MueTaskEventDetail>).detail;
      const dueDates: Record<string, string> = {
        "Aujourd’hui": TASKS_TODAY,
        Demain: "2026-08-18",
        "20 août": "2026-08-20",
        "Cette semaine": "2026-08-21",
      };

      setTasks((current) => {
        const existingIds = new Set(current.map((task) => task.id));
        const additions: Task[] = suggestions
          .filter((task) => !existingIds.has(task.id))
          .map((task) => ({
            id: task.id,
            title: task.title,
            status: task.status,
            due: dueDates[task.due] ?? TASKS_TODAY,
            priority: "medium",
            source: "ai",
            assignees: [],
          }));
        return [...additions, ...current];
      });
      const createdIds = new Set(suggestions.map((task) => task.id));
      setMueProjection((current) => {
        if (!current) return null;
        const remainingTasks = current.tasks.filter(
          (task) => !createdIds.has(task.id),
        );
        if (remainingTasks.length === 0) return null;
        const remainingRevealedCount = current.tasks
          .slice(0, current.revealedTaskCount)
          .filter((task) => !createdIds.has(task.id)).length;
        return {
          ...current,
          tasks: remainingTasks,
          revealedTaskCount: remainingRevealedCount,
        };
      });
      setHighlightedTaskIds(suggestions.map((task) => task.id));
      window.clearTimeout(highlightTimer);
      highlightTimer = window.setTimeout(() => setHighlightedTaskIds([]), 4200);
    };

    const handleMueWorkflow = (event: Event) => {
      const detail = (
        event as CustomEvent<
          | MueWorkflowProjection
          | { state: "idle" | "created"; tasks: MueTaskEventDetail }
        >
      ).detail;

      if (
        detail.state === "idle" ||
        detail.state === "created" ||
        detail.state === "running"
      ) {
        setMueProjection(null);
        return;
      }
      if ("revealedTaskCount" in detail) setMueProjection(detail);
    };

    window.addEventListener("freescale:create-mue-tasks", handleMueTasks);
    window.addEventListener(
      "freescale:mue-task-workflow-state",
      handleMueWorkflow,
    );
    return () => {
      window.removeEventListener("freescale:create-mue-tasks", handleMueTasks);
      window.removeEventListener(
        "freescale:mue-task-workflow-state",
        handleMueWorkflow,
      );
      window.clearTimeout(highlightTimer);
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("view") === "calendar") router.replace("/tasks");
  }, [router, searchParams]);

  useEffect(
    () => () => {
      window.clearTimeout(moveTimerRef.current);
      window.clearTimeout(arrivalTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    const focusedTaskId = searchParams.get("focus");
    if (!focusedTaskId) return;

    setHighlightedTaskIds([focusedTaskId]);
    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(`task-${focusedTaskId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const timer = window.setTimeout(() => setHighlightedTaskIds([]), 5000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [searchParams]);

  const visibleTasks = useMemo(() => {
    const order: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
    return tasks
      .filter((task) =>
        task.title
          .toLocaleLowerCase("fr")
          .includes(query.toLocaleLowerCase("fr")),
      )
      .filter(
        (task) => priorities.length === 0 || priorities.includes(task.priority),
      )
      .sort((a, b) => {
        if (sort === "due") return a.due.localeCompare(b.due);
        if (sort === "priority") return order[a.priority] - order[b.priority];
        return 0;
      });
  }, [priorities, query, sort, tasks]);

  const projectedTasks = useMemo(
    () =>
      mueProjection?.tasks.map((task, index) => ({
        ...task,
        revealed: index < mueProjection.revealedTaskCount,
      })) ?? [],
    [mueProjection],
  );

  function openCreate(status: TaskStatus = "todo") {
    setDefaultStatus(status);
    setCreateOpen(true);
  }

  function addTask(task: Omit<Task, "id" | "assignees">) {
    setTasks((current) => [
      ...current,
      { ...task, id: `task-${Date.now()}`, assignees: [] },
    ]);
    setCreateOpen(false);
    toastSuccess({ description: "La tâche a été ajoutée." });
  }

  function updateStatus(id: string, status: TaskStatus) {
    const currentTask = tasks.find((task) => task.id === id);
    if (!currentTask || currentTask.status === status || pendingTaskMove)
      return;

    window.clearTimeout(moveTimerRef.current);
    window.clearTimeout(arrivalTimerRef.current);
    setRecentlyMovedTaskId(null);
    setPendingTaskMove({ id, status });

    moveTimerRef.current = window.setTimeout(() => {
      setTasks((current) =>
        current.map((task) => (task.id === id ? { ...task, status } : task)),
      );
      setPendingTaskMove(null);
      setRecentlyMovedTaskId(id);
      arrivalTimerRef.current = window.setTimeout(
        () => setRecentlyMovedTaskId(null),
        1100,
      );
    }, 620);
  }

  function removeTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
    toastSuccess({ description: "La tâche a été supprimée." });
  }

  function validateProjectedTask(task: ProjectedMueTask) {
    window.dispatchEvent(
      new CustomEvent("freescale:create-mue-tasks", {
        detail: [task],
      }),
    );
    toastSuccess({ description: `« ${task.title} » a été créée.` });
  }

  return (
    <PageWrapper>
      <header className="mt-4 flex flex-col gap-4 sm:mt-8 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
        <div>
          <h1 className="font-semibold text-3xl tracking-tight">Tâches</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Organisez vos actions et gardez chaque projet en mouvement.
          </p>
        </div>
        <Button
          className="w-full shrink-0 gap-2 rounded-[13px] border border-[#5989f0] bg-gradient-to-b from-[#2965ec] to-[#5c89f8] px-4 text-white shadow-[0_2px_10px_rgba(75,131,253,0.2)] transition-[background-image,filter] duration-200 hover:from-[#255ddd] hover:to-[#4d7ced] hover:brightness-[1.03] sm:w-auto"
          onClick={() => openCreate()}
        >
          <PlusIcon className="size-4" /> Nouvelle tâche
        </Button>
      </header>

      <Tabs defaultValue="table" searchParam="view" className="mt-6 gap-4">
        <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-2.5 lg:flex-row lg:items-center lg:justify-between">
          <TabsList className="shrink-0 bg-background shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            <TabsTrigger value="table" className="gap-2">
              <ListIcon className="size-4" />
              Liste
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2">
              <Columns3Icon className="size-4" />
              Kanban
            </TabsTrigger>
          </TabsList>
          <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
            <div className="relative min-w-48 flex-1 lg:max-w-72">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher une tâche…"
                className="pl-9"
              />
            </div>
            <PriorityFilter values={priorities} onChange={setPriorities} />
            <SortMenu value={sort} onChange={setSort} />
          </div>
        </div>

        <TabsContent
          value="table"
          className={cn("mt-6 space-y-6", !hydrated && "invisible")}
        >
          {statuses.map((status) => (
            <TaskGroup
              key={status.id}
              status={status}
              tasks={visibleTasks.filter((task) => task.status === status.id)}
              projectedTasks={projectedTasks.filter(
                (task) => task.status === status.id,
              )}
              highlightedTaskIds={highlightedTaskIds}
              pendingTaskMove={pendingTaskMove}
              recentlyMovedTaskId={recentlyMovedTaskId}
              onValidateProjection={validateProjectedTask}
              onMove={updateStatus}
              onRemove={removeTask}
            />
          ))}
        </TabsContent>
        <TabsContent
          value="kanban"
          className={cn("mt-6", !hydrated && "invisible")}
        >
          <TaskKanban
            tasks={visibleTasks}
            projectedTasks={projectedTasks}
            highlightedTaskIds={highlightedTaskIds}
            onValidateProjection={validateProjectedTask}
            onAdd={openCreate}
            onMove={updateStatus}
            onRemove={removeTask}
          />
        </TabsContent>
      </Tabs>

      <CreateTaskDialog
        open={createOpen}
        defaultStatus={defaultStatus}
        onOpenChange={setCreateOpen}
        onCreate={addTask}
      />
      <TasksMueTutorial
        hasResults={projectedTasks.some((task) => task.revealed)}
        onClose={() => {
          setTaskTutorialStep(null);
          window.dispatchEvent(
            new CustomEvent("freescale:task-tutorial-step", { detail: 0 }),
          );
          router.replace("/tasks");
        }}
        step={taskTutorialStep}
      />
    </PageWrapper>
  );
}

function TasksMueTutorial({
  hasResults,
  onClose,
  step,
}: {
  hasResults: boolean;
  onClose: () => void;
  step: number | null;
}) {
  const [tutorialAnchor, setTutorialAnchor] = useState<{
    cardLeft: number;
    cardTop: number;
    pointerX: number;
    pointerY?: number;
    direction: "up" | "right";
  } | null>(null);

  useEffect(() => {
    if (step === null || step === 4) {
      setTutorialAnchor(null);
      return;
    }

    const positionFromTarget = () => {
      const selector =
        step === 1
          ? "[data-task-tutorial-mue-trigger]"
          : step === 2
            ? "[data-task-tutorial-step-two-target]"
            : null;
      const target = selector
        ? document.querySelector<HTMLElement>(selector)
        : null;
      if (!target) {
        setTutorialAnchor(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      const cardWidth = Math.min(370, window.innerWidth - 40);
      const targetCenterX = rect.left + rect.width / 2;
      const targetCenterY = rect.top + rect.height / 2;

      if (step === 1) {
        const cardLeft = Math.min(
          Math.max(20, targetCenterX - cardWidth / 2),
          window.innerWidth - cardWidth - 20,
        );
        setTutorialAnchor({
          cardLeft,
          cardTop: rect.bottom + 66,
          direction: "up",
          pointerX: Math.min(
            Math.max(34, targetCenterX - cardLeft),
            cardWidth - 34,
          ),
        });
        return;
      }

      const cardLeft = Math.max(20, rect.left - cardWidth - 58);
      const cardTop = Math.min(
        Math.max(84, targetCenterY - 92),
        window.innerHeight - 230,
      );
      setTutorialAnchor({
        cardLeft,
        cardTop,
        direction: "right",
        pointerX: cardWidth,
        pointerY: Math.min(Math.max(38, targetCenterY - cardTop), 150),
      });
    };

    const frame = window.requestAnimationFrame(positionFromTarget);
    const settleTimers = [360, 620].map((delay) =>
      window.setTimeout(positionFromTarget, delay),
    );
    let mutationSettleTimer: number | undefined;
    const observer = new MutationObserver(() => {
      positionFromTarget();
      if (mutationSettleTimer) window.clearTimeout(mutationSettleTimer);
      mutationSettleTimer = window.setTimeout(positionFromTarget, 460);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", positionFromTarget);
    return () => {
      window.cancelAnimationFrame(frame);
      settleTimers.forEach((timer) => window.clearTimeout(timer));
      if (mutationSettleTimer) window.clearTimeout(mutationSettleTimer);
      observer.disconnect();
      window.removeEventListener("resize", positionFromTarget);
    };
  }, [step]);

  if (step === null) return null;

  if (step === 4) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/20 p-4">
        <div className="relative w-full max-w-sm rounded-2xl border bg-background p-6 shadow-[0_24px_72px_-32px_rgba(15,23,42,.55)]">
          <div className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full border bg-muted/50 text-foreground">
              <CheckIcon className="size-4" />
            </span>
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
              Configuration terminée
            </p>
          </div>
          <h2 className="mt-5 font-semibold text-xl tracking-tight">
            Votre espace est prêt
          </h2>
          <p className="mt-2 text-muted-foreground text-sm leading-6">
            Freescale est maintenant configuré pour centraliser vos échanges et
            transformer les demandes utiles en actions à suivre.
          </p>
          <div className="mt-5 space-y-3 border-y py-4 text-sm">
            {[
              "Vos canaux sont connectés",
              "Le tri de vos messages est configuré",
              "Mue peut préparer vos prochaines tâches",
            ].map((item) => (
              <div className="flex items-center gap-2.5" key={item}>
                <CheckIcon className="size-3.5 shrink-0 text-muted-foreground" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <Button className="mt-5 w-full" onClick={onClose}>
            Continuer
          </Button>
        </div>
      </div>
    );
  }

  const content =
    step === 1
      ? {
          eyebrow: "Étape 1 sur 3",
          title: "Ouvrez le panneau Mue",
          description:
            "Cliquez sur Mue dans la barre du haut. Le panneau s’ouvrira avec le contexte de cette page Tâches.",
        }
      : step === 2
        ? {
            eyebrow: "Étape 2 sur 3",
            title: "Demandez la création des tâches",
            description:
              "Dans Mue, choisissez « Créer », puis « Créer mes tâches à partir des nouveaux messages ».",
          }
        : {
            eyebrow: "Étape 3 sur 3",
            title: hasResults
              ? "Vérifiez les tâches proposées"
              : "Mue analyse vos nouveaux messages",
            description: hasResults
              ? "Les propositions apparaissent aussi dans votre tableau. Vérifiez-les, puis confirmez leur création dans Mue."
              : "Regardez Mue qualifier les demandes : aucune tâche n’est créée tant que vous n’avez pas validé.",
          };

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[35] bg-slate-950/[0.12] backdrop-blur-[0.5px]" />
      <motion.aside
        animate={{ opacity: 1 }}
        className={cn(
          "fixed z-[50] w-[min(370px,calc(100vw-2.5rem))] rounded-2xl border border-blue-200/80 bg-background p-5 shadow-[0_24px_70px_-22px_rgba(15,23,42,.72)] dark:border-blue-900",
          !tutorialAnchor &&
            (step === 1
              ? "left-1/2 top-[130px] -translate-x-1/2"
              : "left-5 top-24 lg:left-auto lg:right-[476px]"),
        )}
        initial={{ opacity: 0 }}
        key={step}
        style={
          tutorialAnchor
            ? {
                left: tutorialAnchor.cardLeft,
                top: tutorialAnchor.cardTop,
              }
            : undefined
        }
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {tutorialAnchor?.direction === "up" ? (
          <div
            aria-hidden="true"
            className="absolute -top-[58px] -translate-x-1/2"
            style={{ left: tutorialAnchor.pointerX }}
          >
            <motion.svg
              animate={{ opacity: [0.58, 1, 0.58], y: [2, -2, 2] }}
              className="h-[58px] w-7 overflow-visible drop-shadow-[0_2px_4px_rgba(37,99,235,.24)]"
              fill="none"
              transition={{
                duration: 1.8,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
              }}
              viewBox="0 0 28 58"
            >
              <path
                d="M14 57V7m0 0L6.5 15M14 7l7.5 8"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                className="text-blue-600"
              />
            </motion.svg>
          </div>
        ) : tutorialAnchor?.direction === "right" ? (
          <div
            aria-hidden="true"
            className="absolute left-full -translate-y-1/2"
            style={{ top: tutorialAnchor.pointerY }}
          >
            <motion.svg
              animate={{ opacity: [0.58, 1, 0.58], x: [-2, 2, -2] }}
              className="h-7 w-[54px] overflow-visible drop-shadow-[0_2px_4px_rgba(37,99,235,.24)]"
              fill="none"
              transition={{
                duration: 1.8,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
              }}
              viewBox="0 0 54 28"
            >
              <path
                d="M1 14h46m0 0-8-7.5M47 14l-8 7.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                className="text-blue-600"
              />
            </motion.svg>
          </div>
        ) : null}
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
            {step === 3 && !hasResults ? (
              <span className="size-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            ) : (
              <MueIcon />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-blue-600 text-[10px] uppercase tracking-[0.14em]">
              {content.eyebrow}
            </p>
            <h2 className="mt-1 font-semibold text-base">{content.title}</h2>
          </div>
          <button
            aria-label="Quitter le tutoriel"
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={onClose}
            type="button"
          >
            <XIcon className="size-4" />
          </button>
        </div>
        <p className="mt-3 text-muted-foreground text-sm leading-5">
          {content.description}
        </p>
        <div className="mt-4 flex gap-1.5">
          {[1, 2, 3].map((value) => (
            <span
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                value <= step ? "bg-blue-600" : "bg-muted",
              )}
              key={value}
            />
          ))}
        </div>
      </motion.aside>
    </>
  );
}

export function MuePriorityBlock({
  tasks,
  completedTaskIds,
  onCompleteTask,
  revealedTaskCount = tasks.length,
  taskChanges,
}: {
  tasks: Task[];
  completedTaskIds: string[];
  onCompleteTask: (task: Task) => void;
  revealedTaskCount?: number;
  taskChanges?: Partial<Record<string, QuickActionChange>>;
}) {
  const totalMinutes = tasks.reduce(
    (total, task) => total + getMuePriorityMeta(task).durationMinutes,
    0,
  );

  return (
    <section className="@container/mue-priorities">
      <header className="flex flex-col gap-1 px-1 pb-3 sm:flex-row sm:items-end sm:gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-sm">Actions rapides</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            À exécuter directement depuis vos échanges, sans créer de tâche.
          </p>
        </div>
        <span className="text-[11px] text-muted-foreground sm:ml-auto">
          Environ {totalMinutes} min au total
        </span>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        {tasks.map((task, index) => {
          const meta = getMuePriorityMeta(task);
          const signal = getMuePrioritySignal(task);
          const completed = completedTaskIds.includes(task.id);
          const change = completed ? undefined : taskChanges?.[task.id];
          const revealed = index < revealedTaskCount;
          const SignalIcon =
            signal.type === "payment"
              ? Clock3Icon
              : signal.type === "ready"
                ? CheckIcon
                : MessageSquareTextIcon;

          if (!revealed) {
            return (
              <article
                className="flex min-h-[220px] min-w-0 animate-pulse flex-col rounded-xl border border-border/80 bg-background px-4 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.45)]"
                key={task.id}
              >
                <span className="h-5 w-24 rounded-md bg-muted" />
                <div className="mt-4 flex items-center gap-2.5">
                  <span className="size-9 rounded-full bg-muted" />
                  <span className="space-y-2">
                    <span className="block h-2.5 w-20 rounded bg-muted" />
                    <span className="block h-2 w-28 rounded bg-muted/70" />
                  </span>
                </div>
                <span className="mt-5 h-3 w-4/5 rounded bg-muted" />
                <span className="mt-2 h-3 w-3/5 rounded bg-muted/70" />
                <span className="mt-auto ml-auto h-9 w-28 rounded-lg bg-muted" />
              </article>
            );
          }

          return (
            <motion.article
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "relative flex min-h-[220px] min-w-0 flex-col rounded-xl border border-border/80 bg-background px-4 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.45)]",
                completed &&
                  "border-emerald-100 bg-emerald-50/20 dark:border-emerald-950 dark:bg-emerald-950/10",
              )}
              initial={{ opacity: 0, y: 12, scale: 0.985 }}
              key={task.id}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between gap-2">
                {completed ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 font-semibold text-[10px] text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <CheckIcon className="size-3" />
                    Effectuée
                  </span>
                ) : (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold text-[10px]",
                      signal.className,
                    )}
                  >
                    <SignalIcon className="size-3" />
                    {signal.label}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  {change ? (
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 font-semibold text-[9px]",
                        change === "new" &&
                          "bg-blue-50 text-blue-700 dark:bg-blue-950/35 dark:text-blue-300",
                        change === "updated" &&
                          "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
                        change === "closable" &&
                          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
                      )}
                    >
                      {change === "new"
                        ? "Nouvelle"
                        : change === "updated"
                          ? "Mise à jour"
                          : "À clôturer"}
                    </span>
                  ) : null}
                  <span className="font-medium text-[11px] text-muted-foreground tabular-nums">
                    {index + 1}
                  </span>
                </span>
              </div>

              <div className="mt-3 flex min-w-0 items-center gap-2.5">
                {task.contact ? (
                  <span
                    aria-label={`Photo de profil de ${task.contact.name}`}
                    className="size-9 shrink-0 rounded-full bg-[url('/images/avatars/freescale-contacts-grid.webp')] bg-no-repeat outline outline-1 outline-border/70 ring-2 ring-background"
                    role="img"
                    style={{
                      backgroundPosition: task.contact.avatarPosition,
                      backgroundSize: "300% 300%",
                    }}
                  />
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-foreground text-xs">
                    {task.contact?.name}
                  </span>
                  <span className="mt-0.5 flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground">
                    <TaskChannelIcon source={meta.source} />
                    <span className="truncate">
                      {meta.source.replace(/^(Gmail|Outlook|WhatsApp) · /, "")}
                    </span>
                  </span>
                </span>
              </div>

              <h3
                className={cn(
                  "mt-4 line-clamp-2 min-h-10 font-semibold text-[13px] leading-5",
                  completed && "text-muted-foreground",
                )}
              >
                {task.title}
              </h3>

              <div className="mt-auto flex justify-end border-t pt-3">
                <Button
                  aria-label={`${meta.actionLabel} — ${task.title}`}
                  className={cn(
                    "h-9 min-w-28 gap-2 rounded-lg px-4",
                    completed
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                      : "bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.2)] hover:bg-blue-700",
                  )}
                  disabled={completed}
                  onClick={() => onCompleteTask(task)}
                  size="sm"
                  variant={completed ? "outline" : "default"}
                >
                  {completed ? (
                    <>
                      <CheckIcon className="size-3.5" /> Effectué
                    </>
                  ) : (
                    <>
                      {meta.actionLabel}
                      <ArrowRightIcon className="size-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

function TaskChannelIcon({ source }: { source: string }) {
  if (source.startsWith("Gmail")) return <Gmail width="12" height="11" />;
  if (source.startsWith("Outlook")) return <Outlook width="12" height="12" />;
  if (source.startsWith("WhatsApp"))
    return <WhatsAppIcon className="size-3 shrink-0 text-emerald-500" />;
  return <MessageSquareTextIcon className="size-3 shrink-0" />;
}

function getMuePrioritySignal(task: Task) {
  const normalizedTitle = task.title.toLocaleLowerCase("fr");

  if (
    normalizedTitle.includes("facture") ||
    normalizedTitle.includes("relancer")
  ) {
    return {
      type: "payment" as const,
      label: "Facture à relancer",
      className:
        "bg-amber-50/70 text-amber-700/80 dark:bg-amber-950/30 dark:text-amber-300/85",
    };
  }

  if (normalizedTitle.includes("seo")) {
    return {
      type: "ready" as const,
      label: "Travail terminé",
      className:
        "bg-emerald-50/65 text-emerald-700/80 dark:bg-emerald-950/30 dark:text-emerald-300/85",
    };
  }

  return {
    type: "waiting" as const,
    label: "Nouveau message",
    className:
      "bg-sky-50/70 text-sky-700/80 dark:bg-sky-950/30 dark:text-sky-300/85",
  };
}

function getMuePriorityMeta(task: Task) {
  const normalizedTitle = task.title.toLocaleLowerCase("fr");
  const overdue = task.due < TASKS_TODAY;

  if (
    normalizedTitle.includes("facture") ||
    normalizedTitle.includes("relancer")
  ) {
    return {
      actionLabel: "Relancer",
      durationMinutes: 4,
      reason: task.context ?? "Une facture client attend votre relance.",
      source: "Gmail · Facture F-2048",
    };
  }

  if (normalizedTitle.includes("seo")) {
    return {
      actionLabel: "Prévenir Jon",
      durationMinutes: 2,
      reason: task.context ?? "Le travail terminé peut être communiqué.",
      source: "Outlook · Projet SEO",
    };
  }

  if (
    normalizedTitle.includes("théo") ||
    normalizedTitle.includes("répondre")
  ) {
    return {
      actionLabel: "Répondre",
      durationMinutes: 6,
      reason: task.context ?? "Un client attend votre confirmation.",
      source: "WhatsApp · Il y a 24 min",
    };
  }

  if (normalizedTitle.includes("contrat")) {
    return {
      actionLabel: "Ouvrir le contrat",
      durationMinutes: 8,
      reason:
        task.context ?? "Le document attend votre validation avant envoi.",
      source: "Telegram · Contrat",
    };
  }

  if (
    normalizedTitle.includes("proposition") ||
    normalizedTitle.includes("devis")
  ) {
    return {
      actionLabel: "Finaliser",
      durationMinutes: 15,
      reason:
        task.context ?? "Le client attend votre retour pour pouvoir avancer.",
      source: normalizedTitle.includes("northstar")
        ? "Gmail · Northstar"
        : "Gmail · Devis",
    };
  }

  if (
    normalizedTitle.includes("envoyer") ||
    normalizedTitle.includes("sarah")
  ) {
    return {
      actionLabel: "Répondre",
      durationMinutes: 5,
      reason:
        task.context ??
        "Une réponse client est attendue avant le prochain point.",
      source: "WhatsApp · Échange client",
    };
  }

  if (normalizedTitle.includes("atlas") || normalizedTitle.includes("api")) {
    return {
      actionLabel: "Voir le blocage",
      durationMinutes: normalizedTitle.includes("api") ? 20 : 10,
      reason:
        task.context ??
        (overdue
          ? "L’échéance est dépassée et bloque la suite du projet."
          : "Ce point peut compromettre la prochaine livraison."),
      source: normalizedTitle.includes("atlas")
        ? "Outlook · Atlas"
        : "Outlook · Tableau client",
    };
  }

  return {
    actionLabel: "Avancer",
    durationMinutes: 15,
    reason:
      task.context ??
      (overdue
        ? "L’échéance est dépassée et nécessite votre attention."
        : "Échéance proche avec un impact direct sur le projet."),
    source: "Canaux · Échange client",
  };
}

function PriorityFilter({
  values,
  onChange,
}: {
  values: TaskPriority[];
  onChange: (values: TaskPriority[]) => void;
}) {
  const options: Array<{ id: TaskPriority; label: string }> = [
    { id: "high", label: "Haute" },
    { id: "medium", label: "Moyenne" },
    { id: "low", label: "Basse" },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button id="tasks-priority-filter" variant="outline" className="gap-2">
          <FilterIcon className="size-4" /> Filtrer
          {values.length > 0 && (
            <span className="rounded-sm bg-muted px-1.5 text-xs tabular-nums">
              {values.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Priorité</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.id}
            checked={values.includes(option.id)}
            onCheckedChange={(checked) =>
              onChange(
                checked
                  ? [...values, option.id]
                  : values.filter((value) => value !== option.id),
              )
            }
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortMenu({
  value,
  onChange,
}: {
  value: "manual" | "due" | "priority";
  onChange: (value: "manual" | "due" | "priority") => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id="tasks-sort-menu"
          variant="outline"
          size="icon"
          aria-label="Trier les tâches"
        >
          <ArrowDownUpIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Trier par</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onChange("manual")}>
          <Checkmark selected={value === "manual"} />
          Ordre manuel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange("due")}>
          <Checkmark selected={value === "due"} />
          Échéance
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange("priority")}>
          <Checkmark selected={value === "priority"} />
          Priorité
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Checkmark({ selected }: { selected: boolean }) {
  return <span className="w-4 text-center">{selected ? "✓" : ""}</span>;
}

function TaskGroup({
  status,
  tasks,
  projectedTasks,
  highlightedTaskIds,
  pendingTaskMove,
  recentlyMovedTaskId,
  onValidateProjection,
  onMove,
  onRemove,
}: {
  status: (typeof statuses)[number];
  tasks: Task[];
  projectedTasks: ProjectedMueTask[];
  highlightedTaskIds: string[];
  pendingTaskMove: PendingTaskMove | null;
  recentlyMovedTaskId: string | null;
  onValidateProjection: (task: ProjectedMueTask) => void;
  onMove: (id: string, status: TaskStatus) => void;
  onRemove: (id: string) => void;
}) {
  const highlightedTasks = tasks.filter((task) =>
    highlightedTaskIds.includes(task.id),
  );
  const regularTasks = tasks.filter(
    (task) => !highlightedTaskIds.includes(task.id),
  );
  const [collapsed, setCollapsed] = useState(false);
  const contentId = `task-group-${status.id}`;

  return (
    <section className="@container/task-group space-y-2.5">
      <div className="flex min-h-8 items-center gap-2 px-1">
        <h2 className="font-semibold text-sm">{status.label}</h2>
        <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-[11px] tabular-nums text-muted-foreground">
          {tasks.length}
        </span>
        {projectedTasks.length > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 font-medium text-[10px] text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
            <MueIcon size="sm" />
            {projectedTasks.some((task) => !task.revealed)
              ? `Mue prépare ${projectedTasks.length}`
              : `${projectedTasks.length} à valider`}
          </span>
        ) : null}
        <Button
          variant="ghost"
          size="iconSm"
          className="ml-auto text-muted-foreground"
          onClick={() => setCollapsed((value) => !value)}
          aria-controls={contentId}
          aria-expanded={!collapsed}
          aria-label={`${collapsed ? "Déplier" : "Plier"} ${status.label}`}
        >
          <ChevronDownIcon
            className={cn(
              "size-4 transition-transform duration-200",
              !collapsed && "rotate-180",
            )}
          />
        </Button>
      </div>
      <div
        id={contentId}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed
            ? "grid-rows-[0fr] opacity-0"
            : "grid-rows-[1fr] opacity-100",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          {tasks.length > 0 || projectedTasks.length > 0 ? (
            <div className="divide-y divide-border/70">
              {highlightedTasks.map((task) => (
                <TaskRow
                  highlighted
                  key={task.id}
                  pendingStatus={
                    pendingTaskMove?.id === task.id
                      ? pendingTaskMove.status
                      : undefined
                  }
                  recentlyMoved={recentlyMovedTaskId === task.id}
                  onMove={onMove}
                  onRemove={onRemove}
                  task={task}
                />
              ))}
              {projectedTasks.map((task, index) => (
                <MueTaskProjectionRow
                  index={index}
                  key={task.id}
                  onValidate={() => onValidateProjection(task)}
                  task={task}
                />
              ))}
              {regularTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  pendingStatus={
                    pendingTaskMove?.id === task.id
                      ? pendingTaskMove.status
                      : undefined
                  }
                  recentlyMoved={recentlyMovedTaskId === task.id}
                  onMove={onMove}
                  onRemove={onRemove}
                />
              ))}
            </div>
          ) : (
            <div aria-hidden="true" className="h-1" />
          )}
        </div>
      </div>
    </section>
  );
}

function MueTaskProjectionRow({
  index,
  task,
  onValidate,
}: {
  index: number;
  task: ProjectedMueTask;
  onValidate: () => void;
}) {
  const titleWidths = ["58%", "72%", "49%", "66%", "54%"];

  return (
    <motion.div
      animate={{
        backgroundPosition: ["180% 50%", "-80% 50%"],
        opacity: 1,
      }}
      aria-label="Emplacement d’une tâche préparée par Mue"
      className="relative overflow-hidden bg-[linear-gradient(105deg,transparent_20%,rgba(96,165,250,0.09)_38%,rgba(168,85,247,0.12)_50%,rgba(251,113,133,0.08)_62%,transparent_80%)] bg-[length:220%_100%] px-4 py-3"
      initial={{ opacity: 0, y: 5 }}
      transition={{
        backgroundPosition: {
          duration: 2.2 + index * 0.18,
          ease: "linear",
          repeat: Number.POSITIVE_INFINITY,
        },
        opacity: { duration: 0.3 },
        y: { duration: 0.3 },
      }}
    >
      <div className="flex items-center gap-3">
        <span className="relative flex size-5 shrink-0 items-center justify-center">
          <MueIcon size="sm" />
          <span className="absolute inset-0 animate-ping rounded-full border border-blue-400/25" />
        </span>
        <div className="min-w-0 flex-1">
          {task.revealed ? (
            <motion.div
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              initial={{ filter: "blur(5px)", opacity: 0, y: 4 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="truncate text-sm font-medium">{task.title}</p>
              <div className="mt-1.5 flex items-center gap-2 text-muted-foreground text-[10px]">
                <span>{task.due}</span>
                <span>·</span>
                <span>Proposée par Mue</span>
              </div>
            </motion.div>
          ) : (
            <>
              <motion.div
                animate={{ opacity: [0.45, 0.9, 0.45] }}
                className="h-3 rounded-full bg-gradient-to-r from-blue-200 via-violet-200 to-rose-200 dark:from-blue-900 dark:via-violet-900 dark:to-rose-900"
                style={{ width: titleWidths[index % titleWidths.length] }}
                transition={{
                  duration: 1.6,
                  repeat: Number.POSITIVE_INFINITY,
                }}
              />
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2.5 w-16 rounded-full bg-muted" />
                <div className="h-2.5 w-12 rounded-full bg-muted" />
              </div>
            </>
          )}
        </div>
        {task.revealed ? (
          <Button
            className="h-7 shrink-0 gap-1.5 border-blue-200 bg-blue-50 px-2.5 text-[10px] text-blue-700 shadow-sm hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
            onClick={onValidate}
            size="sm"
            variant="outline"
          >
            <CheckIcon className="size-3" /> À valider
          </Button>
        ) : (
          <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 font-medium text-[10px] text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
            Préparation IA
          </span>
        )}
      </div>
    </motion.div>
  );
}

function TaskRow({
  task,
  highlighted = false,
  pendingStatus,
  recentlyMoved = false,
  onMove,
  onRemove,
}: {
  task: Task;
  highlighted?: boolean;
  pendingStatus?: TaskStatus;
  recentlyMoved?: boolean;
  onMove: (id: string, status: TaskStatus) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      id={`task-${task.id}`}
      className={cn(
        "group relative px-4 py-3 transition-[background-color,box-shadow] duration-500 hover:bg-muted/30",
        pendingStatus &&
          "bg-blue-50/45 shadow-[inset_3px_0_0_rgba(59,130,246,0.55)] dark:bg-blue-950/20",
        recentlyMoved &&
          "bg-emerald-50/55 shadow-[inset_3px_0_0_rgba(16,185,129,0.5)] dark:bg-emerald-950/20",
        highlighted &&
          "bg-gradient-to-r from-blue-50/90 via-violet-50/60 to-rose-50/50 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.16)] dark:from-blue-950/35 dark:via-violet-950/25 dark:to-rose-950/20",
      )}
    >
      {highlighted ? (
        <>
          <motion.span
            animate={{ opacity: [0.45, 1, 0.45] }}
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 via-violet-500 to-rose-400"
            transition={{ duration: 1.4, repeat: 2, ease: "easeInOut" }}
          />
          <motion.span
            animate={{ opacity: 0, scale: 1.12 }}
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_50%,rgba(96,165,250,0.28),rgba(168,85,247,0.14)_38%,transparent_72%)]"
            initial={{ opacity: 1, scale: 0.94 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.span
            animate={{ opacity: 0, scale: 1.8, y: -10 }}
            className="pointer-events-none absolute right-5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"
            initial={{ opacity: 1, scale: 0.35, y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            <CheckIcon className="size-4" />
          </motion.span>
        </>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-[118px_minmax(200px,1fr)_130px_108px_84px_64px_32px] lg:items-center">
        <TaskStatusMenu
          task={task}
          pendingStatus={pendingStatus}
          onMove={onMove}
        />
        <p
          className={cn(
            "min-w-0 truncate font-medium text-[13px]",
            task.status === "done" && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
        <TaskPeople task={task} />
        <DueDate date={task.due} done={task.status === "done"} />
        <Priority priority={task.priority} />
        <Source source={task.source} />
        <TaskMenu task={task} onMove={onMove} onRemove={onRemove} />
      </div>
    </div>
  );
}

function TaskStatusMenu({
  task,
  pendingStatus,
  onMove,
}: {
  task: Task;
  pendingStatus?: TaskStatus;
  onMove: (id: string, status: TaskStatus) => void;
}) {
  const currentStatus = statuses.find((status) => status.id === task.status);
  if (!currentStatus) return null;
  const displayedStatus = pendingStatus
    ? statuses.find((status) => status.id === pendingStatus)
    : currentStatus;
  if (!displayedStatus) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`Modifier le statut de ${task.title}`}
          id={`task-status-menu-${task.id}`}
          disabled={Boolean(pendingStatus)}
          className={cn(
            "flex h-8 w-[118px] shrink-0 items-center justify-center rounded-lg border px-3 text-center font-medium text-xs transition-[filter,box-shadow] hover:brightness-[0.98] hover:shadow-sm disabled:cursor-wait",
            displayedStatus.toneClass,
          )}
          type="button"
        >
          <span className="flex min-w-0 items-center justify-center gap-1.5 truncate">
            {pendingStatus ? (
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                className="size-1.5 shrink-0 rounded-full bg-current"
                transition={{
                  duration: 0.75,
                  repeat: Number.POSITIVE_INFINITY,
                }}
              />
            ) : null}
            <span className="truncate">{displayedStatus.label}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {statuses.map((status) => (
          <DropdownMenuItem
            disabled={status.id === task.status}
            key={status.id}
            onClick={() => onMove(task.id, status.id)}
          >
            {status.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TaskMenu({
  task,
  onMove,
  onRemove,
}: {
  task: Task;
  onMove: (id: string, status: TaskStatus) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="iconSm"
          id={`task-actions-menu-${task.id}`}
          className="-my-1 ml-auto text-muted-foreground opacity-70 group-hover:opacity-100 lg:ml-0"
          aria-label="Actions de la tâche"
        >
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Déplacer vers</DropdownMenuLabel>
        {statuses.map((status) => (
          <DropdownMenuItem
            key={status.id}
            disabled={task.status === status.id}
            onClick={() => onMove(task.id, status.id)}
          >
            {status.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onClick={() => onRemove(task.id)}
        >
          <Trash2Icon className="size-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TaskKanban({
  tasks,
  projectedTasks,
  highlightedTaskIds,
  onValidateProjection,
  onAdd,
  onMove,
  onRemove,
}: {
  tasks: Task[];
  projectedTasks: ProjectedMueTask[];
  highlightedTaskIds: string[];
  onValidateProjection: (task: ProjectedMueTask) => void;
  onAdd: (status: TaskStatus) => void;
  onMove: (id: string, status: TaskStatus) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-3">
      <div className="grid min-w-[920px] grid-cols-5 gap-2.5">
        {statuses.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status.id);
          const highlightedColumnTasks = columnTasks.filter((task) =>
            highlightedTaskIds.includes(task.id),
          );
          const regularColumnTasks = columnTasks.filter(
            (task) => !highlightedTaskIds.includes(task.id),
          );
          const columnProjections = projectedTasks.filter(
            (task) => task.status === status.id,
          );
          const statusDotClass = {
            scope: "bg-violet-500",
            todo: "bg-blue-500",
            progress: "bg-amber-500",
            waiting: "bg-sky-500",
            done: "bg-emerald-500",
          }[status.id];
          return (
            <section
              key={status.id}
              className={cn(
                "flex min-h-[390px] min-w-0 flex-col rounded-xl bg-slate-50/75 p-2 dark:bg-slate-900/35",
                columnProjections.length > 0 &&
                  "ring-1 ring-blue-300/70 dark:ring-blue-800/70",
              )}
            >
              <div className="flex min-h-9 items-center gap-2 px-1 pb-2">
                <span
                  aria-hidden="true"
                  className={cn("size-2 rounded-full", statusDotClass)}
                />
                <h2 className="min-w-0 truncate font-semibold text-xs">
                  {status.label}
                </h2>
                <span className="ml-auto rounded-md bg-background px-1.5 py-0.5 font-medium text-[10px] tabular-nums text-muted-foreground shadow-sm ring-1 ring-border/60">
                  {columnTasks.length}
                </span>
                <Button
                  aria-label={`Ajouter une tâche dans ${status.label}`}
                  className="size-6 shrink-0 rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
                  onClick={() => onAdd(status.id)}
                  size="iconSm"
                  variant="ghost"
                >
                  <PlusIcon className="size-3.5" />
                </Button>
              </div>
              <div className="space-y-2">
                {highlightedColumnTasks.map((task) => (
                  <TaskKanbanCard
                    highlighted
                    key={task.id}
                    onMove={onMove}
                    onRemove={onRemove}
                    task={task}
                  />
                ))}
                {columnProjections.map((task, index) => (
                  <MueTaskProjectionCard
                    index={index}
                    key={task.id}
                    onValidate={() => onValidateProjection(task)}
                    task={task}
                  />
                ))}
                {regularColumnTasks.map((task) => (
                  <TaskKanbanCard
                    key={task.id}
                    onMove={onMove}
                    onRemove={onRemove}
                    task={task}
                  />
                ))}
                {columnTasks.length === 0 && columnProjections.length === 0 ? (
                  <button
                    className="flex h-20 w-full items-center justify-center rounded-lg border border-dashed border-border/80 text-muted-foreground text-xs transition-colors hover:border-border hover:bg-background/70 hover:text-foreground"
                    onClick={() => onAdd(status.id)}
                    type="button"
                  >
                    Ajouter une tâche
                  </button>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TaskKanbanCard({
  task,
  highlighted = false,
  onMove,
  onRemove,
}: {
  task: Task;
  highlighted?: boolean;
  onMove: (id: string, status: TaskStatus) => void;
  onRemove: (id: string) => void;
}) {
  const priorityConfig = {
    low: { label: "Basse", className: "bg-slate-400" },
    medium: { label: "Moyenne", className: "bg-amber-500" },
    high: { label: "Haute", className: "bg-rose-500" },
  }[task.priority];

  return (
    <Card
      size="sm"
      className={cn(
        "group overflow-hidden rounded-xl bg-background py-0 shadow-[0_1px_2px_rgba(15,23,42,.05)] transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-slate-300 hover:shadow-[0_8px_22px_-18px_rgba(15,23,42,.45)] dark:hover:border-slate-700",
        highlighted &&
          "border-blue-300 bg-gradient-to-br from-blue-50/80 via-violet-50/50 to-rose-50/40 shadow-[0_0_0_3px_rgba(99,102,241,0.08)] dark:border-blue-800 dark:from-blue-950/30 dark:via-violet-950/20 dark:to-rose-950/15",
      )}
    >
      <CardContent className="relative overflow-hidden p-3 pl-3.5">
        <span
          aria-label={`Priorité ${priorityConfig.label.toLocaleLowerCase("fr")}`}
          className={cn(
            "absolute bottom-3 left-0 top-3 w-0.5 rounded-r-full",
            priorityConfig.className,
          )}
          role="img"
        />
        {highlighted ? (
          <motion.span
            animate={{ opacity: 0, scale: 1.25 }}
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(96,165,250,0.32),rgba(168,85,247,0.14)_42%,transparent_75%)]"
            initial={{ opacity: 1, scale: 0.88 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        ) : null}
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 text-sm font-medium leading-snug">
            {task.title}
          </p>
          <TaskMenu task={task} onMove={onMove} onRemove={onRemove} />
        </div>
        <div className="mt-3 flex min-w-0 items-center gap-2 text-[11px]">
          <DueDate date={task.due} done={task.status === "done"} />
          <span aria-hidden="true" className="text-border">
            ·
          </span>
          <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                priorityConfig.className,
              )}
            />
            <span className="truncate">{priorityConfig.label}</span>
          </span>
          {task.assignees.length > 0 ? (
            <span className="ml-auto shrink-0">
              <Assignees assignees={task.assignees} />
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function MueTaskProjectionCard({
  index,
  task,
  onValidate,
}: {
  index: number;
  task: ProjectedMueTask;
  onValidate: () => void;
}) {
  return (
    <motion.div
      animate={{
        backgroundPosition: ["180% 50%", "-80% 50%"],
        opacity: 1,
      }}
      className="overflow-hidden rounded-lg border border-blue-300/60 bg-[linear-gradient(105deg,rgba(255,255,255,.72)_20%,rgba(96,165,250,.14)_38%,rgba(168,85,247,.16)_50%,rgba(251,113,133,.11)_62%,rgba(255,255,255,.72)_80%)] bg-[length:220%_100%] p-3 dark:border-blue-800/70 dark:bg-[linear-gradient(105deg,rgba(15,23,42,.72)_20%,rgba(30,64,175,.18)_38%,rgba(91,33,182,.2)_50%,rgba(136,19,55,.16)_62%,rgba(15,23,42,.72)_80%)]"
      initial={{ opacity: 0, y: 6 }}
      transition={{
        backgroundPosition: {
          duration: 2.1 + index * 0.2,
          ease: "linear",
          repeat: Number.POSITIVE_INFINITY,
        },
        opacity: { duration: 0.3 },
        y: { duration: 0.3 },
      }}
    >
      {task.revealed ? (
        <motion.div
          animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          initial={{ filter: "blur(5px)", opacity: 0, y: 4 }}
        >
          <div className="flex items-center gap-2 text-blue-700 text-[10px] dark:text-blue-300">
            <MueIcon size="sm" /> Proposée par Mue
          </div>
          <p className="mt-2 text-sm font-medium leading-snug">{task.title}</p>
          <Button
            className="mt-3 h-7 w-full gap-1.5 border-blue-200 bg-blue-50 text-[10px] text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
            onClick={onValidate}
            size="sm"
            variant="outline"
          >
            <CheckIcon className="size-3" /> À valider
          </Button>
        </motion.div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-blue-700 text-[10px] dark:text-blue-300">
            <MueIcon size="sm" /> Préparation par Mue
          </div>
          <div className="mt-3 h-3 w-3/4 animate-pulse rounded-full bg-gradient-to-r from-blue-200 via-violet-200 to-rose-200 dark:from-blue-900 dark:via-violet-900 dark:to-rose-900" />
          <div className="mt-2 h-2.5 w-2/5 rounded-full bg-muted" />
        </>
      )}
    </motion.div>
  );
}

function Assignees({ assignees }: { assignees: string[] }) {
  if (assignees.length === 0)
    return (
      <span className="flex items-center gap-1.5 whitespace-nowrap text-muted-foreground text-xs">
        <UserRoundIcon className="size-3.5" />
        Non assignée
      </span>
    );
  return (
    <div
      className="flex -space-x-1.5"
      role="group"
      aria-label="Personnes assignées"
    >
      {assignees.map((assignee) => (
        <Avatar key={assignee} className="size-6 border-2 border-background">
          <AvatarFallback className={cn("text-[9px]", avatarStyles[assignee])}>
            {assignee}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}

function TaskPeople({ task }: { task: Task }) {
  if (!task.contact) return <Assignees assignees={task.assignees} />;

  return (
    <span className="flex min-w-0 items-center gap-2 text-muted-foreground text-xs">
      <span
        aria-label={`Photo de profil de ${task.contact.name}`}
        className="size-7 shrink-0 rounded-full bg-[url('/images/avatars/freescale-contacts-grid.webp')] bg-no-repeat ring-2 ring-background"
        role="img"
        style={{
          backgroundPosition: task.contact.avatarPosition,
          backgroundSize: "300% 300%",
        }}
      />
      <span className="truncate">{task.contact.name}</span>
    </span>
  );
}

function DueDate({ date, done }: { date: string; done: boolean }) {
  const overdue = !done && date < TASKS_TODAY;
  const label =
    date === TASKS_TODAY
      ? "Aujourd’hui"
      : date === "2026-08-18"
        ? "Demain"
        : new Intl.DateTimeFormat("fr-FR", {
            day: "numeric",
            month: "short",
          }).format(new Date(`${date}T12:00:00`));
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 whitespace-nowrap text-muted-foreground text-xs",
        overdue && "font-medium text-red-600",
      )}
    >
      <CalendarDaysIcon className="size-3.5" />
      {overdue ? `En retard · ${label}` : label}
    </span>
  );
}

function Priority({ priority }: { priority: TaskPriority }) {
  const config = {
    low: {
      label: "Basse",
      className:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    },
    medium: {
      label: "Moyenne",
      className:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    },
    high: {
      label: "Haute",
      className:
        "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    },
  }[priority];
  return (
    <span
      className={cn(
        "w-fit whitespace-nowrap rounded-md px-2 py-1 font-medium text-[10px]",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

function Source({ source }: { source: TaskSource }) {
  return source === "ai" ? (
    <span className="flex items-center gap-1.5 whitespace-nowrap text-blue-600 text-xs">
      <MueIcon size="sm" />
      Mue
    </span>
  ) : (
    <span className="whitespace-nowrap text-muted-foreground text-xs">
      Manuel
    </span>
  );
}

function CreateTaskDialog({
  open,
  defaultStatus,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  defaultStatus: TaskStatus;
  onOpenChange: (open: boolean) => void;
  onCreate: (task: Omit<Task, "id" | "assignees">) => void;
}) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [due, setDue] = useState(TASKS_TODAY);

  useEffect(() => {
    if (open) setStatus(defaultStatus);
  }, [defaultStatus, open]);

  function submit() {
    if (!title.trim()) return;
    onCreate({ title: title.trim(), status, priority, due, source: "manual" });
    setTitle("");
    setPriority("medium");
    setDue(TASKS_TODAY);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle tâche</DialogTitle>
          <DialogDescription>
            Ajoutez une action à votre espace de travail. Vous pourrez la
            déplacer à tout moment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label htmlFor="task-title">Tâche</Label>
            <Input
              id="task-title"
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
              }}
              placeholder="Ex. Envoyer le devis à Lucas"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Statut">
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as TaskStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SelectField>
            <SelectField label="Priorité">
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                </SelectContent>
              </Select>
            </SelectField>
            <div className="grid gap-2">
              <Label htmlFor="task-due">Échéance</Label>
              <Input
                id="task-due"
                type="date"
                value={due}
                onChange={(event) => setDue(event.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={!title.trim()}>
            Créer la tâche
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SelectField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
