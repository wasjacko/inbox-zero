"use client";

import Image from "next/image";
import {
  type ChangeEvent,
  type FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArchiveIcon,
  ArrowUpDownIcon,
  ArrowLeftIcon,
  BarChart3Icon,
  CalendarClockIcon,
  ChevronDownIcon,
  CheckCircle2Icon,
  CheckIcon,
  CompassIcon,
  HistoryIcon,
  Loader2Icon,
  ListTodoIcon,
  LockKeyholeIcon,
  MessagesSquareIcon,
  PaperclipIcon,
  PanelRightCloseIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  type LucideIcon,
  UsersRoundIcon,
  XIcon,
} from "lucide-react";
import { Gmail } from "@/components/new-landing/icons/Gmail";
import { Outlook } from "@/components/new-landing/icons/Outlook";
import { MueIcon } from "@/components/MueIcon";
import { MobileAppNavigation } from "@/components/mobile/MobileAppNavigation";
import { MobileGlobalSearch } from "@/components/mobile/MobileGlobalSearch";
import { Badge } from "@/components/ui/badge";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SideNav } from "@/components/SideNav";
import { SidebarRight } from "@/components/SidebarRight";
import { cn } from "@/utils";
import {
  DEFAULT_PREVIEW_WORKSPACE_NAME,
  PREVIEW_WORKSPACE_NAME_EVENT,
  PREVIEW_WORKSPACE_NAME_KEY,
} from "@/utils/preview-workspace";
import { usePreviewConnectedChannels } from "@/hooks/usePreviewConnectedChannels";
import { getAccountLinkingUrl } from "@/utils/account-linking";
import { redirectToSafeUrl } from "@/utils/redirect";
import { toastError } from "@/components/Toast";

const CrispWithNoSSR = dynamic(() => import("@/components/CrispChat"));

function ContentWrapper({
  children,
  previewMode,
}: {
  children: React.ReactNode;
  previewMode: boolean;
}) {
  const { state, isMobile } = useSidebar();
  const pathname = usePathname();
  const isAssistantRoute =
    pathname?.includes("/assistant") || pathname === "/chat";
  const isMailRoute = pathname?.includes("/mail");
  const isInboxRoute = pathname === "/inbox";
  const isRightSidebarOpen =
    !previewMode && !isAssistantRoute && state.includes("chat-sidebar");
  const isPreviewMueOpen =
    previewMode &&
    !isMobile &&
    pathname !== "/chat" &&
    state.includes("mue-panel");

  // The padding only exists to clear the fixed MobileHeader, which neither of
  // these routes renders — on mail it showed up as a blank strip above the
  // screen's own sidebar and toolbar.
  const noTopPadding = isAssistantRoute || isMailRoute || isInboxRoute;

  return (
    <div
      className={cn(
        "min-w-0 flex-1 transition-[margin,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isRightSidebarOpen && "lg:mr-[450px]",
      )}
    >
      <SidebarInset
        className={cn(
          "overflow-hidden bg-background pt-9 max-w-full",
          (noTopPadding || previewMode) && "pt-0",
          previewMode && "overflow-visible",
          // The mail page fills the viewport and scrolls its thread list
          // internally, so layout banners shrink it instead of overflowing
          (isMailRoute || isInboxRoute) && "h-svh",
        )}
      >
        {previewMode ? (
          <>
            <PreviewContextBar />
            <div
              className={cn(
                "min-h-0 min-w-0 flex-1 transition-[margin,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                "max-lg:pt-[calc(var(--mobile-safe-top)+var(--mobile-topbar-height))] max-lg:pb-[calc(var(--mobile-safe-bottom)+var(--mobile-bottombar-height))]",
                isPreviewMueOpen &&
                  "lg:mr-[400px] xl:mr-[440px] [&_[data-page-wrapper]]:xl:px-5 [&_[data-page-wrapper]]:2xl:px-8",
              )}
            >
              {children}
            </div>
          </>
        ) : (
          children
        )}
      </SidebarInset>
      {!previewMode ? (
        <Suspense>
          <CrispWithNoSSR />
        </Suspense>
      ) : null}
    </div>
  );
}

const previewDestinations = [
  {
    name: "Accueil IA",
    description: "Brief et conversations avec Mue",
    href: "/chat",
  },
  {
    name: "Canaux",
    description: "Tous vos messages centralisés",
    href: "/channels-v4",
  },
  {
    name: "Tâches",
    description: "Actions et suivis à réaliser",
    href: "/tasks",
  },
  {
    name: "Relation clients",
    description: "Santé, relances et temps gagné",
    href: "/stats",
  },
  {
    name: "Désabonnement",
    description: "Nettoyage des abonnements inutiles",
    href: "/bulk-unsubscribe",
  },
  {
    name: "Archivage",
    description: "Classement et archivage en masse",
    href: "/bulk-archive",
  },
  {
    name: "Paramètres",
    description: "Préférences de votre espace",
    href: "/settings",
  },
];

type SearchScope = "all" | "messages" | "tasks" | "clients" | "documents";

const globalSearchScopes: Array<{
  id: SearchScope;
  label: string;
  Icon: LucideIcon;
}> = [
  { id: "all", label: "Tout", Icon: SearchIcon },
  { id: "messages", label: "Messages", Icon: MessagesSquareIcon },
  { id: "tasks", label: "Tâches", Icon: ListTodoIcon },
  { id: "clients", label: "Clients", Icon: UsersRoundIcon },
  { id: "documents", label: "Documents", Icon: ArchiveIcon },
];

const globalSearchResults: Array<{
  id: string;
  title: string;
  detail: string;
  meta: string;
  scope: Exclude<SearchScope, "all">;
  href: string;
  Icon: LucideIcon;
  tone: string;
}> = [
  {
    id: "landing-feedback",
    title: "Retours sur la page d’accueil",
    detail: "Sarah Lemoine · WhatsApp",
    meta: "Il y a 12 min",
    scope: "messages",
    href: "/channels-v4",
    Icon: MessagesSquareIcon,
    tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  {
    id: "northstar-proposal",
    title: "Finaliser la proposition Northstar",
    detail: "Projet Northstar · À faire aujourd’hui",
    meta: "Tâche",
    scope: "tasks",
    href: "/tasks",
    Icon: ListTodoIcon,
    tone: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  },
  {
    id: "atlas-mobile",
    title: "Problème mobile avant le lancement Atlas",
    detail: "Alex Morgan · Slack · #product-launch",
    meta: "Il y a 1 h",
    scope: "messages",
    href: "/channels-v4",
    Icon: MessagesSquareIcon,
    tone: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  },
  {
    id: "quote-2026-047",
    title: "Devis #2026-047 — Jean-Pierre Dupont",
    detail: "Projet refonte e-commerce · PDF",
    meta: "Modifié hier",
    scope: "documents",
    href: "/drive",
    Icon: ArchiveIcon,
    tone: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  {
    id: "capucine-roy",
    title: "Capucine Roy",
    detail: "Cliente · Identité de marque · 3 échanges récents",
    meta: "Active",
    scope: "clients",
    href: "/channels-v4?conversation=capucine",
    Icon: UsersRoundIcon,
    tone: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  },
  {
    id: "contract-thomas",
    title: "Envoyer le contrat signé",
    detail: "Thomas Aubry · Projet ITWA",
    meta: "En attente",
    scope: "tasks",
    href: "/tasks",
    Icon: ListTodoIcon,
    tone: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  },
  {
    id: "invoice-june",
    title: "Factures de juin",
    detail: "Northstar, Atlas et Studio Lumen · 4 fichiers",
    meta: "Documents",
    scope: "documents",
    href: "/drive",
    Icon: ArchiveIcon,
    tone: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  },
];

const OPEN_COMMAND_CENTER_EVENT = "freescale:open-command-center";
const MUE_TASK_WORKFLOW_EVENT = "freescale:mue-task-workflow-state";
const TASK_TUTORIAL_STEP_EVENT = "freescale:task-tutorial-step";
const TASK_TUTORIAL_MUE_OPENED_EVENT = "freescale:task-tutorial-mue-opened";
const TASK_TUTORIAL_RESULTS_EVENT = "freescale:task-tutorial-results";
const TASK_TUTORIAL_COMPLETE_EVENT = "freescale:task-tutorial-complete";

function getPreviewContext(pathname: string | null) {
  return (
    previewDestinations.find(({ href }) =>
      href === "/chat" ? pathname === href : pathname?.startsWith(href),
    )?.name ?? "cette page"
  );
}

const mueContextCopy: Record<
  string,
  { title: string; description: string; prompt: string }
> = {
  Canaux: {
    title: "Comment puis-je t’aider ?",
    description:
      "Mue adapte ses suggestions aux messages et conversations visibles sur cette page.",
    prompt: "Que voulez-vous faire avec ces échanges ?",
  },
  Tâches: {
    title: "Organiser votre travail",
    description:
      "Mue s’appuie sur votre tableau actuel pour créer, retrouver et prioriser les bonnes actions.",
    prompt: "Que voulez-vous organiser dans vos tâches ?",
  },
  Clients: {
    title: "Retrouver le bon contexte client",
    description:
      "Mue adapte ses propositions aux contacts, projets et derniers échanges de vos clients.",
    prompt: "Que voulez-vous faire avec vos clients ?",
  },
  "Relation clients": {
    title: "Piloter vos relations",
    description:
      "Mue utilise les signaux, relances et données visibles pour vous aider à décider quoi traiter.",
    prompt: "Que voulez-vous analyser dans vos relations ?",
  },
  Désabonnement: {
    title: "Nettoyer sans perdre l’essentiel",
    description:
      "Mue adapte ses suggestions à vos expéditeurs et conserve les cas ambigus pour validation.",
    prompt: "Que voulez-vous nettoyer ou vérifier ?",
  },
  Archivage: {
    title: "Classer avec contrôle",
    description:
      "Mue s’appuie sur les catégories de cette page et ne modifie rien sans votre accord.",
    prompt: "Que voulez-vous archiver ou organiser ?",
  },
  Paramètres: {
    title: "Configurer votre espace",
    description:
      "Mue adapte ses suggestions aux réglages et connexions disponibles sur cette page.",
    prompt: "Que voulez-vous configurer ?",
  },
  "cette page": {
    title: "Agir dans ce contexte",
    description:
      "Mue adapte ses suggestions à ce qui est actuellement visible dans votre espace.",
    prompt: "Que voulez-vous faire sur cette page ?",
  },
};

function PreviewContextBar() {
  const pathname = usePathname();
  const currentContext = getPreviewContext(pathname);
  const isAiHome = pathname === "/chat";
  const { state, openMobile, isMobile, toggleSidebar } = useSidebar();
  const isMueOpen = isMobile
    ? openMobile.includes("mue-panel")
    : state.includes("mue-panel");
  const [taskTutorialStep, setTaskTutorialStep] = useState(0);
  const [workspaceName, setWorkspaceName] = useState(
    DEFAULT_PREVIEW_WORKSPACE_NAME,
  );
  const connectedChannels = usePreviewConnectedChannels();

  useEffect(() => {
    setWorkspaceName(
      window.localStorage.getItem(PREVIEW_WORKSPACE_NAME_KEY) ??
        DEFAULT_PREVIEW_WORKSPACE_NAME,
    );
    const handleWorkspaceName = (event: Event) =>
      setWorkspaceName((event as CustomEvent<string>).detail);
    window.addEventListener(PREVIEW_WORKSPACE_NAME_EVENT, handleWorkspaceName);
    return () =>
      window.removeEventListener(
        PREVIEW_WORKSPACE_NAME_EVENT,
        handleWorkspaceName,
      );
  }, []);

  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get("tutorial") ===
      "mue-tasks"
    ) {
      setTaskTutorialStep(1);
    }

    const handleStep = (event: Event) =>
      setTaskTutorialStep((event as CustomEvent<number>).detail);
    window.addEventListener(TASK_TUTORIAL_STEP_EVENT, handleStep);
    return () =>
      window.removeEventListener(TASK_TUTORIAL_STEP_EVENT, handleStep);
  }, []);

  useEffect(() => {
    if (taskTutorialStep !== 1 || !isMueOpen) return;
    window.dispatchEvent(new Event(TASK_TUTORIAL_MUE_OPENED_EVENT));
  }, [isMueOpen, taskTutorialStep]);

  return (
    <header className="sticky top-0 z-50 hidden h-16 w-full shrink-0 items-center gap-2 border-b border-border bg-muted/55 px-3 backdrop-blur supports-[backdrop-filter]:bg-muted/50 sm:px-5 lg:flex">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="min-w-0 gap-2 bg-background px-2.5 shadow-sm hover:bg-background sm:px-3"
              size="sm"
              variant="ghost"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-teal-600 font-semibold text-white text-xs">
                W
              </span>
              <span className="hidden max-w-40 truncate font-medium xl:inline">
                {workspaceName}
              </span>
              <ChevronDownIcon className="hidden size-3.5 shrink-0 text-muted-foreground xl:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Votre espace de travail</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-3">
              <span className="flex size-7 items-center justify-center rounded-md bg-teal-600 font-semibold text-white text-xs">
                W
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{workspaceName}</p>
                <p className="truncate text-muted-foreground text-xs">
                  Espace actuel
                </p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/organization">Gérer l’espace</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex h-10 shrink-0 items-center rounded-full border bg-background p-1 shadow-sm">
        {!isAiHome && connectedChannels?.length ? (
          <div className="group/mue relative order-2 rounded-full bg-transparent p-px transition-[background,box-shadow] duration-500 ease-out hover:bg-[linear-gradient(115deg,#60a5fa,#8b5cf6,#fb7185,#60a5fa)] hover:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]">
            {taskTutorialStep === 1 ? (
              <span className="pointer-events-none absolute -inset-2 animate-pulse rounded-full bg-blue-500/30 blur-[3px]" />
            ) : null}
            <button
              aria-expanded={isMueOpen}
              aria-label={`${isMueOpen ? "Fermer" : "Ouvrir"} Mue sur ${currentContext}`}
              data-task-tutorial-mue-trigger
              className={cn(
                "relative flex h-[30px] min-w-0 items-center gap-1.5 overflow-hidden rounded-full bg-background px-3 text-left transition-[background-color,transform] duration-300 hover:bg-background active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isMueOpen && "bg-muted/70 hover:bg-muted/70",
                taskTutorialStep === 1 &&
                  "z-50 border border-blue-300 bg-blue-50 ring-4 ring-blue-500/60 ring-offset-4 ring-offset-background shadow-[0_12px_38px_-10px_rgba(37,99,235,.95)] hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-950/70 dark:hover:bg-blue-950/70",
              )}
              onClick={() => {
                toggleSidebar(["mue-panel"]);
                if (taskTutorialStep === 1)
                  window.dispatchEvent(
                    new Event(TASK_TUTORIAL_MUE_OPENED_EVENT),
                  );
              }}
              type="button"
            >
              <span className="pointer-events-none absolute inset-y-0 -left-10 w-8 -skew-x-12 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent opacity-0 transition-[left,opacity] duration-500 group-hover/mue:left-[110%] group-hover/mue:opacity-100" />
              <MueIcon className="transition-transform duration-300 ease-out group-hover/mue:-rotate-3 group-hover/mue:scale-105" />
              <span className="hidden shrink-0 font-medium text-sm sm:inline">
                Mue
              </span>
              <span className="max-w-28 truncate text-muted-foreground text-xs lg:max-w-36">
                {currentContext}
              </span>
              <PanelRightCloseIcon
                className={cn(
                  "ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-out group-hover/mue:translate-x-0.5",
                  !isMueOpen && "rotate-180",
                )}
              />
            </button>
          </div>
        ) : null}

        <Button
          aria-label="Rechercher dans Freescale"
          className={cn(
            "order-1 h-8 shrink-0 gap-2 rounded-full px-3",
            isAiHome && "w-56 justify-start px-4 sm:w-72 lg:w-80",
          )}
          onClick={() =>
            window.dispatchEvent(new Event(OPEN_COMMAND_CENTER_EVENT))
          }
          variant="ghost"
        >
          <SearchIcon className="size-4" />
          <span className="hidden text-muted-foreground md:inline">
            Rechercher
          </span>
          <span
            className={cn(
              "hidden text-[10px] text-muted-foreground xl:inline",
              isAiHome && "ml-auto",
            )}
          >
            ⌘K
          </span>
        </Button>
      </div>

      <div className="flex min-w-0 flex-1 justify-end">
        <ConnectedChannels />
      </div>
    </header>
  );
}

type MueVerb =
  | "create"
  | "find"
  | "search"
  | "edit"
  | "analyze"
  | "prioritize"
  | "plan";

type MueProposal = {
  label: string;
  prompt?: string;
  badge?: string;
};

type MueActionPlan = Record<MueVerb, MueProposal[]>;

const mueVerbs = [
  { id: "create", label: "Créer", Icon: PlusIcon },
  { id: "find", label: "Trouver", Icon: CompassIcon },
  { id: "search", label: "Rechercher", Icon: SearchIcon },
  { id: "edit", label: "Modifier", Icon: PencilIcon },
  { id: "analyze", label: "Analyser", Icon: BarChart3Icon },
  { id: "prioritize", label: "Prioriser", Icon: ArrowUpDownIcon },
  { id: "plan", label: "Planifier", Icon: CalendarClockIcon },
] as const;

const proposals = (...items: (string | MueProposal)[]): MueProposal[] =>
  items.map((item) => (typeof item === "string" ? { label: item } : item));

const channelActionPlan: MueActionPlan = {
  create: proposals(
    { label: "Créer les tâches des nouveaux messages", badge: "8 nouveaux" },
    { label: "Créer le devis pour Lucas Martin", badge: "Message hier" },
    {
      label: "Créer la facture demandée par Sarah",
      badge: "Repéré ce matin",
    },
  ),
  find: proposals(
    { label: "Trouver les messages sans réponse", badge: "3 trouvés" },
    "Trouver les échanges sur « lancement Atlas »",
    "Trouver les pièces jointes envoyées cette semaine",
  ),
  search: proposals(
    "Rechercher une décision dans tous mes canaux",
    "Rechercher les demandes de devis récentes",
    "Rechercher les échanges sur (sujet, client ou projet)",
  ),
  edit: proposals(
    "Modifier le brouillon destiné à Sarah",
    "Modifier les étiquettes des conversations sélectionnées",
    "Modifier la priorité des messages à traiter",
  ),
  analyze: proposals(
    { label: "Analyser les nouveaux messages", badge: "8 nouveaux" },
    "Analyser le ton des échanges avec Northstar",
    "Analyser les demandes qui peuvent devenir des tâches",
  ),
  prioritize: proposals(
    "Prioriser les conversations qui attendent ma réponse",
    "Prioriser les demandes selon leur échéance",
    "Prioriser les messages des clients actifs",
  ),
  plan: proposals(
    "Planifier mes réponses pour aujourd’hui",
    "Planifier une relance pour Lucas Martin",
    "Planifier les suivis détectés dans mes messages",
  ),
};

const mueActionPlans: Record<string, MueActionPlan> = {
  Canaux: channelActionPlan,
  Tâches: {
    create: proposals(
      {
        label: "Créer mes tâches à partir des nouveaux messages",
        badge: "15 nouveaux",
      },
      "Créer une tâche depuis un message client",
    ),
    find: proposals(
      { label: "Trouver mes tâches en retard", badge: "2 tâches" },
      "Trouver les tâches bloquées",
      "Trouver les tâches qui me sont assignées",
    ),
    search: proposals(
      "Rechercher une tâche par projet",
      "Rechercher une tâche par client",
      "Rechercher dans mes tâches (mot-clé)",
    ),
    edit: proposals(
      "Modifier les échéances de cette semaine",
      "Modifier le statut des tâches sélectionnées",
      "Modifier l’assignation d’une tâche",
    ),
    analyze: proposals(
      "Analyser ma charge de travail",
      "Analyser les risques de retard",
      "Analyser l’avancement de la semaine",
    ),
    prioritize: proposals(
      "Prioriser mes tâches du jour",
      "Prioriser selon l’impact client",
      "Prioriser selon les échéances",
    ),
    plan: proposals(
      "Planifier ma semaine",
      "Planifier mes tâches de demain",
      "Planifier deux blocs de travail profond",
    ),
  },
  Clients: {
    create: proposals(
      "Créer une note client",
      "Créer un brief avant mon prochain rendez-vous",
      "Créer une relance pour un client inactif",
    ),
    find: proposals(
      "Trouver les clients sans échange récent",
      "Trouver les fiches incomplètes",
      "Trouver le dernier échange avec (client)",
    ),
    search: proposals(
      "Rechercher un contact",
      "Rechercher un client par projet",
      "Rechercher une décision client",
    ),
    edit: proposals(
      "Modifier les informations d’un contact",
      "Modifier le projet associé à un client",
      "Modifier le statut d’une relation",
    ),
    analyze: proposals(
      "Analyser la santé de mes clients",
      "Analyser l’activité des 30 derniers jours",
      "Analyser la qualité de mes échanges",
    ),
    prioritize: proposals(
      "Prioriser mes relances clients",
      "Prioriser selon le chiffre d’affaires",
      "Prioriser les relations à risque",
    ),
    plan: proposals(
      "Planifier mes prochains points clients",
      "Planifier les relances de la semaine",
      "Planifier un suivi pour chaque projet actif",
    ),
  },
  "Relation clients": {
    create: proposals(
      "Créer une relance à partir des signaux détectés",
      "Créer un rapport de santé client",
      "Créer une tâche de suivi relationnel",
    ),
    find: proposals(
      "Trouver les clients qui attendent ma réponse",
      "Trouver les relations à risque",
      "Trouver les opportunités de suivi",
    ),
    search: proposals(
      "Rechercher l’historique d’un client",
      "Rechercher une métrique relationnelle",
      "Rechercher le temps gagné sur une période",
    ),
    edit: proposals(
      "Modifier la santé d’une relation",
      "Modifier la prochaine action client",
      "Modifier le segment d’un client",
    ),
    analyze: proposals(
      "Analyser mon temps gagné ce mois-ci",
      "Analyser la santé globale des relations",
      "Analyser mes délais de réponse",
    ),
    prioritize: proposals(
      "Prioriser les relances du jour",
      "Prioriser les situations à risque",
      "Prioriser mes clients à forte valeur",
    ),
    plan: proposals(
      "Planifier mes prochains points clients",
      "Planifier les revues de relation",
      "Planifier ma semaine relation client",
    ),
  },
  Désabonnement: {
    create: proposals(
      "Créer une sélection sûre à désabonner",
      "Créer une règle d’exclusion",
      "Créer une exception pour un expéditeur important",
    ),
    find: proposals(
      "Trouver les newsletters jamais lues",
      "Trouver les expéditeurs à fort volume",
      "Trouver les suggestions ambiguës",
    ),
    search: proposals(
      "Rechercher un expéditeur",
      "Rechercher un domaine",
      "Rechercher une newsletter par nom",
    ),
    edit: proposals(
      "Modifier ma sélection",
      "Modifier le statut d’un expéditeur",
      "Modifier les exceptions de nettoyage",
    ),
    analyze: proposals(
      "Analyser mes taux de lecture",
      "Analyser le volume reçu par expéditeur",
      "Analyser le temps que je peux économiser",
    ),
    prioritize: proposals(
      "Prioriser les expéditeurs les plus fréquents",
      "Prioriser les newsletters jamais ouvertes",
      "Prioriser les plus anciens abonnements",
    ),
    plan: proposals(
      "Planifier une revue hebdomadaire",
      "Planifier la validation de ma sélection",
      "Planifier un nettoyage par lots",
    ),
  },
  Archivage: {
    create: proposals(
      "Créer une règle d’archivage",
      "Créer une sélection à valider",
      "Créer une exception pour un expéditeur",
    ),
    find: proposals(
      "Trouver les anciens messages",
      "Trouver les catégories à fort volume",
      "Trouver les messages non classés",
    ),
    search: proposals(
      "Rechercher un expéditeur à archiver",
      "Rechercher une catégorie",
      "Rechercher par période",
    ),
    edit: proposals(
      "Modifier une catégorie",
      "Modifier une règle d’archivage",
      "Modifier les exclusions",
    ),
    analyze: proposals(
      "Analyser mes catégories",
      "Analyser ce qui peut être archivé sans risque",
      "Analyser l’impact du nettoyage",
    ),
    prioritize: proposals(
      "Prioriser les catégories volumineuses",
      "Prioriser les archives évidentes",
      "Prioriser les éléments à vérifier",
    ),
    plan: proposals(
      "Planifier un archivage par lots",
      "Planifier la vérification demain",
      "Planifier un nettoyage hebdomadaire",
    ),
  },
  Paramètres: {
    create: proposals(
      "Créer une préférence de travail",
      "Créer un modèle de réponse",
      "Créer une configuration de canal",
    ),
    find: proposals(
      "Trouver un réglage",
      "Trouver les autorisations d’un canal",
      "Trouver les éléments de configuration manquants",
    ),
    search: proposals(
      "Rechercher une option",
      "Rechercher une intégration",
      "Rechercher un réglage de sécurité",
    ),
    edit: proposals(
      "Modifier mes notifications",
      "Modifier le comportement de Mue",
      "Modifier les informations de l’espace",
    ),
    analyze: proposals(
      "Analyser ma configuration",
      "Analyser la sécurité de l’espace",
      "Analyser les sources connectées",
    ),
    prioritize: proposals(
      "Prioriser les réglages importants",
      "Prioriser les étapes d’onboarding",
      "Prioriser les contrôles de sécurité",
    ),
    plan: proposals(
      "Planifier la configuration de mon espace",
      "Planifier une revue des accès",
      "Planifier la fin de l’onboarding",
    ),
  },
};

const aiHomeActionPlan: MueActionPlan = {
  create: proposals(
    "Créer mon plan de la journée",
    "Créer une tâche depuis mon brief",
    "Créer un récapitulatif avant un rendez-vous",
  ),
  find: proposals(
    "Trouver les situations qui demandent mon attention",
    "Trouver mes messages sans réponse",
    "Trouver mes tâches en retard",
  ),
  search: proposals(
    "Rechercher dans mon workspace",
    "Rechercher un projet",
    "Rechercher un client ou une décision",
  ),
  edit: proposals(
    "Modifier mon brief du jour",
    "Modifier un brouillon préparé",
    "Modifier mes préférences Mue",
  ),
  analyze: proposals(
    "Analyser ma journée",
    "Analyser les projets à risque",
    "Analyser ma charge de travail",
  ),
  prioritize: proposals(
    "Prioriser les situations du brief",
    "Prioriser mes tâches",
    "Prioriser les clients à rappeler",
  ),
  plan: proposals(
    "Planifier ma journée",
    "Planifier ma semaine",
    "Planifier mes prochains points clients",
  ),
};

mueActionPlans["Accueil IA"] = aiHomeActionPlan;
mueActionPlans["cette page"] = aiHomeActionPlan;

type MueExchange = {
  id: number;
  question: string;
  answer: string;
};

type TaskWorkflowState =
  | "idle"
  | "running"
  | "revealing"
  | "review"
  | "editing"
  | "created";

type MueSuggestedTask = {
  id: string;
  title: string;
  contact?: string;
  source: "Gmail" | "Outlook" | "WhatsApp";
  status: "scope" | "todo" | "waiting";
  due: string;
};

const taskWorkflowSteps: Array<{
  phase: "Comprend" | "Conçoit";
  label: string;
  kind?: "message-count";
}> = [
  {
    phase: "Comprend",
    label: "Canaux retrouvés : Gmail, Outlook et WhatsApp",
  },
  {
    phase: "Comprend",
    label: "Parcours des 15 nouveaux messages",
    kind: "message-count",
  },
  {
    phase: "Comprend",
    label: "Compréhension des demandes et engagements clients",
  },
  {
    phase: "Comprend",
    label: "Association aux interlocuteurs, clients et projets",
  },
  {
    phase: "Conçoit",
    label: "Extraction des actions qui peuvent devenir des tâches",
  },
  {
    phase: "Conçoit",
    label: "Évaluation des échéances, de l’urgence et des doublons",
  },
  { phase: "Conçoit", label: "Préparation des tâches à valider" },
];

const initialMueSuggestedTasks: MueSuggestedTask[] = [
  {
    id: "mue-contract-thomas",
    title: "Envoyer le contrat signé",
    contact: "Thomas Aubry",
    source: "Gmail",
    status: "todo",
    due: "Aujourd’hui",
  },
  {
    id: "mue-quote-david",
    title: "Relancer David au sujet du devis",
    contact: "David Kim",
    source: "Outlook",
    status: "waiting",
    due: "Aujourd’hui",
  },
  {
    id: "mue-proposal-alexandre",
    title: "Préparer la proposition commerciale",
    contact: "Alexandre Dupont",
    source: "WhatsApp",
    status: "scope",
    due: "Demain",
  },
  {
    id: "mue-coworking",
    title: "Réserver le coworking pour la semaine prochaine",
    source: "Gmail",
    status: "todo",
    due: "20 août",
  },
  {
    id: "mue-portfolio",
    title: "Mettre à jour le portfolio avec les derniers projets",
    source: "Outlook",
    status: "scope",
    due: "Cette semaine",
  },
];

function getMueMockAnswer(context: string, request: string) {
  const normalizedRequest = request.toLocaleLowerCase("fr");

  if (
    normalizedRequest.includes("client") ||
    normalizedRequest.includes("relanc")
  ) {
    return "Deux relations demandent votre attention aujourd’hui : Sarah attend une confirmation sur la landing page et Northstar attend le tarif final. Je peux préparer les relances et les conserver en brouillon jusqu’à votre validation.";
  }

  if (context === "Tâches") {
    if (
      normalizedRequest.includes("retard") ||
      normalizedRequest.includes("bloqu")
    ) {
      return "J’ai repéré 2 points à traiter : la validation du devis Capucine est en retard de 2 jours et la proposition Northstar dépend encore du tarif final. Je peux préparer les deux relances, puis vous laisser les valider.";
    }
    return "Je vous conseille de commencer par la proposition Northstar, puis la réponse à Sarah. Les tâches administratives peuvent rester groupées cet après-midi. Je peux appliquer cet ordre à votre tableau après validation.";
  }

  if (context === "Canaux") {
    return "8 nouveaux messages ont été reçus. Trois attendent votre réponse : Sarah sur la landing page, Northstar sur le devis et Thomas sur le contrat. Je peux préparer des brouillons sans rien envoyer.";
  }

  if (context === "Relation clients") {
    return "La relation avec 4 clients est saine. Deux relances sont recommandées aujourd’hui et Freescale vous a déjà évité environ 3 h 40 de tri et de préparation ce mois-ci.";
  }

  if (context === "Archivage" || context === "Désabonnement") {
    return "La sélection paraît cohérente. J’ai isolé les éléments ambigus pour qu’ils restent inchangés. Vous pouvez examiner ma proposition avant de confirmer le nettoyage.";
  }

  if (context === "Clients") {
    return "Sarah et Northstar demandent une attention aujourd’hui. Les autres relations sont à jour. Je peux ouvrir leurs derniers échanges ou préparer un récapitulatif avant votre prochain point.";
  }

  return `J’ai analysé ${context}. Je peux transformer cette demande en proposition concrète, puis vous montrer précisément ce qui sera créé ou modifié avant validation.`;
}

function getMueFollowUps(context: string, request: string): [string, string] {
  const normalizedRequest = request.toLocaleLowerCase("fr");

  if (
    normalizedRequest.includes("priorit") ||
    normalizedRequest.includes("premier") ||
    normalizedRequest.includes("ordre")
  ) {
    return ["Appliquer cet ordre au tableau", "Planifier ma journée"];
  }

  if (
    normalizedRequest.includes("client") ||
    normalizedRequest.includes("relanc")
  ) {
    return ["Préparer les relances", "Afficher les échanges concernés"];
  }

  if (context === "Canaux") {
    return ["Préparer les réponses", "Résumer les messages urgents"];
  }

  if (context === "Tâches") {
    return ["Prioriser mes tâches", "Planifier ma journée"];
  }

  if (context === "Relation clients" || context === "Clients") {
    return ["Voir les clients à relancer", "Préparer mon prochain point"];
  }

  return ["Me proposer la prochaine action", "Approfondir l’analyse"];
}

function MueAssistantMessage({
  context,
  exchange,
  onFollowUp,
}: {
  context: string;
  exchange: MueExchange;
  onFollowUp: (prompt: string) => void;
}) {
  const followUps = getMueFollowUps(context, exchange.question);

  return (
    <div className="max-w-[96%] px-1">
      <div className="font-semibold text-sm">Mue</div>
      <p className="mt-2 text-sm leading-relaxed">{exchange.answer}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {followUps.map((followUp) => (
          <Button
            className="h-8 rounded-full px-3 text-xs"
            key={followUp}
            onClick={() => onFollowUp(followUp)}
            size="sm"
            variant="outline"
          >
            {followUp}
          </Button>
        ))}
      </div>
    </div>
  );
}

function PreviewMuePanel({ name }: { name: string }) {
  const pathname = usePathname();
  const currentContext = getPreviewContext(pathname);
  const { state, openMobile, isMobile, setOpen, setOpenMobile } = useSidebar();
  const isOpen = isMobile ? openMobile.includes(name) : state.includes(name);
  const [prompt, setPrompt] = useState("");
  const [exchanges, setExchanges] = useState<MueExchange[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [discussionTitle, setDiscussionTitle] = useState("Nouvelle discussion");
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [selectedVerb, setSelectedVerb] = useState<MueVerb | null>(null);
  const verbMenuRef = useRef<HTMLDivElement>(null);
  const [taskWorkflowState, setTaskWorkflowState] =
    useState<TaskWorkflowState>("idle");
  const [taskWorkflowStep, setTaskWorkflowStep] = useState(-1);
  const [revealedTaskCount, setRevealedTaskCount] = useState(0);
  const [scannedMessageCount, setScannedMessageCount] = useState(0);
  const [validatedTaskIds, setValidatedTaskIds] = useState<string[]>([]);
  const [suggestedTasks, setSuggestedTasks] = useState<MueSuggestedTask[]>(
    initialMueSuggestedTasks,
  );
  const [taskTutorialStep, setTaskTutorialStep] = useState(0);
  const actionPlan =
    mueActionPlans[currentContext] ?? mueActionPlans["cette page"];
  const contextCopy =
    mueContextCopy[currentContext] ?? mueContextCopy["cette page"];
  const selectedVerbMeta = mueVerbs.find(({ id }) => id === selectedVerb);
  const connectedChannels = usePreviewConnectedChannels();

  useEffect(() => {
    if (!selectedVerb) return;

    const closeVerbMenu = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !verbMenuRef.current?.contains(event.target)
      ) {
        setSelectedVerb(null);
      }
    };

    document.addEventListener("pointerdown", closeVerbMenu);
    return () => document.removeEventListener("pointerdown", closeVerbMenu);
  }, [selectedVerb]);

  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get("tutorial") ===
      "mue-tasks"
    ) {
      setTaskTutorialStep(1);
    }

    const handleStep = (event: Event) =>
      setTaskTutorialStep((event as CustomEvent<number>).detail);
    window.addEventListener(TASK_TUTORIAL_STEP_EVENT, handleStep);
    return () =>
      window.removeEventListener(TASK_TUTORIAL_STEP_EVENT, handleStep);
  }, []);

  const close = useCallback(() => {
    const removePanel = (panels: string[]) =>
      panels.filter((panelName) => panelName !== name);
    setOpen(removePanel);
    setOpenMobile(removePanel);
  }, [name, setOpen, setOpenMobile]);

  useEffect(() => {
    if (pathname === null) return;
    setExchanges([]);
    setPrompt("");
    setAttachedFile(null);
    setDiscussionTitle("Nouvelle discussion");
    setSelectedVerb(null);
    setTaskWorkflowState("idle");
    setTaskWorkflowStep(-1);
    setRevealedTaskCount(0);
    setScannedMessageCount(0);
    setValidatedTaskIds([]);
    setSuggestedTasks(initialMueSuggestedTasks);
  }, [pathname]);

  useEffect(() => {
    const requestedMueAction = new URLSearchParams(window.location.search).get(
      "mue",
    );
    if (!requestedMueAction || pathname === "/chat") return;

    setPrompt(requestedMueAction);
    setDiscussionTitle("Action depuis le Brief");
    const addPanel = (panels: string[]) =>
      panels.includes(name) ? panels : [...panels, name];
    setOpen(addPanel);
    setOpenMobile(addPanel);
  }, [name, pathname, setOpen, setOpenMobile]);

  useEffect(() => {
    const handlePrefillMue = (event: Event) => {
      const nextPrompt = (event as CustomEvent<string>).detail;
      if (typeof nextPrompt !== "string" || !nextPrompt.trim()) return;

      setPrompt(nextPrompt);
      setDiscussionTitle("Relation client");
      const addPanel = (panels: string[]) =>
        panels.includes(name) ? panels : [...panels, name];
      setOpen(addPanel);
      setOpenMobile(addPanel);

      window.requestAnimationFrame(() => {
        const composer = document.querySelector(
          '[aria-label="Panneau Mue"] textarea',
        );
        if (composer instanceof HTMLTextAreaElement) composer.focus();
      });
    };

    window.addEventListener("freescale:prefill-mue", handlePrefillMue);
    return () =>
      window.removeEventListener("freescale:prefill-mue", handlePrefillMue);
  }, [name, setOpen, setOpenMobile]);

  useEffect(() => {
    if (taskWorkflowState !== "running") return;

    // Deliberately irregular: counting is quick, understanding and extracting
    // actions take the majority of the simulated reasoning time.
    const tutorialActive = taskTutorialStep >= 2;
    const schedule = tutorialActive
      ? [220, 680, 1250, 2050, 2850, 3700, 4550]
      : [250, 1150, 2650, 5650, 6950, 9950, 11_650];
    const timers = schedule.map((delay, index) =>
      window.setTimeout(() => setTaskWorkflowStep(index), delay),
    );
    timers.push(
      window.setTimeout(
        () => {
          setTaskWorkflowState("revealing");
          setRevealedTaskCount(0);
        },
        tutorialActive ? 4900 : 12_650,
      ),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [taskTutorialStep, taskWorkflowState]);

  useEffect(() => {
    if (taskWorkflowState !== "running" || taskWorkflowStep !== 1) return;

    setScannedMessageCount(0);
    const messageDelays = [
      90, 160, 245, 330, 420, 505, 595, 690, 785, 890, 995, 1100, 1210, 1320,
      1430,
    ];
    const timers = messageDelays.map((delay, index) =>
      window.setTimeout(() => setScannedMessageCount(index + 1), delay),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [taskWorkflowState, taskWorkflowStep]);

  useEffect(() => {
    if (taskWorkflowState !== "revealing") return;

    const interval = window.setInterval(() => {
      setRevealedTaskCount((current) => {
        const next = Math.min(current + 1, suggestedTasks.length);
        if (next === suggestedTasks.length) {
          window.clearInterval(interval);
          window.setTimeout(() => {
            setTaskWorkflowState("review");
            setIsThinking(false);
          }, 300);
        }
        return next;
      });
    }, 420);

    return () => window.clearInterval(interval);
  }, [suggestedTasks.length, taskWorkflowState]);

  useEffect(() => {
    if (currentContext !== "Tâches") return;

    window.dispatchEvent(
      new CustomEvent(MUE_TASK_WORKFLOW_EVENT, {
        detail: {
          state: taskWorkflowState,
          tasks: suggestedTasks.filter(
            (task) => !validatedTaskIds.includes(task.id),
          ),
          revealedTaskCount: suggestedTasks
            .slice(0, revealedTaskCount)
            .filter((task) => !validatedTaskIds.includes(task.id)).length,
        },
      }),
    );
  }, [
    currentContext,
    revealedTaskCount,
    suggestedTasks,
    taskWorkflowState,
    validatedTaskIds,
  ]);

  useEffect(() => {
    const handleCreatedTasks = (event: Event) => {
      const createdTasks = (event as CustomEvent<Array<{ id: string }>>).detail;
      if (!Array.isArray(createdTasks)) return;

      setValidatedTaskIds((current) => [
        ...new Set([...current, ...createdTasks.map((task) => task.id)]),
      ]);
    };

    window.addEventListener("freescale:create-mue-tasks", handleCreatedTasks);
    return () =>
      window.removeEventListener(
        "freescale:create-mue-tasks",
        handleCreatedTasks,
      );
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [close, isOpen]);

  const askMue = (request: string) => {
    const cleanRequest = request.trim();
    if (!cleanRequest || isThinking) return;

    const normalizedRequest = cleanRequest.toLocaleLowerCase("fr");
    const startsTaskWorkflow =
      currentContext === "Tâches" &&
      normalizedRequest.includes("tâche") &&
      (normalizedRequest.includes("nouveaux messages") ||
        normalizedRequest.includes("messages reçus") ||
        normalizedRequest.includes("suggérées"));

    setPrompt("");
    setIsThinking(true);
    setSelectedVerb(null);
    if (discussionTitle === "Nouvelle discussion") {
      setDiscussionTitle(
        cleanRequest.length > 28
          ? `${cleanRequest.slice(0, 28)}…`
          : cleanRequest,
      );
    }

    if (startsTaskWorkflow) {
      setExchanges([]);
      setAttachedFile(null);
      setSuggestedTasks(initialMueSuggestedTasks);
      setTaskWorkflowStep(-1);
      setRevealedTaskCount(0);
      setScannedMessageCount(0);
      setValidatedTaskIds([]);
      setTaskWorkflowState("running");
      return;
    }

    if (taskWorkflowState !== "created") setTaskWorkflowState("idle");

    window.setTimeout(() => {
      setExchanges((current) => [
        ...current,
        {
          id: Date.now(),
          question: cleanRequest,
          answer: getMueMockAnswer(currentContext, cleanRequest),
        },
      ]);
      setIsThinking(false);
      setAttachedFile(null);
    }, 650);
  };

  const submitPrompt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    askMue(prompt);
  };

  const startNewDiscussion = () => {
    setDiscussionTitle("Nouvelle discussion");
    setExchanges([]);
    setPrompt("");
    setAttachedFile(null);
    setIsThinking(false);
    setSelectedVerb(null);
    setTaskWorkflowState("idle");
    setTaskWorkflowStep(-1);
    setRevealedTaskCount(0);
    setScannedMessageCount(0);
    setValidatedTaskIds([]);
    setSuggestedTasks(initialMueSuggestedTasks);
  };

  const loadDiscussion = (title: string, question: string) => {
    setDiscussionTitle(title);
    setExchanges([
      {
        id: Date.now(),
        question,
        answer: getMueMockAnswer(currentContext, question),
      },
    ]);
    setTaskWorkflowState("idle");
    setTaskWorkflowStep(-1);
    setScannedMessageCount(0);
  };

  const confirmSuggestedTasks = () => {
    const remainingTasks = suggestedTasks.filter(
      (task) => !validatedTaskIds.includes(task.id),
    );
    if (remainingTasks.length === 0) return;

    window.dispatchEvent(
      new CustomEvent("freescale:create-mue-tasks", {
        detail: remainingTasks,
      }),
    );
    setTaskWorkflowState("created");
    if (taskTutorialStep >= 2)
      window.dispatchEvent(new Event(TASK_TUTORIAL_COMPLETE_EVENT));
  };

  const confirmSingleSuggestedTask = (task: MueSuggestedTask) => {
    if (validatedTaskIds.includes(task.id)) return;
    window.dispatchEvent(
      new CustomEvent("freescale:create-mue-tasks", {
        detail: [task],
      }),
    );
    const remainingAfterValidation = suggestedTasks.filter(
      (item) => item.id !== task.id && !validatedTaskIds.includes(item.id),
    );
    if (remainingAfterValidation.length === 0) {
      setTaskWorkflowState("created");
      if (taskTutorialStep >= 2)
        window.dispatchEvent(new Event(TASK_TUTORIAL_COMPLETE_EVENT));
    }
  };

  const cycleSuggestedTaskStatus = (id: string) => {
    const nextStatus: Record<
      MueSuggestedTask["status"],
      MueSuggestedTask["status"]
    > = {
      scope: "todo",
      todo: "waiting",
      waiting: "scope",
    };
    setSuggestedTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, status: nextStatus[task.status] } : task,
      ),
    );
  };

  const prefillProposal = (proposal: MueProposal) => {
    const proposalPrompt = proposal.prompt ?? proposal.label;
    const launchesTaskWorkflow =
      currentContext === "Tâches" &&
      proposalPrompt.toLocaleLowerCase("fr").includes("nouveaux messages");

    if (launchesTaskWorkflow) {
      if (taskTutorialStep === 2)
        window.dispatchEvent(new Event(TASK_TUTORIAL_RESULTS_EVENT));
      askMue(proposalPrompt);
      return;
    }

    setPrompt(proposalPrompt);
    window.requestAnimationFrame(() => {
      const composer = document.querySelector(
        '[aria-label="Panneau Mue"] textarea',
      );
      if (composer instanceof HTMLTextAreaElement) {
        composer.focus();
        composer.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  };

  return (
    <aside
      aria-hidden={!isOpen}
      aria-label="Panneau Mue"
      className={cn(
        "fixed right-0 top-16 z-30 hidden h-[calc(100svh-4rem)] w-full flex-col border-l bg-background shadow-[-18px_0_42px_-34px_rgba(15,23,42,0.45)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex lg:w-[400px] xl:w-[440px]",
        isOpen
          ? "translate-x-0"
          : "pointer-events-none translate-x-full shadow-none",
        taskTutorialStep >= 2 &&
          "z-40 border-l-2 border-l-blue-400 shadow-[-24px_0_60px_-28px_rgba(37,99,235,.5)]",
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="min-w-0 gap-2 px-2" variant="ghost">
              <span className="max-w-48 truncate font-medium">
                {discussionTitle}
              </span>
              <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Discussions Mue</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2" onSelect={startNewDiscussion}>
              <PlusIcon className="size-4" /> Nouvelle discussion
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Récentes
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="gap-2"
              onSelect={() =>
                loadDiscussion(
                  "Priorités de la semaine",
                  "Quelles sont mes priorités cette semaine ?",
                )
              }
            >
              <HistoryIcon className="size-4" /> Priorités de la semaine
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2"
              onSelect={() =>
                loadDiscussion(
                  "Relances clients",
                  "Quels clients dois-je relancer aujourd’hui ?",
                )
              }
            >
              <HistoryIcon className="size-4" /> Relances clients
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1">
          <Button
            asChild
            aria-label="Ouvrir l’accueil IA"
            size="iconSm"
            variant="ghost"
          >
            <Link href="/chat?chatView=ask">
              <SlidersHorizontalIcon className="size-4" />
            </Link>
          </Button>
          <Button
            aria-label="Fermer Mue"
            onClick={close}
            size="iconSm"
            variant="ghost"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2.5 text-muted-foreground text-xs">
        <span className="size-1.5 rounded-full bg-blue-500" />
        Contexte actif :
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            className="font-medium text-foreground"
            exit={{ filter: "blur(4px)", opacity: 0, y: -3 }}
            initial={{ filter: "blur(4px)", opacity: 0, y: 3 }}
            key={currentContext}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {currentContext}
          </motion.span>
        </AnimatePresence>
      </div>

      <div
        className={cn(
          "min-h-0 flex-1",
          taskWorkflowState === "idle" || taskWorkflowState === "created"
            ? "overflow-y-auto"
            : "overflow-hidden",
        )}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            className={cn(
              "flex min-h-full flex-col px-4",
              taskWorkflowState === "idle" ? "py-5" : "py-3",
            )}
            exit={{ filter: "blur(5px)", opacity: 0, y: -6 }}
            initial={{ filter: "blur(6px)", opacity: 0, y: 8 }}
            key={currentContext}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {taskWorkflowState !== "idle" ? (
              <>
                <TaskCreationWorkflow
                  state={taskWorkflowState}
                  step={taskWorkflowStep}
                  tasks={suggestedTasks}
                  revealedTaskCount={revealedTaskCount}
                  scannedMessageCount={scannedMessageCount}
                  validatedTaskIds={validatedTaskIds}
                  onConfirm={confirmSuggestedTasks}
                  onConfirmTask={confirmSingleSuggestedTask}
                  onFollowUp={askMue}
                  onEdit={() =>
                    setTaskWorkflowState((current) =>
                      current === "editing" ? "review" : "editing",
                    )
                  }
                  onRemove={(id) =>
                    setSuggestedTasks((current) =>
                      current.filter((task) => task.id !== id),
                    )
                  }
                  onStatusChange={cycleSuggestedTaskStatus}
                />
                {taskWorkflowState === "created" && exchanges.length > 0 ? (
                  <div className="mt-5 space-y-4">
                    {exchanges.map((exchange) => (
                      <div className="space-y-3" key={exchange.id}>
                        <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-muted px-4 py-3 text-foreground text-sm leading-relaxed">
                          {exchange.question}
                        </div>
                        <MueAssistantMessage
                          context={currentContext}
                          exchange={exchange}
                          onFollowUp={askMue}
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
                {taskWorkflowState === "created" && isThinking ? (
                  <div className="mt-3 flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2Icon className="size-4 animate-spin text-blue-600" />
                    Mue réfléchit…
                  </div>
                ) : null}
              </>
            ) : exchanges.length > 0 ? (
              <div className="space-y-3">
                {exchanges.map((exchange) => (
                  <div className="space-y-3" key={exchange.id}>
                    <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-muted px-4 py-3 text-foreground text-sm leading-relaxed">
                      {exchange.question}
                    </div>
                    <MueAssistantMessage
                      context={currentContext}
                      exchange={exchange}
                      onFollowUp={askMue}
                    />
                  </div>
                ))}
                {isThinking ? (
                  <div className="flex max-w-[94%] items-center gap-2 rounded-xl border bg-card p-4 text-muted-foreground text-sm shadow-sm">
                    <Loader2Icon className="size-4 animate-spin text-blue-600" />
                    Mue analyse {currentContext}…
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="my-auto py-8 text-center">
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: -4 }}
                    initial={{ opacity: 0, scale: 0.94, y: 5 }}
                    key={selectedVerb ? "interested" : "focused"}
                    transition={{
                      duration: 0.28,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Image
                      alt="Mue"
                      className="mx-auto size-24 object-contain"
                      height={112}
                      priority
                      src={
                        selectedVerb
                          ? "/images/mue/mue-insight.png"
                          : "/images/mue/mue-focus.png"
                      }
                      width={112}
                    />
                  </motion.div>
                </AnimatePresence>
                <h2 className="mt-4 font-semibold text-xl">
                  {contextCopy.title}
                </h2>
                <p className="mx-auto mt-2 max-w-xs text-muted-foreground text-sm leading-relaxed">
                  {contextCopy.description}
                </p>
                {currentContext === "Tâches" ? (
                  <div className="mx-auto mt-5 max-w-xs rounded-xl border bg-muted/25 p-3 text-left">
                    <div className="flex items-center gap-2">
                      {connectedChannels?.map((channel) => (
                        <span
                          className="flex size-7 items-center justify-center rounded-md border bg-background shadow-sm"
                          key={channel}
                        >
                          {channel === "gmail" ? (
                            <Gmail height={15} width={15} />
                          ) : (
                            <Outlook height={15} width={15} />
                          )}
                        </span>
                      ))}
                      <span className="ml-1 font-medium text-xs">
                        {connectedChannels?.length === 1
                          ? "1 canal prêt"
                          : `${connectedChannels?.length ?? 0} canaux prêts`}
                      </span>
                    </div>
                    <p className="mt-2.5 text-muted-foreground text-xs leading-5">
                      Je peux parcourir les messages récents de vos canaux
                      connectés pour identifier des tâches, sans rien créer
                      avant votre validation.
                    </p>
                  </div>
                ) : null}
                {isThinking ? (
                  <div className="mt-5 inline-flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2Icon className="size-4 animate-spin text-blue-600" />
                    Analyse en cours…
                  </div>
                ) : null}
              </div>
            )}

            {taskWorkflowState === "idle" ? (
              <div className="relative mt-auto pt-2" ref={verbMenuRef}>
                <AnimatePresence initial={false}>
                  {selectedVerb && selectedVerbMeta ? (
                    <motion.div
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="absolute inset-x-0 bottom-full z-20 mb-2 max-h-52 overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-[0_18px_46px_-18px_rgba(15,23,42,0.32)]"
                      exit={{ opacity: 0, scale: 0.97, y: 6 }}
                      initial={{ opacity: 0, scale: 0.97, y: 6 }}
                      key={`verb-${selectedVerb}`}
                      transition={{
                        duration: 0.22,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <div className="flex h-7 items-center justify-between gap-3 px-1.5">
                        <div className="flex items-center gap-1.5 font-semibold text-[10px] text-muted-foreground uppercase tracking-wide">
                          <span className="flex size-3.5 items-center justify-center rounded-full border border-muted-foreground/45">
                            <selectedVerbMeta.Icon className="size-2.5" />
                          </span>
                          {selectedVerbMeta.label}
                        </div>
                        <Button
                          aria-label="Fermer les propositions"
                          className="size-6 text-muted-foreground"
                          onClick={() => setSelectedVerb(null)}
                          size="iconSm"
                          variant="ghost"
                        >
                          <XIcon className="size-3" />
                        </Button>
                      </div>

                      <div className="mt-0.5 space-y-0.5">
                        {actionPlan[selectedVerb].map((proposal) => {
                          const proposalPrompt =
                            proposal.prompt ?? proposal.label;
                          const isPrefilled = prompt === proposalPrompt;

                          return (
                            <button
                              data-task-tutorial-step-two-target={
                                taskTutorialStep === 2 &&
                                proposalPrompt
                                  .toLocaleLowerCase("fr")
                                  .includes("nouveaux messages")
                                  ? ""
                                  : undefined
                              }
                              className={cn(
                                "group flex min-h-9 w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                isPrefilled && "bg-blue-50 dark:bg-blue-950/30",
                                taskTutorialStep === 2 &&
                                  proposalPrompt
                                    .toLocaleLowerCase("fr")
                                    .includes("nouveaux messages") &&
                                  "border border-blue-300 bg-blue-50 shadow-[inset_3px_0_0_#2563eb,0_10px_24px_-20px_rgba(37,99,235,.85)] dark:border-blue-800 dark:bg-blue-950/35",
                              )}
                              key={proposal.label}
                              onClick={() => prefillProposal(proposal)}
                              type="button"
                            >
                              <span
                                className={cn(
                                  "flex size-3.5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/45 text-muted-foreground",
                                  isPrefilled &&
                                    "border-blue-500 text-blue-600",
                                )}
                              >
                                {isPrefilled ? (
                                  <CheckIcon className="size-2.5" />
                                ) : (
                                  <PlusIcon className="size-2.5" />
                                )}
                              </span>
                              <span className="min-w-0 flex-1 text-xs leading-snug">
                                {proposal.label}
                              </span>
                              {proposal.badge ? (
                                <Badge
                                  className="h-4 shrink-0 border-transparent bg-muted px-1.5 font-normal text-[9px] text-muted-foreground hover:bg-muted"
                                  variant="secondary"
                                >
                                  {proposal.badge}
                                </Badge>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <div className="flex flex-wrap gap-1.5 pb-1">
                  {mueVerbs.map(({ id, label, Icon }) => (
                    <button
                      data-task-tutorial-step-two-target={
                        taskTutorialStep === 2 && id === "create"
                          ? ""
                          : undefined
                      }
                      className={cn(
                        "relative inline-flex h-8 items-center gap-1.5 rounded-full border bg-background px-3 font-medium text-xs shadow-sm transition-[background-color,border-color,color,box-shadow] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selectedVerb === id &&
                          "border-foreground bg-foreground text-background hover:bg-foreground",
                        taskTutorialStep === 2 &&
                          id === "create" &&
                          "border-blue-600 bg-blue-600 text-white shadow-[0_8px_22px_-10px_rgba(37,99,235,.9)] hover:bg-blue-600 dark:border-blue-500 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-600",
                      )}
                      disabled={isThinking}
                      key={id}
                      onClick={() =>
                        setSelectedVerb((current) =>
                          current === id ? null : id,
                        )
                      }
                      type="button"
                    >
                      <Icon className="size-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className={cn(
          "shrink-0 bg-background",
          taskWorkflowState === "idle" || taskWorkflowState === "created"
            ? "p-4"
            : "px-4 py-3",
        )}
      >
        {(taskWorkflowState === "idle" || taskWorkflowState === "created") &&
        attachedFile ? (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <PaperclipIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{attachedFile}</span>
            </span>
            <Button
              aria-label="Retirer la pièce jointe"
              className="size-6"
              onClick={() => setAttachedFile(null)}
              size="iconSm"
              variant="ghost"
            >
              <XIcon className="size-3.5" />
            </Button>
          </div>
        ) : null}
        {taskWorkflowState === "idle" || taskWorkflowState === "created" ? (
          <>
            <PromptInput
              className={cn(
                "rounded-xl",
                taskWorkflowState === "created"
                  ? "min-h-[84px]"
                  : "min-h-[112px]",
              )}
              onSubmit={submitPrompt}
            >
              <PromptInputTextarea
                className="px-4 py-3 pr-24 text-sm"
                maxHeight={taskWorkflowState === "created" ? 88 : 140}
                minHeight={taskWorkflowState === "created" ? 44 : 72}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setPrompt(event.currentTarget.value)
                }
                placeholder="Écrivez votre demande…"
                value={prompt}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <Button
                  aria-label="Joindre un fichier"
                  onClick={() => setAttachedFile("brief-projet.pdf")}
                  size="iconSm"
                  type="button"
                  variant="ghost"
                >
                  <PaperclipIcon className="size-4" />
                </Button>
                <PromptInputSubmit
                  disabled={!prompt.trim() || isThinking}
                  status={isThinking ? "submitted" : "ready"}
                />
              </div>
            </PromptInput>
            <div className="mt-2 flex items-center justify-between gap-3 text-muted-foreground text-[11px]">
              <span>
                {taskWorkflowState === "idle"
                  ? "Aucune action sans validation"
                  : "Vous gardez toujours le dernier mot"}
              </span>
              <Link className="hover:text-foreground" href="/chat?chatView=ask">
                Ouvrir l’accueil IA
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </aside>
  );
}

function TaskCreationWorkflow({
  state,
  step,
  tasks,
  revealedTaskCount,
  scannedMessageCount,
  validatedTaskIds,
  onConfirm,
  onConfirmTask,
  onFollowUp,
  onEdit,
  onRemove,
  onStatusChange,
}: {
  state: TaskWorkflowState;
  step: number;
  tasks: MueSuggestedTask[];
  revealedTaskCount: number;
  scannedMessageCount: number;
  validatedTaskIds: string[];
  onConfirm: () => void;
  onConfirmTask: (task: MueSuggestedTask) => void;
  onFollowUp: (prompt: string) => void;
  onEdit: () => void;
  onRemove: (id: string) => void;
  onStatusChange: (id: string) => void;
}) {
  if (state === "running") {
    const phase = taskWorkflowSteps[Math.max(0, step)]?.phase ?? "Comprend";

    return (
      <div className="flex flex-1 flex-col py-1" aria-live="polite">
        <TaskWorkflowUserBubble />
        <div className="mt-4">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              className="flex items-center gap-2 font-semibold text-sm"
              initial={{ filter: "blur(3px)", opacity: 0, y: 3 }}
              key={step < 0 ? "Mue" : phase}
              layout
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <span>Mue{step >= 0 ? ` · ${phase}` : ""}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-xl border border-blue-100 bg-blue-50/55 p-3 dark:border-blue-900 dark:bg-blue-950/20"
          initial={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-2 font-medium text-xs text-blue-800 dark:text-blue-200">
            <CheckCircle2Icon className="size-3.5" />
            J’ai bien compris le contexte
          </div>
          <p className="mt-1.5 text-blue-950/65 text-xs leading-5 dark:text-blue-100/65">
            Vos trois canaux viennent d’être connectés. Je vais parcourir leurs
            15 nouveaux messages, puis isoler uniquement les demandes et
            engagements qui peuvent devenir des tâches.
          </p>
        </motion.div>

        <div className="mt-4 space-y-3">
          {taskWorkflowSteps.slice(0, step + 1).map((item, index) => {
            const active = index === step;
            return (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex items-start gap-2.5 text-xs leading-relaxed",
                  active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
                initial={{ opacity: 0, x: -5 }}
                key={item.label}
                transition={{ duration: 0.25 }}
              >
                <span
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    active ? "bg-foreground" : "bg-muted-foreground/35",
                  )}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1",
                    active && item.kind !== "message-count" && "animate-pulse",
                  )}
                >
                  {item.label}
                  {item.kind === "message-count" ? null : "…"}
                </span>
                {item.kind === "message-count" ? (
                  <span className="ml-auto inline-flex min-w-14 shrink-0 items-center justify-center rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-[11px] text-blue-700 tabular-nums dark:bg-blue-950/40 dark:text-blue-300">
                    <AnimatePresence initial={false} mode="popLayout">
                      <motion.span
                        animate={{
                          filter: "blur(0px)",
                          opacity: 1,
                          y: 0,
                        }}
                        exit={{
                          filter: "blur(3px)",
                          opacity: 0,
                          y: -6,
                        }}
                        initial={{
                          filter: "blur(3px)",
                          opacity: 0,
                          y: 6,
                        }}
                        key={index < step ? 15 : scannedMessageCount}
                        transition={{ duration: 0.12 }}
                      >
                        {index < step ? 15 : scannedMessageCount}
                      </motion.span>
                    </AnimatePresence>
                    <span className="ml-0.5 text-blue-500/70">/15</span>
                  </span>
                ) : null}
              </motion.div>
            );
          })}
        </div>

        {step >= 0 ? (
          <div className="mt-auto pt-8 text-muted-foreground text-[11px]">
            Étape {step + 1} sur {taskWorkflowSteps.length} · Analyse simulée
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <motion.div
      animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
      className={cn(
        "flex min-h-0 flex-col",
        state === "created" ? "shrink-0" : "flex-1",
      )}
      initial={{ filter: "blur(5px)", opacity: 0, y: 8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <TaskWorkflowUserBubble compact />
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="font-semibold text-sm">Mue</div>
        <span className="rounded-full bg-blue-50 px-2 py-1 font-medium text-[10px] text-blue-700 dark:bg-blue-950/35 dark:text-blue-300">
          15 messages analysés
        </span>
      </div>
      <div className="mt-2 px-1">
        <p className="text-sm leading-relaxed">
          {state === "created" ? (
            <>
              C’est fait. Les cinq tâches sont ajoutées à votre tableau Tâches.
              Je garde le détail ici pour que nous puissions continuer.
            </>
          ) : (
            <>
              J’ai trouvé <strong>{tasks.length} actions claires</strong> dans
              vos nouveaux messages. Vérifiez-les avant de les ajouter au
              tableau.
            </>
          )}
        </p>
      </div>

      <div className="mt-3 space-y-1.5">
        <AnimatePresence initial={false}>
          {tasks.map((task, index) => {
            const revealed = state !== "revealing" || index < revealedTaskCount;
            const validated = validatedTaskIds.includes(task.id);

            return revealed ? (
              <motion.div
                animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
                className={cn(
                  "group rounded-lg border bg-card px-3 py-2 shadow-[0_1px_2px_rgba(15,23,42,.04)] transition-colors",
                  validated &&
                    "border-emerald-100 bg-emerald-50/45 dark:border-emerald-950 dark:bg-emerald-950/15",
                )}
                exit={{ opacity: 0, height: 0, scale: 0.98 }}
                initial={{ filter: "blur(4px)", opacity: 0, scale: 0.98 }}
                key={task.id}
                layout
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex min-h-10 items-center gap-2.5">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground",
                      validated &&
                        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
                    )}
                  >
                    {validated ? (
                      <CheckIcon className="size-3.5" />
                    ) : (
                      <span className="font-semibold text-[10px]">
                        {index + 1}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-xs leading-5">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                      {task.contact ? (
                        <span className="max-w-24 truncate">
                          {task.contact}
                        </span>
                      ) : null}
                      {task.contact ? <span aria-hidden="true">·</span> : null}
                      <span className="shrink-0">{task.source}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{task.due}</span>
                    </div>
                  </div>
                  {state === "editing" ? (
                    <Button
                      aria-label={`Retirer ${task.title}`}
                      className="size-6 shrink-0 text-muted-foreground"
                      onClick={() => onRemove(task.id)}
                      size="iconSm"
                      variant="ghost"
                    >
                      <XIcon className="size-3.5" />
                    </Button>
                  ) : null}
                  {state === "created" ? (
                    <span
                      className={cn(
                        "hidden shrink-0 rounded-full px-2 py-1 font-medium text-[10px] xl:block",
                        taskStatusClass(task.status),
                      )}
                    >
                      {taskStatusLabel(task.status)}
                    </span>
                  ) : (
                    <button
                      className={cn(
                        "hidden shrink-0 rounded-full px-2 py-1 font-medium text-[10px] xl:block",
                        taskStatusClass(task.status),
                        state === "editing" && "ring-1 ring-current/15",
                      )}
                      disabled={state !== "editing"}
                      onClick={() => onStatusChange(task.id)}
                      type="button"
                    >
                      {taskStatusLabel(task.status)}
                    </button>
                  )}
                  {state !== "created" ? (
                    <Button
                      className={cn(
                        "h-7 shrink-0 gap-1 px-2 text-[10px]",
                        validated &&
                          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300",
                      )}
                      disabled={validated}
                      onClick={() => onConfirmTask(task)}
                      size="sm"
                      variant="outline"
                    >
                      {validated ? (
                        <CheckIcon className="size-3" />
                      ) : (
                        <PlusIcon className="size-3" />
                      )}
                      {validated ? "Créée" : "Valider"}
                    </Button>
                  ) : null}
                </div>
              </motion.div>
            ) : (
              <motion.div
                animate={{ opacity: 1 }}
                className="h-[57px] overflow-hidden rounded-lg border bg-card px-3 py-2"
                initial={{ opacity: 0 }}
                key={`skeleton-${task.id}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-6 animate-pulse rounded-full bg-muted" />
                  <div className="min-w-0 flex-1">
                    <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
                    <div className="mt-2 h-2.5 w-2/5 animate-pulse rounded bg-muted/70" />
                  </div>
                  <div className="h-7 w-14 animate-pulse rounded-md bg-muted" />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {state === "created" ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex flex-wrap gap-2"
          initial={{ opacity: 0, y: 4 }}
        >
          {["Prioriser ces tâches", "Planifier ma journée"].map((followUp) => (
            <Button
              className="h-8 rounded-full px-3 text-xs"
              key={followUp}
              onClick={() => onFollowUp(followUp)}
              size="sm"
              variant="outline"
            >
              {followUp}
            </Button>
          ))}
        </motion.div>
      ) : null}

      {state !== "revealing" && state !== "created" ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex flex-wrap gap-2"
          initial={{ opacity: 0, y: 4 }}
        >
          <Button
            className="gap-2"
            disabled={
              tasks.length === 0 || validatedTaskIds.length === tasks.length
            }
            onClick={onConfirm}
            size="sm"
          >
            <CheckIcon className="size-4" />
            {validatedTaskIds.length === tasks.length
              ? "Toutes créées"
              : validatedTaskIds.length > 0
                ? `Créer les ${tasks.length - validatedTaskIds.length} restantes`
                : "Créer les 5 tâches"}
          </Button>
          <Button
            className="gap-2"
            onClick={onEdit}
            size="sm"
            variant="outline"
          >
            <PencilIcon className="size-3.5" />
            {state === "editing" ? "Terminer" : "Modifier"}
          </Button>
        </motion.div>
      ) : null}
    </motion.div>
  );
}

function TaskWorkflowUserBubble({ compact = false }: { compact?: boolean }) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-muted text-foreground leading-relaxed",
        compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm",
      )}
      initial={{ opacity: 0, y: 4 }}
      layoutId="task-workflow-user-request"
      transition={{ duration: 0.2 }}
    >
      Crée mes tâches à partir des nouveaux messages
    </motion.div>
  );
}

function taskStatusLabel(status: MueSuggestedTask["status"]) {
  if (status === "scope") return "À cadrer";
  if (status === "waiting") return "En attente";
  return "À faire";
}

function taskStatusClass(status: MueSuggestedTask["status"]) {
  if (status === "scope") {
    return "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300";
  }
  if (status === "waiting") {
    return "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
  }
  return "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
}

function PreviewCommandCenter() {
  const pathname = usePathname();
  const connectedChannels = usePreviewConnectedChannels();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<"search" | "ask">("search");
  const [activeScope, setActiveScope] = useState<SearchScope>("all");

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    const handleOpen = () => setOpen(true);

    window.addEventListener("keydown", handleShortcut);
    window.addEventListener(OPEN_COMMAND_CENTER_EVENT, handleOpen);
    return () => {
      window.removeEventListener("keydown", handleShortcut);
      window.removeEventListener(OPEN_COMMAND_CENTER_EVENT, handleOpen);
    };
  }, []);

  const filteredResults = useMemo(() => {
    if (!connectedChannels?.length) return [];
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    return globalSearchResults.filter((result) => {
      const matchesScope =
        activeScope === "all" || result.scope === activeScope;
      const matchesQuery =
        !normalizedQuery ||
        `${result.title} ${result.detail} ${result.meta}`
          .toLocaleLowerCase("fr")
          .includes(normalizedQuery);
      return matchesScope && matchesQuery;
    });
  }, [activeScope, connectedChannels, query]);

  const currentContext = getPreviewContext(pathname);

  const askMue = (prompt: string) => {
    setQuestion(prompt.trim() || `Que puis-je faire sur ${currentContext} ?`);
    setQuery("");
    setMode("ask");
  };

  const handleAskSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) return;
    askMue(query);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      window.setTimeout(
        () => window.dispatchEvent(new Event("freescale:focus-search-trigger")),
        0,
      );
      window.setTimeout(() => {
        setMode("search");
        setQuery("");
        setQuestion("");
        setActiveScope("all");
      }, 180);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden p-0 transition-[max-width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] max-lg:left-0 max-lg:top-0 max-lg:h-dvh max-lg:max-h-dvh max-lg:w-screen max-lg:max-w-none max-lg:translate-x-0 max-lg:translate-y-0 max-lg:rounded-none max-lg:border-0 max-lg:[&>button]:hidden",
          mode === "ask" ? "max-w-3xl" : "max-w-4xl",
        )}
      >
        {mode === "search" ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Rechercher ou demander à Mue</DialogTitle>
              <DialogDescription>
                Recherchez dans Freescale ou posez une question à Mue.
              </DialogDescription>
            </DialogHeader>

            <MobileGlobalSearch
              activeScope={activeScope}
              onCancel={() => handleOpenChange(false)}
              onQueryChange={setQuery}
              onResultClick={() => setOpen(false)}
              onScopeChange={(scope) => setActiveScope(scope as SearchScope)}
              query={query}
              results={filteredResults}
              scopes={globalSearchScopes}
            />

            <div className="hidden items-center gap-3 px-5 pb-3 pt-5 pr-12 sm:px-6 sm:pt-6 lg:flex">
              <SearchIcon className="size-6 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                className="h-11 min-w-0 flex-1 bg-transparent font-medium text-lg outline-none placeholder:font-normal placeholder:text-muted-foreground sm:text-xl"
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="Rechercher dans Freescale…"
                value={query}
              />
              <Button
                className="hidden shrink-0 gap-2 sm:flex"
                onClick={() => askMue(query)}
                size="sm"
                variant="outline"
              >
                <MueIcon />
                Demander à Mue
              </Button>
            </div>

            <div className="hidden gap-1 overflow-x-auto border-b px-4 pb-3 sm:px-6 lg:flex">
              {globalSearchScopes.map(({ id, label, Icon }) => (
                <button
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 font-medium text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground",
                    activeScope === id && "bg-muted text-foreground",
                  )}
                  key={id}
                  onClick={() => setActiveScope(id)}
                  type="button"
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="hidden min-h-[360px] max-h-[56vh] overflow-y-auto px-3 py-3 sm:px-4 lg:block">
              <div className="flex items-center justify-between px-2 pb-2">
                <p className="font-medium text-muted-foreground text-[11px] uppercase tracking-[0.12em]">
                  {query ? "Résultats" : "Récents dans votre espace"}
                </p>
                <span className="text-muted-foreground text-[11px] tabular-nums">
                  {filteredResults.length} résultat
                  {filteredResults.length === 1 ? "" : "s"}
                </span>
              </div>

              {filteredResults.length ? (
                <div className="space-y-1">
                  {filteredResults.map((result, index) => {
                    const Icon = result.Icon;
                    return (
                      <div
                        className={cn(
                          "group flex items-center gap-2 rounded-xl transition-colors hover:bg-muted/70",
                          index === 0 && "bg-muted/45",
                        )}
                        key={result.id}
                      >
                        <Link
                          className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                          href={result.href}
                          onClick={() => setOpen(false)}
                        >
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-lg",
                              result.tone,
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-sm">
                              {result.title}
                            </span>
                            <span className="mt-0.5 block truncate text-muted-foreground text-xs">
                              {result.detail}
                            </span>
                          </span>
                          <span className="hidden shrink-0 text-muted-foreground text-[11px] sm:block">
                            {result.meta}
                          </span>
                        </Link>
                        <button
                          aria-label={`Demander à Mue à propos de ${result.title}`}
                          className="mr-2 hidden size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-blue-600 group-hover:flex"
                          onClick={() =>
                            askMue(`Aide-moi avec « ${result.title} »`)
                          }
                          type="button"
                        >
                          <MueIcon />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center text-center">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <SearchIcon className="size-4" />
                  </span>
                  <p className="mt-3 font-medium text-sm">
                    Aucun résultat dans Freescale
                  </p>
                  <p className="mt-1 max-w-sm text-muted-foreground text-xs leading-5">
                    Essayez un client, un projet, un message ou demandez à Mue
                    d’élargir la recherche.
                  </p>
                  <Button
                    className="mt-4 gap-2"
                    onClick={() => askMue(query)}
                    size="sm"
                    variant="outline"
                  >
                    <MueIcon />
                    Rechercher avec Mue
                  </Button>
                </div>
              )}
            </div>

            <div className="hidden items-center justify-between gap-4 border-t bg-muted/15 px-5 py-2.5 text-muted-foreground text-[11px] lg:flex">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="rounded border bg-background px-1.5 py-0.5">
                    ↑↓
                  </kbd>{" "}
                  naviguer
                </span>
                <span className="hidden sm:inline">
                  <kbd className="rounded border bg-background px-1.5 py-0.5">
                    ↵
                  </kbd>{" "}
                  ouvrir
                </span>
              </div>
              <span>Messages, tâches, clients et documents</span>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="border-b px-5 py-4 pr-12 text-left">
              <div className="flex items-center gap-3">
                <Button
                  aria-label="Retour à la recherche"
                  onClick={() => {
                    setMode("search");
                    setQuery("");
                  }}
                  size="iconSm"
                  variant="ghost"
                >
                  <ArrowLeftIcon className="size-4" />
                </Button>
                <MueIcon size="lg" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <DialogTitle>Mue IA</DialogTitle>
                    <Badge
                      className="font-normal text-[10px]"
                      variant="secondary"
                    >
                      {currentContext}
                    </Badge>
                  </div>
                  <DialogDescription className="truncate">
                    Une demande contextuelle, sans quitter votre page.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="min-h-[280px] bg-muted/15 px-5 py-5 sm:px-7">
              <div className="ml-auto max-w-[78%] rounded-2xl rounded-br-md bg-foreground px-4 py-3 text-background text-sm">
                {question}
              </div>
              <div className="mt-4 max-w-[88%] rounded-xl border bg-background p-4 shadow-sm">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <MueIcon />
                  Mue analyse {currentContext}
                </div>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                  Je prépare une réponse et les éventuelles actions associées.
                  Chaque modification vous sera présentée avant application.
                </p>
                <div className="mt-3 flex items-center gap-2 text-muted-foreground text-xs">
                  <CheckCircle2Icon className="size-3.5 text-green-600" />
                  Rien ne sera modifié sans votre validation.
                </div>
              </div>
            </div>

            <div className="border-t p-4 sm:px-6">
              <PromptInput
                className="min-h-[92px] rounded-xl"
                onSubmit={handleAskSubmit}
              >
                <PromptInputTextarea
                  className="px-4 py-3 pr-24 text-sm"
                  maxHeight={100}
                  minHeight={58}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    setQuery(event.currentTarget.value)
                  }
                  placeholder="Continuer la discussion avec Mue..."
                  value={query}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <Button
                    aria-label="Joindre un fichier"
                    size="iconSm"
                    type="button"
                    variant="ghost"
                  >
                    <PaperclipIcon className="size-4" />
                  </Button>
                  <PromptInputSubmit disabled={!query.trim()} status="ready" />
                </div>
              </PromptInput>
              <div className="mt-2 flex items-center justify-between gap-3 text-muted-foreground text-xs">
                <span>Contexte utilisé : {currentContext}</span>
                <Link
                  className="hover:text-foreground"
                  href="/chat?chatView=ask"
                >
                  Ouvrir dans l’accueil IA
                </Link>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ConnectedChannels() {
  const accountChannels = usePreviewConnectedChannels();
  const [connected, setConnected] = useState<ChannelId[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ChannelId | null>(null);
  const [step, setStep] = useState<"select" | "confirm" | "success">("select");
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!accountChannels) return;
    setConnected(
      accountChannels.filter((id): id is ChannelId =>
        channelIds.includes(id as ChannelId),
      ),
    );
  }, [accountChannels]);

  const visibleConnected = connected.slice(0, 4);
  const hiddenConnectedCount = connected.length - visibleConnected.length;
  const selectedChannel = channels.find((channel) => channel.id === selected);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSelected(null);
      setStep("select");
      setIsConnecting(false);
    }
  };

  const connectSelectedChannel = async () => {
    if (!selected || isConnecting) return;
    setIsConnecting(true);

    if (selected === "gmail" || selected === "outlook") {
      const provider = selected === "gmail" ? "google" : "microsoft";

      try {
        const url = await getAccountLinkingUrl(provider);
        redirectToSafeUrl(url, { allowExternal: true });
      } catch (error) {
        console.error(`Error initiating ${provider} account linking:`, error);
        toastError({
          title: `Impossible de connecter ${selectedChannel?.name ?? "ce canal"}`,
          description: "Réessayez dans quelques instants.",
        });
        setIsConnecting(false);
      }
      return;
    }

    toastError({
      title: `${selectedChannel?.name ?? "Ce canal"} n’est pas encore disponible`,
      description:
        "Seuls Gmail et Outlook peuvent être réellement connectés pour le moment.",
    });
    setIsConnecting(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div className="order-2 flex items-center gap-1 rounded-lg bg-muted/70 p-1">
        {visibleConnected.map((channelId) => {
          const channel = channels.find(({ id }) => id === channelId);
          if (!channel) return null;

          return (
            <Button
              asChild
              className="bg-background shadow-sm hover:bg-background"
              key={channel.id}
              size="iconSm"
              variant="ghost"
            >
              <Link href="/channels-v4" aria-label={`${channel.name} connecté`}>
                <ChannelLogo id={channel.id} />
              </Link>
            </Button>
          );
        })}

        {hiddenConnectedCount > 0 ? (
          <Badge
            className="h-8 min-w-8 justify-center px-1.5"
            variant="secondary"
          >
            +{hiddenConnectedCount}
          </Badge>
        ) : null}

        <DialogTrigger asChild>
          <Button
            className="ml-1 gap-2 px-2.5 text-muted-foreground hover:text-foreground sm:px-3"
            size="sm"
            variant="ghost"
          >
            <PlusIcon className="size-4" />
            <span className="hidden sm:inline">Ajouter un canal</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent className="max-w-2xl p-0">
        {step === "select" ? (
          <>
            <DialogHeader className="border-b px-6 py-5 pr-12">
              <DialogTitle>Ajouter un canal</DialogTitle>
              <DialogDescription>
                Choisissez le service que vous souhaitez connecter à votre
                espace Freescale.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 px-6 pb-6 sm:grid-cols-2">
              {channels.map((channel) => {
                const isConnected = connected.includes(channel.id);

                return (
                  <button
                    className={cn(
                      "flex min-h-24 items-center gap-4 rounded-lg border bg-card p-4 text-left shadow-sm transition-colors",
                      isConnected
                        ? "cursor-default bg-muted/40"
                        : "hover:border-foreground/20 hover:bg-accent/50",
                    )}
                    disabled={isConnected}
                    key={channel.id}
                    onClick={() => {
                      setSelected(channel.id);
                      setStep("confirm");
                    }}
                    type="button"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-background shadow-sm">
                      <ChannelLogo id={channel.id} size="large" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{channel.name}</span>
                        {isConnected ? (
                          <Badge className="gap-1" variant="green">
                            <CheckIcon className="size-3" /> Connecté
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-muted-foreground text-sm">
                        {channel.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {step === "confirm" && selectedChannel ? (
          <>
            <DialogHeader className="border-b px-6 py-5 pr-12">
              <div className="flex items-center gap-3">
                <Button
                  aria-label="Retour à la sélection"
                  onClick={() => setStep("select")}
                  size="iconSm"
                  variant="ghost"
                >
                  <ArrowLeftIcon className="size-4" />
                </Button>
                <div>
                  <DialogTitle>Connecter {selectedChannel.name}</DialogTitle>
                  <DialogDescription className="mt-1">
                    Vérifiez ce qui sera synchronisé avant de continuer.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 px-6">
              <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
                <div className="flex size-12 items-center justify-center rounded-lg border bg-background shadow-sm">
                  <ChannelLogo id={selectedChannel.id} size="large" />
                </div>
                <div>
                  <p className="font-medium">{selectedChannel.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {selectedChannel.description}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-3 font-medium text-sm">Freescale pourra :</p>
                <ul className="space-y-3 text-sm">
                  {[
                    "Importer les nouvelles conversations dans Canaux",
                    "Envoyer vos réponses depuis votre espace de travail",
                    "Synchroniser automatiquement les statuts et notifications",
                  ].map((permission) => (
                    <li className="flex items-start gap-3" key={permission}>
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                        <CheckIcon className="size-3" />
                      </span>
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 text-muted-foreground text-xs">
                <LockKeyholeIcon className="mt-0.5 size-4 shrink-0" />
                {selectedChannel.id === "gmail" ||
                selectedChannel.id === "outlook"
                  ? `Vous serez redirigé vers ${selectedChannel.name} pour autoriser la connexion de votre compte.`
                  : "Cette intégration sera disponible lorsqu’elle pourra synchroniser de vraies données."}
              </div>
            </div>

            <DialogFooter className="border-t px-6 py-4">
              <Button onClick={() => setStep("select")} variant="outline">
                Retour
              </Button>
              <Button loading={isConnecting} onClick={connectSelectedChannel}>
                Connecter {selectedChannel.name}
              </Button>
            </DialogFooter>
          </>
        ) : null}

        {step === "success" && selectedChannel ? (
          <div className="flex flex-col items-center px-8 py-10 text-center">
            <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
              <CheckCircle2Icon className="size-7" />
            </div>
            <DialogTitle>{selectedChannel.name} est connecté</DialogTitle>
            <DialogDescription className="mt-2 max-w-sm">
              Le canal apparaît maintenant dans la barre de contexte et peut
              être utilisé depuis Canaux.
            </DialogDescription>
            <DialogClose asChild>
              <Button className="mt-6 min-w-28">Terminer</Button>
            </DialogClose>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

const channelIds = [
  "gmail",
  "outlook",
  "whatsapp",
  "slack",
  "telegram",
  "teams",
] as const;

type ChannelId = (typeof channelIds)[number];

const channels: Array<{
  id: ChannelId;
  name: string;
  description: string;
}> = [
  {
    id: "gmail",
    name: "Gmail",
    description: "E-mails et conversations Google Workspace.",
  },
  {
    id: "outlook",
    name: "Outlook",
    description: "E-mails Microsoft 365 et Outlook.",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Messages clients via WhatsApp Business.",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Messages et notifications de votre workspace.",
  },
  {
    id: "telegram",
    name: "Telegram",
    description: "Conversations et alertes depuis votre bot.",
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Messages et collaborations de votre équipe.",
  },
];

function ChannelLogo({
  id,
  size = "default",
}: {
  id: ChannelId;
  size?: "default" | "large";
}) {
  const iconSize = size === "large" ? 28 : 22;

  if (id === "gmail") return <Gmail width={iconSize} height={iconSize} />;
  if (id === "outlook") return <Outlook width={iconSize} height={iconSize} />;
  if (id === "whatsapp")
    return (
      <WhatsAppIcon
        className={cn("text-[#22c55e]", size === "large" ? "size-7" : "size-5")}
      />
    );
  if (id === "slack" || id === "telegram") {
    return (
      <Image
        alt=""
        height={iconSize}
        src={`/images/${id}.svg`}
        width={iconSize}
      />
    );
  }

  return (
    <UsersRoundIcon
      className={cn("text-indigo-600", size === "large" ? "size-7" : "size-5")}
    />
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12.04 2a9.84 9.84 0 0 0-8.5 14.78L2 22l5.36-1.5A9.87 9.87 0 1 0 12.04 2Zm0 17.75a7.8 7.8 0 0 1-3.98-1.09l-.29-.17-3.18.89.85-3.1-.19-.31a7.86 7.86 0 1 1 6.79 3.78Zm4.31-5.89c-.24-.12-1.4-.69-1.62-.77-.22-.08-.38-.12-.54.12-.16.24-.61.77-.75.93-.14.16-.28.18-.52.06-.24-.12-1-.37-1.91-1.18a7.18 7.18 0 0 1-1.32-1.64c-.14-.24-.01-.36.1-.48.1-.11.24-.28.35-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.63.3-.22.24-.83.81-.83 1.98s.85 2.3.97 2.46c.12.16 1.67 2.55 4.05 3.58.57.24 1.01.39 1.35.5.57.18 1.08.15 1.49.09.46-.07 1.4-.58 1.6-1.13.2-.55.2-1.03.14-1.13-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

export function SideNavWithTopNav({
  children,
  defaultOpen,
  previewMode = false,
}: {
  children: React.ReactNode;
  defaultOpen: boolean;
  previewMode?: boolean;
}) {
  const pathname = usePathname();

  if (!pathname) return null;

  const isAssistantRoute =
    pathname.includes("/assistant") || pathname === "/chat";
  const isAiHome = previewMode && pathname === "/chat";
  // The mail screen ships its own sidebar, so this one would be a second copy.
  const isMailRoute = pathname.includes("/mail");

  // Ugly code. May change the onboarding path later so we don't need to do this.
  // Only return children for the onboarding or onboarding-brief pages: /[emailAccountId]/onboarding or /[emailAccountId]/onboarding-brief
  const segments = pathname.split("/").filter(Boolean);
  const isPreviewOnboarding =
    previewMode &&
    segments.length === 1 &&
    (segments[0] === "onboarding" || segments[0] === "onboarding-brief");
  if (
    isPreviewOnboarding ||
    (segments.length === 2 &&
      (segments[1] === "onboarding" || segments[1] === "onboarding-brief"))
  )
    return children;

  return (
    <SidebarProvider
      defaultOpen={defaultOpen ? ["left-sidebar"] : []}
      sidebarNames={
        previewMode
          ? ["left-sidebar", "mue-panel"]
          : ["left-sidebar", "chat-sidebar"]
      }
    >
      {/* Both are suppressed together: the trigger only opens SideNav, so
          leaving it on the mail route would render a button that opens an
          empty drawer. */}
      {!isMailRoute && (
        <>
          {previewMode ? <MobileAppNavigation /> : <MobileHeader />}
          <div className={previewMode ? "hidden lg:contents" : undefined}>
            <SideNav name="left-sidebar" previewMode={previewMode} />
          </div>
        </>
      )}
      <ContentWrapper previewMode={previewMode}>{children}</ContentWrapper>
      {previewMode ? (
        <>
          <PreviewCommandCenter />
          {!isAiHome ? <PreviewMuePanel name="mue-panel" /> : null}
        </>
      ) : null}
      {!previewMode && !isAssistantRoute ? (
        <SidebarRight name="chat-sidebar" />
      ) : null}
    </SidebarProvider>
  );
}

function MobileHeader() {
  return (
    <header className="pointer-events-none fixed top-0 left-0 right-0 z-50 h-9 md:hidden">
      <div className="flex h-full items-center px-4">
        <SidebarTrigger
          name="left-sidebar"
          className="pointer-events-auto size-6"
        />
      </div>
    </header>
  );
}
