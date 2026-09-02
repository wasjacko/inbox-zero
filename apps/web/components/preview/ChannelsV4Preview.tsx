"use client";

import {
  ArchiveIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  AtSignIcon,
  BotIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleHelpIcon,
  FileIcon,
  InboxIcon,
  InfoIcon,
  LandmarkIcon,
  LinkIcon,
  ListTodoIcon,
  LoaderCircleIcon,
  MailIcon,
  MicIcon,
  MoreHorizontalIcon,
  PaperclipIcon,
  PenLineIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  SendHorizontalIcon,
  Settings2Icon,
  ShieldCheckIcon,
  ShieldOffIcon,
  SmileIcon,
  SparklesIcon,
  StarIcon,
  TagIcon,
  Trash2Icon,
  TrophyIcon,
  UsersRoundIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePreloadedPageData } from "@/hooks/usePreloadedPageData";
import type { ThreadsListResponse } from "@/app/api/threads/route";
import { GithubIcon, WhatsAppIcon } from "@/components/BrandIcons";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Gmail } from "@/components/new-landing/icons/Gmail";
import { Outlook } from "@/components/new-landing/icons/Outlook";
import { PageHeader } from "@/components/PageHeader";
import { PageWrapper } from "@/components/PageWrapper";
import { toastError, toastSuccess } from "@/components/Toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils";
import { EMAIL_ACCOUNT_HEADER } from "@/utils/config";
import { useThread } from "@/hooks/useThread";
import { useContactPhotos } from "@/hooks/useContactPhotos";
import { usePreviewSetupProgress } from "@/hooks/usePreviewSetupProgress";
import {
  MobileChannelsPreview,
  type MobileChannelConversation,
} from "@/components/mobile/MobileSimplifiedPages";
import { useAccount } from "@/providers/EmailAccountProvider";
import {
  toRealChannelConversation,
  toRealChannelConversations,
} from "@/utils/channels/real-conversations";
import {
  archiveThreadAction,
  markReadThreadAction,
  sendEmailAction,
  trashThreadAction,
} from "@/utils/actions/mail";
import { getAccountLinkingUrl } from "@/utils/account-linking";
import { CHANNELS_THREADS_CACHE_KEY } from "@/utils/preview-data";

type Channel = "gmail" | "outlook" | "whatsapp" | "slack" | "telegram";
type AiMode = "manual" | "assist" | "suggest";
type Folder =
  | "all"
  | "unread"
  | "starred"
  | "attachments"
  | "sent"
  | "drafts"
  | "trash";
type LabelTone = "blue" | "green" | "orange" | "rose" | "slate";
type ContactType = "client" | "provider" | "collaborator" | "supplier";
type EmailTaskPriority = "low" | "medium" | "high";

const ContactPhotosContext = createContext<Record<string, string>>({});

type InboxLabel = {
  id: string;
  name: string;
  tone: LabelTone;
};

type ThreadMessage = {
  id: string;
  author: "me" | "contact";
  body: string;
  time: string;
  attachment?: string;
};

type InboxConversation = {
  id: string;
  name: string;
  initials: string;
  address: string;
  avatarUrl?: string;
  channel: Channel;
  contactType?: ContactType;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  starred?: boolean;
  attachment?: boolean;
  archived?: boolean;
  draft?: boolean;
  resolved?: boolean;
  trashed?: boolean;
  labels?: string[];
  project?: string;
  projectSource?: "manual" | "ai";
  messages: ThreadMessage[];
};

const initialLabels: InboxLabel[] = [
  { id: "follow-up", name: "Relance", tone: "orange" },
  { id: "waiting", name: "En attente", tone: "slate" },
  { id: "finance", name: "Finance", tone: "green" },
  { id: "urgent", name: "Urgent", tone: "rose" },
];

const projects = [
  "Refonte de la page d’accueil",
  "Partenariat Northstar",
  "Lancement Freescale",
  "Portail client Atlas",
  "Identité de marque Aurélia",
  "Espace Meridian",
];

const initialConversations: InboxConversation[] = [
  {
    id: "sarah",
    name: "Sarah Lemoine",
    initials: "SL",
    address: "+33 6 12 34 56 78",
    channel: "whatsapp",
    contactType: "client",
    subject: "Retours sur la page d’accueil",
    preview:
      "Peut-on rendre l’en-tête plus apaisé ? J’aimerais relire la version finale demain.",
    time: "12 min",
    unread: true,
    starred: true,
    labels: ["follow-up"],
    project: "Refonte de la page d’accueil",
    projectSource: "manual",
    messages: [
      {
        id: "s1",
        author: "contact",
        body: "Bonjour Wacil, nous avons regroupé les premiers retours de l’équipe sur la nouvelle page d’accueil.",
        time: "Hier · 14:32",
      },
      {
        id: "s2",
        author: "contact",
        body: "La structure fonctionne bien. Nous aimerions surtout rendre l’ensemble plus calme et mieux hiérarchiser la proposition de valeur.",
        time: "Hier · 14:34",
      },
      {
        id: "s3",
        author: "me",
        body: "Merci Sarah. Je reprends les contrastes, le rythme vertical et la formulation du premier écran. Je te partage une nouvelle version demain matin.",
        time: "Hier · 14:41",
      },
      {
        id: "s4",
        author: "contact",
        body: "Parfait. Est-ce que tu peux aussi vérifier la version mobile ? Le titre prend beaucoup de place sur les petits écrans.",
        time: "Hier · 14:46",
      },
      {
        id: "s5",
        author: "me",
        body: "Oui, je vais traiter les deux formats ensemble pour conserver la même hiérarchie. Je regarderai aussi le passage tablette.",
        time: "Hier · 14:51",
      },
      {
        id: "s6",
        author: "contact",
        body: "Je t’envoie le compte rendu de notre atelier. Les commentaires prioritaires sont signalés en bleu.",
        time: "Hier · 15:08",
        attachment: "Compte-rendu-atelier.pdf",
      },
      {
        id: "s7",
        author: "me",
        body: "Bien reçu. Je vais m’appuyer dessus pour éviter de traiter les remarques secondaires avant la validation de la direction.",
        time: "Hier · 15:15",
      },
      {
        id: "s8",
        author: "contact",
        body: "Exactement. Pour demain, le plus important reste l’en-tête, le bloc de preuve et le CTA principal.",
        time: "Hier · 15:19",
      },
      {
        id: "s9",
        author: "me",
        body: "Bonjour Sarah, j’ai terminé une première passe. La nouvelle hiérarchie est en ligne sur le lien de prévisualisation habituel.",
        time: "09:12",
      },
      {
        id: "s10",
        author: "contact",
        body: "Je regarde avec l’équipe. À première vue, le rythme est beaucoup plus clair et le CTA ressort mieux.",
        time: "09:28",
      },
      {
        id: "s11",
        author: "contact",
        body: "Une dernière remarque : le fond du bandeau paraît encore un peu intense sur certains écrans.",
        time: "09:36",
      },
      {
        id: "s12",
        author: "me",
        body: "J’ai intégré les derniers retours à la page d’accueil.",
        time: "10:16",
      },
      {
        id: "s13",
        author: "contact",
        body: "La direction est bonne. Peut-on rendre l’en-tête plus apaisé et réduire un peu le contraste ?",
        time: "10:20",
      },
      {
        id: "s14",
        author: "contact",
        body: "J’aimerais relire la version finale demain matin, si possible.",
        time: "10:21",
      },
    ],
  },
  {
    id: "maya",
    name: "Maya Chen",
    initials: "MC",
    address: "maya@northstar.co",
    channel: "gmail",
    contactType: "client",
    subject: "Re : proposition de partenariat",
    preview:
      "Le périmètre révisé me convient. Peux-tu envoyer le tarif final et tes prochaines disponibilités ?",
    time: "38 min",
    unread: true,
    attachment: true,
    project: "Partenariat Northstar",
    projectSource: "manual",
    messages: [
      {
        id: "m1",
        author: "me",
        body: "J’ai mis à jour le périmètre suite à notre échange. Le document révisé est joint.",
        time: "09:32",
        attachment: "Northstar-scope-v3.pdf",
      },
      {
        id: "m2",
        author: "contact",
        body: "Le périmètre révisé me convient. Peux-tu envoyer le tarif final et tes prochaines disponibilités ?",
        time: "09:48",
      },
    ],
  },
  {
    id: "alex",
    name: "Alex Morgan",
    initials: "AM",
    address: "#product-launch",
    channel: "slack",
    contactType: "collaborator",
    subject: "Derniers retours avant lancement",
    preview:
      "@Wacil J’ai ajouté les derniers retours au document partagé. Deux éléments nécessitent ton approbation.",
    time: "1h",
    unread: true,
    labels: ["urgent"],
    project: "Lancement Freescale",
    projectSource: "manual",
    messages: [
      {
        id: "a1",
        author: "contact",
        body: "@Wacil J’ai ajouté les derniers retours au document partagé. Deux éléments nécessitent ton approbation.",
        time: "09:08",
      },
    ],
  },
  {
    id: "thomas",
    name: "Thomas Aubry",
    initials: "TA",
    address: "@thomas_a",
    channel: "telegram",
    contactType: "provider",
    subject: "Contrat signé",
    preview: "J’ai tout signé. Je t’envoie le PDF final.",
    time: "2h",
    unread: false,
    attachment: true,
    labels: ["waiting"],
    messages: [
      {
        id: "t1",
        author: "me",
        body: "Peux-tu me retourner le contrat signé aujourd’hui ?",
        time: "08:02",
      },
      {
        id: "t2",
        author: "contact",
        body: "J’ai tout signé. Je t’envoie le PDF final.",
        time: "08:17",
        attachment: "Aubry-agreement-signed.pdf",
      },
    ],
  },
  {
    id: "jon",
    name: "Jon Bell",
    initials: "JB",
    address: "jon@atlaslabs.io",
    channel: "outlook",
    contactType: "client",
    subject: "Problème d’invitation sur mobile",
    preview:
      "Nous ne pouvons toujours pas inviter un second membre depuis le mobile. Le problème est-il en cours d’analyse ?",
    time: "3h",
    unread: true,
    labels: ["urgent"],
    project: "Portail client Atlas",
    projectSource: "manual",
    messages: [
      {
        id: "j1",
        author: "contact",
        body: "Nous ne pouvons toujours pas inviter un second membre depuis le mobile. Le problème est-il en cours d’analyse ?",
        time: "08:35",
      },
    ],
  },
  {
    id: "lina",
    name: "Lina Moreau",
    initials: "LM",
    address: "@lina_moreau",
    channel: "telegram",
    contactType: "supplier",
    subject: "Sélection des photos",
    preview:
      "J’enverrai les photos sélectionnées dès que l’équipe aura validé, probablement jeudi.",
    time: "Hier",
    unread: false,
    labels: ["waiting"],
    project: "Identité de marque Aurélia",
    projectSource: "manual",
    messages: [
      {
        id: "l1",
        author: "contact",
        body: "J’enverrai les photos sélectionnées dès que l’équipe aura validé, probablement jeudi.",
        time: "Hier · 17:08",
      },
    ],
  },
  {
    id: "orbital",
    name: "Orbital Finance",
    initials: "OF",
    address: "finance@orbital.so",
    channel: "gmail",
    contactType: "supplier",
    subject: "Informations pour la facture d’août",
    preview:
      "Peux-tu confirmer la référence du bon de commande à indiquer sur la facture d’août ?",
    time: "Hier",
    unread: true,
    labels: ["finance"],
    messages: [
      {
        id: "o1",
        author: "contact",
        body: "Peux-tu confirmer la référence du bon de commande à indiquer sur la facture d’août ?",
        time: "Hier · 15:34",
      },
    ],
  },
  {
    id: "capucine",
    name: "Capucine Roy",
    initials: "CR",
    address: "capucine@meridian.fr",
    channel: "gmail",
    contactType: "client",
    subject: "Brief projet mis à jour",
    preview:
      "Voici le brief mis à jour avec nos commentaires de l’atelier d’hier.",
    time: "Mar",
    unread: false,
    attachment: true,
    project: "Espace Meridian",
    projectSource: "manual",
    messages: [
      {
        id: "c1",
        author: "contact",
        body: "Voici le brief mis à jour avec nos commentaires de l’atelier d’hier.",
        time: "Mardi · 16:12",
        attachment: "Meridian-brief-v4.pdf",
      },
    ],
  },
  {
    id: "github",
    name: "GitHub",
    initials: "GH",
    address: "notifications@github.com",
    channel: "gmail",
    contactType: "supplier",
    subject: "Relecture demandée sur la demande de fusion #482",
    preview: "Alex a demandé ta relecture sur feat/customer-portal-navigation.",
    time: "Mar",
    unread: false,
    labels: ["follow-up"],
    trashed: true,
    messages: [
      {
        id: "g1",
        author: "contact",
        body: "Alex a demandé ta relecture sur feat/customer-portal-navigation.",
        time: "Mardi · 14:52",
      },
    ],
  },
  {
    id: "nora",
    name: "Nora Martin",
    initials: "NM",
    address: "nora@papier.co",
    channel: "outlook",
    contactType: "collaborator",
    subject: "Merci pour la mise en relation",
    preview:
      "Merci encore pour la mise en relation. Je serais ravi de rester en contact pour de futurs projets.",
    time: "Lun",
    unread: false,
    draft: true,
    labels: ["follow-up"],
    messages: [
      {
        id: "n1",
        author: "contact",
        body: "Merci encore pour la mise en relation. Je serais ravi de rester en contact pour de futurs projets.",
        time: "Lundi · 11:18",
      },
    ],
  },
];

const channels: Channel[] = [
  "gmail",
  "outlook",
  "whatsapp",
  "slack",
  "telegram",
];
const DESKTOP_CONVERSATIONS_PER_PAGE = 25;

export function ChannelsV4Preview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { emailAccountId, provider, userEmail } = useAccount();
  const {
    data: realThreads,
    error: threadsError,
    isLoading: threadsLoading,
    mutate: refreshThreads,
  } = usePreloadedPageData<ThreadsListResponse>(
    emailAccountId ? CHANNELS_THREADS_CACHE_KEY : null,
    {
      dedupingInterval: 60_000,
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );
  const requestedConversationId = searchParams.get("conversation");
  const taskTutorialRequested =
    searchParams.get("tutorial") === "channel-tasks";
  const setup = usePreviewSetupProgress();
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [labels, setLabels] = useState(initialLabels);
  const [folder, setFolder] = useState<Folder>("all");
  const [source, setSource] = useState<Channel | "all">("all");
  const [labelFilter, setLabelFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(
    initialConversations.some(
      (conversation) => conversation.id === requestedConversationId,
    )
      ? (requestedConversationId ?? "")
      : "",
  );
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [reply, setReply] = useState("");
  const [aiMode, setAiMode] = useState<AiMode>("manual");
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [analysisScope, setAnalysisScope] = useState<"thread" | "selection">(
    "thread",
  );
  const [acceptedSuggestion, setAcceptedSuggestion] = useState(false);
  const [organizationOpen, setOrganizationOpen] = useState(false);
  const [organizationIds, setOrganizationIds] = useState<string[]>([]);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState<EmailTaskPriority>("medium");
  const [taskCreating, setTaskCreating] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const [taskTutorialStep, setTaskTutorialStep] = useState<number | null>(
    taskTutorialRequested ? 1 : null,
  );
  const { data: selectedThread, mutate: refreshSelectedThread } = useThread(
    { id: selectedId || null },
    { parseReplies: true },
  );
  const connectedChannels = useMemo<Channel[]>(() => {
    const detected = new Set<Channel>(
      conversations.map((conversation) => conversation.channel),
    );
    if (provider === "google") detected.add("gmail");
    if (provider === "microsoft") detected.add("outlook");
    return channels.filter((channel) => detected.has(channel));
  }, [conversations, provider]);

  const loadedThreads = useMemo(() => {
    const byId = new Map(
      (realThreads?.threads ?? []).map((thread) => [thread.id, thread]),
    );
    return [...byId.values()];
  }, [realThreads]);

  useEffect(() => {
    setConversations(
      toRealChannelConversations({
        provider,
        threads: loadedThreads,
        userEmail,
      }),
    );
  }, [loadedThreads, provider, userEmail]);

  const loadMoreThreads = useCallback(async () => {
    const pageToken = realThreads?.nextPageToken;
    if (!emailAccountId || !pageToken || loadingMoreRef.current) return false;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const response = await fetch(
        `${CHANNELS_THREADS_CACHE_KEY}&nextPageToken=${encodeURIComponent(pageToken)}`,
        { headers: { [EMAIL_ACCOUNT_HEADER]: emailAccountId } },
      );
      if (!response.ok) throw new Error("threads_page_failed");
      const page = (await response.json()) as ThreadsListResponse;
      await refreshThreads(
        (current) => {
          if (!current) return page;
          const merged = new Map(
            [...current.threads, ...page.threads].map((thread) => [
              thread.id,
              thread,
            ]),
          );
          return {
            ...current,
            threads: [...merged.values()],
            nextPageToken: page.nextPageToken,
            totalCount: current.totalCount ?? page.totalCount,
          };
        },
        { revalidate: false },
      );
      return page.threads.length > 0;
    } catch {
      toastError({
        description: "Impossible de charger les messages suivants.",
      });
      return false;
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [emailAccountId, realThreads?.nextPageToken, refreshThreads]);

  useEffect(() => {
    if (!selectedThread?.thread) return;
    const detailed = toRealChannelConversation({
      provider,
      thread: selectedThread.thread,
      userEmail,
    });
    setConversations((current) => [
      detailed,
      ...current.filter((conversation) => conversation.id !== detailed.id),
    ]);
  }, [provider, selectedThread, userEmail]);

  const contactAddresses = useMemo(
    () => conversations.map(({ address }) => address),
    [conversations],
  );
  const { photos: contactPhotos, requiresContactsPermission } =
    useContactPhotos(contactAddresses);

  const enableGoogleContactPhotos = async () => {
    try {
      const authUrl = await getAccountLinkingUrl("google", {
        returnTo: "/channels-v4",
      });
      window.location.assign(authUrl);
    } catch {
      toastError({
        description: "Impossible d’ouvrir l’autorisation Google Contacts.",
      });
    }
  };

  useEffect(() => {
    if (taskTutorialRequested) setTaskTutorialStep((current) => current ?? 1);
  }, [taskTutorialRequested]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const matchesFolder =
        (folder === "all" &&
          !conversation.archived &&
          !conversation.draft &&
          !conversation.trashed) ||
        (folder === "unread" &&
          conversation.unread &&
          !conversation.archived &&
          !conversation.trashed) ||
        (folder === "starred" &&
          conversation.starred &&
          !conversation.archived &&
          !conversation.trashed) ||
        (folder === "attachments" &&
          conversation.attachment &&
          !conversation.archived &&
          !conversation.trashed) ||
        (folder === "sent" &&
          conversation.messages.some((message) => message.author === "me")) ||
        (folder === "drafts" && conversation.draft) ||
        (folder === "trash" && conversation.trashed);
      const matchesSource = source === "all" || conversation.channel === source;
      const matchesLabel =
        labelFilter === "all" ||
        (labelFilter === "__unlabeled"
          ? !conversation.labels?.length
          : conversation.labels?.includes(labelFilter));
      const labelNames = (conversation.labels ?? [])
        .map((id) => labels.find((label) => label.id === id)?.name ?? "")
        .join(" ");
      const matchesQuery =
        !normalized ||
        `${conversation.name} ${conversation.address} ${conversation.subject} ${conversation.preview} ${conversation.project ?? ""} ${labelNames}`
          .toLowerCase()
          .includes(normalized);
      return matchesFolder && matchesSource && matchesLabel && matchesQuery;
    });
  }, [conversations, folder, labelFilter, labels, query, source]);

  const selected =
    conversations.find((conversation) => conversation.id === selectedId) ??
    null;
  const showInitialLoading = threadsLoading && conversations.length === 0;
  const showThreadsError = Boolean(threadsError) && conversations.length === 0;

  const mobileConversations = useMemo<MobileChannelConversation[]>(
    () =>
      conversations.map((conversation) => ({
        id: conversation.id,
        name: conversation.name,
        subject: conversation.subject,
        preview: conversation.preview,
        channel: conversation.channel === "outlook" ? "Outlook" : "Gmail",
        unread: conversation.unread ? 1 : 0,
        time: conversation.time,
        avatarUrl:
          contactPhotos[conversation.address.toLowerCase()] ??
          conversation.avatarUrl,
        messages: conversation.messages.map((message) => ({
          id: message.id,
          author: message.author,
          body: message.body,
          time: message.time,
        })),
      })),
    [contactPhotos, conversations],
  );

  const openConversation = (id: string) => {
    setSelectedId(id);
    setReply("");
    setAcceptedSuggestion(false);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id
          ? { ...conversation, unread: false }
          : conversation,
      ),
    );
    if (taskTutorialStep === 1 && id === "sarah") setTaskTutorialStep(2);
  };

  const openTaskFromEmail = () => {
    if (!selected) return;
    if (taskTutorialStep === 2) {
      setTaskTutorialStep(3);
      return;
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTaskTitle(`Répondre à ${selected.name} — ${selected.subject}`);
    setTaskDue(tomorrow.toISOString().slice(0, 10));
    setTaskPriority(selected.unread ? "high" : "medium");
    setTaskDialogOpen(true);
  };

  const createTaskFromEmail = async () => {
    if (!selected || !taskTitle.trim() || taskCreating) return;
    setTaskCreating(true);
    try {
      const response = await fetch("/api/user/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [EMAIL_ACCOUNT_HEADER]: emailAccountId,
        },
        body: JSON.stringify({
          title: taskTitle.trim(),
          status: "todo",
          due: taskDue || null,
          priority: taskPriority,
          source: "ai",
          assignees: [],
          context: `E-mail de ${selected.name} : ${selected.subject}`,
          sourceThreadId: selected.id,
          contactName: selected.name,
        }),
      });
      if (response.status === 409) {
        toastError({
          title: "Tâche déjà créée",
          description: "Cette conversation possède déjà une tâche associée.",
        });
        return;
      }
      if (!response.ok) throw new Error("task_creation_failed");
      setTaskDialogOpen(false);
      toastSuccess({
        title: "Tâche créée",
        description: "La tâche est maintenant disponible dans Tâches.",
      });
    } catch {
      toastError({
        title: "Tâche non créée",
        description: "Vérifiez votre connexion puis réessayez.",
      });
    } finally {
      setTaskCreating(false);
    }
  };

  const finishTaskTutorial = () => {
    setup.saveTaskAutomation({
      enabled: true,
      requireApproval: true,
      rules: ["request", "commitment", "deadline"],
    });
    setTaskTutorialStep(4);
    toastSuccess({
      title: "Tâche créée",
      description: "Relire la version finale avec Sarah · demain à 9 h.",
    });
  };

  const closeTaskTutorial = () => {
    setTaskTutorialStep(null);
    router.replace("/channels-v4");
  };

  const openAi = (scope: "thread" | "selection") => {
    setAnalysisScope(scope);
    setAiOpen(true);
  };

  const openOrganization = (ids: string[]) => {
    if (!ids.length) return;
    setOrganizationIds(ids);
    setOrganizationOpen(true);
  };

  const sendReply = async () => {
    const clean = reply.trim();
    if (!selected || !clean) return;
    const lastMessage = selectedThread?.thread.messages.at(-1);
    const freescaleActivity = lastMessage?.headers.from
      ?.toLowerCase()
      .includes(userEmail.toLowerCase())
      ? "followup"
      : "reply";

    try {
      const result = await sendEmailAction(emailAccountId, {
        freescaleActivity,
        to: selected.address,
        subject: selected.subject,
        messageHtml: textToSafeHtml(clean),
        replyToEmail: lastMessage?.headers["message-id"]
          ? {
              threadId: selected.id,
              headerMessageId: lastMessage.headers["message-id"],
              messageId: lastMessage.id,
              references: lastMessage.headers.references,
            }
          : undefined,
      });
      if (result?.serverError || !result?.data) throw new Error("send_failed");

      setReply("");
      await Promise.all([refreshSelectedThread(), refreshThreads()]);
      toastSuccess({
        description: `Réponse envoyée via ${channelName(selected.channel)}.`,
      });
    } catch {
      toastError({
        title: "Réponse non envoyée",
        description: "Vérifiez la connexion Gmail puis réessayez.",
      });
    }
  };

  const sendMobileReply = async (conversationId: string, body: string) => {
    const conversation = conversations.find(({ id }) => id === conversationId);
    if (!conversation || selectedId !== conversationId) return false;
    const lastMessage = selectedThread?.thread.messages.at(-1);
    const freescaleActivity = lastMessage?.headers.from
      ?.toLowerCase()
      .includes(userEmail.toLowerCase())
      ? "followup"
      : "reply";
    const result = await sendEmailAction(emailAccountId, {
      freescaleActivity,
      to: conversation.address,
      subject: conversation.subject,
      messageHtml: textToSafeHtml(body),
      replyToEmail: lastMessage?.headers["message-id"]
        ? {
            threadId: conversation.id,
            headerMessageId: lastMessage.headers["message-id"],
            messageId: lastMessage.id,
            references: lastMessage.headers.references,
          }
        : undefined,
    });
    if (result?.serverError || !result?.data) {
      toastError({ description: "Impossible d’envoyer cette réponse." });
      return false;
    }
    await Promise.all([refreshSelectedThread(), refreshThreads()]);
    toastSuccess({ description: "Réponse envoyée via Gmail." });
    return true;
  };

  const sendMobileMessage = async (recipient: string, body: string) => {
    const result = await sendEmailAction(emailAccountId, {
      freescaleActivity: "message",
      to: recipient,
      subject: "Message depuis Freescale",
      messageHtml: textToSafeHtml(body),
    });
    if (result?.serverError || !result?.data) {
      toastError({ description: "Impossible d’envoyer ce message." });
      return false;
    }
    await refreshThreads();
    toastSuccess({ description: "Message envoyé via Gmail." });
    return true;
  };

  const sendNewMessage = async (
    recipient: string,
    subject: string,
    body: string,
  ) => {
    const result = await sendEmailAction(emailAccountId, {
      freescaleActivity: "message",
      to: recipient,
      subject: subject || "Message depuis Freescale",
      messageHtml: textToSafeHtml(body),
    });
    if (result?.serverError || !result?.data) {
      toastError({ description: "Impossible d’envoyer ce message." });
      return false;
    }
    await refreshThreads();
    toastSuccess({
      description: `Message envoyé via ${provider === "microsoft" ? "Outlook" : "Gmail"}.`,
    });
    return true;
  };

  const archiveMobileConversation = async (conversationId: string) => {
    const result = await archiveThreadAction(emailAccountId, {
      threadId: conversationId,
    });
    if (result?.serverError) {
      toastError({ description: "Impossible d’archiver cette conversation." });
      return false;
    }
    setSelectedId("");
    await refreshThreads();
    toastSuccess({ description: "Conversation archivée dans Gmail." });
    return true;
  };

  const trashMobileConversation = async (conversationId: string) => {
    const result = await trashThreadAction(emailAccountId, {
      threadId: conversationId,
    });
    if (result?.serverError) {
      toastError({
        description: "Impossible de supprimer cette conversation.",
      });
      return false;
    }
    setSelectedId("");
    await refreshThreads();
    toastSuccess({
      description: "Conversation placée dans la corbeille Gmail.",
    });
    return true;
  };

  const markMobileConversationRead = async (conversationId: string) => {
    const result = await markReadThreadAction(emailAccountId, {
      threadId: conversationId,
      read: true,
    });
    if (result?.serverError) {
      toastError({
        description: "Impossible de marquer cette conversation comme lue.",
      });
      return false;
    }
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, unread: false }
          : conversation,
      ),
    );
    await refreshThreads();
    return true;
  };

  const archiveSelected = async () => {
    if (!selected) return;
    const result = await archiveThreadAction(emailAccountId, {
      threadId: selected.id,
    });
    if (result?.serverError) {
      toastError({ description: "Impossible d’archiver cette conversation." });
      return;
    }
    setSelectedId("");
    await refreshThreads();
    toastSuccess({ description: "Conversation archivée dans Gmail." });
  };

  const trashSelected = async () => {
    if (!selected) return;
    const result = await trashThreadAction(emailAccountId, {
      threadId: selected.id,
    });
    if (result?.serverError) {
      toastError({
        description: "Impossible de supprimer cette conversation.",
      });
      return;
    }
    setSelectedId("");
    await refreshThreads();
    toastSuccess({
      description: "Conversation déplacée dans la corbeille Gmail.",
    });
  };

  const toggleSelectedUnread = async () => {
    if (!selected) return;
    const read = selected.unread;
    const result = await markReadThreadAction(emailAccountId, {
      threadId: selected.id,
      read,
    });
    if (result?.serverError) {
      toastError({ description: "Impossible de modifier l’état de lecture." });
      return;
    }
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selected.id
          ? { ...conversation, unread: !read }
          : conversation,
      ),
    );
    await refreshThreads();
    toastSuccess({
      description: read
        ? "Conversation marquée comme lue dans Gmail."
        : "Conversation marquée comme non lue dans Gmail.",
    });
  };

  return (
    <ContactPhotosContext.Provider value={contactPhotos}>
      <MobileChannelsPreview
        availableChannels={connectedChannels.filter(
          (channel): channel is "gmail" | "outlook" =>
            channel === "gmail" || channel === "outlook",
        )}
        conversations={mobileConversations}
        error={showThreadsError}
        loading={showInitialLoading}
        hasMore={Boolean(realThreads?.nextPageToken)}
        loadingMore={loadingMore}
        totalMessages={realThreads?.totalCount}
        onArchive={archiveMobileConversation}
        onCompose={sendMobileMessage}
        onCreateTask={(conversationId) => {
          if (selectedId !== conversationId) setSelectedId(conversationId);
          const conversation = conversations.find(
            ({ id }) => id === conversationId,
          );
          if (!conversation) return;
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          setTaskTitle(
            `Répondre à ${conversation.name} — ${conversation.subject}`,
          );
          setTaskDue(tomorrow.toISOString().slice(0, 10));
          setTaskPriority(conversation.unread ? "high" : "medium");
          setTaskDialogOpen(true);
        }}
        onMarkRead={markMobileConversationRead}
        onLoadMore={loadMoreThreads}
        onOpenConversation={openConversation}
        onReply={sendMobileReply}
        onRetry={async () => {
          await refreshThreads();
        }}
        onEnableContactPhotos={enableGoogleContactPhotos}
        requiresContactPhotosPermission={requiresContactsPermission}
        onTrash={trashMobileConversation}
        requestedConversationId={requestedConversationId}
      />
      <div className="hidden lg:block">
        <PageWrapper className="mb-0 flex h-[calc(100svh-4rem)] flex-col pb-4">
          <div className="flex min-h-14 shrink-0 items-end justify-between gap-4">
            <PageHeader
              title="Canaux"
              description="Tous vos échanges clients, sans le bruit."
            />
            <div className="flex items-center gap-2">
              {requiresContactsPermission && provider === "google" ? (
                <Button
                  className="hidden gap-2 sm:inline-flex"
                  onClick={enableGoogleContactPhotos}
                  size="sm"
                  variant="outline"
                >
                  Activer les photos Google
                </Button>
              ) : null}
              <Button
                className="hidden gap-2 sm:inline-flex"
                onClick={() => setModeDialogOpen(true)}
                size="sm"
                variant="outline"
              >
                <AiModeIcon mode={aiMode} />
                {aiModeLabel(aiMode)}
              </Button>
              <Button
                className="shrink-0 gap-2 rounded-[13px] border border-[#5989f0] bg-gradient-to-b from-[#2965ec] to-[#5c89f8] px-4 text-white shadow-[0_2px_10px_rgba(75,131,253,0.2)] transition-[background-image,filter] duration-200 hover:from-[#255ddd] hover:to-[#4d7ced] hover:brightness-[1.03]"
                onClick={() => setComposeOpen(true)}
              >
                <PlusIcon className="size-4" />
                <span className="hidden sm:inline">Nouveau message</span>
                <span className="sm:hidden">Nouveau</span>
              </Button>
            </div>
          </div>

          <Card className="mt-4 flex min-h-0 flex-1 overflow-hidden shadow-sm">
            {showInitialLoading ? (
              <ChannelsLoadingState
                channel={provider === "microsoft" ? "outlook" : "gmail"}
              />
            ) : showThreadsError ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <p className="font-medium text-sm">
                  Gmail n’a pas pu être synchronisé
                </p>
                <p className="mt-1 max-w-sm text-muted-foreground text-xs leading-5">
                  Vérifiez que le canal possède toujours les autorisations
                  Gmail, puis relancez la synchronisation.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => refreshThreads()}
                  size="sm"
                  variant="outline"
                >
                  Réessayer
                </Button>
              </div>
            ) : selected ? (
              <MessageReader
                conversation={selected}
                onCreateTask={openTaskFromEmail}
                onArchive={archiveSelected}
                onBack={() => {
                  setSelectedId("");
                  setReply("");
                }}
                onCreateDraft={() => {
                  if (!selected) return;
                  setReply(`Bonjour ${selected.name.split(" ")[0] ?? ""}, `);
                  toastSuccess({
                    description: "Brouillon préparé dans la réponse.",
                  });
                }}
                onOrganize={() => selected && openOrganization([selected.id])}
                onReplyChange={setReply}
                onResolve={() => {
                  if (!selected) return;
                  setConversations((current) =>
                    current.map((conversation) =>
                      conversation.id === selected.id
                        ? {
                            ...conversation,
                            resolved: !conversation.resolved,
                            unread: false,
                          }
                        : conversation,
                    ),
                  );
                  toastSuccess({
                    description: selected.resolved
                      ? "Conversation rouverte."
                      : "Conversation marquée comme traitée.",
                  });
                }}
                onSendReply={sendReply}
                onTrash={trashSelected}
                onToggleStar={() => {
                  if (!selected) return;
                  setConversations((current) =>
                    current.map((conversation) =>
                      conversation.id === selected.id
                        ? { ...conversation, starred: !conversation.starred }
                        : conversation,
                    ),
                  );
                }}
                onToggleUnread={toggleSelectedUnread}
                reply={reply}
                taskTutorialStep={taskTutorialStep}
              />
            ) : (
              <ConversationList
                allConversations={conversations}
                checkedIds={checkedIds}
                conversations={filtered}
                connectedChannels={connectedChannels}
                folder={folder}
                labelFilter={labelFilter}
                labels={labels}
                hasMore={Boolean(realThreads?.nextPageToken)}
                loadingMore={loadingMore}
                totalMessages={realThreads?.totalCount}
                onAnalyzeSelection={() => openAi("selection")}
                onCheck={setCheckedIds}
                onFolderChange={setFolder}
                onLabelFilterChange={setLabelFilter}
                onLoadMore={loadMoreThreads}
                onManageLabels={() => setTagManagerOpen(true)}
                onOpen={openConversation}
                onOrganizeSelection={() => openOrganization(checkedIds)}
                onQueryChange={setQuery}
                onSourceChange={setSource}
                query={query}
                source={source}
                taskTutorialStep={taskTutorialStep}
              />
            )}
          </Card>

          <NewMessageDialog
            availableChannels={connectedChannels}
            contacts={conversations}
            onSend={sendNewMessage}
            onOpenChange={setComposeOpen}
            open={composeOpen}
          />

          <TagManagerDialog
            conversations={conversations}
            labels={labels}
            onCreate={(name) => {
              const base = name
                .trim()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
              if (!base) return;
              const id = labels.some((label) => label.id === base)
                ? `${base}-${labels.length + 1}`
                : base;
              const tones: LabelTone[] = [
                "blue",
                "green",
                "orange",
                "rose",
                "slate",
              ];
              setLabels((current) => [
                ...current,
                {
                  id,
                  name: name.trim(),
                  tone: tones[current.length % tones.length] ?? "slate",
                },
              ]);
            }}
            onDelete={(id) => {
              setLabels((current) =>
                current.filter((label) => label.id !== id),
              );
              setConversations((current) =>
                current.map((conversation) => ({
                  ...conversation,
                  labels: conversation.labels?.filter(
                    (labelId) => labelId !== id,
                  ),
                })),
              );
              if (labelFilter === id) setLabelFilter("all");
            }}
            onOpenChange={setTagManagerOpen}
            onRename={(id, name) =>
              setLabels((current) =>
                current.map((label) =>
                  label.id === id ? { ...label, name: name.trim() } : label,
                ),
              )
            }
            open={tagManagerOpen}
          />

          <AiModeDialog
            aiMode={aiMode}
            onChange={setAiMode}
            onOpenChange={setModeDialogOpen}
            open={modeDialogOpen}
          />
          <OrganizationDialog
            conversations={conversations.filter((conversation) =>
              organizationIds.includes(conversation.id),
            )}
            labels={labels}
            onCreateLabel={(name) => {
              const base = name
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
              if (!base) return;
              const id = labels.some((label) => label.id === base)
                ? `${base}-${labels.length + 1}`
                : base;
              const tones: LabelTone[] = [
                "blue",
                "green",
                "orange",
                "rose",
                "slate",
              ];
              setLabels((current) => [
                ...current,
                {
                  id,
                  name: name.trim(),
                  tone: tones[current.length % tones.length] ?? "slate",
                },
              ]);
              setConversations((current) =>
                current.map((conversation) =>
                  organizationIds.includes(conversation.id)
                    ? {
                        ...conversation,
                        labels: [
                          ...new Set([...(conversation.labels ?? []), id]),
                        ],
                      }
                    : conversation,
                ),
              );
            }}
            onDeleteLabel={(id) => {
              setLabels((current) =>
                current.filter((label) => label.id !== id),
              );
              setConversations((current) =>
                current.map((conversation) => ({
                  ...conversation,
                  labels: conversation.labels?.filter(
                    (labelId) => labelId !== id,
                  ),
                })),
              );
              if (labelFilter === id) setLabelFilter("all");
            }}
            onOpenChange={(open) => {
              setOrganizationOpen(open);
              if (!open) setOrganizationIds([]);
            }}
            onProjectChange={(project) =>
              setConversations((current) =>
                current.map((conversation) =>
                  organizationIds.includes(conversation.id)
                    ? {
                        ...conversation,
                        project: project || undefined,
                        projectSource: project ? "manual" : undefined,
                      }
                    : conversation,
                ),
              )
            }
            onToggleLabel={(id, assigned) =>
              setConversations((current) =>
                current.map((conversation) => {
                  if (!organizationIds.includes(conversation.id))
                    return conversation;
                  const currentLabels = conversation.labels ?? [];
                  return {
                    ...conversation,
                    labels: assigned
                      ? [...new Set([...currentLabels, id])]
                      : currentLabels.filter((labelId) => labelId !== id),
                  };
                }),
              )
            }
            open={organizationOpen}
          />
          <OnDemandAiSheet
            accepted={acceptedSuggestion}
            conversation={selected}
            onAccept={() => {
              setAcceptedSuggestion(true);
              if (selected)
                setConversations((current) =>
                  current.map((conversation) =>
                    conversation.id === selected.id
                      ? {
                          ...conversation,
                          project: conversation.project ?? "Opérations Orbital",
                          projectSource: "ai",
                        }
                      : conversation,
                  ),
                );
              toastSuccess({
                description:
                  "Suggestion acceptée. Aucun autre élément n’a été modifié.",
              });
            }}
            onOpenChange={setAiOpen}
            onUseReply={(value) => {
              setReply(value);
              setAiOpen(false);
            }}
            open={aiOpen}
            scope={analysisScope}
            selectionCount={checkedIds.length}
          />
          <TaskCreationTutorial
            onClose={closeTaskTutorial}
            onConfirmTask={finishTaskTutorial}
            onContinue={() => setTaskTutorialStep(1)}
            onOpenRelations={() =>
              router.push("/stats?onboarding=task-created")
            }
            step={taskTutorialStep}
          />
          <TaskFromEmailDialog
            creating={taskCreating}
            due={taskDue}
            onConfirm={createTaskFromEmail}
            onDueChange={setTaskDue}
            onOpenChange={setTaskDialogOpen}
            onPriorityChange={setTaskPriority}
            onTitleChange={setTaskTitle}
            open={taskDialogOpen}
            priority={taskPriority}
            title={taskTitle}
          />
        </PageWrapper>
      </div>
    </ContactPhotosContext.Provider>
  );
}

function ChannelsLoadingState({ channel }: { channel: Channel }) {
  return (
    <div className="flex min-w-0 flex-1" role="status">
      <span className="sr-only">
        Synchronisation avec {channelName(channel)}…
      </span>
      <aside className="hidden w-16 shrink-0 border-r bg-muted/15 lg:flex lg:flex-col lg:items-center lg:py-5">
        <span className="flex size-10 items-center justify-center rounded-xl border bg-background shadow-sm">
          <ChannelIcon channel={channel} size="md" />
        </span>
      </aside>
      <section className="min-w-0 flex-1 px-4 py-4 lg:px-6">
        <div className="mb-4 flex items-center gap-3 border-b pb-4">
          <Skeleton className="h-9 w-64 max-w-[55%] rounded-lg" />
          <Skeleton className="ml-auto h-8 w-24 rounded-lg" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              className="flex items-center gap-4 rounded-xl px-3 py-3.5"
              key={index}
            >
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-36 rounded" />
                  <Skeleton className="ml-auto h-4 w-16 rounded" />
                </div>
                <Skeleton className="h-3.5 w-[72%] rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TaskFromEmailDialog({
  creating,
  due,
  onConfirm,
  onDueChange,
  onOpenChange,
  onPriorityChange,
  onTitleChange,
  open,
  priority,
  title,
}: {
  creating: boolean;
  due: string;
  onConfirm: () => void;
  onDueChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onPriorityChange: (value: EmailTaskPriority) => void;
  onTitleChange: (value: string) => void;
  open: boolean;
  priority: EmailTaskPriority;
  title: string;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer une tâche depuis cet e-mail</DialogTitle>
          <DialogDescription>
            Vérifiez les informations avant de l’ajouter. Rien n’est créé sans
            votre confirmation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="font-medium text-sm" htmlFor="email-task-title">
              Titre
            </label>
            <Input
              autoComplete="off"
              id="email-task-title"
              onChange={(event) => onTitleChange(event.target.value)}
              value={title}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor="email-task-due">
                Échéance
              </label>
              <Input
                id="email-task-due"
                min={new Date().toISOString().slice(0, 10)}
                onChange={(event) => onDueChange(event.target.value)}
                type="date"
                value={due}
              />
            </div>
            <div className="space-y-2">
              <label
                className="font-medium text-sm"
                htmlFor="email-task-priority"
              >
                Priorité
              </label>
              <Select
                onValueChange={(value) =>
                  onPriorityChange(value as EmailTaskPriority)
                }
                value={priority}
              >
                <SelectTrigger id="email-task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Normale</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-xl border bg-muted/35 px-3 py-2.5 text-muted-foreground text-xs leading-5">
            Seuls le titre, le contact, le sujet et le lien interne vers la
            conversation seront associés à la tâche. Le contenu complet du
            message n’est pas copié.
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={creating}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Annuler
          </Button>
          <Button disabled={creating || !title.trim()} onClick={onConfirm}>
            {creating ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <ListTodoIcon className="size-4" />
            )}
            Confirmer la création
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskCreationTutorial({
  onClose,
  onConfirmTask,
  onContinue,
  onOpenRelations,
  step,
}: {
  onClose: () => void;
  onConfirmTask: () => void;
  onContinue: () => void;
  onOpenRelations: () => void;
  step: number | null;
}) {
  if (step === null) return null;

  if (step === 0 || step === 4) {
    const completed = step === 4;
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4 backdrop-blur-[2px]">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border bg-background p-7 shadow-[0_28px_90px_-34px_rgba(15,23,42,.65)] sm:p-8">
          <button
            aria-label="Fermer le tutoriel"
            className="absolute right-5 top-5 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={onClose}
            type="button"
          >
            <XIcon className="size-4" />
          </button>
          <div
            className={cn(
              "grid size-14 place-items-center rounded-2xl",
              completed
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
            )}
          >
            {completed ? (
              <TrophyIcon className="size-7" />
            ) : (
              <ListTodoIcon className="size-7" />
            )}
          </div>
          <p className="mt-6 font-medium text-blue-600 text-xs uppercase tracking-[0.16em]">
            {completed
              ? "Configuration terminée"
              : "Didacticiel interactif · 1 min"}
          </p>
          <h2 className="mt-2 font-semibold text-2xl tracking-tight">
            {completed
              ? "Bravo, votre espace est prêt !"
              : "Transformez un message client en tâche"}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm leading-6">
            {completed
              ? "Mue peut maintenant repérer les demandes importantes. Vos premières tâches à accomplir sont prêtes et vous pouvez les suivre depuis Relations clients."
              : "Essayez le parcours sur un vrai échange : ouvrez la conversation, demandez à Mue de créer une tâche, puis gardez le contrôle avant de la valider."}
          </p>
          {completed ? (
            <div className="mt-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 dark:border-emerald-900/70 dark:bg-emerald-950/20">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                  <CheckCircle2Icon className="size-4" />
                </span>
                <div>
                  <p className="font-medium text-sm">
                    Relire la version finale avec Sarah
                  </p>
                  <p className="mt-1 text-emerald-800/75 text-xs dark:text-emerald-200/70">
                    Demain à 9 h · issue du message WhatsApp
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              aria-label="Étapes du tutoriel"
              className="mt-6 flex items-center gap-2"
              role="list"
            >
              {["Ouvrir", "Demander", "Valider"].map((label, index) => (
                <div
                  className="flex flex-1 items-center gap-2"
                  key={label}
                  role="listitem"
                >
                  <span className="grid size-6 place-items-center rounded-full bg-blue-600 font-semibold text-[11px] text-white">
                    {index + 1}
                  </span>
                  <span className="font-medium text-[11px] text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Button
            className={cn(
              "mt-7 w-full gap-2 rounded-xl",
              completed && "bg-emerald-600 hover:bg-emerald-700",
            )}
            onClick={completed ? onOpenRelations : onContinue}
          >
            {completed ? "Voir mes priorités clients" : "Commencer le tutoriel"}
            <ArrowRightIcon className="size-4" />
          </Button>
          {completed ? (
            <button
              className="mt-3 w-full py-1 text-muted-foreground text-xs hover:text-foreground"
              onClick={onClose}
              type="button"
            >
              Rester dans Canaux
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const copy =
    step === 1
      ? {
          eyebrow: "Vous êtes dans Canaux · Étape 1 sur 3",
          title: "Commencez par le message de Sarah",
          description:
            "Son dernier message contient une demande et une échéance. Cliquez sur sa conversation mise en évidence.",
        }
      : step === 2
        ? {
            eyebrow: "Étape 2 sur 3",
            title: "Demandez à Mue de créer la tâche",
            description:
              "Dans la barre de réponse, cliquez sur le tag « Créer une tâche ». Mue analysera uniquement cet échange.",
          }
        : {
            eyebrow: "Étape 3 sur 3",
            title: "Gardez le dernier mot",
            description:
              "Mue a détecté l’action et l’échéance. Vérifiez sa proposition avant de la créer.",
          };

  return (
    <aside className="fixed bottom-5 right-5 z-50 w-[min(390px,calc(100vw-2.5rem))] rounded-2xl border bg-background p-5 shadow-[0_24px_65px_-25px_rgba(15,23,42,.65)]">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          {step === 3 ? (
            <CheckCircle2Icon className="size-5" />
          ) : (
            <SparklesIcon className="size-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-blue-600 text-[10px] uppercase tracking-[0.14em]">
            {copy.eyebrow}
          </p>
          <h2 className="mt-1 font-semibold text-base">{copy.title}</h2>
        </div>
        <button
          aria-label="Quitter le tutoriel"
          className="rounded-full p-1 text-muted-foreground hover:bg-muted"
          onClick={onClose}
          type="button"
        >
          <XIcon className="size-4" />
        </button>
      </div>
      <p className="mt-3 text-muted-foreground text-sm leading-5">
        {copy.description}
      </p>
      {step === 3 ? (
        <div className="mt-4 overflow-hidden rounded-xl border bg-muted/20">
          <div className="border-b p-3.5">
            <p className="font-medium text-sm">
              Relire la version finale avec Sarah
            </p>
            <p className="mt-1 text-muted-foreground text-xs">
              Demain à 9 h · Sarah Lemoine
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 p-3.5">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs">
              <ShieldCheckIcon className="size-3.5" />
              Validation requise
            </span>
            <Button className="gap-1.5" onClick={onConfirmTask} size="sm">
              <CheckCircle2Icon className="size-4" />
              Créer la tâche
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      )}
    </aside>
  );
}

function _ChannelsFilterRail({
  conversations,
  folder,
  labelFilter,
  labels,
  onFolderChange,
  onLabelFilterChange,
  onNewLabel,
  onSourceChange,
  source,
}: {
  conversations: InboxConversation[];
  folder: Folder;
  labelFilter: string;
  labels: InboxLabel[];
  onFolderChange: (folder: Folder) => void;
  onLabelFilterChange: (label: string) => void;
  onNewLabel: () => void;
  onSourceChange: (source: Channel | "all") => void;
  source: Channel | "all";
}) {
  const resetSecondaryFilters = () => {
    onSourceChange("all");
    onLabelFilterChange("all");
  };
  const selectFolder = (nextFolder: Folder) => {
    resetSecondaryFilters();
    onFolderChange(nextFolder);
  };
  const selectSource = (nextSource: Channel) => {
    onFolderChange("all");
    onLabelFilterChange("all");
    onSourceChange(nextSource);
  };
  const selectLabel = (nextLabel: string) => {
    onFolderChange("all");
    onSourceChange("all");
    onLabelFilterChange(nextLabel);
  };
  const primaryActive =
    folder === "all" && source === "all" && labelFilter === "all";
  const visibleChannels = channels
    .map((channel) => ({
      channel,
      count: conversations.filter((item) => item.channel === channel).length,
    }))
    .filter((item) => item.count > 0);
  const unlabeledCount = conversations.filter(
    (conversation) => !conversation.labels?.length,
  ).length;
  const primaryCount = conversations.filter(
    (conversation) =>
      !conversation.archived && !conversation.draft && !conversation.trashed,
  ).length;

  return (
    <aside className="relative hidden w-14 shrink-0 bg-background xl:block">
      <div className="group/rail absolute inset-y-0 left-0 z-20 w-14 overflow-hidden border-r bg-background px-2 py-3 transition-[width,box-shadow] duration-200 ease-out hover:w-48 hover:shadow-xl focus-within:w-48 focus-within:shadow-xl">
        <nav
          aria-label="Filtres des conversations"
          className="w-44 space-y-0.5"
        >
          <FilterRailButton
            active={primaryActive}
            count={primaryCount}
            icon={<InboxIcon className="size-4" />}
            label="Principale"
            onClick={() => selectFolder("all")}
          />
          <FilterRailButton
            active={folder === "starred"}
            count={conversations.filter((item) => item.starred).length}
            icon={<StarIcon className="size-4" />}
            label="Favoris"
            onClick={() => selectFolder("starred")}
          />
          <FilterRailButton
            active={folder === "sent"}
            icon={<SendHorizontalIcon className="size-4" />}
            label="Envoyés"
            onClick={() => selectFolder("sent")}
          />
          <FilterRailButton
            active={folder === "drafts"}
            icon={<PenLineIcon className="size-4" />}
            label="Brouillons"
            onClick={() => selectFolder("drafts")}
          />
          <FilterRailButton
            active={folder === "trash"}
            icon={<Trash2Icon className="size-4" />}
            label="Corbeille"
            onClick={() => selectFolder("trash")}
          />

          <div className="py-4">
            <div className="w-10 border-t transition-[width] duration-200 group-hover/rail:w-full group-focus-within/rail:w-full" />
          </div>

          {visibleChannels.map(({ channel, count }) => (
            <FilterRailButton
              active={source === channel}
              count={count}
              icon={<ChannelIcon channel={channel} size="md" />}
              key={channel}
              label={channelName(channel)}
              onClick={() => selectSource(channel)}
            />
          ))}

          <div className="py-4">
            <div className="w-10 border-t transition-[width] duration-200 group-hover/rail:w-full group-focus-within/rail:w-full" />
          </div>

          {labels.map((label) => (
            <FilterRailButton
              active={labelFilter === label.id}
              count={
                conversations.filter((conversation) =>
                  conversation.labels?.includes(label.id),
                ).length
              }
              icon={
                <span
                  className={cn(
                    "size-2.5 rounded-[3px]",
                    labelDotClass(label.tone),
                  )}
                />
              }
              key={label.id}
              label={label.name}
              onClick={() => selectLabel(label.id)}
            />
          ))}
          <FilterRailButton
            active={labelFilter === "__unlabeled"}
            count={unlabeledCount}
            icon={<span className="size-2.5 rounded-[3px] bg-slate-500" />}
            label="Non classé"
            onClick={() => selectLabel("__unlabeled")}
          />
          <button
            className="mt-2 flex w-10 items-center gap-2.5 overflow-hidden whitespace-nowrap rounded-lg px-3 py-2 text-left font-medium text-[13px] text-blue-600 transition-[width,background-color] hover:bg-accent/50 group-hover/rail:w-full group-focus-within/rail:w-full"
            onClick={onNewLabel}
            title="Nouveau tag"
            type="button"
          >
            <PlusIcon className="size-4 shrink-0" />
            <span className="opacity-0 transition-opacity group-hover/rail:opacity-100 group-focus-within/rail:opacity-100">
              Nouveau tag
            </span>
          </button>
        </nav>
      </div>
    </aside>
  );
}

function FilterRailButton({
  active,
  count,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  count?: number;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-10 items-center gap-2.5 overflow-hidden whitespace-nowrap rounded-lg px-3 py-2 text-left text-[13px] transition-[width,background-color,color] group-hover/rail:w-full group-focus-within/rail:w-full",
        active
          ? "bg-accent font-medium text-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      )}
      onClick={onClick}
      title={label}
      type="button"
    >
      <span className="flex size-4 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate opacity-0 transition-opacity group-hover/rail:opacity-100 group-focus-within/rail:opacity-100">
        {label}
      </span>
      {count === undefined ? null : (
        <span className="shrink-0 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover/rail:opacity-100 group-focus-within/rail:opacity-100">
          {count}
        </span>
      )}
    </button>
  );
}

function ConversationList({
  allConversations,
  checkedIds,
  connectedChannels,
  conversations,
  folder,
  labelFilter,
  labels,
  hasMore,
  loadingMore,
  totalMessages,
  onAnalyzeSelection,
  onCheck,
  onFolderChange,
  onLabelFilterChange,
  onLoadMore,
  onManageLabels,
  onOpen,
  onOrganizeSelection,
  onQueryChange,
  onSourceChange,
  query,
  source,
  taskTutorialStep,
}: {
  allConversations: InboxConversation[];
  checkedIds: string[];
  connectedChannels: Channel[];
  conversations: InboxConversation[];
  folder: Folder;
  labelFilter: string;
  labels: InboxLabel[];
  hasMore: boolean;
  loadingMore: boolean;
  totalMessages?: number;
  onAnalyzeSelection: () => void;
  onCheck: (ids: string[]) => void;
  onFolderChange: (folder: Folder) => void;
  onLabelFilterChange: (label: string) => void;
  onLoadMore: () => Promise<boolean>;
  onManageLabels: () => void;
  onOpen: (id: string) => void;
  onOrganizeSelection: () => void;
  onQueryChange: (query: string) => void;
  onSourceChange: (source: Channel | "all") => void;
  query: string;
  source: Channel | "all";
  taskTutorialStep: number | null;
}) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [page, setPage] = useState(0);
  const pageStart = page * DESKTOP_CONVERSATIONS_PER_PAGE;
  const pageEnd = pageStart + DESKTOP_CONVERSATIONS_PER_PAGE;
  const pageConversations = conversations.slice(pageStart, pageEnd);
  const canGoNext = pageEnd < conversations.length || hasMore;
  const hasLocalNextPage = pageEnd < conversations.length;
  const filterKey = `${folder}:${labelFilter}:${source}:${query}`;
  const pageFilterKeyRef = useRef(filterKey);

  useEffect(() => {
    if (pageFilterKeyRef.current === filterKey) return;
    pageFilterKeyRef.current = filterKey;
    setPage(0);
  }, [filterKey]);

  const allChecked =
    pageConversations.length > 0 &&
    pageConversations.every((item) => checkedIds.includes(item.id));
  const toggleAll = () =>
    onCheck(
      allChecked
        ? checkedIds.filter(
            (id) => !pageConversations.some((item) => item.id === id),
          )
        : [
            ...new Set([
              ...checkedIds,
              ...pageConversations.map((item) => item.id),
            ]),
          ],
    );
  const folderLabel = {
    all: "Principale",
    unread: "Non lus",
    starred: "Favoris",
    attachments: "Pièces jointes",
    sent: "Envoyés",
    drafts: "Brouillons",
    trash: "Corbeille",
  }[folder];
  const activeFilters =
    Number(folder !== "all") +
    Number(source !== "all") +
    Number(labelFilter !== "all");
  return (
    <section className="flex min-w-0 flex-1 flex-col bg-background">
      <div className="shrink-0 border-b px-4 pb-3 pt-4 sm:px-5 lg:px-6">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 bg-muted/40 pl-9"
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Rechercher des messages..."
              value={query}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Filtrer les conversations"
                className="relative flex size-9 shrink-0 items-center justify-center p-0 [&_svg]:m-0"
                size="iconSm"
                variant="outline"
              >
                <Settings2Icon className="size-4" />
                {activeFilters ? (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-foreground text-[9px] text-background">
                    {activeFilters}
                  </span>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                Vue de la boîte de réception
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                onValueChange={(value) => onFolderChange(value as Folder)}
                value={folder}
              >
                <DropdownMenuRadioItem value="all">
                  Principale
                  <span className="ml-auto text-muted-foreground text-xs">
                    {
                      allConversations.filter(
                        (conversation) =>
                          !conversation.draft && !conversation.trashed,
                      ).length
                    }
                  </span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="unread">
                  Non lus
                  <span className="ml-auto text-muted-foreground text-xs">
                    {allConversations.filter((item) => item.unread).length}
                  </span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="starred">
                  Favoris
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="attachments">
                  Pièces jointes
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="sent">
                  Envoyés
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="drafts">
                  Brouillons
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="trash">
                  Corbeille
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              {connectedChannels.length > 1 ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Canal</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    onValueChange={(value) =>
                      onSourceChange(value as Channel | "all")
                    }
                    value={source}
                  >
                    <DropdownMenuRadioItem value="all">
                      Tous les canaux
                    </DropdownMenuRadioItem>
                    {connectedChannels.map((channel) => (
                      <DropdownMenuRadioItem key={channel} value={channel}>
                        <span className="flex size-4 items-center justify-center">
                          <ChannelIcon channel={channel} />
                        </span>
                        {channelName(channel)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Étiquette</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                onValueChange={onLabelFilterChange}
                value={labelFilter}
              >
                <DropdownMenuRadioItem value="all">
                  Toutes les étiquettes
                </DropdownMenuRadioItem>
                {labels.map((label) => (
                  <DropdownMenuRadioItem key={label.id} value={label.id}>
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        labelDotClass(label.tone),
                      )}
                    />
                    {label.name}
                    <span className="ml-auto text-muted-foreground text-xs">
                      {
                        allConversations.filter((conversation) =>
                          conversation.labels?.includes(label.id),
                        ).length
                      }
                    </span>
                  </DropdownMenuRadioItem>
                ))}
                <DropdownMenuRadioItem value="__unlabeled">
                  <span className="size-2 rounded-full bg-slate-500" />
                  Non classé
                  <span className="ml-auto text-muted-foreground text-xs">
                    {
                      allConversations.filter(
                        (conversation) => !conversation.labels?.length,
                      ).length
                    }
                  </span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {!selectionMode ? (
          <div
            aria-label="Filtrer rapidement par tag"
            className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
          >
            <button
              aria-pressed={labelFilter === "all"}
              className={cn(
                "inline-flex h-7 shrink-0 items-center rounded-full px-3 font-medium text-[11px] transition-colors",
                labelFilter === "all"
                  ? "bg-foreground text-background"
                  : "bg-muted/65 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              onClick={() => {
                onFolderChange("all");
                onSourceChange("all");
                onLabelFilterChange("all");
              }}
              type="button"
            >
              Tous les tags
            </button>
            {labels.map((label) => {
              const count = allConversations.filter(
                (conversation) =>
                  !conversation.archived &&
                  !conversation.draft &&
                  !conversation.trashed &&
                  conversation.labels?.includes(label.id),
              ).length;
              return (
                <button
                  aria-pressed={labelFilter === label.id}
                  className={cn(
                    "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 font-medium text-[11px] transition-colors",
                    labelFilter === label.id
                      ? "bg-foreground text-background"
                      : "bg-muted/65 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  key={label.id}
                  onClick={() => {
                    onFolderChange("all");
                    onSourceChange("all");
                    onLabelFilterChange(label.id);
                  }}
                  type="button"
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      labelDotClass(label.tone),
                    )}
                  />
                  {label.name}
                  <span
                    className={cn(
                      "text-[10px]",
                      labelFilter === label.id
                        ? "text-background/70"
                        : "text-muted-foreground/70",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
            <button
              className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-muted/35 px-2.5 font-medium text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={onManageLabels}
              type="button"
            >
              <Settings2Icon className="size-3.5" />
              Gérer
            </button>
          </div>
        ) : null}
        <div className="mt-2 flex h-7 items-center gap-2 px-0.5">
          {selectionMode ? (
            <>
              <Checkbox
                aria-label="Sélectionner toutes les conversations visibles"
                checked={allChecked}
                onCheckedChange={toggleAll}
              />
              <span className="text-xs">
                {checkedIds.length
                  ? `${checkedIds.length} sélectionnée${checkedIds.length > 1 ? "s" : ""}`
                  : "Sélectionner des messages"}
              </span>
              {checkedIds.length ? (
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    aria-label="Organiser les conversations sélectionnées"
                    onClick={onOrganizeSelection}
                    size="iconSm"
                    variant="ghost"
                  >
                    <TagIcon className="size-3.5" />
                  </Button>
                  <Button
                    className="gap-1.5"
                    onClick={onAnalyzeSelection}
                    size="xs-2"
                    variant="outline"
                  >
                    <SparklesIcon className="size-3.5" />
                    Demander à l’IA
                  </Button>
                </div>
              ) : null}
              <Button
                aria-label="Quitter la sélection"
                Icon={XIcon}
                onClick={() => {
                  onCheck([]);
                  setSelectionMode(false);
                }}
                size="iconSm"
                variant="ghost"
              />
            </>
          ) : (
            <>
              <span className="font-medium text-xs">{folderLabel}</span>
              <span className="text-muted-foreground text-xs">
                {folder === "all" &&
                labelFilter === "all" &&
                source === "all" &&
                !query.trim() &&
                totalMessages !== undefined
                  ? `${totalMessages} messages Gmail`
                  : `${conversations.length}${hasMore ? "+" : ""}`}
              </span>
              {source !== "all" ? (
                <Badge className="gap-1 border-0 bg-muted px-1.5 py-0 text-[10px] text-muted-foreground">
                  <ChannelIcon channel={source} />
                  {channelName(source)}
                </Badge>
              ) : null}
              {labelFilter !== "all" ? (
                <LabelPill
                  compact
                  label={labels.find((label) => label.id === labelFilter)}
                />
              ) : null}
              <button
                className="ml-auto text-muted-foreground text-xs transition-colors hover:text-foreground"
                onClick={() => setSelectionMode(true)}
                type="button"
              >
                Sélectionner
              </button>
            </>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3 lg:px-4">
        {pageConversations.map((conversation) => {
          const checked = checkedIds.includes(conversation.id);
          return (
            <div
              className={cn(
                "group my-1 flex rounded-xl transition-colors duration-150",
                conversation.unread
                  ? "bg-blue-50/45 hover:bg-blue-50/75 dark:bg-blue-950/15 dark:hover:bg-blue-950/25"
                  : "bg-background hover:bg-muted/35",
                taskTutorialStep === 1 &&
                  conversation.id === "sarah" &&
                  "relative z-40 ring-2 ring-blue-500 ring-offset-4 ring-offset-background shadow-[0_12px_36px_-16px_rgba(37,99,235,.6)] animate-pulse",
              )}
              key={conversation.id}
            >
              {selectionMode ? (
                <div className="flex shrink-0 items-start pl-3 pt-4">
                  <Checkbox
                    aria-label={`Sélectionner ${conversation.name}`}
                    checked={checked}
                    onCheckedChange={() =>
                      onCheck(
                        checked
                          ? checkedIds.filter((id) => id !== conversation.id)
                          : [...checkedIds, conversation.id],
                      )
                    }
                  />
                </div>
              ) : null}
              <button
                className="min-w-0 flex-1 cursor-pointer rounded-xl px-3 py-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 sm:px-4 lg:px-5"
                onClick={() => onOpen(conversation.id)}
                type="button"
              >
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <ChannelAvatar conversation={conversation} />
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={cn(
                          "min-w-0 truncate text-sm sm:text-[15px]",
                          conversation.unread ? "font-semibold" : "font-medium",
                        )}
                      >
                        {conversation.name}
                      </span>
                      {conversation.contactType ? (
                        <ContactTypePill
                          compact
                          type={conversation.contactType}
                        />
                      ) : null}
                      {conversation.starred ? (
                        <StarIcon className="size-3.5 shrink-0 fill-amber-400 text-amber-500" />
                      ) : null}
                      <span className="pointer-events-none ml-auto hidden translate-x-1 items-center gap-1 rounded-full border bg-background px-2 py-0.5 font-medium text-[10px] text-muted-foreground opacity-0 shadow-sm transition-[opacity,transform] duration-150 group-hover:translate-x-0 group-hover:opacity-100 lg:inline-flex">
                        <ChannelIcon channel={conversation.channel} />
                        {channelName(conversation.channel)}
                      </span>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 text-xs",
                          conversation.unread
                            ? "font-semibold text-blue-600"
                            : "text-muted-foreground",
                        )}
                      >
                        {conversation.unread ? (
                          <span className="size-1.5 rounded-full bg-blue-600" />
                        ) : null}
                        {conversation.time}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-muted-foreground text-xs leading-5 sm:text-sm">
                      {conversation.channel === "gmail" ||
                      conversation.channel === "outlook" ? (
                        <>
                          <span
                            className={cn(
                              "mr-1.5 text-foreground",
                              conversation.unread
                                ? "font-semibold"
                                : "font-medium",
                            )}
                          >
                            {conversation.subject}
                          </span>
                          <span aria-hidden="true">— </span>
                          <span>{conversation.preview}</span>
                        </>
                      ) : (
                        conversation.preview
                      )}
                    </p>
                    {conversation.attachment ? (
                      <span className="mt-2.5 inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-muted-foreground text-xs group-hover:bg-background/80">
                        <PaperclipIcon className="size-3.5" />1 pièce jointe
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
        {!conversations.length ? (
          <div className="py-16 text-center">
            <InboxIcon className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-sm">Aucun message trouvé</p>
          </div>
        ) : null}
      </div>
      {conversations.length ? (
        <div className="flex shrink-0 items-center justify-between border-t bg-background px-4 py-3 lg:px-5">
          <Button
            className="gap-1.5"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            size="sm"
            variant="outline"
          >
            <ArrowLeftIcon className="size-4" />
            Précédent
          </Button>
          <span className="font-medium text-muted-foreground text-xs">
            Page {page + 1}
          </span>
          <Button
            className="gap-1.5"
            disabled={!canGoNext || (loadingMore && !hasLocalNextPage)}
            onClick={async () => {
              if (pageEnd < conversations.length) {
                setPage((current) => current + 1);
                return;
              }
              if (await onLoadMore()) setPage((current) => current + 1);
            }}
            size="sm"
            variant="outline"
          >
            {loadingMore && !hasLocalNextPage ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : null}
            Suivant
            {!loadingMore || hasLocalNextPage ? (
              <ArrowRightIcon className="size-4" />
            ) : null}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function MessageReader({
  conversation,
  onArchive,
  onBack,
  onCreateDraft,
  onCreateTask,
  onOrganize,
  onReplyChange,
  onResolve,
  onSendReply,
  onTrash,
  onToggleStar,
  onToggleUnread,
  reply,
  taskTutorialStep,
}: {
  conversation: InboxConversation | null;
  onArchive: () => void;
  onBack: () => void;
  onCreateDraft: () => void;
  onCreateTask: () => void;
  onOrganize: () => void;
  onReplyChange: (reply: string) => void;
  onResolve: () => void;
  onSendReply: () => void;
  onTrash: () => void;
  onToggleStar: () => void;
  onToggleUnread: () => void;
  reply: string;
  taskTutorialStep: number | null;
}) {
  const [customerOpen, setCustomerOpen] = useState(false);
  const [mueDraftActive, setMueDraftActive] = useState(false);
  const [mueGenerating, setMueGenerating] = useState(false);
  const [attachments, setAttachments] = useState<
    { id: string; name: string; size: number }[]
  >([]);
  const [isDictating, setIsDictating] = useState(false);
  const [alternativeIndex, setAlternativeIndex] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const dictationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversationId = conversation?.id;
  const messageCount = conversation?.messages.length ?? 0;

  function stopSuggestion() {
    if (suggestionTimerRef.current !== null) {
      clearTimeout(suggestionTimerRef.current);
      suggestionTimerRef.current = null;
    }
    setMueGenerating(false);
  }

  function stopDictation() {
    if (dictationTimerRef.current !== null) {
      clearTimeout(dictationTimerRef.current);
      dictationTimerRef.current = null;
    }
    setIsDictating(false);
  }

  function insertIntoReply(value: string) {
    const current = reply.trimEnd();
    onReplyChange(`${current}${current ? " " : ""}${value}`);
    requestAnimationFrame(() => replyTextareaRef.current?.focus());
  }

  function toggleDictation() {
    if (isDictating) {
      stopDictation();
      return;
    }

    setMueDraftActive(false);
    setIsDictating(true);
    dictationTimerRef.current = setTimeout(() => {
      const firstName = conversation?.name.split(" ")[0] ?? "";
      insertIntoReply(`Bonjour ${firstName}, merci pour ton message.`);
      setIsDictating(false);
      dictationTimerRef.current = null;
    }, 1200);
  }

  function generateSuggestion(
    variant: "suggested" | "short" | "cordial" | "alternative" = "suggested",
  ) {
    if (!conversation) return;
    stopSuggestion();
    setMueDraftActive(true);
    setMueGenerating(true);
    onReplyChange("");
    const text = buildMueSuggestion(conversation, variant, alternativeIndex);
    const characters = Array.from(text);
    const startedAt = performance.now();
    const duration = Math.min(720, Math.max(360, characters.length * 3.5));

    const reveal = () => {
      const linearProgress = Math.min(
        1,
        (performance.now() - startedAt) / duration,
      );
      const progress = 1 - (1 - linearProgress) ** 3;
      const count = Math.max(1, Math.floor(characters.length * progress));
      onReplyChange(characters.slice(0, count).join(""));

      if (linearProgress < 1) {
        suggestionTimerRef.current = setTimeout(reveal, 18);
      } else {
        suggestionTimerRef.current = null;
        setMueGenerating(false);
      }
    };

    suggestionTimerRef.current = setTimeout(reveal, 100);
  }

  // A conversation always opens on a blank, manual reply. Mue only writes
  // after the user explicitly chooses one of the prompt chips.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the conversation id intentionally owns this lifecycle.
  useEffect(() => {
    if (!conversationId) return;
    stopSuggestion();
    stopDictation();
    setAlternativeIndex(0);
    setMueDraftActive(false);
    setAttachments([]);
    onReplyChange("");
    return () => {
      stopSuggestion();
      stopDictation();
    };
  }, [conversationId]);

  useLayoutEffect(() => {
    if (!conversationId || messageCount === 0) return;
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;
    scrollArea.scrollTop = scrollArea.scrollHeight;
  }, [conversationId, messageCount]);

  if (!conversation)
    return (
      <section className="hidden flex-1 items-center justify-center xl:flex">
        <p className="text-muted-foreground text-sm">
          Sélectionnez une conversation
        </p>
      </section>
    );
  return (
    <section className="@container/reader flex min-w-0 flex-1 flex-col bg-muted/60 dark:bg-muted/35">
      <div className="relative z-10 min-h-16 shrink-0 border-b bg-background px-3 py-2.5 shadow-[0_8px_20px_-18px_rgba(15,23,42,.22)] @md/reader:px-4 @2xl/reader:px-5">
        <div className="flex min-h-11 w-full items-center gap-0.5 @md/reader:gap-1">
          <Button
            aria-label="Retour à la boîte de réception"
            className="mr-1 shrink-0"
            Icon={ArrowLeftIcon}
            onClick={onBack}
            size="iconSm"
            variant="ghost"
          />
          <ChannelAvatar conversation={conversation} />
          <div className="ml-2 min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="truncate font-semibold text-sm @md/reader:text-[15px]">
                {conversation.name}
              </h2>
              {conversation.contactType ? (
                <ContactTypePill compact type={conversation.contactType} />
              ) : null}
            </div>
            <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs">
              <ChannelIcon channel={conversation.channel} />
              <span className="truncate">
                {conversation.channel === "gmail" ||
                conversation.channel === "outlook"
                  ? conversation.address
                  : `Réponse via ${channelName(conversation.channel)}`}
              </span>
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <TooltipProvider delayDuration={250}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label={
                      conversation.unread
                        ? "Marquer comme lu"
                        : "Marquer comme non lu"
                    }
                    Icon={MailIcon}
                    onClick={onToggleUnread}
                    size="iconSm"
                    variant="ghost"
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {conversation.unread
                    ? "Marquer comme lu"
                    : "Marquer comme non lu"}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Supprimer la conversation"
                    Icon={Trash2Icon}
                    onClick={onTrash}
                    size="iconSm"
                    variant="ghost"
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">Supprimer</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Archiver la conversation"
                    Icon={ArchiveIcon}
                    onClick={onArchive}
                    size="iconSm"
                    variant="ghost"
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">Archiver</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Organiser la conversation"
                    onClick={onOrganize}
                    size="iconSm"
                    variant="ghost"
                  >
                    <TagIcon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Ajouter une étiquette
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              aria-label="Marquer comme traitée"
              className={cn(
                "hidden @md/reader:inline-flex",
                conversation.resolved && "bg-blue-50 text-blue-700",
              )}
              Icon={CheckCircle2Icon}
              onClick={onResolve}
              size="iconSm"
              variant="ghost"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Plus d’actions"
                  className="hidden @md/reader:inline-flex"
                  Icon={MoreHorizontalIcon}
                  size="iconSm"
                  variant="ghost"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Conversation</DropdownMenuLabel>
                <DropdownMenuItem onSelect={onCreateDraft}>
                  <PenLineIcon />
                  Préparer une réponse
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    navigator.clipboard
                      ?.writeText(
                        `${window.location.origin}/channels-v4?conversation=${conversation.id}`,
                      )
                      .catch(() => undefined);
                    toastSuccess({
                      description: "Lien de la conversation copié.",
                    });
                  }}
                >
                  <LinkIcon />
                  Copier le lien
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={onTrash}
                >
                  <Trash2Icon />
                  Déplacer dans Corbeille
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-1">
              <Button
                className="hidden gap-2 border-0 bg-blue-50 text-blue-700 shadow-none hover:bg-blue-100 hover:text-blue-800 @lg/reader:inline-flex dark:bg-blue-950/40 dark:text-blue-300"
                onClick={() => setCustomerOpen(true)}
                size="sm"
                variant="outline"
              >
                <UsersRoundIcon className="size-4" />
                Fiche client
              </Button>
              <Button
                aria-label={
                  conversation.starred
                    ? "Retirer des favoris"
                    : "Ajouter aux favoris"
                }
                onClick={onToggleStar}
                size="iconSm"
                variant="ghost"
              >
                <StarIcon
                  className={cn(
                    "size-4",
                    conversation.starred && "fill-amber-400 text-amber-500",
                  )}
                />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
        ref={scrollAreaRef}
      >
        <div className="mx-auto w-full max-w-[64rem] px-3 pb-10 pt-6 @md/reader:px-5 @2xl/reader:px-8 @2xl/reader:pt-8">
          {conversation.channel === "gmail" ||
          conversation.channel === "outlook" ? (
            <div className="mb-5 border-b pb-5">
              <div className="flex items-start gap-3">
                <ChannelAvatar conversation={conversation} />
                <div className="min-w-0 flex-1">
                  <h1 className="text-pretty font-semibold text-lg leading-6 @md/reader:text-xl">
                    {conversation.subject}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 text-muted-foreground text-xs">
                    <span className="font-medium text-foreground">
                      {conversation.name}
                    </span>
                    <span>&lt;{conversation.address}&gt;</span>
                    <span className="ml-auto">{conversation.time}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground text-xs">
                    À moi · via {channelName(conversation.channel)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          {conversation.messages.map((message, index) => {
            const dateLabel = threadDateLabel(message.time);
            const previousDate =
              index > 0
                ? threadDateLabel(conversation.messages[index - 1]?.time ?? "")
                : null;
            return (
              <div key={message.id}>
                {index === 0 || dateLabel !== previousDate ? (
                  <div className="mb-8 mt-1 text-center font-medium text-muted-foreground/60 text-xs @md/reader:text-sm">
                    {dateLabel}
                  </div>
                ) : null}
                <div
                  className={cn(
                    "mb-8 flex gap-2.5 @md/reader:mb-10",
                    conversation.channel === "gmail" ||
                      conversation.channel === "outlook"
                      ? "items-start"
                      : "items-end",
                    message.author === "me" && "justify-end",
                  )}
                >
                  {message.author === "contact" &&
                  conversation.channel !== "gmail" &&
                  conversation.channel !== "outlook" ? (
                    <ChannelAvatar conversation={conversation} />
                  ) : null}
                  <div
                    className={cn(
                      conversation.channel === "gmail" ||
                        conversation.channel === "outlook"
                        ? "w-full max-w-none"
                        : "w-fit max-w-[88%] @lg/reader:max-w-[76%] @3xl/reader:max-w-[43rem]",
                      message.author === "me" && "text-right",
                    )}
                  >
                    <div
                      className={cn(
                        "text-left text-sm leading-6 @md/reader:text-[15px] @md/reader:leading-7",
                        conversation.channel === "gmail" ||
                          conversation.channel === "outlook"
                          ? "border-b border-border/70 bg-background px-4 py-5 @md/reader:px-6 @md/reader:py-6"
                          : cn(
                              "rounded-[1.25rem] border px-4 py-3 @md/reader:px-5 @md/reader:py-4",
                              message.author === "me"
                                ? "border-[#263f93] bg-[#263f93] text-white shadow-[0_5px_16px_-14px_rgba(38,63,147,.42)]"
                                : "border-border/80 bg-background text-foreground shadow-[0_4px_18px_-16px_rgba(15,23,42,.18)]",
                            ),
                      )}
                    >
                      {conversation.channel === "gmail" ||
                      conversation.channel === "outlook" ? (
                        <div className="mb-4 flex items-center gap-2 border-b pb-3 text-xs">
                          <span className="font-semibold">
                            {message.author === "me"
                              ? "Moi"
                              : conversation.name}
                          </span>
                          <span className="text-muted-foreground">
                            {message.author === "me"
                              ? `à ${conversation.address}`
                              : "à moi"}
                          </span>
                          <span className="ml-auto text-muted-foreground">
                            {threadTimeLabel(message.time)}
                          </span>
                        </div>
                      ) : null}
                      {message.body}
                      {message.attachment ? (
                        <div
                          className={cn(
                            "mt-3 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs",
                            message.author === "me"
                              ? "border-white/15 bg-white/10"
                              : "bg-muted/40",
                          )}
                        >
                          <FileIcon className="size-4" />
                          <span className="truncate">{message.attachment}</span>
                        </div>
                      ) : null}
                    </div>
                    {conversation.channel !== "gmail" &&
                    conversation.channel !== "outlook" ? (
                      <span
                        className={cn(
                          "mt-2 inline-block text-[10px] text-muted-foreground/60 @md/reader:text-xs",
                          message.author === "contact" && "ml-3",
                          message.author === "me" && "mr-3",
                        )}
                      >
                        {threadTimeLabel(message.time)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="shrink-0 bg-muted/60 px-3 pb-3 @md/reader:px-5 @md/reader:pb-5 @2xl/reader:px-8 dark:bg-muted/35">
        <div className="mx-auto w-full max-w-[61rem] overflow-hidden rounded-2xl border bg-background shadow-[0_14px_36px_-24px_rgba(15,23,42,.35)] transition-shadow focus-within:ring-2 focus-within:ring-ring">
          <Textarea
            aria-busy={mueGenerating}
            className={cn(
              "min-h-24 resize-none border-0 px-4 py-3.5 text-sm shadow-none transition-colors focus-visible:ring-0 @md/reader:min-h-28 @md/reader:text-[15px]",
              mueGenerating &&
                "bg-[linear-gradient(90deg,#64748b_0%,#2563eb_28%,#7c3aed_48%,#ec4899_68%,#64748b_100%)] bg-[length:240%_100%] bg-clip-text text-transparent [animation:mue-text-flow_1.8s_ease-in-out_infinite] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]",
            )}
            onChange={(event) => onReplyChange(event.target.value)}
            placeholder={
              mueGenerating
                ? "Mue prépare une réponse…"
                : `Votre réponse à ${conversation.name}…`
            }
            readOnly={mueGenerating}
            ref={replyTextareaRef}
            value={reply}
          />
          {attachments.length ? (
            <div className="flex flex-wrap gap-2 px-3 pb-3">
              {attachments.map((attachment) => (
                <span
                  className="inline-flex max-w-56 items-center gap-2 rounded-lg border bg-muted/35 px-2.5 py-1.5 text-xs"
                  key={attachment.id}
                >
                  <FileIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{attachment.name}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {Math.max(1, Math.round(attachment.size / 1024))} Ko
                  </span>
                  <button
                    aria-label={`Retirer ${attachment.name}`}
                    className="rounded-sm text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setAttachments((current) =>
                        current.filter((item) => item.id !== attachment.id),
                      )
                    }
                    type="button"
                  >
                    <XIcon className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <input
            className="hidden"
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              setAttachments((current) => [
                ...current,
                ...files.map((file) => ({
                  id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
                  name: file.name,
                  size: file.size,
                })),
              ]);
              event.target.value = "";
            }}
            ref={attachmentInputRef}
            type="file"
          />
          <div className="flex flex-wrap items-center gap-1 border-t bg-muted/25 px-2 py-2">
            <Button
              aria-label="Joindre un fichier"
              Icon={PaperclipIcon}
              onClick={() => attachmentInputRef.current?.click()}
              size="iconSm"
              variant="ghost"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Mentionner quelqu’un"
                  Icon={AtSignIcon}
                  size="iconSm"
                  variant="ghost"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuLabel>Ajouter une mention</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() =>
                    insertIntoReply(`@${conversation.name.replaceAll(" ", "")}`)
                  }
                >
                  <ChannelAvatar conversation={conversation} />
                  <span className="truncate">{conversation.name}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertIntoReply("@Mue")}>
                  <SparklesIcon className="size-4 text-blue-600" />
                  Mue
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Ajouter un emoji"
                  Icon={SmileIcon}
                  size="iconSm"
                  variant="ghost"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-auto p-2">
                <div className="grid grid-cols-6 gap-1">
                  {["👍", "😊", "🙏", "✅", "🎉", "👀"].map((emoji) => (
                    <button
                      aria-label={`Ajouter ${emoji}`}
                      className="grid size-8 place-items-center rounded-md text-base hover:bg-muted"
                      key={emoji}
                      onClick={() => insertIntoReply(emoji)}
                      type="button"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 font-medium text-[10px] text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-wait disabled:opacity-50 dark:border-blue-800 dark:bg-blue-950/35 dark:text-blue-300"
              disabled={mueGenerating}
              onClick={() => generateSuggestion("suggested")}
              type="button"
            >
              {mueGenerating ? (
                <LoaderCircleIcon className="size-3.5 animate-spin" />
              ) : (
                <SparklesIcon className="size-3.5" />
              )}
              {mueGenerating ? "Mue écrit…" : "Suggérer avec Mue"}
            </button>
            <button
              className={cn(
                "inline-flex min-h-8 items-center gap-1.5 rounded-lg border bg-background px-2.5 font-medium text-[10px] text-foreground transition-colors hover:bg-muted",
                taskTutorialStep === 2 &&
                  "relative z-40 border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500 ring-offset-2 ring-offset-background shadow-[0_8px_28px_-12px_rgba(37,99,235,.7)] animate-pulse dark:bg-blue-950/40 dark:text-blue-300",
              )}
              onClick={onCreateTask}
              type="button"
            >
              <ListTodoIcon className="size-3.5" />
              Créer une tâche
            </button>
            {mueDraftActive && !mueGenerating ? (
              <>
                <button
                  className="inline-flex min-h-8 items-center rounded-lg border bg-background px-2.5 font-medium text-[10px] text-foreground transition-colors hover:bg-muted"
                  onClick={() => generateSuggestion("short")}
                  type="button"
                >
                  Faire plus court
                </button>
                <button
                  className="inline-flex min-h-8 items-center rounded-lg border bg-background px-2.5 font-medium text-[10px] text-foreground transition-colors hover:bg-muted"
                  onClick={() => generateSuggestion("cordial")}
                  type="button"
                >
                  Rendre plus cordial
                </button>
                <button
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border bg-background px-2.5 font-medium text-[10px] text-foreground transition-colors hover:bg-muted"
                  onClick={() => {
                    setAlternativeIndex((current) => current + 1);
                    generateSuggestion("alternative");
                  }}
                  type="button"
                >
                  <RotateCcwIcon className="size-3.5" />
                  Autre proposition
                </button>
              </>
            ) : null}
            <Button
              aria-label={
                isDictating ? "Arrêter la dictée" : "Dicter la réponse"
              }
              className={cn(
                "ml-auto",
                isDictating &&
                  "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/35 dark:text-rose-300",
              )}
              Icon={MicIcon}
              onClick={toggleDictation}
              size="iconSm"
              variant="ghost"
            />
            <Button
              aria-label="Envoyer la réponse"
              className="ml-1 rounded-l-full rounded-r-none pl-3"
              disabled={!reply.trim()}
              Icon={SendHorizontalIcon}
              onClick={() => {
                onSendReply();
                setMueDraftActive(false);
                setAttachments([]);
              }}
              size="iconSm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Options d’envoi"
                  className="rounded-l-none rounded-r-full border-l border-primary-foreground/20 px-2"
                  disabled={!reply.trim()}
                  Icon={ChevronDownIcon}
                  size="iconSm"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Options d’envoi</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    toastSuccess({
                      description: "Message programmé pour demain à 9 h.",
                    });
                    onReplyChange("");
                    setAttachments([]);
                    setMueDraftActive(false);
                  }}
                >
                  <CalendarClockIcon className="size-4" />
                  Programmer demain à 9 h
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    toastSuccess({ description: "Brouillon enregistré." })
                  }
                >
                  <FileIcon className="size-4" />
                  Enregistrer le brouillon
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <Sheet open={customerOpen} onOpenChange={setCustomerOpen}>
        <SheetContent className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Fiche client</SheetTitle>
            <SheetDescription>
              Contexte lié à cette conversation, modifiable depuis Relations
              clients.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 flex items-center gap-3 border-b pb-5">
            <ChannelAvatar conversation={conversation} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{conversation.name}</p>
              <p className="mt-0.5 truncate text-muted-foreground text-sm">
                {conversation.address}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <CustomerDetail label="Type de contact">
              {conversation.contactType ? (
                <ContactTypePill type={conversation.contactType} />
              ) : (
                <span className="text-muted-foreground text-sm">
                  Non renseigné
                </span>
              )}
            </CustomerDetail>
            <CustomerDetail label="Canal principal">
              <span className="inline-flex items-center gap-2 font-medium text-sm">
                <ChannelIcon channel={conversation.channel} size="md" />
                {channelName(conversation.channel)}
              </span>
            </CustomerDetail>
            <CustomerDetail label="Projet associé">
              <span className="font-medium text-sm">
                {conversation.project ?? "Aucun projet"}
              </span>
            </CustomerDetail>
            <CustomerDetail label="Dernière activité">
              <span className="font-medium text-sm">{conversation.time}</span>
            </CustomerDetail>
          </div>
          <Button
            className="mt-7 w-full"
            onClick={() => {
              setCustomerOpen(false);
              toastSuccess({
                description: `Fiche de ${conversation.name} ouverte dans Relations clients.`,
              });
            }}
            variant="outline"
          >
            <UsersRoundIcon className="size-4" />
            Ouvrir dans Relations clients
          </Button>
        </SheetContent>
      </Sheet>
    </section>
  );
}

function CustomerDetail({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/40 px-3.5 py-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="min-w-0 text-right">{children}</span>
    </div>
  );
}

function threadDateLabel(time: string) {
  if (time.includes("Hier")) return "Hier";
  if (time.includes("Mardi")) return "Mardi";
  if (time.includes("Lundi")) return "Lundi";
  return "Aujourd’hui";
}

function threadTimeLabel(time: string) {
  return time.includes("·") ? (time.split("·").at(-1)?.trim() ?? time) : time;
}

function textToSafeHtml(text: string) {
  const escaped = text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  return `<p>${escaped.replaceAll("\n", "<br>")}</p>`;
}

function buildMueSuggestion(
  conversation: InboxConversation,
  variant: "suggested" | "short" | "cordial" | "alternative",
  alternativeIndex: number,
) {
  const firstName = conversation.name.split(" ")[0] ?? conversation.name;
  const subject = conversation.subject.toLocaleLowerCase("fr");

  if (variant === "short") {
    return `Bonjour ${firstName}, bien reçu. Je m’en occupe et je reviens vers toi rapidement.`;
  }
  if (variant === "cordial") {
    return `Bonjour ${firstName}, merci beaucoup pour ton message et pour ces précisions. Je prends bien en compte ton retour concernant « ${subject} » et je te partage une mise à jour très rapidement.`;
  }
  if (variant === "alternative") {
    const alternatives = [
      `Bonjour ${firstName}, merci pour ton retour. Je vérifie les derniers éléments liés à « ${subject} » et je reviens vers toi avec une réponse claire dans la journée.`,
      `Bonjour ${firstName}, c’est bien noté. Je reprends le sujet « ${subject} » avec l’équipe et je te confirme la suite dès que possible.`,
      `Bonjour ${firstName}, merci pour ces éléments. Je finalise le point sur « ${subject} » et je t’envoie la prochaine étape rapidement.`,
    ];
    return alternatives[alternativeIndex % alternatives.length] ?? "";
  }
  return `Bonjour ${firstName}, merci pour ton message. Je prends en compte ton retour concernant « ${subject} » et je te partage une mise à jour rapidement.`;
}

function NewMessageDialog({
  availableChannels,
  contacts,
  onSend,
  onOpenChange,
  open,
}: {
  availableChannels: Channel[];
  contacts: InboxConversation[];
  onSend: (
    recipient: string,
    subject: string,
    message: string,
  ) => Promise<boolean>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [channel, setChannel] = useState<Channel>("gmail");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const firstChannel = availableChannels[0];
    if (firstChannel && !availableChannels.includes(channel)) {
      setChannel(firstChannel);
    }
  }, [availableChannels, channel]);

  const suggestedContacts = useMemo(() => {
    const query = recipient.trim().toLocaleLowerCase("fr");
    const isEmailChannel = channel === "gmail" || channel === "outlook";
    const seen = new Set<string>();

    return contacts
      .filter((contact) => {
        const compatible = isEmailChannel
          ? contact.channel === "gmail" || contact.channel === "outlook"
          : contact.channel === channel;
        const matches =
          !query ||
          contact.name.toLocaleLowerCase("fr").includes(query) ||
          contact.address.toLocaleLowerCase("fr").includes(query);
        if (!compatible || !matches || seen.has(contact.address)) return false;
        seen.add(contact.address);
        return true;
      })
      .sort((a, b) => {
        if (a.channel === channel && b.channel !== channel) return -1;
        if (a.channel !== channel && b.channel === channel) return 1;
        return Number(b.unread) - Number(a.unread);
      })
      .slice(0, 5);
  }, [channel, contacts, recipient]);

  const reset = () => {
    setChannel("gmail");
    setRecipient("");
    setSubject("");
    setMessage("");
    setShowSuggestions(false);
  };

  const submit = async () => {
    const cleanRecipient = recipient.trim();
    const cleanMessage = message.trim();
    if (!cleanRecipient || !cleanMessage) return;
    setSending(true);
    try {
      const sent = await onSend(cleanRecipient, subject.trim(), cleanMessage);
      if (!sent) return;
      reset();
      onOpenChange(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) reset();
      }}
      open={open}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
            <PenLineIcon className="size-4" />
          </div>
          <DialogTitle>Nouveau message</DialogTitle>
          <DialogDescription>
            Démarrez une conversation depuis l’un de vos canaux connectés.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit().catch(() => undefined);
          }}
        >
          {availableChannels.length > 1 ? (
            <div className="space-y-1.5">
              <label
                className="font-medium text-sm"
                htmlFor="new-message-channel"
              >
                Canal
              </label>
              <Select
                onValueChange={(value) => setChannel(value as Channel)}
                value={channel}
              >
                <SelectTrigger id="new-message-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableChannels.map((item) => (
                    <SelectItem key={item} value={item}>
                      <span className="flex items-center gap-2">
                        <ChannelIcon channel={item} size="md" />
                        {channelName(item)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="relative space-y-1.5">
            <label
              className="font-medium text-sm"
              htmlFor="new-message-recipient"
            >
              Destinataire
            </label>
            <Input
              autoFocus
              id="new-message-recipient"
              onBlur={() =>
                window.setTimeout(() => setShowSuggestions(false), 120)
              }
              onClick={() => setShowSuggestions(true)}
              onChange={(event) => {
                setRecipient(event.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={
                channel === "whatsapp" || channel === "telegram"
                  ? "Nom, identifiant ou numéro"
                  : channel === "slack"
                    ? "Nom ou identifiant Slack"
                    : "Nom ou adresse e-mail"
              }
              value={recipient}
            />
            {showSuggestions && suggestedContacts.length > 0 ? (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border/80 bg-background p-1.5 shadow-[0_18px_45px_-20px_rgba(15,23,42,0.38)]">
                <p className="px-2.5 pb-1.5 pt-1 font-medium text-[11px] text-muted-foreground">
                  {recipient.trim()
                    ? "Contacts correspondants"
                    : "Contacts suggérés"}
                </p>
                {suggestedContacts.map((contact) => (
                  <button
                    className="group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted/60"
                    key={contact.id}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setRecipient(contact.address);
                      setShowSuggestions(false);
                    }}
                    type="button"
                  >
                    <ChannelAvatar conversation={contact} small />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-sm">
                        {contact.name}
                      </span>
                      <span className="mt-0.5 block truncate text-muted-foreground text-xs">
                        {contact.address}
                      </span>
                    </span>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/60 transition-colors group-hover:bg-background">
                      <ChannelIcon channel={contact.channel} size="sm" />
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label
              className="font-medium text-sm"
              htmlFor="new-message-subject"
            >
              Objet{" "}
              <span className="font-normal text-muted-foreground">
                (facultatif)
              </span>
            </label>
            <Input
              id="new-message-subject"
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Objet de la conversation"
              value={subject}
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-sm" htmlFor="new-message-body">
              Message
            </label>
            <Textarea
              className="min-h-28 resize-none"
              id="new-message-body"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Écrivez votre message…"
              value={message}
            />
          </div>

          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Annuler
            </Button>
            <Button
              className="gap-2 rounded-[11px] border border-[#5989f0] bg-gradient-to-b from-[#2965ec] to-[#5c89f8] text-white hover:from-[#255ddd] hover:to-[#4d7ced]"
              disabled={sending || !recipient.trim() || !message.trim()}
              type="submit"
            >
              {sending ? "Envoi…" : `Envoyer via ${channelName(channel)}`}
              <SendHorizontalIcon className="size-4" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TagManagerDialog({
  conversations,
  labels,
  onCreate,
  onDelete,
  onOpenChange,
  onRename,
  open,
}: {
  conversations: InboxConversation[];
  labels: InboxLabel[];
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
  onOpenChange: (open: boolean) => void;
  onRename: (id: string, name: string) => void;
  open: boolean;
}) {
  const [newTag, setNewTag] = useState("");
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setDraftNames(
      Object.fromEntries(labels.map((label) => [label.id, label.name])),
    );
    setNewTag("");
  }, [labels, open]);

  const createTag = () => {
    const value = newTag.trim();
    if (!value) return;
    onCreate(value);
    setNewTag("");
    toastSuccess({ description: `Tag « ${value} » créé.` });
  };

  const saveChanges = () => {
    for (const label of labels) {
      const nextName = draftNames[label.id]?.trim();
      if (nextName && nextName !== label.name) onRename(label.id, nextName);
    }
    toastSuccess({ description: "Tags mis à jour." });
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-muted">
            <TagIcon className="size-4" />
          </div>
          <DialogTitle>Gérer les tags</DialogTitle>
          <DialogDescription>
            Créez, renommez ou supprimez les tags utilisés pour trier vos
            conversations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              createTag();
            }}
          >
            <Input
              aria-label="Nom du nouveau tag"
              className="h-10"
              onChange={(event) => setNewTag(event.target.value)}
              placeholder="Nom du nouveau tag"
              value={newTag}
            />
            <Button disabled={!newTag.trim()} size="sm" type="submit">
              <PlusIcon className="size-4" />
              Créer
            </Button>
          </form>

          <div className="overflow-hidden rounded-xl border">
            {labels.map((label, index) => {
              const usageCount = conversations.filter((conversation) =>
                conversation.labels?.includes(label.id),
              ).length;
              return (
                <div
                  className={cn(
                    "flex min-h-14 items-center gap-3 px-3",
                    index > 0 && "border-t",
                  )}
                  key={label.id}
                >
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      labelDotClass(label.tone),
                    )}
                  />
                  <Input
                    aria-label={`Renommer le tag ${label.name}`}
                    className="h-9 min-w-0 flex-1 border-transparent bg-transparent px-2 shadow-none hover:border-border focus-visible:border-border"
                    onChange={(event) =>
                      setDraftNames((current) => ({
                        ...current,
                        [label.id]: event.target.value,
                      }))
                    }
                    value={draftNames[label.id] ?? label.name}
                  />
                  <span className="shrink-0 text-muted-foreground text-xs">
                    {usageCount} conversation{usageCount > 1 ? "s" : ""}
                  </span>
                  <ConfirmDialog
                    cancelText="Annuler"
                    confirmText="Supprimer"
                    description={
                      usageCount
                        ? `Le tag « ${label.name} » sera retiré de ${usageCount} conversation${usageCount > 1 ? "s" : ""}. Les messages ne seront pas supprimés.`
                        : `Le tag « ${label.name} » sera supprimé. Il n’est associé à aucune conversation.`
                    }
                    onConfirm={() => {
                      onDelete(label.id);
                      toastSuccess({
                        description: `Tag « ${label.name} » supprimé.`,
                      });
                    }}
                    title={`Supprimer « ${label.name} » ?`}
                    trigger={
                      <Button
                        aria-label={`Supprimer le tag ${label.name}`}
                        size="iconSm"
                        variant="ghost"
                      >
                        <Trash2Icon className="size-3.5 text-muted-foreground" />
                      </Button>
                    }
                  />
                </div>
              );
            })}
            {!labels.length ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                Aucun tag. Créez le premier ci-dessus.
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Annuler
          </Button>
          <Button onClick={saveChanges}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OrganizationDialog({
  conversations,
  labels,
  onCreateLabel,
  onDeleteLabel,
  onOpenChange,
  onProjectChange,
  onToggleLabel,
  open,
}: {
  conversations: InboxConversation[];
  labels: InboxLabel[];
  onCreateLabel: (name: string) => void;
  onDeleteLabel: (id: string) => void;
  onOpenChange: (open: boolean) => void;
  onProjectChange: (project: string) => void;
  onToggleLabel: (id: string, assigned: boolean) => void;
  open: boolean;
}) {
  const [newLabel, setNewLabel] = useState("");
  const projectValues = new Set(
    conversations.map((conversation) => conversation.project ?? ""),
  );
  const commonProject =
    projectValues.size === 1 ? ([...projectValues][0] ?? "") : null;
  const submitLabel = () => {
    const value = newLabel.trim();
    if (!value) return;
    onCreateLabel(value);
    setNewLabel("");
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-muted">
            <TagIcon className="size-4" />
          </div>
          <DialogTitle>
            {conversations.length > 1
              ? `Organiser ${conversations.length} conversations`
              : "Organiser la conversation"}
          </DialogTitle>
          <DialogDescription>
            Associez des étiquettes et un projet. Rien n’est déduit ni modifié
            par l’IA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div>
            <p className="mb-2 font-medium text-sm">Projet</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full justify-between" variant="outline">
                  <span className="min-w-0 truncate">
                    {commonProject === null
                      ? "Plusieurs projets"
                      : commonProject || "Aucun projet"}
                  </span>
                  <Settings2Icon className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel>Associer un projet</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  onValueChange={(value) =>
                    onProjectChange(value === "none" ? "" : value)
                  }
                  value={
                    commonProject === null
                      ? "__multiple"
                      : commonProject || "none"
                  }
                >
                  <DropdownMenuRadioItem value="none">
                    Aucun projet
                  </DropdownMenuRadioItem>
                  {projects.map((project) => (
                    <DropdownMenuRadioItem key={project} value={project}>
                      {project}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium text-sm">Étiquettes</p>
              <span className="text-muted-foreground text-xs">
                Sélectionnez celles qui s’appliquent
              </span>
            </div>
            <div className="overflow-hidden rounded-lg border">
              {labels.map((label, index) => {
                const matching = conversations.filter((conversation) =>
                  conversation.labels?.includes(label.id),
                ).length;
                const checked = matching === conversations.length;
                const indeterminate = matching > 0 && !checked;
                return (
                  <div
                    className={cn(
                      "flex min-h-11 items-center gap-3 px-3",
                      index > 0 && "border-t",
                    )}
                    key={label.id}
                  >
                    <Checkbox
                      aria-label={`Associer l’étiquette ${label.name}`}
                      checked={indeterminate ? "indeterminate" : checked}
                      onCheckedChange={() => onToggleLabel(label.id, !checked)}
                    />
                    <LabelPill label={label} />
                    {indeterminate ? (
                      <span className="ml-auto text-muted-foreground text-xs">
                        Certaines
                      </span>
                    ) : null}
                    <ConfirmDialog
                      description={`Cette action retire « ${label.name} » de toutes les conversations. Les messages et les projets ne seront pas affectés.`}
                      onConfirm={() => onDeleteLabel(label.id)}
                      title={`Supprimer « ${label.name} » ?`}
                      trigger={
                        <Button
                          aria-label={`Supprimer ${label.name}`}
                          className={cn("ml-auto", indeterminate && "ml-0")}
                          size="iconSm"
                          variant="ghost"
                        >
                          <Trash2Icon className="size-3.5 text-muted-foreground" />
                        </Button>
                      }
                    />
                  </div>
                );
              })}
              {!labels.length ? (
                <p className="px-3 py-5 text-center text-muted-foreground text-sm">
                  Aucune étiquette
                </p>
              ) : null}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                onChange={(event) => setNewLabel(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submitLabel();
                  }
                }}
                placeholder="Créer une étiquette..."
                value={newLabel}
              />
              <Button
                aria-label="Créer l’étiquette"
                disabled={!newLabel.trim()}
                onClick={submitLabel}
                size="icon"
                variant="outline"
              >
                <PlusIcon className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              onOpenChange(false);
              toastSuccess({
                description:
                  conversations.length > 1
                    ? `${conversations.length} conversations organisées.`
                    : "Conversation organisée.",
              });
            }}
          >
            Terminer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LabelPill({
  compact = false,
  label,
}: {
  compact?: boolean;
  label?: InboxLabel;
}) {
  if (!label) return null;
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 rounded-full font-medium",
        compact ? "max-w-24 px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-xs",
        labelPillClass(label.tone),
      )}
    >
      <span className="truncate">{label.name}</span>
    </span>
  );
}

function ContactTypePill({
  compact = false,
  type,
}: {
  compact?: boolean;
  type: ContactType;
}) {
  const content: Record<ContactType, { label: string; className: string }> = {
    client: {
      label: "Client",
      className:
        "border-0 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    },
    provider: {
      label: "Prestataire",
      className:
        "border-0 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    },
    collaborator: {
      label: "Collaborateur",
      className:
        "border-0 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
    },
    supplier: {
      label: "Fournisseur",
      className: "border-0 bg-muted text-muted-foreground",
    },
  };
  const item = content[type];
  return (
    <Badge
      className={cn(
        "shrink-0 font-medium",
        compact
          ? "max-w-28 px-2 py-0.5 text-[10px] leading-4"
          : "px-2 py-1 text-xs",
        item.className,
      )}
      variant="outline"
    >
      <span className="truncate">{item.label}</span>
    </Badge>
  );
}

function labelPillClass(tone: LabelTone) {
  return {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    green:
      "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
    orange:
      "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    slate: "bg-muted text-muted-foreground",
  }[tone];
}

function labelDotClass(tone: LabelTone) {
  return {
    blue: "bg-blue-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
    rose: "bg-rose-500",
    slate: "bg-slate-400",
  }[tone];
}

function AiModeDialog({
  aiMode,
  onChange,
  onOpenChange,
  open,
}: {
  aiMode: AiMode;
  onChange: (mode: AiMode) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [choice, setChoice] = useState(aiMode);
  const options: Array<{
    id: AiMode;
    title: string;
    description: string;
    icon: typeof BotIcon;
    recommended?: boolean;
  }> = [
    {
      id: "manual",
      title: "Manuel",
      description:
        "Rien n’est analysé automatiquement. Vous choisissez explicitement chaque conversation ou sélection.",
      icon: ShieldOffIcon,
      recommended: true,
    },
    {
      id: "assist",
      title: "Assistance à la demande",
      description:
        "Les outils d’IA restent disponibles, mais l’analyse ne commence qu’après votre demande et la confirmation du périmètre.",
      icon: SparklesIcon,
    },
    {
      id: "suggest",
      title: "Suggérer sans jamais appliquer",
      description:
        "Freescale peut préparer des suggestions pour les nouveaux messages. Chaque modification nécessite toujours votre approbation.",
      icon: ShieldCheckIcon,
    },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choisissez comment l’IA peut vous aider</DialogTitle>
          <DialogDescription>
            Vous pouvez modifier ce réglage à tout moment. Changer de mode ne
            modifie jamais les messages existants.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {options.map(
            ({ id, title, description, icon: Icon, recommended }) => (
              <button
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent",
                  choice === id &&
                    "border-blue-500 bg-blue-50 ring-1 ring-blue-500 dark:bg-blue-950/20",
                )}
                key={id}
                onClick={() => setChoice(id)}
                type="button"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{title}</p>
                    {recommended ? (
                      <Badge className="border-0 bg-green-50 text-green-700">
                        Le plus confidentiel
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-muted-foreground text-xs leading-5">
                    {description}
                  </p>
                </div>
                {choice === id ? (
                  <CheckCircle2Icon className="size-5 text-blue-600" />
                ) : null}
              </button>
            ),
          )}
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-muted-foreground text-xs">
          <InfoIcon className="mt-0.5 size-4 shrink-0" />
          Freescale affiche toujours le message original, le périmètre analysé
          et les éléments utilisés pour formuler une suggestion.
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Annuler
          </Button>
          <Button
            onClick={() => {
              onChange(choice);
              onOpenChange(false);
              toastSuccess({
                description: `Mode « ${aiModeLabel(choice)} » enregistré.`,
              });
            }}
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OnDemandAiSheet({
  accepted,
  conversation,
  onAccept,
  onOpenChange,
  onUseReply,
  open,
  scope,
  selectionCount,
}: {
  accepted: boolean;
  conversation: InboxConversation | null;
  onAccept: () => void;
  onOpenChange: (open: boolean) => void;
  onUseReply: (value: string) => void;
  open: boolean;
  scope: "thread" | "selection";
  selectionCount: number;
}) {
  const [analyzed, setAnalyzed] = useState(false);
  const [summary, setSummary] = useState(true);
  const [actions, setActions] = useState(true);
  const [draft, setDraft] = useState(true);
  const [classification, setClassification] = useState(false);
  const resetOpen = (value: boolean) => {
    if (!value) setAnalyzed(false);
    onOpenChange(value);
  };
  const messageCount = conversation?.messages.length ?? 0;
  const projectSuggestion =
    conversation?.project ??
    (conversation?.id === "orbital" ? "Opérations Orbital" : "Non attribué");
  return (
    <Sheet open={open} onOpenChange={resetOpen}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <SparklesIcon className="size-5" />
          </div>
          <SheetTitle>IA à la demande</SheetTitle>
          <SheetDescription>
            {scope === "selection"
              ? `${selectionCount} conversations sélectionnées. Vous décidez ce qui peut être analysé.`
              : `Uniquement cette conversation de ${messageCount} messages. Rien d’autre dans votre boîte de réception.`}
          </SheetDescription>
        </SheetHeader>
        {!analyzed ? (
          <div className="mt-6 space-y-5">
            <Card className="p-4">
              <p className="font-medium text-sm">Périmètre de l’analyse</p>
              <div className="mt-3 flex items-start gap-3 rounded-lg bg-muted p-3">
                <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-green-600" />
                <div>
                  <p className="font-medium text-xs">Périmètre limité</p>
                  <p className="mt-1 text-muted-foreground text-xs leading-5">
                    {scope === "selection"
                      ? "Seules les conversations sélectionnées seront envoyées pour analyse."
                      : `Seuls les messages de « ${conversation?.subject ?? "cette conversation"} » seront analysés.`}
                  </p>
                </div>
              </div>
            </Card>
            <div>
              <p className="mb-2 font-medium text-sm">
                Sur quoi souhaitez-vous être aidé ?
              </p>
              <div className="space-y-2">
                <AnalysisChoice
                  checked={summary}
                  description="Produire un aperçu factuel et concis"
                  label="Résumer"
                  onChange={setSummary}
                />
                <AnalysisChoice
                  checked={actions}
                  description="Repérer les tâches ou engagements possibles"
                  label="Extraire les actions possibles"
                  onChange={setActions}
                />
                <AnalysisChoice
                  checked={draft}
                  description={
                    scope === "selection"
                      ? "Préparer un brouillon séparé pour chaque conversation"
                      : "Préparer le texte sans jamais l’envoyer"
                  }
                  label={
                    scope === "selection"
                      ? "Rédiger des réponses séparées"
                      : "Rédiger une réponse"
                  }
                  onChange={setDraft}
                />
                <AnalysisChoice
                  checked={classification}
                  description="Suggérer un projet et une catégorie"
                  label="Suggérer une classification"
                  onChange={setClassification}
                />
              </div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 text-xs leading-5 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
              <strong>Approbation humaine requise.</strong> L’analyse peut être
              incomplète ou incorrecte. Aucun changement ne sera appliqué
              automatiquement aux tâches, étiquettes, projets ou réponses.
            </div>
            <Button
              className="w-full"
              disabled={!summary && !actions && !draft && !classification}
              onClick={() => setAnalyzed(true)}
            >
              Analyser ce périmètre
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">Suggestions</p>
              <Badge
                className="border-amber-200 bg-amber-50 text-amber-700"
                variant="outline"
              >
                Non appliquées
              </Badge>
            </div>
            {summary ? (
              <SuggestionCard
                confidence="Confiance élevée"
                evidence={
                  scope === "selection"
                    ? `Basé uniquement sur ${selectionCount} conversations sélectionnées`
                    : "Basé sur 3 messages"
                }
                title="Résumé"
              >
                <p className="text-sm leading-6">
                  {scope === "selection"
                    ? "Sarah demande une dernière révision du design pour demain. Maya a validé le périmètre du partenariat et attend le tarif ainsi que les prochaines disponibilités."
                    : "Sarah valide la direction générale, demande un en-tête plus apaisé et souhaite relire la version finale demain matin."}
                </p>
              </SuggestionCard>
            ) : null}
            {actions ? (
              <SuggestionCard
                confidence="À confirmer"
                evidence={
                  scope === "selection"
                    ? "Une suggestion issue de chaque conversation sélectionnée"
                    : "D’après le dernier message de Sarah"
                }
                title={
                  scope === "selection"
                    ? "2 actions possibles"
                    : "Action possible"
                }
              >
                <p className="text-sm">
                  {scope === "selection"
                    ? "Réviser l’en-tête de Sarah et préparer le tarif final pour Maya. Vérifiez chaque action avant de créer une tâche."
                    : "Réviser l’en-tête et préparer la version finale pour demain matin."}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline">
                    Créer la tâche
                  </Button>
                  <Button size="sm" variant="ghost">
                    Ignorer
                  </Button>
                </div>
              </SuggestionCard>
            ) : null}
            {classification ? (
              <SuggestionCard
                confidence="Confiance : 72 %"
                evidence="Formulation de la conversation et historique du contact"
                title={
                  scope === "selection"
                    ? "2 suggestions de projet"
                    : "Suggestion de projet"
                }
              >
                {scope === "selection" ? (
                  <div>
                    <p className="text-sm leading-6">
                      Les classifications doivent être vérifiées conversation
                      par conversation afin de ne pas associer le même projet à
                      des clients sans lien entre eux.
                    </p>
                    <Button className="mt-3" size="sm" variant="outline">
                      Vérifier une par une
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{projectSuggestion}</p>
                      <p className="text-muted-foreground text-xs">
                        {conversation?.project
                          ? "L’association existante semble cohérente"
                          : "Projet suggéré"}
                      </p>
                    </div>
                    {accepted ? (
                      <Badge className="border-0 bg-green-50 text-green-700">
                        Acceptée
                      </Badge>
                    ) : (
                      <Button onClick={onAccept} size="sm">
                        Accepter
                      </Button>
                    )}
                  </div>
                )}
                <button
                  className="mt-3 flex items-center gap-1 text-blue-700 text-xs hover:underline"
                  type="button"
                >
                  <CircleHelpIcon className="size-3" />
                  Pourquoi cette suggestion ?
                </button>
              </SuggestionCard>
            ) : null}
            {draft ? (
              <SuggestionCard
                confidence="Brouillon uniquement"
                evidence={
                  scope === "selection"
                    ? "Chaque brouillon utilise uniquement sa conversation"
                    : "Utilise le contexte de cette conversation"
                }
                title={
                  scope === "selection"
                    ? `${selectionCount} brouillons de réponse séparés`
                    : "Réponse suggérée"
                }
              >
                {scope === "selection" ? (
                  <div>
                    <p className="text-sm leading-6">
                      Les brouillons restent séparés et doivent être ouverts,
                      modifiés puis approuvés dans leur conversation d’origine.
                    </p>
                    <Button className="mt-3 w-full" size="sm">
                      Vérifier les brouillons séparément
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm leading-6">
                      Bien sûr — je vais adoucir l’en-tête et réduire le
                      contraste aujourd’hui. Je vous enverrai la version finale
                      demain matin pour validation.
                    </p>
                    <Button
                      className="mt-3 w-full"
                      onClick={() =>
                        onUseReply(
                          "Bien sûr — je vais adoucir l’en-tête et réduire le contraste aujourd’hui. Je vous enverrai la version finale demain matin pour validation.",
                        )
                      }
                      size="sm"
                    >
                      Utiliser comme brouillon
                    </Button>
                  </div>
                )}
              </SuggestionCard>
            ) : null}
            <Button
              className="w-full"
              onClick={() => setAnalyzed(false)}
              variant="outline"
            >
              Modifier les choix d’analyse
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function AnalysisChoice({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent">
      <Checkbox
        aria-label={label}
        checked={checked}
        onCheckedChange={(value) => onChange(Boolean(value))}
      />
      <span>
        <span className="block font-medium text-sm">{label}</span>
        <span className="mt-0.5 block text-muted-foreground text-xs">
          {description}
        </span>
      </span>
    </div>
  );
}

function SuggestionCard({
  children,
  confidence,
  evidence,
  title,
}: {
  children: React.ReactNode;
  confidence: string;
  evidence: string;
  title: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <BotIcon className="size-4 text-blue-600" />
          <p className="font-medium text-sm">{title}</p>
        </div>
        <Badge className="shrink-0" variant="outline">
          {confidence}
        </Badge>
      </div>
      <div className="mt-3">{children}</div>
      <div className="mt-3 border-t pt-3 text-muted-foreground text-xs">
        Source : {evidence}
      </div>
    </Card>
  );
}

function ChannelAvatar({
  conversation,
  small = false,
}: {
  conversation: InboxConversation;
  small?: boolean;
}) {
  const contactPhotos = useContext(ContactPhotosContext);
  const senderDomain = conversation.address.split("@").at(1);
  const photoUrl =
    contactPhotos[conversation.address.toLowerCase()] ??
    conversation.avatarUrl ??
    (senderDomain
      ? `https://icons.duckduckgo.com/ip3/${encodeURIComponent(senderDomain)}.ico`
      : undefined);

  return (
    <div className="relative shrink-0 self-center">
      <Avatar className={small ? "size-8" : "size-10"}>
        {conversation.id === "github" ? (
          <span
            aria-label="Logo GitHub"
            className="flex size-full items-center justify-center bg-slate-950 text-white dark:bg-white dark:text-slate-950"
            role="img"
          >
            <GithubIcon className={small ? "size-4" : "size-5"} />
          </span>
        ) : conversation.id === "orbital" ? (
          <span
            aria-label="Logo Orbital Finance"
            className="flex size-full items-center justify-center bg-indigo-600 text-white"
            role="img"
          >
            <LandmarkIcon className={small ? "size-4" : "size-5"} />
          </span>
        ) : photoUrl ? (
          <Image
            alt={conversation.name}
            className="size-full bg-background object-cover"
            height={40}
            src={photoUrl}
            unoptimized
            width={40}
          />
        ) : (
          <AvatarFallback>{conversation.initials}</AvatarFallback>
        )}
      </Avatar>
      {!small ? (
        <span className="pointer-events-none invisible absolute -bottom-1 -right-1 flex size-5 scale-90 items-center justify-center rounded-full border bg-background opacity-0 shadow-sm transition duration-150 group-hover:visible group-hover:scale-100 group-hover:opacity-100">
          <ChannelIcon channel={conversation.channel} size="md" />
        </span>
      ) : null}
    </div>
  );
}

function ChannelIcon({
  channel,
  size = "sm",
}: {
  channel: Channel;
  size?: "sm" | "md";
}) {
  const medium = size === "md";
  if (channel === "gmail")
    return <Gmail height={medium ? "18" : "11"} width={medium ? "20" : "13"} />;
  if (channel === "outlook")
    return (
      <Outlook height={medium ? "19" : "12"} width={medium ? "20" : "13"} />
    );
  if (channel === "whatsapp")
    return (
      <WhatsAppIcon
        className={cn(medium ? "size-5" : "size-3", "text-[#22c55e]")}
      />
    );
  if (channel === "slack")
    return (
      <Image
        alt="Slack"
        height={medium ? 20 : 12}
        src="/images/slack.svg"
        width={medium ? 20 : 12}
      />
    );
  return (
    <Image
      alt="Telegram"
      height={medium ? 20 : 12}
      src="/images/telegram.svg"
      width={medium ? 20 : 12}
    />
  );
}

function AiModeIcon({ mode }: { mode: AiMode }) {
  if (mode === "manual")
    return <ShieldOffIcon className="size-4 text-muted-foreground" />;
  if (mode === "assist")
    return <SparklesIcon className="size-4 text-blue-600" />;
  return <ShieldCheckIcon className="size-4 text-green-600" />;
}
function aiModeLabel(mode: AiMode) {
  return {
    manual: "Mue en veille",
    assist: "Mue à la demande",
    suggest: "Mue suggère",
  }[mode];
}
function channelName(channel: Channel) {
  return {
    gmail: "Gmail",
    outlook: "Outlook",
    whatsapp: "WhatsApp",
    slack: "Slack",
    telegram: "Telegram",
  }[channel];
}
