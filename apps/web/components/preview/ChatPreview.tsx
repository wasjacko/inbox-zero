"use client";

import {
  ArchiveIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  CopyIcon,
  FileTextIcon,
  HistoryIcon,
  InboxIcon,
  LoaderCircleIcon,
  MessageCircleIcon,
  PaperclipIcon,
  PresentationIcon,
  RotateCcwIcon,
  ScanSearchIcon,
  SendHorizontalIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  UserRoundPenIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { ConnectChannelDialog } from "@/components/ConnectChannelDialog";
import { WhatsAppIcon } from "@/components/BrandIcons";
import { usePreviewConnectedChannels } from "@/hooks/usePreviewConnectedChannels";
import { Gmail } from "@/components/new-landing/icons/Gmail";
import { Outlook } from "@/components/new-landing/icons/Outlook";
import {
  MuePriorityBlock,
  seedTasks,
  TASKS_STORAGE_KEY,
  type Task,
} from "@/components/preview/TasksPreview";
import { toastError, toastSuccess } from "@/components/Toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/Tooltip";
import { cn } from "@/utils";
import {
  getPreviewGreeting,
  PREVIEW_FREELANCER_NAME_EVENT,
  PREVIEW_FREELANCER_NAME_KEY,
} from "@/utils/preview-profile";
import { PREVIEW_ONBOARDING_STATUS_KEY } from "@/utils/preview-onboarding";
import { useMobileViewport } from "@/hooks/useMobileViewport";
import { DesktopRealBrief } from "@/components/preview/DesktopRealBrief";
import { useSession } from "@/utils/auth-client";
import { useAccount } from "@/providers/EmailAccountProvider";
import { usePreloadedPageData } from "@/hooks/usePreloadedPageData";
import { useMueBriefTasks } from "@/hooks/useMueBriefTasks";
import { EMAIL_ACCOUNT_HEADER } from "@/utils/config";
import {
  CREATED_TASK_IDS_STORAGE_KEY,
  CREATED_TASKS_STORAGE_KEY,
  getLocalDateKey,
} from "@/utils/freescale-task-date";

const AutomationPreview = dynamic(
  () =>
    import("@/components/preview/AutomationPreview").then(
      (module) => module.AutomationPreview,
    ),
  { ssr: false, loading: () => <BriefConnectionLoadingState /> },
);
const MobileChatPreview = dynamic(
  () =>
    import("@/components/mobile/MobileChatPreview").then(
      (module) => module.MobileChatPreview,
    ),
  { ssr: false, loading: () => <BriefConnectionLoadingState /> },
);

const suggestions = [
  {
    id: "priorities",
    label: "Aide-moi à gérer mes priorités aujourd’hui",
    icon: InboxIcon,
  },
  { id: "summary", label: "Résume mes échanges importants", icon: ArchiveIcon },
  {
    id: "actions",
    label: "Suggère les prochaines actions",
    icon: SparklesIcon,
  },
] as const;

type ChatView = "brief" | "ask" | "history" | "assistant";

export function ChatPreview(_props: {
  initialView?: ChatView;
  onboardingComplete?: boolean;
}) {
  const [input, setInput] = useState("");
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    try {
      setShowSetup(
        sessionStorage.getItem("freescale-setup-invitation-dismissed") !== "1",
      );
    } catch {
      setShowSetup(true);
    }
  }, []);

  const dismissSetup = () => {
    setShowSetup(false);
    try {
      sessionStorage.setItem("freescale-setup-invitation-dismissed", "1");
    } catch {}
  };

  return (
    <section
      className="relative flex min-h-[70svh] w-full flex-1 flex-col bg-background lg:h-[calc(100svh-4rem)]"
      aria-label="Accueil IA"
    >
      <ChatPanel input={input} onInputChange={setInput} />
      {showSetup ? (
        <aside
          aria-label="Configurer votre espace"
          className="fixed bottom-24 right-4 z-40 w-[calc(100%-2rem)] max-w-sm rounded-2xl border bg-background p-5 shadow-lg lg:bottom-6 lg:right-6"
        >
          <button
            aria-label="Fermer l’invitation"
            className="absolute right-3 top-3 rounded-md p-1.5 hover:bg-muted"
            onClick={dismissSetup}
            type="button"
          >
            <XIcon className="size-4" />
          </button>
          <p className="pr-7 font-medium">Bienvenue dans votre espace</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Connectez vos outils et personnalisez Freescale depuis la
            configuration.
          </p>
          <Button asChild className="mt-4">
            <Link href="/setup">
              Configurer mon espace
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </aside>
      ) : null}
    </section>
  );
}

// biome-ignore lint/correctness/noUnusedVariables: kept temporarily for the alternate tabbed home prototype.
function LegacyChatPreview({
  initialView = "brief",
  onboardingComplete = false,
}: {
  initialView?: ChatView;
  onboardingComplete?: boolean;
}) {
  const [input, setInput] = useState("");
  const [freelancerName, setFreelancerName] = useState("");
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState<ChatView>(initialView);
  const connectedChannels = usePreviewConnectedChannels();
  const isMobileViewport = useMobileViewport();
  const isConnectedChannelsLoading = connectedChannels === null;
  const hasConnectedChannels = (connectedChannels?.length ?? 0) > 0;

  const changeActiveView = (view: string) => {
    if (!isChatView(view)) return;
    setActiveView(view);

    const params = new URLSearchParams(window.location.search);
    if (view === "brief") params.delete("chatView");
    else params.set("chatView", view);
    const query = params.toString();
    window.history.replaceState(null, "", `/chat${query ? `?${query}` : ""}`);
  };

  useEffect(() => {
    const onboardingStatus = window.localStorage.getItem(
      PREVIEW_ONBOARDING_STATUS_KEY,
    );
    setFreelancerName(
      onboardingStatus === "skipped"
        ? ""
        : (window.localStorage.getItem(PREVIEW_FREELANCER_NAME_KEY) ?? ""),
    );
    const handleFreelancerName = (event: Event) =>
      setFreelancerName((event as CustomEvent<string>).detail);
    window.addEventListener(
      PREVIEW_FREELANCER_NAME_EVENT,
      handleFreelancerName,
    );
    return () =>
      window.removeEventListener(
        PREVIEW_FREELANCER_NAME_EVENT,
        handleFreelancerName,
      );
  }, []);

  return (
    <>
      {isMobileViewport ? (
        <MobileChatPreview
          freelancerName={freelancerName}
          hasConnectedChannels={hasConnectedChannels}
          onboardingComplete={onboardingComplete}
          onConnectChannel={() => setConnectDialogOpen(true)}
        />
      ) : null}
      <Tabs
        className="relative isolate hidden h-[calc(100svh-4rem)] min-h-0 w-full flex-none flex-col overflow-x-hidden overflow-y-auto bg-background lg:flex"
        defaultValue="brief"
        onValueChange={changeActiveView}
        value={activeView}
      >
        {activeView === "ask" && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[46%] opacity-80 dark:opacity-30"
            style={{
              background:
                "radial-gradient(ellipse 70% 70% at 52% 0%, rgba(251, 113, 133, 0.20) 0%, rgba(244, 114, 182, 0.11) 30%, rgba(96, 165, 250, 0.07) 52%, transparent 76%)",
            }}
          />
        )}
        <div className="relative z-20 shrink-0 bg-transparent px-4 pt-6 sm:px-6">
          <div className="relative mx-auto flex w-full max-w-3xl items-center justify-between gap-3 sm:justify-center">
            <div className="rounded-xl bg-gradient-to-r from-sky-400/70 via-fuchsia-500/70 to-rose-400/70 p-px shadow-sm">
              <TabsList className="relative isolate h-10 overflow-hidden rounded-[11px] bg-muted/90 p-1">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-y-1 left-1 z-0 w-[calc(50%-4px)] rounded-lg bg-transparent transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                    activeView === "ask" && "translate-x-full",
                    (activeView === "history" || activeView === "assistant") &&
                      "opacity-0",
                  )}
                  data-testid="chat-view-indicator"
                />
                <TabsTrigger
                  className="relative z-10 min-w-[104px] gap-2 rounded-lg bg-transparent text-muted-foreground shadow-none transition-colors duration-300 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  value="brief"
                >
                  <SparklesIcon className="size-4" />
                  Brief
                </TabsTrigger>
                <TabsTrigger
                  className="relative z-10 min-w-[104px] gap-2 rounded-lg bg-transparent text-muted-foreground shadow-none transition-colors duration-300 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  value="ask"
                >
                  <MessageCircleIcon className="size-4" />
                  Ask Mue
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 sm:absolute sm:right-0">
              <Tooltip content="Historique des conversations">
                <TabsTrigger
                  aria-label="Historique des conversations"
                  className="size-9 rounded-lg p-0 text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  value="history"
                >
                  <HistoryIcon className="size-4" />
                </TabsTrigger>
              </Tooltip>
              <Tooltip content="Paramètres IA">
                <TabsTrigger
                  aria-label="Paramètres IA"
                  className="size-9 rounded-lg p-0 text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  value="assistant"
                >
                  <SlidersHorizontalIcon className="size-4" />
                </TabsTrigger>
              </Tooltip>
            </div>
          </div>
        </div>
        <TabsContent
          className="mt-0 flex w-full flex-none overflow-visible"
          value="brief"
        >
          {isConnectedChannelsLoading || isMobileViewport !== false ? (
            <BriefConnectionLoadingState />
          ) : hasConnectedChannels ? (
            <DesktopRealBrief freelancerName={freelancerName} />
          ) : (
            <CenteredBriefOverview
              freelancerName={freelancerName}
              hasConnectedChannels={false}
              onboardingComplete={onboardingComplete}
              onConnectChannel={() => setConnectDialogOpen(true)}
            />
          )}
        </TabsContent>
        <TabsContent
          className="mt-0 flex min-h-0 flex-1 overflow-hidden"
          value="ask"
        >
          <ChatPanel input={input} onInputChange={setInput} />
        </TabsContent>
        <TabsContent
          className="mt-0 min-h-0 flex-1 overflow-y-auto"
          value="history"
        >
          <ChatHistoryPanel />
        </TabsContent>
        <TabsContent
          className="mt-0 min-h-0 flex-1 overflow-y-auto pt-20"
          value="assistant"
        >
          <AutomationPreview embedded />
        </TabsContent>
      </Tabs>
      <ConnectChannelDialog
        onOpenChange={setConnectDialogOpen}
        open={connectDialogOpen}
      />
    </>
  );
}

function isChatView(value: string): value is ChatView {
  return ["brief", "ask", "history", "assistant"].includes(value);
}

const scanPhases = [
  {
    label: "Connexion aux canaux",
    detail: "Gmail, Outlook, WhatsApp et Slack",
  },
  {
    label: "Lecture des nouveaux échanges",
    detail: "7 nouveaux messages trouvés",
  },
  {
    label: "Comparaison avec vos actions",
    detail: "Les doublons et changements sont regroupés",
  },
  {
    label: "Mise à jour du brief",
    detail: "Vos actions effectuées sont conservées",
  },
] as const;

const initialScanMessages = [
  "Lecture de 18 messages sur Gmail, Outlook et WhatsApp…",
  "Regroupement de 9 échanges autour de Maya, Jon et Théo…",
  "Facture F-2048 : paiement en attente détecté pour Maya Chen…",
  "Projet SEO : livraison terminée détectée pour Jon Bell…",
  "WhatsApp : Théo Manili attend une réponse depuis 24 minutes…",
  "Priorisation selon l’urgence, l’impact client et le revenu…",
] as const;

type ScanState = "idle" | "scanning" | "complete";
type ScanMode = "initial" | "refresh";

const homePriorityTaskIds = ["task-5", "task-11", "task-12"] as const;

const briefItems = [
  {
    id: "sophie-proposal",
    title: "Préparer l’appel d’offre pour Sophie",
    description:
      "Mue a regroupé ses échanges, ses attentes et les éléments du projet.",
    status: "Contexte prêt",
    action: "Préparer avec Mue",
    workspaceLabel: "Message à Sophie",
    workspaceContent:
      "Hello Sophie,\n\nJ’ai préparé une première version de l’appel d’offre à partir de nos échanges. Elle reprend les objectifs, le périmètre attendu, le calendrier et les critères de réussite.\n\nJe te l’envoie pour relecture — dis-moi si tu souhaites que j’ajuste certains points avant notre prochain échange.\n\nWacil",
    confirmAction: "Finaliser la mission",
    confirmation: "L’appel d’offre et le message pour Sophie sont prêts.",
    tone: "blue",
  },
  {
    id: "northstar-proposal",
    title: "Finaliser la proposition Northstar",
    description: "Le tarif final manque encore avant l’envoi au client.",
    status: "Aujourd’hui",
    action: "Reprendre le devis",
    workspaceLabel: "Éléments à intégrer au devis",
    workspaceContent:
      "Budget final : 12 400 € HT\nDélai : 6 semaines\nInclure la phase de recette mobile et deux cycles de retours.",
    confirmAction: "Mettre à jour le devis",
    confirmation: "Les éléments du devis Northstar ont été enregistrés.",
    tone: "amber",
  },
  {
    id: "atlas-risk",
    title: "Sécuriser le lancement Atlas",
    description: "Un problème mobile peut bloquer la mise en production.",
    status: "À risque",
    action: "Voir la tâche",
    workspaceLabel: "Plan d’action proposé",
    workspaceContent:
      "Vérifier le blocage mobile avec l’équipe technique.\nResponsable : Wacil\nÉchéance : aujourd’hui, 16 h\nPriorité : haute",
    confirmAction: "Créer la tâche",
    confirmation: "La tâche Atlas a été ajoutée à vos priorités.",
    tone: "rose",
  },
  {
    id: "draft-replies",
    title: "Vérifier 2 réponses préparées",
    description: "Deux brouillons sont prêts dans Canaux pour relecture.",
    status: "2 brouillons",
    action: "Relire les réponses",
    workspaceLabel: "Réponses à relire",
    workspaceContent:
      "1. Sarah — Validation des ajustements de la landing page\n\n2. Maya — Confirmation du périmètre et du tarif final",
    confirmAction: "Valider les réponses",
    confirmation: "Les deux réponses sont prêtes à être utilisées.",
    tone: "blue",
  },
  {
    id: "suggested-tasks",
    title: "Confirmer 3 tâches suggérées",
    description: "Mue a extrait trois actions de vos derniers échanges.",
    status: "3 tâches",
    action: "Voir les suggestions",
    workspaceLabel: "Tâches détectées par Mue",
    workspaceContent:
      "• Envoyer la V2 de la landing page à Sarah\n• Finaliser le tarif du devis Northstar\n• Vérifier le blocage mobile du projet Atlas",
    confirmAction: "Ajouter les 3 tâches",
    confirmation: "Les trois tâches ont été ajoutées à vos priorités.",
    tone: "violet",
  },
] as const;

const dailyBriefClients = [
  {
    name: "Maya Chen",
    avatarPosition: "50% 0%",
    channel: "Gmail",
    conversationId: "maya-gmail",
    source: "Facture F-2048",
    label: "Paiement",
    headline: "Maya n’a pas confirmé le règlement.",
    senderAddress: "maya.chen@northstar-studio.com",
    subject: "Facture F-2048 — règlement de juillet",
    messagePreview:
      "Bonjour Wacil, j’ai bien reçu la facture F-2048. Je reviens vers toi dès que le règlement est programmé.",
    messageBody:
      "Bonjour Wacil,\n\nJ’ai bien reçu la facture F-2048 envoyée pour la prestation de juillet.\n\nJe fais le point avec notre service comptable et je reviens vers toi dès que le règlement est programmé.\n\nMerci pour ta patience,\nMaya",
    messageHighlight: "je reviens vers toi dès que le règlement est programmé",
    messageTime: "Hier, 16:42",
    previousMessages: [
      {
        sender: "Maya Chen",
        time: "8 août, 14:32",
        body: "Bonjour Wacil,\n\nMerci encore pour la livraison de juillet. Peux-tu m’envoyer la facture dès qu’elle est prête ?",
      },
      {
        sender: "Wacil Ait",
        time: "12 août, 09:18",
        body: "Bonjour Maya,\n\nJe t’envoie la facture F-2048 correspondant à la prestation de juillet. Dis-moi si ton équipe a besoin d’un autre justificatif.",
      },
      {
        sender: "Maya Chen",
        time: "12 août, 11:06",
        body: "Bonjour Wacil,\n\nBien reçue, merci. Je la transmets au service comptable aujourd’hui.",
      },
    ],
    observation:
      "La facture de juillet est arrivée à échéance hier. Aucun règlement ni réponse n’apparaît dans les échanges.",
    tone: "amber",
  },
  {
    name: "Jon Bell",
    avatarPosition: "100% 100%",
    channel: "Outlook",
    conversationId: "jon-outlook",
    source: "Projet SEO",
    label: "Projet livré",
    headline: "Jon attend la confirmation du SEO.",
    senderAddress: "jon.bell@meridian-labs.co",
    subject: "Re: Optimisations SEO — point d’avancement",
    messagePreview:
      "Bonjour Wacil, as-tu une visibilité sur la finalisation des optimisations SEO ?",
    messageBody:
      "Bonjour Wacil,\n\nJ’espère que tu vas bien. As-tu une visibilité sur la finalisation des optimisations SEO ?\n\nNous aimerions partager un point d’avancement avec l’équipe avant notre réunion de vendredi.\n\nMerci,\nJon",
    messageHighlight: "finalisation des optimisations SEO",
    messageTime: "Hier, 14:18",
    previousMessages: [
      {
        sender: "Wacil Ait",
        time: "Vendredi, 17:12",
        body: "Bonjour Jon,\n\nJe te partage le récapitulatif des recommandations SEO et le calendrier de déploiement.",
      },
      {
        sender: "Jon Bell",
        time: "Lundi, 10:24",
        body: "Bonjour Wacil,\n\nL’équipe a bien reçu les recommandations SEO. Il nous manque simplement la confirmation de mise en production.",
      },
      {
        sender: "Wacil Ait",
        time: "Lundi, 15:40",
        body: "Bonjour Jon,\n\nLes derniers contrôles sont en cours. Je te confirme la finalisation dès que la validation est terminée.",
      },
    ],
    observation:
      "Les optimisations SEO ont été validées ce matin. La conversation client ne mentionne pas encore cette avancée.",
    tone: "emerald",
  },
  {
    name: "Théo Manili",
    avatarPosition: "50% 50%",
    channel: "WhatsApp",
    conversationId: "theo-whatsapp",
    source: "Message reçu il y a 24 min",
    label: "Conversation active",
    headline: "Théo attend la confirmation du planning.",
    senderAddress: "+33 6 84 12 09 47",
    subject: null,
    messagePreview:
      "Bonjour Wacil, peux-tu me confirmer le planning d’intégration et les prochaines étapes ?",
    messageBody:
      "Bonjour Wacil, peux-tu me confirmer le planning d’intégration et les prochaines étapes ?",
    messageHighlight:
      "confirmer le planning d’intégration et les prochaines étapes",
    messageTime: "Aujourd’hui, 10:31",
    previousMessages: [
      {
        sender: "Théo Manili",
        time: "Hier, 17:36",
        body: "Salut Wacil, est-ce qu’on reste bien sur une intégration cette semaine ?",
      },
      {
        sender: "Wacil Ait",
        time: "Hier, 18:02",
        body: "Oui, je vérifie les derniers créneaux avec l’équipe et je te confirme ça demain matin.",
      },
      {
        sender: "Wacil Ait",
        time: "Aujourd’hui, 09:48",
        body: "Bonjour Théo, je finalise le planning d’intégration avec l’équipe et je reviens vers toi dans la matinée.",
      },
    ],
    observation:
      "Théo demande une confirmation sur le planning d’intégration. Son message est le plus récent du brief.",
    tone: "blue",
  },
] as const;

const prioritizedDailyBriefClients = [
  dailyBriefClients[2],
  dailyBriefClients[0],
  dailyBriefClients[1],
] as const;

const dailyBriefUnreadCounts = {
  "maya-gmail": 6,
  "jon-outlook": 5,
  "theo-whatsapp": 7,
} as const;

type BriefReplyVariant =
  | "suggested"
  | "warm"
  | "direct"
  | "short"
  | "professional";

const dailyBriefReplies: Record<
  (typeof dailyBriefClients)[number]["conversationId"],
  Record<BriefReplyVariant, string>
> = {
  "maya-gmail": {
    suggested:
      "Bonjour Maya,\n\nMerci pour ton retour. Peux-tu me confirmer la date prévue du règlement de la facture F-2048 ?\n\nMerci d’avance,\nWacil",
    warm: "Bonjour Maya,\n\nMerci pour ton message. Aucun souci, peux-tu simplement me tenir au courant dès que la date de règlement de la facture F-2048 est confirmée ?\n\nBonne journée,\nWacil",
    direct:
      "Bonjour Maya,\n\nPeux-tu me confirmer la date de règlement prévue pour la facture F-2048 ?\n\nMerci,\nWacil",
    short:
      "Bonjour Maya, peux-tu me confirmer la date de règlement de la facture F-2048 ? Merci.",
    professional:
      "Bonjour Maya,\n\nMerci pour votre retour. Pourriez-vous me confirmer la date de règlement prévue pour la facture F-2048 ?\n\nBien cordialement,\nWacil Ait",
  },
  "jon-outlook": {
    suggested:
      "Bonjour Jon,\n\nLes optimisations SEO sont désormais finalisées et validées. Tu peux les intégrer à ton point d’avancement de vendredi.\n\nÀ bientôt,\nWacil",
    warm: "Bonjour Jon,\n\nBonne nouvelle : les optimisations SEO sont terminées et validées. Tout est prêt pour votre point d’équipe de vendredi.\n\nÀ bientôt,\nWacil",
    direct:
      "Bonjour Jon,\n\nLes optimisations SEO sont finalisées et validées.\n\nWacil",
    short: "Bonjour Jon, les optimisations SEO sont finalisées et validées.",
    professional:
      "Bonjour Jon,\n\nJe vous confirme que les optimisations SEO ont été finalisées et validées. Elles peuvent désormais être intégrées à votre prochain point d’avancement.\n\nBien cordialement,\nWacil Ait",
  },
  "theo-whatsapp": {
    suggested:
      "Bonjour Théo, oui, le planning d’intégration est confirmé. Je t’envoie le détail des prochaines étapes dans la journée.",
    warm: "Bonjour Théo ! Le planning est bien confirmé. Je te partage le détail des prochaines étapes un peu plus tard aujourd’hui.",
    direct:
      "Bonjour Théo, le planning d’intégration est confirmé. Le détail des prochaines étapes arrive aujourd’hui.",
    short:
      "Bonjour Théo, le planning est confirmé. Je t’envoie la suite aujourd’hui.",
    professional:
      "Bonjour Théo, je vous confirme le planning d’intégration. Je vous transmettrai le détail des prochaines étapes dans la journée.",
  },
};

const dailyBriefChanges = [
  {
    time: "08:42",
    title: "Livraison SEO confirmée",
    detail: "Outlook · Jon Bell",
  },
  {
    time: "Hier",
    title: "Facture F-2048 arrivée à échéance",
    detail: "Gmail · Maya Chen",
  },
  {
    time: "Hier",
    title: "Planning d’intégration demandé",
    detail: "WhatsApp · Théo Manili",
  },
] as const;

function BriefConnectionLoadingState() {
  return (
    <div
      aria-live="polite"
      className="relative flex min-h-[calc(100svh-8rem)] w-full items-start justify-center overflow-hidden px-6 pb-12 pt-16 sm:pt-20"
      role="status"
    >
      <span className="sr-only">Chargement de votre messagerie</span>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 opacity-60 dark:opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 62% 72% at 50% 0%, rgba(96,165,250,0.11), rgba(251,191,36,0.045) 52%, transparent 78%)",
        }}
      />
      <section className="relative flex w-full max-w-lg flex-col items-center text-center">
        <div className="h-10 w-60 animate-pulse rounded-xl bg-muted" />
        <div className="mt-8 h-6 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-muted" />
        <div className="mt-6 h-10 w-44 animate-pulse rounded-[13px] bg-muted" />
      </section>
    </div>
  );
}

function CenteredBriefOverview({
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [readConversationIds, setReadConversationIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [draftReplies, setDraftReplies] = useState<Record<string, string>>({});
  const [sentReplies, setSentReplies] = useState<
    Record<string, BriefSentReply[]>
  >({});
  const [refreshing, setRefreshing] = useState(false);
  const [showArrival, setShowArrival] = useState(onboardingComplete);
  const reducedMotion = useReducedMotion();
  const greeting = getPreviewGreeting(freelancerName);

  useEffect(() => {
    if (!showArrival) return;
    const timer = window.setTimeout(
      () => setShowArrival(false),
      reducedMotion ? 200 : 950,
    );
    return () => window.clearTimeout(timer);
  }, [reducedMotion, showArrival]);

  useEffect(() => {
    if (!refreshing) return;
    const timer = window.setTimeout(() => setRefreshing(false), 2200);
    return () => window.clearTimeout(timer);
  }, [refreshing]);

  if (!hasConnectedChannels) {
    return (
      <DisconnectedBriefState
        greeting={greeting}
        onConnectChannel={onConnectChannel}
      />
    );
  }

  return (
    <div className="relative flex min-h-[calc(100svh-8rem)] w-full flex-none items-start justify-center bg-background px-4 pb-12 pt-16 sm:px-6 sm:pt-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] opacity-60 dark:opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 52% 62% at 50% 8%, rgba(96,165,250,0.1), rgba(251,191,36,0.035) 56%, transparent 78%)",
        }}
      />

      <AnimatePresence>
        {showArrival ? (
          <motion.div
            animate={{ opacity: 1 }}
            aria-live="polite"
            className="absolute inset-0 z-30 grid place-items-center overflow-hidden bg-background"
            exit={{ opacity: 0, scale: 1.03, filter: "blur(8px)" }}
            initial={{ opacity: 1 }}
            transition={{
              duration: reducedMotion ? 0.1 : 0.5,
              ease: "easeOut",
            }}
          >
            <motion.div
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="relative flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{
                delay: reducedMotion ? 0 : 0.08,
                duration: reducedMotion ? 0.1 : 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <motion.span
                animate={
                  reducedMotion
                    ? undefined
                    : { scale: [0.86, 1.08, 1], rotate: [-8, 4, 0] }
                }
                className="grid size-14 place-items-center rounded-2xl bg-blue-600 text-white shadow-[0_18px_45px_-18px_rgba(37,99,235,0.75)]"
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                <SparklesIcon className="size-6" />
              </motion.span>
              <p className="mt-5 font-medium text-2xl tracking-tight">
                Votre espace est prêt.
              </p>
              <p className="mt-2 text-muted-foreground text-sm">
                Mue a déjà préparé votre premier brief.
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.section
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative mx-auto w-full max-w-[42rem]"
        initial={
          onboardingComplete && !reducedMotion
            ? { opacity: 0, y: 24, scale: 0.985 }
            : false
        }
        transition={{
          delay: onboardingComplete && !reducedMotion ? 0.5 : 0,
          duration: 0.65,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <motion.header
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
          initial={
            onboardingComplete && !reducedMotion ? { opacity: 0, y: 10 } : false
          }
          transition={{
            delay: onboardingComplete && !reducedMotion ? 0.72 : 0,
            duration: 0.45,
          }}
        >
          <h1
            aria-label={greeting}
            className="font-medium text-3xl tracking-tight sm:text-4xl"
          >
            {onboardingComplete && !reducedMotion ? (
              <span aria-hidden="true">
                {Array.from(greeting).map((character, index) => (
                  <motion.span
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    className="inline-block whitespace-pre"
                    initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                    key={`${character}-${index}`}
                    transition={{
                      delay: 0.76 + index * 0.035,
                      duration: 0.32,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {character}
                  </motion.span>
                ))}
              </span>
            ) : (
              greeting
            )}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground text-sm leading-6">
            Vous avez reçu{" "}
            <em className="font-medium italic text-foreground">
              18 messages non lus
            </em>
            .{" "}
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 align-middle font-normal text-[11px] text-blue-700 not-italic dark:bg-blue-950/35 dark:text-blue-300">
              <SparklesIcon className="size-2.5" />
              Mue
            </span>{" "}
            vous suggère de répondre à{" "}
            <em className="font-medium italic text-foreground">
              3 messages clients
            </em>
            . Tout va bien : rien ne sera envoyé sans votre accord.
          </p>
        </motion.header>

        <section className="relative mt-10 sm:mt-12" aria-label="Brief du jour">
          <div className="grid gap-3">
            {prioritizedDailyBriefClients.map((client, index) => {
              const open = openIndex === index;
              const answered = Boolean(
                sentReplies[client.conversationId]?.length,
              );
              const unread =
                !answered && !readConversationIds.has(client.conversationId);
              const unreadCount = dailyBriefUnreadCounts[client.conversationId];
              const nextPendingIndex = prioritizedDailyBriefClients.findIndex(
                (candidate, candidateIndex) =>
                  candidateIndex !== index &&
                  !sentReplies[candidate.conversationId]?.length,
              );
              const nextPendingClient =
                nextPendingIndex >= 0
                  ? prioritizedDailyBriefClients[nextPendingIndex]
                  : null;

              return (
                <article
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-background shadow-[0_16px_42px_-22px_rgba(15,23,42,0.32),0_3px_10px_-6px_rgba(15,23,42,0.16)] transition-colors duration-200",
                    answered
                      ? "border-emerald-200/90 bg-emerald-50/30 hover:border-emerald-300 dark:border-emerald-900/70 dark:bg-emerald-950/10"
                      : "border-slate-200/70 dark:border-white/10",
                  )}
                  key={client.name}
                >
                  <button
                    aria-haspopup="dialog"
                    aria-label={`Ouvrir le message de ${client.name}`}
                    className={cn(
                      "group grid w-full cursor-pointer grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-3 px-4 py-4 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset sm:grid-cols-[2.75rem_minmax(0,1fr)_auto] sm:px-5",
                      answered
                        ? "hover:bg-emerald-50/80 focus-visible:ring-emerald-500/45 dark:hover:bg-emerald-950/20"
                        : "hover:bg-blue-50/55 focus-visible:ring-blue-500/50 dark:hover:bg-blue-950/20",
                    )}
                    onClick={() => {
                      setReadConversationIds((current) =>
                        new Set(current).add(client.conversationId),
                      );
                      setOpenIndex(index);
                    }}
                    type="button"
                  >
                    <span className="relative block size-11">
                      <span
                        aria-label={`Photo de profil de ${client.name}`}
                        className="block size-11 rounded-full bg-[url('/images/avatars/freescale-contacts-grid.webp')] bg-no-repeat outline outline-1 outline-border/60 ring-2 ring-background"
                        role="img"
                        style={{
                          backgroundPosition: client.avatarPosition,
                          backgroundSize: "300% 300%",
                        }}
                      />
                      {unread && (
                        <span
                          aria-label={`${unreadCount} nouveaux messages`}
                          className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-blue-600 px-1 font-semibold text-[10px] text-white shadow-sm ring-2 ring-background"
                          role="status"
                        >
                          {unreadCount}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium text-[14px] leading-5 sm:text-[15px]">
                        {client.headline}
                      </span>
                      <span className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <DailyBriefChannelIcon channel={client.channel} large />
                        {client.name}
                      </span>
                    </span>

                    {answered ? (
                      <span
                        aria-label="Réponse envoyée"
                        className="col-span-2 mt-1 grid size-9 place-items-center justify-self-end rounded-full bg-emerald-100 text-emerald-700 shadow-sm ring-1 ring-emerald-200 transition-[background-color,color,box-shadow] duration-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-[0_0_0_4px_rgba(16,185,129,0.12)] group-hover:ring-emerald-600 sm:col-span-1 sm:mt-0 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800 dark:group-hover:bg-emerald-500 dark:group-hover:text-emerald-950"
                        role="status"
                      >
                        <CheckIcon className="size-4 stroke-[2.5]" />
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="col-span-2 mt-1 grid size-9 place-items-center justify-self-end rounded-full bg-blue-50 text-blue-600 transition-[background-color,color,transform] duration-200 group-hover:translate-x-0.5 group-hover:bg-blue-600 group-hover:text-white sm:col-span-1 sm:mt-0 dark:bg-blue-950/45 dark:text-blue-300"
                      >
                        <ArrowRightIcon className="size-4 motion-reduce:transform-none" />
                      </span>
                    )}
                  </button>

                  <Dialog
                    onOpenChange={(nextOpen) => {
                      if (nextOpen) {
                        setReadConversationIds((current) =>
                          new Set(current).add(client.conversationId),
                        );
                      }
                      setOpenIndex(nextOpen ? index : null);
                    }}
                    open={open}
                  >
                    <DialogContent className="flex h-[min(42rem,88svh)] w-[calc(100%-2rem)] max-w-[44rem] flex-col gap-0 overflow-hidden border border-border/70 bg-background p-0 shadow-[0_28px_80px_-28px_rgba(15,23,42,0.48)] sm:rounded-3xl">
                      <DialogHeader className="shrink-0 bg-background px-5 py-4 pr-14 text-left sm:px-6">
                        <div className="flex items-start gap-3.5">
                          <span className="relative mt-0.5 block size-10 shrink-0">
                            <span
                              aria-label={`Photo de profil de ${client.name}`}
                              className="block size-10 rounded-full bg-[url('/images/avatars/freescale-contacts-grid.webp')] bg-no-repeat outline outline-1 outline-border/60 ring-2 ring-background"
                              role="img"
                              style={{
                                backgroundPosition: client.avatarPosition,
                                backgroundSize: "300% 300%",
                              }}
                            />
                          </span>
                          <div className="min-w-0">
                            <DialogTitle className="text-left font-semibold text-[16px] leading-6 tracking-tight sm:text-[17px]">
                              {client.headline}
                            </DialogTitle>
                            <DialogDescription className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                              <DailyBriefChannelIcon
                                channel={client.channel}
                                large
                              />
                              {client.name} · {client.label}
                              <Link
                                aria-label={`Ouvrir la conversation avec ${client.name} dans Canaux`}
                                className="ml-2 inline-flex items-center gap-0.5 rounded text-muted-foreground/75 underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                                href={`/channels?conversation=${client.conversationId}${draftReplies[client.conversationId] ? `&draft=${encodeURIComponent(draftReplies[client.conversationId])}` : ""}`}
                              >
                                Canaux
                                <ArrowUpRightIcon className="size-3" />
                              </Link>
                            </DialogDescription>
                          </div>
                        </div>
                      </DialogHeader>
                      <div className="flex min-h-0 flex-1 flex-col">
                        <BriefSourcePreview
                          client={client}
                          sentReplies={sentReplies[client.conversationId] ?? []}
                        >
                          <BriefReplyComposer
                            answered={answered}
                            client={client}
                            draft={draftReplies[client.conversationId] ?? ""}
                            nextClientName={nextPendingClient?.name}
                            onDraftChange={(value) =>
                              setDraftReplies((current) => ({
                                ...current,
                                [client.conversationId]: value,
                              }))
                            }
                            onNext={() => {
                              if (!nextPendingClient) {
                                setOpenIndex(null);
                                return;
                              }
                              setReadConversationIds((current) =>
                                new Set(current).add(
                                  nextPendingClient.conversationId,
                                ),
                              );
                              setOpenIndex(nextPendingIndex);
                            }}
                            onSend={() => {
                              const body =
                                draftReplies[client.conversationId]?.trim();
                              if (!body) return;
                              const reply = {
                                id: crypto.randomUUID(),
                                body,
                                time: new Intl.DateTimeFormat("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }).format(new Date()),
                              };
                              setSentReplies((current) => ({
                                ...current,
                                [client.conversationId]: [
                                  ...(current[client.conversationId] ?? []),
                                  reply,
                                ],
                              }));
                              setDraftReplies((current) => ({
                                ...current,
                                [client.conversationId]: "",
                              }));
                              toastSuccess({
                                description:
                                  "Réponse envoyée. Cette conversation est maintenant traitée.",
                              });
                            }}
                          />
                        </BriefSourcePreview>
                      </div>
                    </DialogContent>
                  </Dialog>
                </article>
              );
            })}
          </div>

          <AnimatePresence>
            {refreshing ? (
              <motion.div
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-background/92 backdrop-blur-sm"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
              >
                <RotateCcwIcon className="size-5 animate-spin text-blue-600" />
                <p className="mt-3 font-medium text-xs">
                  Mue vérifie les nouveaux échanges…
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>

        <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
          <span>Mis à jour à 08:44</span>
          <span aria-hidden="true">•</span>
          <button
            className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-50"
            disabled={refreshing}
            onClick={() => setRefreshing(true)}
            type="button"
          >
            <RotateCcwIcon className="size-3" />
            Actualiser
          </button>
        </div>
      </motion.section>
    </div>
  );
}

function DisconnectedBriefState({
  greeting,
  onConnectChannel,
}: {
  greeting: string;
  onConnectChannel: () => void;
}) {
  return (
    <div className="flex min-h-[calc(100svh-8rem)] w-full items-start justify-center px-6 pb-12 pt-16 sm:pt-20">
      <section className="w-full max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          <InboxIcon className="size-6" />
        </span>
        <h1 className="mt-5 font-medium text-3xl tracking-tight">{greeting}</h1>
        <h2 className="mt-8 font-semibold text-lg">Aucun canal connecté</h2>
        <p className="mt-2 text-muted-foreground text-sm leading-6">
          Connectez votre messagerie pour que Mue puisse préparer vos briefs et
          faire ressortir les échanges importants.
        </p>
        <Button
          className="mt-6 rounded-xl bg-blue-600 hover:bg-blue-700"
          onClick={onConnectChannel}
        >
          Connecter un canal
        </Button>
      </section>
    </div>
  );
}

// biome-ignore lint/correctness/noUnusedVariables: kept temporarily for the alternate brief prototype.
function DailyBriefOverview() {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStep, setRefreshStep] = useState(0);

  useEffect(() => {
    if (!refreshing) return;

    const timers = [
      window.setTimeout(() => setRefreshStep(1), 850),
      window.setTimeout(() => setRefreshStep(2), 1750),
      window.setTimeout(() => setRefreshStep(3), 2650),
      window.setTimeout(() => {
        setRefreshing(false);
        setRefreshStep(0);
      }, 3600),
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [refreshing]);

  const refreshLabels = [
    "Connexion aux canaux…",
    "Lecture des nouveaux échanges…",
    "Comparaison avec le brief actuel…",
    "Synthèse des changements…",
  ];

  return (
    <div className="relative min-h-0 flex-1 overflow-y-auto bg-background px-4 pb-14 pt-28 sm:px-6 sm:pt-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 opacity-60 dark:opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 62% 72% at 50% 0%, rgba(96,165,250,0.11), rgba(251,191,36,0.045) 52%, transparent 78%)",
        }}
      />

      <main className="relative mx-auto w-full max-w-5xl">
        <header className="flex flex-col gap-5 border-b border-foreground/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-medium text-[11px] text-blue-600 uppercase tracking-[0.16em]">
              Mercredi 26 août
            </p>
            <h1 className="mt-2 font-medium text-3xl tracking-tight sm:text-4xl">
              Bonjour Wacil
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">
              Voici ce qui a évolué dans vos échanges depuis hier.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-right text-[10px] text-muted-foreground leading-4">
              18 messages · 3 canaux
              <br />
              Actualisé à 08:44
            </span>
            <Button
              aria-label="Actualiser le brief"
              className="size-9 rounded-lg p-0"
              disabled={refreshing}
              onClick={() => setRefreshing(true)}
              variant="outline"
            >
              <RotateCcwIcon
                className={cn("size-3.5", refreshing && "animate-spin")}
              />
            </Button>
          </div>
        </header>

        <AnimatePresence initial={false}>
          {refreshing ? (
            <motion.div
              animate={{ height: "auto", opacity: 1 }}
              className="relative overflow-hidden border-b border-blue-200/70 bg-blue-50/40 px-1 py-3 dark:border-blue-900/50 dark:bg-blue-950/15"
              exit={{ height: 0, opacity: 0 }}
              initial={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-3">
                <span className="size-1.5 animate-pulse rounded-full bg-blue-600" />
                <AnimatePresence mode="wait">
                  <motion.p
                    animate={{ opacity: 1, y: 0 }}
                    className="font-medium text-[11px]"
                    exit={{ opacity: 0, y: -3 }}
                    initial={{ opacity: 0, y: 3 }}
                    key={refreshStep}
                  >
                    {refreshLabels[refreshStep]}
                  </motion.p>
                </AnimatePresence>
              </div>
              <motion.span
                animate={{ width: `${(refreshStep + 1) * 25}%` }}
                className="absolute inset-x-0 bottom-0 h-px bg-blue-600"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <section className="grid gap-8 py-7 lg:grid-cols-[minmax(0,1.55fr)_minmax(260px,0.75fr)] lg:gap-12">
          <div>
            <div className="border-b border-foreground/10 pb-6">
              <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
                En bref
              </p>
              <p className="mt-3 max-w-3xl text-balance font-medium text-xl leading-8 tracking-[-0.015em] sm:text-2xl sm:leading-9">
                L’activité se concentre autour de trois clients : un paiement
                reste sans nouvelle, une livraison vient d’être validée et une
                conversation récente attend votre attention.
              </p>
            </div>

            <div className="mt-7">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-semibold text-sm">Situations détectées</h2>
                <span className="text-[10px] text-muted-foreground">
                  Classées par impact client
                </span>
              </div>

              <div className="mt-2">
                {dailyBriefClients.map((client, index) => (
                  <motion.article
                    animate={{ opacity: 1, y: 0 }}
                    className="grid gap-3 border-b border-foreground/10 py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)]"
                    initial={{ opacity: 0, y: 6 }}
                    key={client.name}
                    transition={{
                      delay: 0.08 + index * 0.06,
                      duration: 0.32,
                    }}
                  >
                    <span
                      aria-label={`Photo de profil de ${client.name}`}
                      className="size-10 rounded-full bg-[url('/images/avatars/freescale-contacts-grid.webp')] bg-no-repeat outline outline-1 outline-border/70"
                      role="img"
                      style={{
                        backgroundPosition: client.avatarPosition,
                        backgroundSize: "300% 300%",
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="font-semibold text-sm">{client.name}</h3>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 font-medium text-[9px]",
                            client.tone === "amber" &&
                              "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
                            client.tone === "emerald" &&
                              "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
                            client.tone === "blue" &&
                              "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
                          )}
                        >
                          {client.label}
                        </span>
                      </div>
                      <p className="mt-2 max-w-2xl text-[13px] text-muted-foreground leading-5">
                        {client.observation}
                      </p>
                      <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <DailyBriefChannelIcon channel={client.channel} />
                        {client.channel} · {client.source}
                      </p>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:border-l lg:border-foreground/10 lg:pl-8">
            <h2 className="font-semibold text-sm">Ce qui a changé</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Depuis le brief d’hier à 18:04
            </p>

            <ol className="mt-5">
              {dailyBriefChanges.map((change, index) => (
                <li
                  className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 pb-6 last:pb-0"
                  key={change.title}
                >
                  {index < dailyBriefChanges.length - 1 ? (
                    <span className="absolute bottom-0 left-[2.95rem] top-5 w-px bg-foreground/10" />
                  ) : null}
                  <span className="pt-0.5 text-[10px] text-muted-foreground tabular-nums">
                    {change.time}
                  </span>
                  <span className="relative pl-4">
                    <span className="absolute left-0 top-1.5 size-1.5 rounded-full bg-blue-600 ring-4 ring-background" />
                    <span className="block font-medium text-xs leading-5">
                      {change.title}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                      {change.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-8 border-t border-foreground/10 pt-5">
              <p className="text-[11px] text-muted-foreground leading-5">
                Le brief est une lecture de vos échanges. Aucune réponse, tâche
                ou relance n’est créée automatiquement.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function DailyBriefChannelIcon({
  channel,
  large = false,
}: {
  channel: string;
  large?: boolean;
}) {
  const size = large ? 16 : 12;
  if (channel === "Gmail") return <Gmail height={size} width={size} />;
  if (channel === "Outlook") return <Outlook height={size} width={size} />;
  return (
    <WhatsAppIcon
      className={cn(large ? "size-4" : "size-3", "text-emerald-500")}
    />
  );
}

type BriefSentReply = { id: string; body: string; time: string };

function BriefReplyComposer({
  answered,
  client,
  draft,
  nextClientName,
  onDraftChange,
  onNext,
  onSend,
}: {
  answered: boolean;
  client: (typeof dailyBriefClients)[number];
  draft: string;
  nextClientName?: string;
  onDraftChange: (value: string) => void;
  onNext: () => void;
  onSend: () => void;
}) {
  const [manualReply, setManualReply] = useState(false);
  const [alternativeIndex, setAlternativeIndex] = useState(0);
  const [generation, setGeneration] = useState<{
    phase: "loading" | "streaming";
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const generationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialReplyRequestedRef = useRef(false);
  const reducedMotion = useReducedMotion();
  const replyBusy = generation !== null;

  useEffect(
    () => () => {
      if (generationTimerRef.current !== null) {
        clearTimeout(generationTimerRef.current);
        generationTimerRef.current = null;
      }
      initialReplyRequestedRef.current = false;
    },
    [],
  );

  useEffect(() => {
    if (replyBusy && draft && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [draft, replyBusy]);

  function generate(variant: BriefReplyVariant = "suggested") {
    if (generationTimerRef.current !== null) return;

    const text = dailyBriefReplies[client.conversationId][variant];
    setManualReply(false);
    setGeneration({ phase: "loading" });
    onDraftChange("");
    textareaRef.current?.focus();

    generationTimerRef.current = setTimeout(() => {
      setGeneration({ phase: "streaming" });
      const startedAt = performance.now();
      const characters = Array.from(text);
      const duration = Math.min(1200, Math.max(520, characters.length * 5));

      function reveal() {
        const linearProgress = reducedMotion
          ? 1
          : Math.min(1, (performance.now() - startedAt) / duration);
        const progress = 1 - (1 - linearProgress) ** 3;
        const count = Math.max(1, Math.floor(characters.length * progress));
        onDraftChange(characters.slice(0, count).join(""));

        if (linearProgress < 1) {
          generationTimerRef.current = setTimeout(reveal, 24);
        } else {
          generationTimerRef.current = null;
          setGeneration(null);
        }
      }

      reveal();
    }, 180);
  }

  // The first suggestion is intentionally generated once when the modal composer mounts.
  // biome-ignore lint/correctness/useExhaustiveDependencies: generate is not a stable callback and must not retrigger the initial suggestion.
  useEffect(() => {
    if (answered || initialReplyRequestedRef.current || draft) return;
    initialReplyRequestedRef.current = true;
    generate();
  }, [answered, draft]);

  function proposeAlternative() {
    const alternatives: BriefReplyVariant[] = [
      "warm",
      "direct",
      "professional",
      "suggested",
    ];
    const variant = alternatives[alternativeIndex % alternatives.length];
    setAlternativeIndex((current) => current + 1);
    generate(variant);
  }

  return (
    <div className="shrink-0 bg-background p-4 pt-3 sm:px-6 sm:pb-5">
      <span className="sr-only" role="status">
        {generation ? "Mue prépare le texte…" : ""}
      </span>
      <div className="rounded-2xl border border-border bg-background shadow-sm transition-[border-color,box-shadow] focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-500/10 dark:focus-within:border-blue-800">
        <div className="overflow-hidden rounded-[15px] bg-background">
          <div className="flex items-center justify-between gap-3 px-4 pt-3.5">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full",
                  manualReply
                    ? "bg-muted text-foreground"
                    : "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300",
                )}
              >
                {manualReply ? (
                  <UserRoundPenIcon className="size-3.5" />
                ) : (
                  <Image
                    alt="Mue"
                    className="size-6 rounded-full object-cover"
                    height={24}
                    src="/images/mue/mue-focus.png"
                    width={24}
                  />
                )}
              </span>
              <span
                className={cn(
                  "truncate font-semibold text-[11px]",
                  manualReply
                    ? "text-foreground"
                    : "text-blue-600 dark:text-blue-300",
                )}
              >
                {manualReply
                  ? "Votre réponse"
                  : answered && !draft
                    ? "Mue reste disponible"
                    : replyBusy
                      ? "Mue prépare une réponse…"
                      : "Mue te propose une réponse"}
              </span>
            </div>
          </div>
          <Textarea
            aria-busy={replyBusy}
            aria-label={`Réponse à ${client.name}`}
            className={cn(
              "min-h-20 max-h-[18svh] resize-none rounded-none border-0 bg-transparent px-4 py-2.5 text-sm text-foreground leading-6 shadow-none transition-colors duration-500 placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0",
              replyBusy &&
                generation?.phase === "streaming" &&
                "bg-[linear-gradient(90deg,#64748b_0%,#2563eb_28%,#7c3aed_48%,#ec4899_68%,#64748b_100%)] bg-[length:240%_100%] bg-clip-text text-transparent [animation:mue-text-flow_1.8s_ease-in-out_infinite] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] motion-reduce:animate-none",
            )}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder={
              replyBusy
                ? "Mue prépare une réponse…"
                : answered
                  ? `Écrivez un message de suivi à ${client.name.split(" ")[0]}…`
                  : `Écrivez votre réponse à ${client.name.split(" ")[0]}…`
            }
            readOnly={replyBusy}
            ref={textareaRef}
            value={draft}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 bg-muted/20 px-3 py-2.5">
            {!manualReply && Boolean(draft.trim()) && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  aria-label="Raccourcir la réponse"
                  className="inline-flex min-h-8 items-center rounded-lg border border-border bg-background px-2.5 font-medium text-[10px] text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:cursor-wait disabled:opacity-50"
                  disabled={generation !== null}
                  onClick={() => generate("short")}
                  type="button"
                >
                  Plus court
                </button>
                <button
                  aria-label="Rendre la réponse plus cordiale"
                  className="inline-flex min-h-8 items-center rounded-lg border border-border bg-background px-2.5 font-medium text-[10px] text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:cursor-wait disabled:opacity-50"
                  disabled={generation !== null}
                  onClick={() => generate("professional")}
                  type="button"
                >
                  Plus cordial
                </button>
                <button
                  aria-label="Proposer une autre réponse"
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 font-medium text-[10px] text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:cursor-wait disabled:opacity-50"
                  disabled={generation !== null}
                  onClick={proposeAlternative}
                  type="button"
                >
                  {replyBusy ? (
                    <LoaderCircleIcon
                      aria-hidden="true"
                      className="size-3.5 animate-spin text-blue-500 motion-reduce:animate-none"
                    />
                  ) : (
                    <RotateCcwIcon className="size-3.5" />
                  )}
                  Autre proposition
                </button>
              </div>
            )}
            <div className="ml-auto flex items-center">
              <button
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[hsl(var(--button-gradient-border))] [background-image:var(--button-gradient)] px-3.5 font-semibold text-[11px] text-white shadow-[0_2px_10.1px_hsl(var(--button-gradient-shadow)/0.2)] transition-[filter,transform,box-shadow] hover:-translate-y-px hover:brightness-[1.03] hover:shadow-[0_2px_14px_hsl(var(--button-gradient-shadow)/0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 motion-reduce:transform-none"
                disabled={!draft.trim() || generation !== null}
                onClick={onSend}
                title="Envoi simulé dans cette démonstration"
                type="button"
              >
                Envoyer sur {client.channel}
                <SendHorizontalIcon className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {answered && (
          <motion.div
            animate={{ height: "auto", opacity: 1, y: 0 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0, y: -6 }}
            initial={{ height: 0, opacity: 0, y: -10 }}
            transition={{
              duration: reducedMotion ? 0.01 : 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="mt-2.5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 shadow-[0_8px_20px_-16px_rgba(16,185,129,0.55)] dark:border-emerald-900/70 dark:bg-emerald-950/20">
              <motion.span
                animate={{ scale: 1 }}
                className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                initial={{ scale: reducedMotion ? 1 : 0.65 }}
                transition={{
                  delay: reducedMotion ? 0 : 0.18,
                  duration: reducedMotion ? 0.01 : 0.32,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <CheckIcon className="size-3.5 stroke-[2.5]" />
              </motion.span>
              <p className="min-w-0 flex-1 truncate font-medium text-[11px] text-emerald-900 dark:text-emerald-100">
                Réponse envoyée à {client.name}
              </p>
              <button
                className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 font-semibold text-[10px] text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
                onClick={onNext}
                type="button"
              >
                {nextClientName
                  ? `Répondre à ${nextClientName.split(" ")[0]}`
                  : "Terminer le brief"}
                <ArrowRightIcon className="size-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BriefSourcePreview({
  children,
  client,
  sentReplies,
}: {
  children: ReactNode;
  client: (typeof dailyBriefClients)[number];
  sentReplies: BriefSentReply[];
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <ChannelConversationThread client={client} sentReplies={sentReplies} />
      {children}
    </div>
  );
}

function ChannelConversationThread({
  client,
  sentReplies,
}: {
  client: (typeof dailyBriefClients)[number];
  sentReplies: BriefSentReply[];
}) {
  const threadRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const thread = threadRef.current;
    if (!thread) return;
    thread.scrollTo({
      top: thread.scrollHeight,
      behavior: sentReplies.length ? "smooth" : "instant",
    });
  }, [sentReplies.length]);

  return (
    <section
      aria-label={`Conversation avec ${client.name}`}
      className="mx-4 min-h-0 flex-1 scroll-smooth overflow-y-auto overscroll-contain rounded-2xl border border-border/80 bg-[#f7f8fa] px-4 py-5 shadow-[0_14px_36px_-28px_rgba(15,23,42,0.36)] sm:mx-6 sm:px-6 dark:bg-muted/15"
      ref={threadRef}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="mb-2 flex items-center justify-center">
          <Badge variant="secondary">Aujourd’hui</Badge>
        </div>
        {client.previousMessages.map((message) => {
          const outgoing = message.sender === "Wacil Ait";
          return (
            <div
              className={cn(
                "flex max-w-[85%] flex-col",
                outgoing ? "ml-auto items-end" : "mr-auto items-start",
              )}
              key={`${message.sender}-${message.time}`}
            >
              <div
                className={cn(
                  "whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                  outgoing
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md border bg-background",
                )}
              >
                {message.body}
              </div>
              <span className="mt-1 px-1 text-[11px] text-muted-foreground">
                {message.time}
              </span>
            </div>
          );
        })}

        <div className="mr-auto flex max-w-[85%] flex-col items-start">
          <div className="whitespace-pre-line rounded-2xl rounded-bl-md border bg-background px-4 py-3 text-sm leading-6 shadow-sm">
            {client.messageBody}
          </div>
          <span className="mt-1 px-1 text-[11px] text-muted-foreground">
            {client.messageTime}
          </span>
        </div>
        {sentReplies.map((reply) => (
          <div
            className="ml-auto flex max-w-[85%] flex-col items-end"
            key={reply.id}
          >
            <div className="whitespace-pre-line rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground shadow-sm">
              {reply.body}
            </div>
            <span className="mt-1 px-1 text-[11px] text-muted-foreground">
              Envoi simulé · {reply.time}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// biome-ignore lint/correctness/noUnusedVariables: kept temporarily for the alternate brief prototype.
function LegacyBriefPanel() {
  const [homeTasks, setHomeTasks] = useState<Task[]>(() =>
    homePriorityTaskIds
      .map((id) => seedTasks.find((task) => task.id === id))
      .filter((task): task is Task => Boolean(task)),
  );
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanMode, setScanMode] = useState<ScanMode>("initial");
  const [hasCompletedInitialScan, setHasCompletedInitialScan] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [messagesScanned, setMessagesScanned] = useState(0);
  const [completedQuickActionIds, setCompletedQuickActionIds] = useState<
    string[]
  >([]);

  useEffect(() => {
    try {
      const savedTasks = window.localStorage.getItem(TASKS_STORAGE_KEY);
      if (!savedTasks) return;

      const storedTasks = JSON.parse(savedTasks) as Task[];
      const storedById = new Map(storedTasks.map((task) => [task.id, task]));
      setHomeTasks(
        homePriorityTaskIds
          .map((id) => {
            const seedTask = seedTasks.find((task) => task.id === id);
            const storedTask = storedById.get(id);
            if (!seedTask) return;
            return storedTask
              ? {
                  ...seedTask,
                  ...storedTask,
                  context: storedTask.context ?? seedTask.context,
                }
              : seedTask;
          })
          .filter((task): task is Task => Boolean(task)),
      );
    } catch {
      // Keep the seeded priorities if local task data cannot be read.
    }
  }, []);

  useEffect(() => {
    if (scanState !== "scanning") return;

    const timers: number[] = [];
    const schedule = (callback: () => void, delay: number) => {
      timers.push(window.setTimeout(callback, delay));
    };

    const initial = scanMode === "initial";
    const totalMessages = initial ? 18 : 7;

    if (initial) {
      for (let percent = 1; percent < 100; percent += 1) {
        schedule(() => setScanProgress(percent), 60 + percent * 92);
      }
      schedule(() => setScanProgress(100), 9500);
    }

    schedule(() => setScanStep(1), initial ? 1500 : 520);
    for (let message = 1; message <= totalMessages; message += 1) {
      schedule(
        () => setMessagesScanned(message),
        (initial ? 500 : 520) + message * (initial ? 120 : 110),
      );
    }
    schedule(() => setScanStep(2), initial ? 3200 : 1550);
    schedule(() => setScanStep(3), initial ? 5000 : 2550);
    if (initial) {
      schedule(() => setScanStep(4), 6700);
      schedule(() => setScanStep(5), 8200);
    }
    schedule(
      () => {
        if (initial) {
          setHasCompletedInitialScan(true);
        }
        setScanState("complete");
      },
      initial ? 10_000 : 3550,
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [scanMode, scanState]);

  const startScan = () => {
    setScanMode(hasCompletedInitialScan ? "refresh" : "initial");
    setScanStep(0);
    setScanProgress(0);
    setMessagesScanned(0);
    setScanState("scanning");
  };

  const cancelScan = () => {
    setScanStep(0);
    setScanProgress(0);
    setMessagesScanned(0);
    setScanState("idle");
  };

  const completeQuickAction = (task: Task) => {
    setCompletedQuickActionIds((current) =>
      current.includes(task.id) ? current : [...current, task.id],
    );
    toastSuccess({
      description: `Action effectuée pour ${task.contact?.name ?? "ce contact"}.`,
    });
  };

  return (
    <div className="relative flex min-h-0 flex-1 justify-center overflow-y-auto px-4 pb-10 pt-28 sm:px-6 sm:pb-14 sm:pt-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-2/3 opacity-70 dark:opacity-25"
        style={{
          background:
            "radial-gradient(ellipse 70% 70% at 50% 0%, rgba(96, 165, 250, 0.12) 0%, rgba(251, 191, 36, 0.07) 50%, transparent 78%)",
        }}
      />
      <div className="relative w-full max-w-5xl">
        <header
          className={cn(
            "text-center",
            hasCompletedInitialScan ? "mb-8 sm:mb-10" : "mb-3 sm:mb-4",
          )}
        >
          <h1 className="font-medium text-3xl tracking-tight sm:text-4xl">
            Bonjour Wacil
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground text-sm leading-6 sm:text-base">
            {hasCompletedInitialScan ? (
              <>
                Mue a analysé{" "}
                <span className="font-semibold text-foreground">
                  18 nouveaux messages.
                </span>
                <br />
                Trois actions rapides sont prêtes pour aujourd’hui.
              </>
            ) : (
              <>
                Transformez vos échanges en actions claires,
                <br /> sans parcourir chaque conversation.
              </>
            )}
          </p>
          {hasCompletedInitialScan || scanState === "scanning" ? (
            <>
              <Button
                className="mt-5"
                Icon={
                  scanState === "scanning"
                    ? XIcon
                    : scanState === "complete"
                      ? RotateCcwIcon
                      : ScanSearchIcon
                }
                onClick={scanState === "scanning" ? cancelScan : startScan}
                variant="outline"
              >
                {scanState === "scanning"
                  ? "Arrêter l’analyse"
                  : "Actualiser le brief"}
              </Button>
              <p className="mt-2 text-muted-foreground text-[11px]">
                {scanState === "complete"
                  ? "Brief actualisé à l’instant"
                  : "Dernière actualisation hier à 18:04"}
              </p>
            </>
          ) : null}
        </header>

        <ScanExperience
          completedTaskIds={completedQuickActionIds}
          hasCompletedInitialScan={hasCompletedInitialScan}
          messagesScanned={messagesScanned}
          onCompleteTask={completeQuickAction}
          onStartScan={startScan}
          scanMode={scanMode}
          scanProgress={scanProgress}
          scanState={scanState}
          scanStep={scanStep}
          tasks={homeTasks}
        />
      </div>
    </div>
  );
}

function ScanExperience({
  completedTaskIds,
  hasCompletedInitialScan,
  messagesScanned,
  onCompleteTask,
  onStartScan,
  scanMode,
  scanProgress,
  scanState,
  scanStep,
  tasks,
}: {
  completedTaskIds: string[];
  hasCompletedInitialScan: boolean;
  messagesScanned: number;
  onCompleteTask: (task: Task) => void;
  onStartScan: () => void;
  scanMode: ScanMode;
  scanProgress: number;
  scanState: ScanState;
  scanStep: number;
  tasks: Task[];
}) {
  const progress = ((scanStep + 1) / scanPhases.length) * 100;
  const taskChanges =
    scanMode === "refresh" && scanState === "complete"
      ? {
          "task-5": "updated" as const,
          "task-11": "closable" as const,
          "task-12": "new" as const,
        }
      : undefined;

  if (!hasCompletedInitialScan && scanState === "idle") {
    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-3xl px-3 pb-6 pt-3 sm:px-5"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex justify-center">
          <Button
            className="bg-blue-600 text-white shadow-[0_2px_10px_rgba(37,99,235,0.22)] hover:bg-blue-700"
            Icon={SparklesIcon}
            onClick={onStartScan}
          >
            Générer votre brief
          </Button>
        </div>

        <div className="mt-12">
          <div className="flex items-end justify-between gap-6 border-b border-foreground/10 pb-3">
            <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.16em]">
              Votre brief répondra à
            </p>
            <span className="text-[10px] text-muted-foreground">
              Lecture seule · rien n’est envoyé
            </span>
          </div>

          <div>
            {[
              {
                number: "01",
                question: "Qui attend quelque chose de vous ?",
                detail: "Demandes et réponses en attente",
              },
              {
                number: "02",
                question: "Qu’est-ce qui risque de vous échapper ?",
                detail: "Engagements, retards et échéances",
              },
              {
                number: "03",
                question: "Qu’est-ce qui peut attendre ?",
                detail: "Le reste, classé sans bruit",
              },
            ].map((item, index) => (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="group grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-4 border-b border-foreground/10 py-4 sm:grid-cols-[3.25rem_minmax(0,1fr)_auto] sm:py-5"
                initial={{ opacity: 0, x: -8 }}
                key={item.number}
                transition={{
                  delay: 0.12 + index * 0.08,
                  duration: 0.36,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <span className="font-medium text-blue-600 text-xs tabular-nums">
                  {item.number}
                </span>
                <span className="font-medium text-sm tracking-[-0.01em] sm:text-base">
                  {item.question}
                </span>
                <span className="col-start-2 mt-0.5 text-[10px] text-muted-foreground sm:col-start-auto sm:mt-0 sm:text-right sm:text-[11px]">
                  {item.detail}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (!hasCompletedInitialScan && scanState === "scanning") {
    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-5xl px-1 pb-4 pt-2"
        initial={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-[11px] text-muted-foreground">
              {messagesScanned} sur 18 messages parcourus
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                animate={{
                  backgroundPosition: ["180% 0", "-80% 0"],
                  opacity: 1,
                  y: 0,
                }}
                className="mt-1 min-h-7 bg-[linear-gradient(90deg,#64748b_0%,#2563eb_32%,#7c3aed_50%,#d97706_68%,#64748b_100%)] bg-[length:240%_100%] bg-clip-text font-medium text-base text-transparent sm:text-lg"
                exit={{ opacity: 0, y: -4 }}
                initial={{ opacity: 0, y: 4 }}
                key={scanStep}
                transition={{
                  backgroundPosition: {
                    duration: 2.4,
                    ease: "linear",
                    repeat: Number.POSITIVE_INFINITY,
                  },
                  opacity: { duration: 0.22 },
                  y: { duration: 0.22 },
                }}
              >
                {initialScanMessages[scanStep]}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="flex items-end justify-center gap-3 sm:justify-end">
            <ScanChannelIcons />
            <p className="font-semibold text-3xl tracking-tight tabular-nums">
              {scanProgress}
              <span className="ml-0.5 text-base text-muted-foreground">%</span>
            </p>
          </div>
        </div>

        <div
          aria-label={`Analyse effectuée à ${scanProgress} %`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={scanProgress}
          className="h-1 overflow-hidden bg-muted"
          role="progressbar"
        >
          <motion.div
            animate={{ width: `${scanProgress}%` }}
            className="h-full bg-[linear-gradient(90deg,#2563eb,#7c3aed,#f59e0b)]"
            transition={{ duration: 0.12, ease: "linear" }}
          />
        </div>

        <ScanBuildingCards scanStep={scanStep} tasks={tasks} />
      </motion.div>
    );
  }

  return (
    <div aria-live="polite" className="min-h-[252px]">
      <AnimatePresence initial={false} mode="popLayout">
        {scanState === "scanning" ? (
          <motion.div
            animate={{ height: "auto", opacity: 1, y: 0 }}
            className="relative mb-3 overflow-hidden rounded-xl border border-blue-200/70 bg-blue-50/45 px-4 py-3 dark:border-blue-900/60 dark:bg-blue-950/20"
            exit={{ height: 0, marginBottom: 0, opacity: 0, y: -4 }}
            initial={{ height: 0, opacity: 0, y: -4 }}
            key="incremental-scan"
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3">
              <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-background text-blue-600 shadow-sm dark:border-blue-800">
                <ScanSearchIcon className="size-4" />
                <span className="absolute -right-0.5 -top-0.5 size-2 animate-pulse rounded-full border-2 border-background bg-blue-500" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p className="font-semibold text-xs">
                    Mue analyse uniquement les nouveaux échanges
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {messagesScanned > 0
                      ? `${messagesScanned} sur 7 messages`
                      : "Connexion en cours"}
                  </span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 truncate text-[11px] text-muted-foreground"
                    exit={{ opacity: 0, y: -3 }}
                    initial={{ opacity: 0, y: 3 }}
                    key={scanStep}
                    transition={{ duration: 0.18 }}
                  >
                    {scanPhases[scanStep].label} · {scanPhases[scanStep].detail}
                  </motion.p>
                </AnimatePresence>
              </div>
              <ScanChannelIcons />
            </div>
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-100 dark:bg-blue-950"
            >
              <motion.span
                animate={{ width: `${progress}%` }}
                className="block h-full bg-blue-500"
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <MuePriorityBlock
        tasks={tasks}
        completedTaskIds={completedTaskIds}
        onCompleteTask={onCompleteTask}
        taskChanges={taskChanges}
      />
    </div>
  );
}

const scanCardMeta = [
  {
    channel: "Gmail",
    source: "Facture F-2048",
    signal: "Paiement en attente",
    formingStep: 2,
    readyStep: 3,
  },
  {
    channel: "Outlook",
    source: "Projet SEO",
    signal: "Livraison confirmée",
    formingStep: 3,
    readyStep: 4,
  },
  {
    channel: "WhatsApp",
    source: "Message reçu il y a 24 min",
    signal: "Réponse attendue",
    formingStep: 4,
    readyStep: 5,
  },
] as const;

function ScanBuildingCards({
  scanStep,
  tasks,
}: {
  scanStep: number;
  tasks: Task[];
}) {
  return (
    <div className="mt-5 grid gap-3 md:grid-cols-3">
      {tasks.map((task, index) => {
        const meta = scanCardMeta[index] ?? scanCardMeta[2];
        const forming = scanStep >= meta.formingStep;
        const ready = scanStep >= meta.readyStep;

        return (
          <motion.article
            animate={{ opacity: 1, y: 0 }}
            className="relative flex min-h-[220px] flex-col overflow-hidden rounded-xl border border-border/80 bg-background px-4 py-4"
            initial={{ opacity: 0, y: 8 }}
            key={task.id}
            transition={{ delay: index * 0.08, duration: 0.35 }}
          >
            {!ready ? <AiSkeletonGlow /> : null}
            {forming ? (
              <>
                <div className="relative flex items-center justify-between gap-2">
                  <span className="rounded-md bg-blue-50 px-2 py-1 font-semibold text-[10px] text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                    {meta.signal}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Source vérifiée
                  </span>
                </div>
                <div className="relative mt-3 flex items-center gap-2.5">
                  {task.contact ? (
                    <span
                      aria-label={`Photo de profil de ${task.contact.name}`}
                      className="size-9 shrink-0 rounded-full bg-[url('/images/avatars/freescale-contacts-grid.webp')] bg-no-repeat outline outline-1 outline-border/70"
                      role="img"
                      style={{
                        backgroundPosition: task.contact.avatarPosition,
                        backgroundSize: "300% 300%",
                      }}
                    />
                  ) : null}
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-xs">
                      {task.contact?.name}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <ScanSourceIcon channel={meta.channel} />
                      {meta.source}
                    </span>
                  </span>
                </div>
                {ready ? (
                  <motion.h3
                    animate={{ opacity: 1, y: 0 }}
                    className="relative mt-4 line-clamp-2 min-h-10 font-semibold text-[13px] leading-5"
                    initial={{ opacity: 0, y: 5 }}
                  >
                    {task.title}
                  </motion.h3>
                ) : (
                  <div className="relative mt-5 space-y-2">
                    <AiSkeletonLine className="w-[88%]" />
                    <AiSkeletonLine className="w-[62%]" />
                  </div>
                )}
                <div className="relative mt-auto border-t pt-3 text-right text-[10px] text-muted-foreground">
                  {ready
                    ? "Action proposée — en attente de validation"
                    : "Mue formule une action…"}
                </div>
              </>
            ) : (
              <div className="relative flex h-full flex-col">
                <AiSkeletonLine className="h-5 w-28" />
                <div className="mt-4 flex items-center gap-3">
                  <span className="size-9 rounded-full bg-muted/60" />
                  <span className="flex-1 space-y-2">
                    <AiSkeletonLine className="w-2/5" />
                    <AiSkeletonLine className="w-3/5" />
                  </span>
                </div>
                <div className="mt-6 space-y-2">
                  <AiSkeletonLine className="w-4/5" />
                  <AiSkeletonLine className="w-3/5" />
                </div>
                <p className="mt-auto text-[10px] text-muted-foreground">
                  Recherche d’un signal exploitable…
                </p>
              </div>
            )}
          </motion.article>
        );
      })}
    </div>
  );
}

function AiSkeletonGlow() {
  return (
    <motion.span
      animate={{ backgroundPosition: ["180% 0", "-80% 0"] }}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_20%,rgba(59,130,246,0.08)_38%,rgba(168,85,247,0.11)_50%,rgba(245,158,11,0.08)_62%,transparent_80%)] bg-[length:220%_100%]"
      transition={{
        duration: 2.2,
        ease: "linear",
        repeat: Number.POSITIVE_INFINITY,
      }}
    />
  );
}

function AiSkeletonLine({ className }: { className?: string }) {
  return (
    <motion.span
      animate={{ backgroundPosition: ["180% 0", "-80% 0"] }}
      className={cn(
        "block h-2.5 rounded-full bg-[linear-gradient(100deg,hsl(var(--muted))_15%,#dbeafe_35%,#f3e8ff_52%,#fef3c7_68%,hsl(var(--muted))_85%)] bg-[length:240%_100%]",
        className,
      )}
      transition={{
        duration: 2.1,
        ease: "linear",
        repeat: Number.POSITIVE_INFINITY,
      }}
    />
  );
}

function ScanSourceIcon({ channel }: { channel: string }) {
  if (channel === "Gmail") return <Gmail height="11" width="12" />;
  if (channel === "Outlook") return <Outlook height="12" width="12" />;
  return <WhatsAppIcon className="size-3 text-emerald-500" />;
}

function ScanChannelIcons() {
  return (
    <div
      aria-label="Canaux analysés"
      className="flex shrink-0 items-center -space-x-1.5"
      role="group"
    >
      <motion.span
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="flex size-8 items-center justify-center rounded-full border bg-background shadow-sm"
        initial={{ opacity: 0, scale: 0.82, y: 5 }}
        transition={{ delay: 0.04, duration: 0.3 }}
      >
        <Gmail height="15" width="16" />
      </motion.span>
      <motion.span
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="flex size-8 items-center justify-center rounded-full border bg-background shadow-sm"
        initial={{ opacity: 0, scale: 0.82, y: 5 }}
        transition={{ delay: 0.13, duration: 0.3 }}
      >
        <Outlook height="16" width="16" />
      </motion.span>
      <motion.span
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="flex size-8 items-center justify-center rounded-full border bg-background shadow-sm"
        initial={{ opacity: 0, scale: 0.82, y: 5 }}
        transition={{ delay: 0.22, duration: 0.3 }}
      >
        <WhatsAppIcon className="size-4 text-emerald-500" />
      </motion.span>
      <motion.span
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="flex size-8 items-center justify-center rounded-full border bg-background shadow-sm"
        initial={{ opacity: 0, scale: 0.82, y: 5 }}
        transition={{ delay: 0.31, duration: 0.3 }}
      >
        <Image alt="Slack" height={16} src="/images/slack.svg" width={16} />
      </motion.span>
    </div>
  );
}

type BriefItem = (typeof briefItems)[number];

const briefToneClasses = {
  blue: {
    badge: "bg-[#edf3ff] text-[#3565dc] dark:bg-[#162957] dark:text-[#a9c1ff]",
    card: "border-[#dce7ff] bg-[linear-gradient(108deg,hsl(var(--background))_0%,hsl(var(--background))_58%,#edf3ff_100%)] dark:border-[#263f76] dark:bg-[linear-gradient(108deg,hsl(var(--background))_0%,hsl(var(--background))_58%,#142349_100%)]",
    button:
      "bg-[linear-gradient(180deg,#5682f2_0%,#4271e8_100%)] text-white hover:brightness-[0.98]",
  },
  amber: {
    badge: "bg-[#edf8ff] text-[#287db5] dark:bg-[#102c43] dark:text-[#9bd8ff]",
    card: "border-[#d9edfa] bg-[linear-gradient(108deg,hsl(var(--background))_0%,hsl(var(--background))_58%,#edf8ff_100%)] dark:border-[#21465f] dark:bg-[linear-gradient(108deg,hsl(var(--background))_0%,hsl(var(--background))_58%,#10283a_100%)]",
    button:
      "bg-[linear-gradient(180deg,#58a9e7_0%,#3e8fd1_100%)] text-white hover:brightness-[0.98]",
  },
  rose: {
    badge: "bg-[#f0f2ff] text-[#555fce] dark:bg-[#202552] dark:text-[#b8beff]",
    card: "border-[#dfe2ff] bg-[linear-gradient(108deg,hsl(var(--background))_0%,hsl(var(--background))_58%,#f0f2ff_100%)] dark:border-[#343b79] dark:bg-[linear-gradient(108deg,hsl(var(--background))_0%,hsl(var(--background))_58%,#1c2147_100%)]",
    button:
      "bg-[linear-gradient(180deg,#737eea_0%,#5e68d8_100%)] text-white hover:brightness-[0.98]",
  },
  violet: {
    badge: "bg-[#f5f1ff] text-[#7256c8] dark:bg-[#2a204f] dark:text-[#cbbaff]",
    card: "border-[#e7ddff] bg-[linear-gradient(108deg,hsl(var(--background))_0%,hsl(var(--background))_58%,#f5f1ff_100%)] dark:border-[#443675] dark:bg-[linear-gradient(108deg,hsl(var(--background))_0%,hsl(var(--background))_58%,#271d46_100%)]",
    button:
      "bg-[linear-gradient(180deg,#8c76e8_0%,#735ecf_100%)] text-white hover:brightness-[0.98]",
  },
} as const;

function _BriefActionCard({
  item,
  isCompleted,
  onOpen,
  priority,
}: {
  item: BriefItem;
  isCompleted: boolean;
  onOpen: (item: BriefItem) => void;
  priority: number;
}) {
  return (
    <article
      className={cn(
        "flex min-h-[270px] flex-col overflow-hidden rounded-2xl border shadow-[0_12px_36px_-26px_rgba(15,23,42,0.28)] dark:shadow-[0_12px_36px_-26px_rgba(0,0,0,0.55)]",
        briefToneClasses[item.tone].card,
      )}
    >
      <div className="mx-4 mt-4 flex h-14 items-center gap-3 rounded-xl border border-black/[0.06] bg-background/70 px-3.5 shadow-sm backdrop-blur-sm dark:border-white/10">
        <span className="font-semibold text-3xl text-[#4771df] leading-none tracking-[-0.05em] tabular-nums dark:text-[#a9c1ff]">
          {priority}
        </span>
        <span className="font-semibold text-[9px] text-muted-foreground uppercase tracking-[0.14em]">
          Priorité
        </span>
      </div>

      <div className="min-w-0 flex-1 px-4 py-5">
        <h3 className="font-semibold text-[15px] leading-5 tracking-tight">
          {item.title}
        </h3>
        <p className="mt-2 text-muted-foreground text-xs leading-5">
          {item.description}
        </p>
      </div>

      <div className="px-4 pb-4">
        <button
          aria-label={item.action}
          className={cn(
            "inline-flex h-9 w-full shrink-0 items-center justify-center rounded-xl px-3 font-semibold text-xs shadow-[0_6px_16px_-8px_rgba(15,23,42,0.35)] ring-1 ring-black/[0.04] transition-[filter,box-shadow] hover:shadow-[0_8px_18px_-8px_rgba(15,23,42,0.42)] dark:ring-white/10",
            briefToneClasses[item.tone].button,
          )}
          onClick={() => onOpen(item)}
          type="button"
        >
          {isCompleted ? "Revoir" : item.action}
        </button>
      </div>
    </article>
  );
}

function _ActionWorkspace({
  completedItems,
  item,
  onBack,
  onComplete,
  onSelect,
}: {
  completedItems: string[];
  item: BriefItem;
  onBack: () => void;
  onComplete: (item: BriefItem) => void;
  onSelect: (item: BriefItem) => void;
}) {
  return (
    <section className="overflow-hidden rounded-[22px] border bg-background shadow-[0_28px_80px_-52px_rgba(15,23,42,0.45)]">
      <div className="grid min-h-[calc(100svh-9rem)] lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="border-b bg-muted/20 p-3 lg:border-r lg:border-b-0 lg:p-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <p className="font-semibold text-sm">Mes priorités</p>
              <p className="mt-0.5 text-muted-foreground text-[11px]">
                3 actions proposées
              </p>
            </div>
            <button
              aria-label="Fermer la tâche"
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              onClick={onBack}
              type="button"
            >
              <XIcon className="size-4" />
            </button>
          </div>

          <nav
            aria-label="Priorités"
            className="grid grid-cols-3 gap-2 lg:block lg:space-y-2"
          >
            {briefItems.slice(0, 3).map((priorityItem, index) => {
              const isActive = priorityItem.id === item.id;
              const isCompleted = completedItems.includes(priorityItem.id);

              return (
                <button
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "w-full rounded-xl border px-3 py-3 text-left transition-[background-color,border-color,box-shadow]",
                    isActive
                      ? "border-[#9bb5f5] bg-background shadow-sm ring-1 ring-[#4771df]/10 dark:border-[#4363aa]"
                      : "border-transparent hover:border-border hover:bg-background/70",
                  )}
                  key={priorityItem.id}
                  onClick={() => onSelect(priorityItem)}
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md font-semibold text-[11px] tabular-nums",
                        isActive
                          ? "bg-[#4771df] text-white"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {isCompleted ? (
                        <CheckIcon className="size-3" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="hidden text-muted-foreground text-[10px] uppercase tracking-[0.12em] sm:inline lg:inline">
                      Priorité
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 font-medium text-xs leading-5">
                    {priorityItem.title}
                  </p>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          <header className="flex min-h-16 items-center justify-between gap-4 border-b px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="text-muted-foreground text-[10px] uppercase tracking-[0.14em]">
                Tâche sélectionnée
              </p>
              <h2 className="mt-0.5 truncate font-semibold text-sm">
                {item.title}
              </h2>
            </div>
            <span className="hidden rounded-full bg-[#edf3ff] px-2.5 py-1 font-medium text-[#3565dc] text-[11px] sm:inline-flex dark:bg-[#162957] dark:text-[#a9c1ff]">
              Assisté par Mue
            </span>
          </header>

          <div className="grid min-h-[calc(100svh-13rem)] grid-rows-[minmax(520px,1fr)_auto] xl:grid-cols-[minmax(0,1fr)_390px] xl:grid-rows-1">
            <DestinationViewport item={item} />
            <aside className="min-h-0 border-t bg-background xl:max-h-[calc(100svh-13rem)] xl:overflow-y-auto xl:border-t-0 xl:border-l">
              <MueAssistantPanel
                item={item}
                key={item.id}
                onComplete={onComplete}
              />
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

function DestinationViewport({ item }: { item: BriefItem }) {
  const isSophieProposal = item.id === "sophie-proposal";

  return (
    <section className="min-h-0 overflow-y-auto bg-[#f3f5f8] p-4 sm:p-6 dark:bg-[#090b10]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between gap-3 text-muted-foreground text-[11px]">
          <span>
            {isSophieProposal
              ? "Appels d’offres / Sophie"
              : "Espace de travail"}
          </span>
          <span>Brouillon privé</span>
        </div>

        <article className="min-h-[720px] rounded-xl border bg-white px-7 py-8 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.38)] sm:px-12 sm:py-11 dark:bg-[#11141b]">
          {isSophieProposal ? (
            <>
              <p className="font-semibold text-[11px] text-[#4771df] uppercase tracking-[0.14em]">
                Proposition commerciale
              </p>
              <h2 className="mt-4 max-w-xl font-semibold text-3xl leading-tight tracking-tight">
                Refonte du portail client Meridian
              </h2>
              <p className="mt-3 text-muted-foreground text-sm">
                Préparé pour Sophie · 17 août 2026
              </p>

              <div className="my-8 h-px bg-border" />

              <div className="space-y-8">
                <DocumentSection
                  content="Créer un portail plus clair, plus rapide et plus utile pour les équipes clientes, tout en réduisant les demandes adressées au support."
                  number="01"
                  title="Objectif"
                />
                <DocumentSection
                  content="Recherche et cadrage, architecture des parcours, direction visuelle, prototypage des écrans clés et accompagnement de la recette."
                  number="02"
                  title="Périmètre proposé"
                />
                <DocumentSection
                  content="Une phase de cadrage de 2 semaines, suivie de 4 semaines de conception et de 2 semaines de validation et livraison."
                  number="03"
                  title="Calendrier"
                />
                <DocumentSection
                  content="Une collaboration resserrée avec un point hebdomadaire, des validations explicites à chaque étape et deux cycles de retours inclus."
                  number="04"
                  title="Méthode"
                />
              </div>
            </>
          ) : (
            <>
              <p className="font-semibold text-[11px] text-[#4771df] uppercase tracking-[0.14em]">
                Proposition de Mue
              </p>
              <h2 className="mt-4 font-semibold text-2xl tracking-tight">
                {item.title}
              </h2>
              <p className="mt-3 text-muted-foreground text-sm leading-6">
                {item.description}
              </p>
              <Textarea
                className="mt-8 min-h-80 resize-none border-0 bg-muted/30 p-5 text-sm leading-7 shadow-none focus-visible:ring-1"
                defaultValue={item.workspaceContent}
              />
            </>
          )}
        </article>
      </div>
    </section>
  );
}

function DocumentSection({
  content,
  number,
  title,
}: {
  content: string;
  number: string;
  title: string;
}) {
  return (
    <section className="grid gap-2 sm:grid-cols-[44px_minmax(0,1fr)]">
      <span className="font-mono text-[#4771df] text-xs">{number}</span>
      <div>
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="mt-2 text-muted-foreground text-sm leading-6">
          {content}
        </p>
      </div>
    </section>
  );
}

function MueAssistantPanel({
  item,
  onComplete,
}: {
  item: BriefItem;
  onComplete: (item: BriefItem) => void;
}) {
  const [stage, setStage] = useState<"context" | "format" | "ready">(
    item.id === "sophie-proposal" ? "context" : "format",
  );
  const [deliverable, setDeliverable] = useState<
    "document" | "slides" | "both"
  >("document");

  const stageIndex = stage === "context" ? 0 : stage === "format" ? 1 : 2;
  const isSophieProposal = item.id === "sophie-proposal";

  return (
    <section className="p-5 pb-10">
      <div className="mb-5">
        <div className="mb-2 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 font-medium text-[11px]",
              briefToneClasses[item.tone].badge,
            )}
          >
            Mission avec Mue
          </span>
          <span className="text-muted-foreground text-[11px]">
            Validation requise avant chaque création
          </span>
        </div>
        <h2 className="font-semibold text-lg tracking-tight">
          Mue vous accompagne
        </h2>
        <p className="mt-2 text-muted-foreground text-xs leading-5">
          Mue montre son contexte et demande votre validation avant chaque
          création.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-3 overflow-hidden rounded-xl border bg-background shadow-sm">
        {["Contexte", "Livrable", "Message"].map((label, index) => (
          <div
            className={cn(
              "relative flex items-center gap-2 border-r px-3 py-3 last:border-r-0 sm:px-4",
              index === stageIndex && "bg-[#edf3ff] dark:bg-[#162957]",
            )}
            key={label}
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                index < stageIndex &&
                  "border-[#4d78ea] bg-[#4d78ea] text-white",
                index === stageIndex &&
                  "border-[#4d78ea] text-[#3565dc] dark:text-[#a9c1ff]",
              )}
            >
              {index < stageIndex ? (
                <CheckIcon className="size-3" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={cn(
                "truncate text-muted-foreground text-xs",
                index === stageIndex && "font-medium text-foreground",
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {stage === "context" ? (
        <div className="rounded-2xl border bg-background shadow-[0_14px_40px_-30px_rgba(15,23,42,0.3)]">
          <div className="border-b px-5 py-4 sm:px-6">
            <p className="font-semibold text-sm">
              Mue a récupéré le contexte utile
            </p>
            <p className="mt-1 text-muted-foreground text-xs">
              12 échanges analysés · 3 pièces jointes · dernière mise à jour il
              y a 4 min
            </p>
          </div>
          <div className="space-y-5 px-5 py-5 sm:px-6">
            <div>
              <p className="font-medium text-xs">Résumé</p>
              <p className="mt-2 text-muted-foreground text-sm leading-6">
                Sophie prépare la consultation pour refondre le portail client
                de Meridian. Elle attend une proposition claire, orientée
                résultats, avec un périmètre découpé par phases.
              </p>
            </div>
            <div>
              <p className="font-medium text-xs">Attentes identifiées</p>
              <ul className="mt-2 grid gap-2 text-muted-foreground text-sm sm:grid-cols-2">
                {[
                  "Vision et approche du projet",
                  "Périmètre et livrables détaillés",
                  "Planning sur 8 semaines",
                  "Budget et modalités d’accompagnement",
                ].map((expectation) => (
                  <li
                    className="rounded-lg border bg-muted/20 px-3 py-2.5"
                    key={expectation}
                  >
                    {expectation}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex justify-end border-t px-5 py-4 sm:px-6">
            <Button onClick={() => setStage("format")}>
              Choisir le livrable
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : null}

      {stage === "format" ? (
        <div className="rounded-2xl border bg-background px-5 py-5 shadow-[0_14px_40px_-30px_rgba(15,23,42,0.3)] sm:px-6">
          <p className="font-semibold text-sm">
            {isSophieProposal
              ? "Quel livrable Mue doit-elle préparer ?"
              : item.workspaceLabel}
          </p>
          <p className="mt-1 text-muted-foreground text-xs leading-5">
            {isSophieProposal
              ? "Le contenu sera structuré à partir du contexte validé ci-dessus."
              : "Vérifiez la proposition de Mue avant de poursuivre."}
          </p>

          {isSophieProposal ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                {
                  value: "document" as const,
                  label: "Document",
                  detail: "Proposition complète",
                  Icon: FileTextIcon,
                },
                {
                  value: "slides" as const,
                  label: "Slides",
                  detail: "Présentation synthétique",
                  Icon: PresentationIcon,
                },
                {
                  value: "both" as const,
                  label: "Les deux",
                  detail: "Document + présentation",
                  Icon: PaperclipIcon,
                },
              ].map(({ value, label, detail, Icon }) => (
                <button
                  aria-pressed={deliverable === value}
                  className={cn(
                    "rounded-xl border px-4 py-4 text-left transition-colors",
                    deliverable === value
                      ? "border-[#6f91ec] bg-[#edf3ff] ring-1 ring-[#6f91ec]/20 dark:bg-[#162957]"
                      : "hover:bg-muted/40",
                  )}
                  key={value}
                  onClick={() => setDeliverable(value)}
                  type="button"
                >
                  <Icon className="size-4 text-[#4771df]" />
                  <p className="mt-3 font-medium text-sm">{label}</p>
                  <p className="mt-1 text-muted-foreground text-[11px]">
                    {detail}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <Textarea
              className="mt-5 min-h-52 resize-none text-sm leading-6"
              defaultValue={item.workspaceContent}
              id={`brief-action-${item.id}`}
            />
          )}

          <div className="mt-6 flex items-center justify-between border-t pt-4">
            {isSophieProposal ? (
              <Button onClick={() => setStage("context")} variant="ghost">
                Revoir le contexte
              </Button>
            ) : (
              <span />
            )}
            <Button onClick={() => setStage("ready")}>
              {isSophieProposal ? "Valider et générer" : "Continuer"}
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : null}

      {stage === "ready" ? (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-background shadow-[0_14px_40px_-30px_rgba(15,23,42,0.3)]">
            <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
              <div className="flex-1">
                <p className="font-semibold text-sm">Livrable prêt</p>
                <p className="mt-1 text-muted-foreground text-xs">
                  {isSophieProposal
                    ? deliverable === "both"
                      ? "Appel-offre-Sophie.docx · Appel-offre-Sophie.pptx"
                      : deliverable === "slides"
                        ? "Appel-offre-Sophie.pptx"
                        : "Appel-offre-Sophie.docx"
                    : "La proposition de Mue a été préparée."}
                </p>
              </div>
              <Button size="sm" variant="outline">
                Ouvrir le livrable
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-background px-5 py-5 shadow-[0_14px_40px_-30px_rgba(15,23,42,0.3)] sm:px-6">
            <label
              className="font-semibold text-sm"
              htmlFor={`brief-message-${item.id}`}
            >
              {item.workspaceLabel}
            </label>
            <p className="mt-1 text-muted-foreground text-xs">
              Mue prépare le message, mais rien ne part sans votre validation.
            </p>
            <Textarea
              className="mt-4 min-h-48 resize-none text-sm leading-6"
              defaultValue={item.workspaceContent}
              id={`brief-message-${item.id}`}
            />
            <div className="mt-5 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button onClick={() => setStage("format")} variant="outline">
                Modifier le livrable
              </Button>
              <Button onClick={() => onComplete(item)}>
                {item.confirmAction}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

const recentConversations = [
  {
    title: "Priorités de la journée",
    preview: "Résumé des échanges clients et des actions urgentes",
    date: "Aujourd’hui, 09:12",
  },
  {
    title: "Préparation de la proposition Northstar",
    preview: "Points à clarifier avant l’envoi du devis",
    date: "Hier, 17:40",
  },
  {
    title: "Suivi du projet Atlas",
    preview: "Risques identifiés et prochaines étapes recommandées",
    date: "14 août, 11:25",
  },
];

function ChatHistoryPanel() {
  return (
    <div className="flex min-h-full justify-center px-4 pb-10 pt-28 sm:px-6 sm:pb-14 sm:pt-32">
      <div className="w-full max-w-3xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-blue-700 text-xs dark:text-blue-300">
            <HistoryIcon className="size-4" />
            Conversations Mue
          </div>
          <h1 className="mt-2 font-medium text-2xl tracking-tight sm:text-3xl">
            Historique
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Retrouvez vos précédentes analyses sans perdre le contexte de votre
            workspace.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="divide-y">
            {recentConversations.map((conversation) => (
              <Link
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/45 sm:px-6"
                href="/chat?chatView=ask"
                key={conversation.title}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  <MessageCircleIcon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-sm">
                    {conversation.title}
                  </span>
                  <span className="mt-1 block truncate text-muted-foreground text-xs">
                    {conversation.preview}
                  </span>
                </span>
                <span className="hidden shrink-0 text-muted-foreground text-xs sm:block">
                  {conversation.date}
                </span>
              </Link>
            ))}
          </div>
          <div className="flex items-center justify-between gap-4 border-t bg-muted/20 px-5 py-3 sm:px-6">
            <span className="text-muted-foreground text-xs">
              Les conversations restent privées dans votre espace.
            </span>
            <Button asChild size="sm" variant="outline">
              <Link href="/chat?chatView=ask">Nouvelle discussion</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

type AskMueResponse = {
  kind: "answer" | "priorities" | "summary" | "redirect";
  title: string;
  body: string;
  items?: Array<{ label: string; meta: string; tone?: "urgent" | "normal" }>;
  destination?: { href: string; label: string };
};

type AskMueMessage =
  | { id: string; role: "user"; content: string }
  | {
      id: string;
      role: "assistant";
      content: string;
      prompt: string;
      suggestion?: AskMueSuggestionId;
      asset?: AskMueAsset;
      restored?: boolean;
    };

type AskMueSuggestionId = (typeof suggestions)[number]["id"];

type AskMueAsset = {
  name: string;
  type: string;
  size: string;
};

type AskMuePayload = {
  content: string;
  asset?: AskMueAsset;
};

const ASK_MUE_ASSET_MARKER = ":::mue-asset:::";
const ASK_MUE_CHAT_STORAGE_KEY = "freescale-ask-mue-chat-v1";

const askSuggestionFinalCopy: Record<AskMueSuggestionId, string> = {
  priorities:
    "J’ai terminé. Les sujets suivants ressortent nettement aujourd’hui. Je les ai classés selon l’attente client, l’urgence et ce qu’ils débloquent pour la suite. Voici le plan que je vous propose :",
  summary:
    "J’ai regroupé les échanges qui parlent du même sujet, puis retiré les répétitions. Voici l’essentiel, avec un accès direct à chaque conversation :",
  actions:
    "J’ai transformé les demandes et engagements explicites en tâches concrètes. Elles sont prêtes, mais je vous laisse les vérifier avant de les ajouter :",
};

const askPriorityItems = [
  {
    label: "Confirmer le planning avec Théo",
    meta: "WhatsApp · 7 messages · réponse attendue",
    tone: "urgent" as const,
  },
  {
    label: "Relancer Maya pour le règlement",
    meta: "Gmail · facture F-2048",
    tone: "normal" as const,
  },
  {
    label: "Valider les prochaines étapes SEO avec Jon",
    meta: "Outlook · projet livré",
    tone: "normal" as const,
  },
];

const askSuggestionThinkingSteps = [
  {
    label: "Je comprends votre demande",
    detail: "Intention, périmètre et résultat attendu",
    duration: 1400,
  },
  {
    label: "Je scanne vos nouveaux messages",
    detail: "Conversations, réponses attendues et signaux d’urgence",
    duration: 1800,
  },
  {
    label: "Je relie les échanges à votre activité",
    detail: "Clients, projets, échéances et tâches existantes",
    duration: 2200,
  },
  {
    label: "Je compacte le contexte utile",
    detail: "Je retire le bruit et prépare une réponse actionnable",
    duration: 4200,
  },
] as const;

const askSuggestedTasks = [
  {
    id: "ask-theo-planning",
    title: "Confirmer le planning avec Théo",
    meta: "WhatsApp · réponse attendue aujourd’hui",
    source: "WhatsApp" as const,
    status: "todo" as const,
    due: "Aujourd’hui",
  },
  {
    id: "ask-maya-payment",
    title: "Relancer Maya pour le règlement",
    meta: "Gmail · facture F-2048 arrivée à échéance",
    source: "Gmail" as const,
    status: "waiting" as const,
    due: "Aujourd’hui",
  },
  {
    id: "ask-jon-seo",
    title: "Valider les prochaines étapes SEO avec Jon",
    meta: "Outlook · projet livré, confirmation attendue",
    source: "Outlook" as const,
    status: "scope" as const,
    due: "Demain",
  },
] as const;

function getAskMueResponse(prompt: string): AskMueResponse {
  const normalized = prompt.toLocaleLowerCase("fr-FR");
  const asksForMutation = [
    "crée",
    "cree",
    "ajoute",
    "envoie",
    "réponds",
    "reponds",
    "archive",
    "supprime",
    "planifie",
    "assigne",
    "désabonne",
    "desabonne",
  ].some((verb) => normalized.includes(verb));

  if (asksForMutation) {
    const isMessageAction = ["message", "répond", "repond", "envoie"].some(
      (word) => normalized.includes(word),
    );
    const destination = isMessageAction
      ? { href: "/channels-v4", label: "Ouvrir Canaux" }
      : { href: "/tasks", label: "Ouvrir Tâches" };

    return {
      kind: "redirect",
      title: "Cette action demande votre validation",
      body: `Ask Mue reste en lecture seule dans cet espace. Je peux préparer et vérifier l’action avec vous, puis vous laisser la réaliser depuis ${isMessageAction ? "Canaux" : "Tâches"}.`,
      destination,
    };
  }

  if (
    ["priorité", "priorite", "aujourd’hui", "aujourd'hui", "prochaine"].some(
      (word) => normalized.includes(word),
    )
  ) {
    return {
      kind: "priorities",
      title: "Voici l’ordre que je vous conseille aujourd’hui",
      body: "J’ai classé les échanges selon l’attente client, l’urgence et leur impact sur vos projets.",
      items: askPriorityItems,
    };
  }

  if (
    ["résume", "resume", "échange", "echange", "message"].some((word) =>
      normalized.includes(word),
    )
  ) {
    return {
      kind: "summary",
      title: "L’essentiel de vos échanges",
      body: "Trois conversations demandent votre attention. Théo attend son planning, Maya n’a pas encore confirmé le règlement et Jon attend la suite du projet SEO.",
      items: askPriorityItems,
    };
  }

  return {
    kind: "answer",
    title: "Voilà ce que je peux en tirer",
    body: "Je peux analyser vos échanges, comparer les urgences et transformer ce contexte en synthèse claire. Pour agir sur une conversation ou une tâche, je vous orienterai toujours vers la page concernée afin que vous gardiez la main.",
  };
}

function getAskMuePayload(prompt: string): AskMuePayload {
  const normalized = prompt.toLocaleLowerCase("fr-FR");

  if (
    ["code", "javascript", "fonction"].some((word) => normalized.includes(word))
  ) {
    return {
      content:
        "### Exemple prêt à adapter\n\nVoici une fonction simple qui reprend le comportement demandé :\n\n```javascript\nfunction organiserPriorites(taches) {\n  return taches.sort((a, b) => b.urgence - a.urgence);\n}\n```\n\nLe bloc se construit directement dans la réponse et peut être copié.",
    };
  }

  if (
    ["rapport", "document", "pdf", "fichier"].some((word) =>
      normalized.includes(word),
    )
  ) {
    return {
      content: `### Aperçu du livrable\n\nJ’ai structuré les informations disponibles dans un aperçu de rapport.\n\n${ASK_MUE_ASSET_MARKER}\n\nLe document reste informatif : vous pourrez l’ouvrir et le vérifier avant toute utilisation.`,
      asset: {
        name: "rapport-priorites.pdf",
        type: "PDF",
        size: "1,2 Mo",
      },
    };
  }

  const response = getAskMueResponse(prompt);
  const items = response.items
    ?.map((item, index) => `${index + 1}. **${item.label}**\n   ${item.meta}`)
    .join("\n\n");
  const destination = response.destination
    ? `\n\n[${response.destination.label}](${response.destination.href})`
    : "";

  return {
    content: `### ${response.title}\n\n${response.body}${items ? `\n\n${items}` : ""}${destination}`,
  };
}

function AskMueAssetCard({
  asset,
  ready,
}: {
  asset: AskMueAsset;
  ready: boolean;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="my-4 flex min-h-24 w-full max-w-xl items-center gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3.5 transition-[background-color,border-color] duration-150 hover:border-border hover:bg-muted/35"
      initial={{ opacity: 0.85, y: 2 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground">
        <FileTextIcon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-sm">{asset.name}</span>
        <span className="mt-0.5 block text-muted-foreground text-xs">
          {asset.type} · {asset.size}
        </span>
        <span
          className={cn(
            "mt-2 inline-flex items-center gap-1.5 text-xs transition-colors duration-150",
            ready ? "text-emerald-600" : "text-muted-foreground",
          )}
        >
          {ready ? (
            <CheckIcon className="size-3.5" />
          ) : (
            <LoaderCircleIcon className="size-3.5 animate-spin" />
          )}
          {ready ? "Aperçu prêt" : "Préparation en cours…"}
        </span>
      </span>
      <Button
        className="shrink-0"
        disabled={!ready}
        onClick={() =>
          toastSuccess({
            description: "Aperçu simulé ouvert dans Ask Mue.",
          })
        }
        size="sm"
        variant="ghost"
      >
        Ouvrir
      </Button>
    </motion.div>
  );
}

function AskMueStreamingContent({
  content,
  asset,
  streaming,
}: {
  content: string;
  asset?: AskMueAsset;
  streaming: boolean;
}) {
  const [beforeAsset, afterAsset] = content.split(ASK_MUE_ASSET_MARKER);
  const hasAssetMarker = content.includes(ASK_MUE_ASSET_MARKER);
  const responseClassName =
    "prose-sm max-w-none text-foreground [&_h3]:mb-2 [&_h3]:font-medium [&_h3]:text-[15px] [&_li]:my-2 [&_ol]:mt-3 [&_p]:text-muted-foreground [&_p]:leading-6 [&_pre]:max-w-full [&_pre]:overflow-x-auto";

  return (
    <div className="relative max-w-2xl">
      <Response className={responseClassName}>{beforeAsset}</Response>
      {hasAssetMarker && asset && (
        <AskMueAssetCard asset={asset} ready={!streaming} />
      )}
      {hasAssetMarker && afterAsset && (
        <Response className={responseClassName}>{afterAsset}</Response>
      )}
      {streaming && (
        <motion.span
          animate={{ opacity: [1, 0.25, 1] }}
          aria-label="Réponse en cours"
          className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 rounded-full bg-foreground/70"
          transition={{ duration: 0.7, repeat: Number.POSITIVE_INFINITY }}
        />
      )}
    </div>
  );
}

function AskMueThinkingTrace({ phase }: { phase: number }) {
  const isCompacting = phase === askSuggestionThinkingSteps.length - 1;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      aria-live="polite"
      className="max-w-xl py-1"
      initial={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="relative flex size-5 items-center justify-center">
          <span className="absolute size-4 animate-ping rounded-full bg-blue-400/20 motion-reduce:animate-none" />
          <span className="size-2 rounded-full bg-blue-500" />
        </span>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            className="font-medium"
            exit={{ filter: "blur(4px)", opacity: 0, y: -4 }}
            initial={{ filter: "blur(4px)", opacity: 0, y: 4 }}
            key={phase}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            Mue réfléchit
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="mt-3 space-y-2 border-l border-border/80 pl-3">
        {askSuggestionThinkingSteps.slice(0, phase + 1).map((step, index) => (
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex items-start gap-2 text-xs",
              index === phase
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
            initial={{ opacity: 0, x: -4 }}
            key={step.label}
          >
            {index < phase ? (
              <CheckIcon className="mt-0.5 size-3.5 text-emerald-600" />
            ) : (
              <LoaderCircleIcon className="mt-0.5 size-3.5 animate-spin text-blue-500 motion-reduce:animate-none" />
            )}
            <span className="min-w-0">
              <span
                className={cn(
                  "block",
                  index === phase &&
                    "bg-[linear-gradient(90deg,#64748b_0%,#2563eb_35%,#7c3aed_58%,#64748b_100%)] bg-[length:220%_100%] bg-clip-text text-transparent [animation:mue-text-flow_1.8s_ease-in-out_infinite] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] motion-reduce:animate-none",
                )}
              >
                {step.label}
                {index === phase ? "…" : ""}
              </span>
              <span className="mt-0.5 block font-normal text-[11px] text-muted-foreground">
                {step.detail}
              </span>
            </span>
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {isCompacting && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 max-w-md rounded-xl border border-border/60 bg-muted/20 p-3"
            initial={{ opacity: 0, y: 5 }}
            exit={{ opacity: 0 }}
          >
            <div className="mb-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Construction de la réponse</span>
              <span className="inline-flex items-center gap-1">
                <span className="size-1 animate-pulse rounded-full bg-blue-500" />
                en cours
              </span>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-[92%] [animation-duration:1.6s]" />
              <Skeleton className="h-2.5 w-[78%] [animation-duration:1.8s]" />
              <Skeleton className="h-2.5 w-[86%] [animation-duration:2s]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AskMueTypedText({
  content,
  instant = false,
  onComplete,
}: {
  content: string;
  instant?: boolean;
  onComplete: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const characters = Array.from(content);
  const [visibleLength, setVisibleLength] = useState(() =>
    instant ? characters.length : 0,
  );
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (reducedMotion || instant) {
      setVisibleLength(characters.length);
      return;
    }

    const startedAt = performance.now();
    const interval = window.setInterval(() => {
      const nextLength = Math.min(
        characters.length,
        Math.max(1, Math.floor((performance.now() - startedAt) / 6)),
      );
      setVisibleLength(nextLength);
      if (nextLength === characters.length) window.clearInterval(interval);
    }, 24);

    return () => window.clearInterval(interval);
  }, [instant, reducedMotion, characters.length]);

  useEffect(() => {
    if (visibleLength < characters.length || completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  }, [visibleLength, characters.length]);

  return (
    <p className="max-w-2xl whitespace-pre-wrap text-sm leading-6">
      {characters.slice(0, visibleLength).join("")}
      {visibleLength < characters.length && (
        <motion.span
          animate={{ opacity: [1, 0.25, 1] }}
          aria-label="Réponse en cours"
          className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 rounded-full bg-foreground/70"
          transition={{ duration: 0.7, repeat: Number.POSITIVE_INFINITY }}
        />
      )}
    </p>
  );
}

function AskMueResultSkeleton({
  suggestion,
}: {
  suggestion: AskMueSuggestionId;
}) {
  const label =
    suggestion === "actions"
      ? "Mue prépare les tâches"
      : suggestion === "summary"
        ? "Mue structure la synthèse"
        : "Mue organise les priorités";

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      aria-label={label}
      className="mt-4 max-w-2xl"
      initial={{ opacity: 0, y: 6 }}
    >
      <div className="mb-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="relative flex size-4 items-center justify-center">
          <span className="absolute size-3 animate-ping rounded-full bg-blue-400/20 motion-reduce:animate-none" />
          <SparklesIcon className="size-3 text-blue-500" />
        </span>
        {label}…
      </div>
      <div className="grid gap-2.5 sm:grid-cols-3">
        {[78, 92, 68].map((width, index) => (
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="relative min-h-32 overflow-hidden rounded-2xl border border-border/70 bg-card p-4"
            initial={{ opacity: 0, scale: 0.985 }}
            key={width}
            transition={{ delay: index * 0.12, duration: 0.25 }}
          >
            <motion.span
              animate={{ x: ["-120%", "220%"] }}
              className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-blue-100/55 to-transparent dark:via-blue-900/20"
              transition={{
                duration: 1.5,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
              }}
            />
            <Skeleton className="size-7 rounded-lg" />
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="mt-2 h-3" style={{ width: `${width}%` }} />
            <Skeleton className="mt-4 h-7 w-20 rounded-lg" />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

function AskMueSuggestionReveal({
  instant = false,
  messageId,
  suggestion,
}: {
  instant?: boolean;
  messageId: string;
  suggestion: AskMueSuggestionId;
}) {
  const reducedMotion = useReducedMotion();
  const [ready, setReady] = useState(instant);

  useEffect(() => {
    if (instant) {
      setReady(true);
      return;
    }
    const timeout = window.setTimeout(
      () => setReady(true),
      reducedMotion ? 120 : 1800,
    );
    return () => window.clearTimeout(timeout);
  }, [instant, reducedMotion]);

  return (
    <AnimatePresence initial={false} mode="wait">
      {ready ? (
        <AskMueSuggestionResult
          key="result"
          messageId={messageId}
          suggestion={suggestion}
        />
      ) : (
        <AskMueResultSkeleton key="skeleton" suggestion={suggestion} />
      )}
    </AnimatePresence>
  );
}

function AskMueSuggestionResult({
  messageId,
  suggestion,
}: {
  messageId: string;
  suggestion: AskMueSuggestionId;
}) {
  const { emailAccountId } = useAccount();
  const [decision, setDecision] = useState<"pending" | "accepted" | "declined">(
    "pending",
  );
  const [createdTaskIds, setCreatedTaskIds] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [decisionReady, setDecisionReady] = useState(false);
  const decisionStorageKey = `${ASK_MUE_CHAT_STORAGE_KEY}:decision:${emailAccountId}:${messageId}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(decisionStorageKey) ?? "null",
      ) as {
        decision?: "pending" | "accepted" | "declined";
        createdTaskIds?: string[];
      } | null;
      if (saved?.decision) setDecision(saved.decision);
      if (Array.isArray(saved?.createdTaskIds))
        setCreatedTaskIds(saved.createdTaskIds);
    } catch {}
    setDecisionReady(true);
  }, [decisionStorageKey]);

  useEffect(() => {
    if (!decisionReady) return;
    try {
      sessionStorage.setItem(
        decisionStorageKey,
        JSON.stringify({ decision, createdTaskIds }),
      );
    } catch {}
  }, [createdTaskIds, decision, decisionReady, decisionStorageKey]);

  const createTasks = async (ids: string[]) => {
    const tasks = askSuggestedTasks.filter(
      (task) => ids.includes(task.id) && !createdTaskIds.includes(task.id),
    );
    if (tasks.length === 0) return;

    if (!emailAccountId) {
      toastError({
        description: "Connectez une messagerie avant d’ajouter ces tâches.",
      });
      return;
    }

    setIsExecuting(true);
    try {
      const due = getLocalDateKey();
      const persistedTasks = await Promise.all(
        tasks.map(async (task) => {
          const response = await fetch("/api/user/tasks", {
            method: "POST",
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
              [EMAIL_ACCOUNT_HEADER]: emailAccountId,
            },
            body: JSON.stringify({
              title: task.title,
              status: "scope",
              due,
              priority: "medium",
              source: "ai",
              assignees: [],
              sourceThreadId: `ask-mue-priority:${due}:${task.id}`,
            }),
          });
          if (!response.ok) throw new Error("task_request_failed");
          const result = (await response.json()) as { task: { id: string } };
          return result.task;
        }),
      );

      const nextCreatedIds = [
        ...new Set([...createdTaskIds, ...tasks.map((task) => task.id)]),
      ];
      setCreatedTaskIds(nextCreatedIds);
      if (nextCreatedIds.length === askSuggestedTasks.length) {
        setDecision("accepted");
      }
      const savedCount = persistedTasks.length;
      const persistedTaskIds = persistedTasks.map((task) => task.id);
      try {
        sessionStorage.setItem(
          CREATED_TASK_IDS_STORAGE_KEY,
          persistedTaskIds.join(","),
        );
        sessionStorage.setItem(
          CREATED_TASKS_STORAGE_KEY,
          JSON.stringify(
            tasks.map((task, index) => ({
              id: persistedTaskIds[index],
              title: task.title,
              status: "scope",
              due,
              priority: "medium",
              source: "ai",
              assignees: [],
              sourceThreadId: `ask-mue-priority:${due}:${task.id}`,
            })),
          ),
        );
      } catch {}
      toastSuccess({
        title: "Ajouté à Aujourd’hui",
        description: `${savedCount} tâche${savedCount === 1 ? " a" : "s ont"} été ajoutée${savedCount === 1 ? "" : "s"} à la page Tâches.`,
        duration: 10_000,
        action: {
          label: "Voir mes tâches",
          onClick: () => {
            const params = new URLSearchParams({
              created: persistedTaskIds.join(","),
            });
            window.location.assign(`/tasks?${params.toString()}`);
          },
        },
      });
    } catch {
      toastError({
        description: "Les tâches n’ont pas pu être ajoutées. Réessayez.",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  if (suggestion === "summary") {
    return (
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        aria-label="Échanges importants"
        className="mt-4 max-w-2xl"
        initial={{ opacity: 0, y: 7 }}
      >
        <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-muted/20 px-4 py-3">
          <div>
            <p className="font-semibold text-sm">3 échanges à retenir</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Contexte compacté depuis 18 messages
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-2 py-1 font-medium text-[10px] text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            À jour
          </span>
        </div>
        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
          {dailyBriefClients.map((client) => (
            <div
              className="flex min-h-40 flex-col items-start rounded-2xl border border-border/80 bg-card p-4 shadow-[0_12px_34px_-28px_rgba(15,23,42,0.5)]"
              key={client.name}
            >
              <div className="flex w-full items-center gap-2.5">
                <ClientMentionAvatar
                  className="size-8"
                  name={client.name}
                  position={client.avatarPosition}
                />
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-sm">{client.name}</p>
                  <DailyBriefChannelIcon channel={client.channel} />
                </div>
              </div>
              <p className="mt-3 flex-1 text-xs leading-5 text-muted-foreground">
                {client.headline}
              </p>
              <Button asChild className="mt-3" size="sm" variant="ghost">
                <Link
                  href={`/channels-v4?conversation=${client.conversationId}`}
                >
                  Ouvrir
                  <ArrowUpRightIcon className="size-3.5" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </motion.section>
    );
  }

  const isActions = suggestion === "actions";

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      aria-label={isActions ? "Tâches proposées" : "Plan de priorités proposé"}
      className="mt-4 max-w-2xl"
      initial={{ opacity: 0, y: 7 }}
      key={`${messageId}-${suggestion}`}
    >
      <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-muted/20 px-4 py-3">
        <div>
          <p className="font-semibold text-sm">
            {isActions
              ? `${askSuggestedTasks.length} tâche${askSuggestedTasks.length === 1 ? "" : "s"} prête${askSuggestedTasks.length === 1 ? "" : "s"} à créer`
              : "Plan proposé pour aujourd’hui"}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {isActions
              ? "Rien ne sera ajouté sans votre accord"
              : "Validez cet ordre avant de l’appliquer"}
          </p>
        </div>
        <span className="rounded-full border bg-background px-2 py-1 font-medium text-[10px] text-muted-foreground">
          Validation requise
        </span>
      </div>

      <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
        {askSuggestedTasks.map((task, index) => {
          const created = createdTaskIds.includes(task.id);
          return (
            <div
              className="flex min-h-40 flex-col items-start rounded-2xl border border-border/80 bg-card p-4 shadow-[0_12px_34px_-28px_rgba(15,23,42,0.5)]"
              key={task.id}
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-lg font-semibold text-xs",
                  created
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
                )}
              >
                {created ? <CheckIcon className="size-4" /> : index + 1}
              </span>
              <div className="mt-3 min-w-0 flex-1">
                <p className="font-medium text-sm leading-5">{task.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {task.meta} · {task.due}
                </p>
              </div>
              {isActions ? (
                <Button
                  className="shrink-0"
                  disabled={created || decision === "declined" || isExecuting}
                  onClick={() => createTasks([task.id])}
                  size="sm"
                  variant={created ? "ghost" : "outline"}
                >
                  {created ? "Ajoutée" : "Ajouter"}
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-2xl border border-border/80 bg-muted/15 px-4 py-3">
        {decision === "pending" ? (
          <>
            <Button
              disabled={isExecuting}
              onClick={() =>
                createTasks(askSuggestedTasks.map((task) => task.id))
              }
              size="sm"
            >
              {isExecuting ? (
                <LoaderCircleIcon className="size-3.5 animate-spin" />
              ) : (
                <CheckIcon className="size-3.5" />
              )}
              {isActions
                ? `Oui, ajouter les ${askSuggestedTasks.length}`
                : "Oui, valider ce plan"}
            </Button>
            <Button
              disabled={isExecuting}
              onClick={() => setDecision("declined")}
              size="sm"
              variant="ghost"
            >
              Non, ajuster
            </Button>
          </>
        ) : (
          <p
            className={cn(
              "flex items-center gap-2 font-medium text-xs",
              decision === "accepted"
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-muted-foreground",
            )}
          >
            {decision === "accepted" ? (
              <CheckIcon className="size-4" />
            ) : (
              <RotateCcwIcon className="size-4" />
            )}
            {decision === "accepted"
              ? isActions
                ? "Les tâches ont été ajoutées."
                : "Les priorités ont été ajoutées à Aujourd’hui."
              : "D’accord. Dites-moi ce que vous voulez modifier."}
          </p>
        )}
      </div>
    </motion.section>
  );
}

function AskMueMessageActions({
  content,
  onRegenerate,
}: {
  content: string;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyResponse = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mt-2 flex items-center gap-0.5 text-muted-foreground">
      <Tooltip content={copied ? "Copié" : "Copier"}>
        <Button
          aria-label={copied ? "Réponse copiée" : "Copier la réponse"}
          className="size-8 rounded-lg transition-colors duration-150"
          onClick={copyResponse}
          size="icon"
          variant="ghost"
        >
          {copied ? (
            <CheckIcon className="size-3.5 text-emerald-600" />
          ) : (
            <CopyIcon className="size-3.5" />
          )}
        </Button>
      </Tooltip>
      <Tooltip content="Régénérer">
        <Button
          aria-label="Régénérer la réponse"
          className="size-8 rounded-lg transition-colors duration-150"
          onClick={onRegenerate}
          size="icon"
          variant="ghost"
        >
          <RotateCcwIcon className="size-3.5" />
        </Button>
      </Tooltip>
    </div>
  );
}

function getClientMention(name: string) {
  return `@${name.split(" ")[0]}`;
}

function normalizeMention(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr-FR");
}

function ClientMentionAvatar({
  name,
  position,
  className,
}: {
  name: string;
  position: string;
  className?: string;
}) {
  return (
    <span
      aria-label={`Photo de profil de ${name}`}
      className={cn(
        "shrink-0 rounded-full bg-[url('/images/avatars/freescale-contacts-grid.webp')] bg-no-repeat ring-1 ring-border/70",
        className,
      )}
      role="img"
      style={{
        backgroundPosition: position,
        backgroundSize: "300% 300%",
      }}
    />
  );
}

function AskMueUserMessage({ content }: { content: string }) {
  const mentionPattern = /(@[^\s]+)/g;

  return (
    <>
      {content.split(mentionPattern).map((part, index) => {
        const client = dailyBriefClients.find(
          (item) =>
            normalizeMention(getClientMention(item.name)) ===
            normalizeMention(part.replace(/[.,!?;:]$/, "")),
        );

        if (!client) {
          return <span key={`${part}-${index}`}>{part}</span>;
        }

        return (
          <span
            className="mx-0.5 inline-flex translate-y-0.5 items-center gap-1 rounded-full border border-border/70 bg-muted/40 py-0.5 pl-0.5 pr-2 font-medium text-xs"
            key={`${part}-${index}`}
          >
            <ClientMentionAvatar
              className="size-5"
              name={client.name}
              position={client.avatarPosition}
            />
            {getClientMention(client.name)}
          </span>
        );
      })}
    </>
  );
}

function ChatPanel({
  input,
  onInputChange,
}: {
  input: string;
  onInputChange: (value: string) => void;
}) {
  const { data: session } = useSession();
  const reducedMotion = useReducedMotion();
  const { emailAccountId } = useAccount();
  const { data: summary, error: summaryError } = usePreloadedPageData<{
    unreadEmails: number;
  }>("/api/user/brief-summary");
  const { data: brief } = useMueBriefTasks();
  const userId = session?.user?.id;
  const [onboardingName, setOnboardingName] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  useEffect(() => {
    if (!userId) return;
    const readName = () => {
      try {
        setOnboardingName({
          userId,
          name:
            localStorage
              .getItem(`${PREVIEW_FREELANCER_NAME_KEY}:${userId}`)
              ?.trim() ?? "",
        });
      } catch {
        setOnboardingName(null);
      }
    };
    readName();
    window.addEventListener(PREVIEW_FREELANCER_NAME_EVENT, readName);
    window.addEventListener("storage", readName);
    return () => {
      window.removeEventListener(PREVIEW_FREELANCER_NAME_EVENT, readName);
      window.removeEventListener("storage", readName);
    };
  }, [userId]);
  const accountName =
    (onboardingName?.userId === userId ? onboardingName?.name : "") ||
    session?.user?.name?.trim();
  const priorityCount = brief?.tasks.length ?? 0;
  const [messages, setMessages] = useState<AskMueMessage[]>([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );
  const [thinkingPhase, setThinkingPhase] = useState(-1);
  const [mentionedClientNames, setMentionedClientNames] = useState<string[]>(
    [],
  );
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [chatStorageReady, setChatStorageReady] = useState(false);
  const skipNextChatPersistRef = useRef(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isStreaming = streamingMessageId !== null;
  const hasStarted = messages.length > 0;
  const latestMessage = messages.at(-1);
  const latestMessageId = latestMessage?.id;
  const streamedContentLength =
    latestMessage?.role === "assistant" ? latestMessage.content.length : 0;
  const mentionMatch = input.match(/(?:^|\s)@([^\s@]*)$/);
  const mentionQuery = mentionMatch?.[1] ?? null;
  const mentionClients =
    mentionQuery === null
      ? []
      : dailyBriefClients.filter(
          (client) =>
            !mentionedClientNames.includes(client.name) &&
            normalizeMention(client.name).includes(
              normalizeMention(mentionQuery),
            ),
        );
  const showMentionMenu = mentionQuery !== null && mentionClients.length > 0;

  useEffect(() => {
    if (!emailAccountId) return;
    skipNextChatPersistRef.current = true;
    setChatStorageReady(false);
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(
          `${ASK_MUE_CHAT_STORAGE_KEY}:${emailAccountId}`,
        ) ?? "null",
      ) as {
        input?: string;
        mentionedClientNames?: string[];
        messages?: AskMueMessage[];
        streamingMessageId?: string | null;
      } | null;

      const restoredMessages = (saved?.messages ?? [])
        .slice(-50)
        .map((message): AskMueMessage => {
          if (message.role === "user") return message;
          const wasInterrupted =
            saved?.streamingMessageId === message.id || !message.content;
          if (!wasInterrupted) return { ...message, restored: true };
          if (message.suggestion) {
            return {
              ...message,
              content: askSuggestionFinalCopy[message.suggestion],
              restored: true,
            };
          }
          const payload = getAskMuePayload(message.prompt);
          return {
            ...message,
            content: payload.content,
            asset: payload.asset,
            restored: true,
          };
        });

      setMessages(restoredMessages);
      setMentionedClientNames(saved?.mentionedClientNames ?? []);
      onInputChange(saved?.input ?? "");
    } catch {
      setMessages([]);
      setMentionedClientNames([]);
      onInputChange("");
    }
    setStreamingMessageId(null);
    setThinkingPhase(-1);
    setChatStorageReady(true);
  }, [emailAccountId, onInputChange]);

  useEffect(() => {
    if (!(chatStorageReady && emailAccountId)) return;
    if (skipNextChatPersistRef.current) {
      skipNextChatPersistRef.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      const serializableMessages = messages.map(
        (message): AskMueMessage =>
          message.role === "user"
            ? message
            : {
                id: message.id,
                role: message.role,
                content: message.content,
                prompt: message.prompt,
                suggestion: message.suggestion,
                asset: message.asset,
              },
      );
      try {
        sessionStorage.setItem(
          `${ASK_MUE_CHAT_STORAGE_KEY}:${emailAccountId}`,
          JSON.stringify({
            input,
            mentionedClientNames,
            messages: serializableMessages,
            streamingMessageId,
          }),
        );
      } catch {}
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [
    chatStorageReady,
    emailAccountId,
    input,
    mentionedClientNames,
    messages,
    streamingMessageId,
  ]);

  useEffect(() => {
    if (!(latestMessageId || isStreaming)) {
      return;
    }
    const scrollBehavior: ScrollBehavior =
      streamedContentLength > 0 && !isStreaming ? "smooth" : "auto";
    const frame = window.requestAnimationFrame(() => {
      scrollAreaRef.current?.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: scrollBehavior,
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [latestMessageId, isStreaming, streamedContentLength]);

  const streamAssistantMessage = async (
    assistantId: string,
    prompt: string,
    suggestion?: AskMueSuggestionId,
  ) => {
    setStreamingMessageId(assistantId);
    setThinkingPhase(suggestion ? 0 : -1);
    setMessages((current) =>
      current.map((message) =>
        message.id === assistantId && message.role === "assistant"
          ? { ...message, content: "" }
          : message,
      ),
    );

    if (suggestion) {
      const examples: Record<string, string> = {
        priorities:
          "J’ai terminé. Les sujets suivants ressortent nettement aujourd’hui. Je les ai classés selon l’attente client, l’urgence et ce qu’ils débloquent pour la suite. Voici le plan que je vous propose :",
        summary:
          "J’ai regroupé les échanges qui parlent du même sujet, puis retiré les répétitions. Voici l’essentiel, avec un accès direct à chaque conversation :",
        actions:
          "J’ai transformé les demandes et engagements explicites en tâches concrètes. Elles sont prêtes, mais je vous laisse les vérifier avant de les ajouter :",
      };

      for (
        let phase = 0;
        phase < askSuggestionThinkingSteps.length;
        phase += 1
      ) {
        setThinkingPhase(phase);
        await new Promise((resolve) =>
          window.setTimeout(
            resolve,
            reducedMotion ? 80 : askSuggestionThinkingSteps[phase].duration,
          ),
        );
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId && message.role === "assistant"
            ? { ...message, content: examples[suggestion] }
            : message,
        ),
      );
      setThinkingPhase(-1);
      return;
    }

    await new Promise((resolve) =>
      window.setTimeout(resolve, reducedMotion ? 30 : 520),
    );
    const payload = getAskMuePayload(prompt);
    setMessages((current) =>
      current.map((message) =>
        message.id === assistantId && message.role === "assistant"
          ? { ...message, asset: payload.asset }
          : message,
      ),
    );
    await typeAssistantMessage(assistantId, payload.content);
  };

  const typeAssistantMessage = async (assistantId: string, content: string) => {
    if (reducedMotion) {
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId && message.role === "assistant"
            ? { ...message, content }
            : message,
        ),
      );
      setThinkingPhase(-1);
      setStreamingMessageId(null);
      return;
    }

    const characters = Array.from(content);
    for (let index = 3; index < characters.length; index += 3) {
      const streamedContent = characters.slice(0, index).join("");
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId && message.role === "assistant"
            ? { ...message, content: streamedContent }
            : message,
        ),
      );
      await new Promise((resolve) => window.setTimeout(resolve, 18));
    }

    setMessages((current) =>
      current.map((message) =>
        message.id === assistantId && message.role === "assistant"
          ? { ...message, content }
          : message,
      ),
    );
    setThinkingPhase(-1);
    setStreamingMessageId(null);
  };

  const sendMessage = (value: string, suggestion?: AskMueSuggestionId) => {
    const content = value.trim();
    if (!content || isStreaming) {
      return;
    }

    const now = Date.now();
    const assistantId = `mue-${now}`;
    setMessages((current) => [
      ...current,
      { id: `user-${now}`, role: "user", content },
      {
        id: assistantId,
        role: "assistant",
        content: "",
        prompt: content,
        suggestion,
      },
    ]);
    onInputChange("");
    streamAssistantMessage(assistantId, content, suggestion);
  };

  const selectMention = (clientName: string) => {
    if (!mentionMatch) {
      return;
    }

    const prefix = mentionMatch[0].startsWith(" ") ? " " : "";
    onInputChange(
      `${input.slice(0, input.length - mentionMatch[0].length)}${prefix}`,
    );
    setMentionedClientNames((current) =>
      current.includes(clientName) ? current : [...current, clientName],
    );
  };

  const submitCurrentMessage = () => {
    const mentionText = mentionedClientNames
      .map((name) => getClientMention(name))
      .join(" ");
    const content = [mentionText, input.trim()].filter(Boolean).join(" ");

    if (!content) {
      return;
    }

    sendMessage(content);
    setMentionedClientNames([]);
  };

  const returnToAskMueHome = () => {
    setMessages([]);
    setStreamingMessageId(null);
    setThinkingPhase(-1);
    setMentionedClientNames([]);
    setActiveMentionIndex(0);
    onInputChange("");
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionMenu) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveMentionIndex((current) =>
          Math.min(current + 1, mentionClients.length - 1),
        );
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveMentionIndex((current) => Math.max(current - 1, 0));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const client = mentionClients[activeMentionIndex];
        if (client) {
          selectMention(client.name);
        }
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onInputChange(input.slice(0, Math.max(0, input.length - 1)));
        return;
      }
    }

    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const composer = (
    <div className="relative">
      <AnimatePresence>
        {showMentionMenu && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            aria-label="Clients à mentionner"
            className="absolute inset-x-0 bottom-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-border/70 bg-background p-1.5 shadow-[0_18px_50px_-20px_rgba(15,23,42,0.4)] sm:max-w-md"
            initial={{ opacity: 0, y: 4 }}
            role="listbox"
            transition={{ duration: 0.12, ease: "easeOut" }}
          >
            <p className="px-2.5 pb-1.5 pt-1 font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
              Mentionner un client
            </p>
            {mentionClients.map((client, index) => (
              <button
                aria-selected={index === activeMentionIndex}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-100",
                  index === activeMentionIndex
                    ? "bg-muted text-foreground"
                    : "hover:bg-muted/60",
                )}
                key={client.name}
                onClick={() => selectMention(client.name)}
                role="option"
                type="button"
              >
                <ClientMentionAvatar
                  className="size-9"
                  name={client.name}
                  position={client.avatarPosition}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-sm">
                    {client.name}
                  </span>
                  <span className="mt-0.5 block truncate text-muted-foreground text-xs">
                    {client.channel} · {client.source}
                  </span>
                </span>
                <span className="text-muted-foreground text-xs">
                  {getClientMention(client.name)}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <PromptInput
        className={cn(
          "border-border/80 bg-background shadow-[0_12px_38px_-24px_rgba(15,23,42,0.45)]",
          hasStarted
            ? "min-h-[96px] rounded-2xl"
            : "min-h-[142px] rounded-[17px] border-0 shadow-none",
        )}
        onSubmit={(event) => {
          event.preventDefault();
          submitCurrentMessage();
        }}
      >
        {mentionedClientNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 pt-3">
            {mentionedClientNames.map((name) => {
              const client = dailyBriefClients.find(
                (item) => item.name === name,
              );
              if (!client) {
                return null;
              }
              return (
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/35 py-0.5 pl-0.5 pr-1"
                  key={client.name}
                >
                  <ClientMentionAvatar
                    className="size-6"
                    name={client.name}
                    position={client.avatarPosition}
                  />
                  <span className="pl-0.5 font-medium text-xs">
                    {getClientMention(client.name)}
                  </span>
                  <button
                    aria-label={`Retirer ${getClientMention(client.name)}`}
                    className="ml-0.5 flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() =>
                      setMentionedClientNames((current) =>
                        current.filter((item) => item !== client.name),
                      )
                    }
                    type="button"
                  >
                    <XIcon className="size-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <PromptInputTextarea
          className={cn(
            "px-5 pr-24 text-base",
            mentionedClientNames.length > 0
              ? "pb-3.5 pt-2"
              : hasStarted
                ? "py-3.5"
                : "py-4",
          )}
          data-testid="chat-input"
          maxHeight={hasStarted ? 148 : 164}
          minHeight={
            mentionedClientNames.length > 0 ? 54 : hasStarted ? 72 : 102
          }
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
            setActiveMentionIndex(0);
            onInputChange(event.currentTarget.value);
          }}
          onKeyDown={handleComposerKeyDown}
          placeholder={
            mentionedClientNames.length > 0
              ? "Que voulez-vous savoir à son sujet ?"
              : "Demandez quelque chose à Mue..."
          }
          value={input}
        />

        <div className="absolute right-3 bottom-3 flex items-center gap-1">
          <Tooltip content="Joindre un fichier">
            <Button
              className="size-9 rounded-full text-muted-foreground hover:text-foreground"
              size="icon"
              type="button"
              variant="ghost"
            >
              <PaperclipIcon className="size-4" />
            </Button>
          </Tooltip>
          <PromptInputSubmit
            disabled={
              !(input.trim() || mentionedClientNames.length > 0) || isStreaming
            }
            status={isStreaming ? "streaming" : "ready"}
          />
        </div>
      </PromptInput>
    </div>
  );

  return (
    <div
      className="relative flex h-full min-w-0 flex-1 flex-col"
      style={
        {
          "--chat-px": "1.5rem",
          "--chat-max-w": "960px",
        } as CSSProperties
      }
    >
      {!hasStarted && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-72"
          style={{
            background:
              "radial-gradient(ellipse at 45% 0%, rgba(96,165,250,.20), transparent 65%), radial-gradient(ellipse at 70% 0%, rgba(251,191,153,.12), transparent 60%)",
          }}
        />
      )}
      <AnimatePresence initial={false}>
        {hasStarted ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="flex min-h-0 flex-1 flex-col"
            initial={false}
            key="conversation"
            transition={{ duration: 0.1 }}
          >
            <div
              className="min-h-0 flex-1 overflow-y-auto px-[var(--chat-px)] pt-5"
              ref={scrollAreaRef}
            >
              <div className="sticky top-0 z-10 mx-auto mb-5 flex w-full max-w-[760px] bg-gradient-to-b from-background via-background/95 to-transparent pb-4 pt-1">
                <Tooltip content="Retour aux suggestions Ask Mue">
                  <Button
                    aria-label="Retour à Ask Mue"
                    className="size-9 rounded-full border-border/70 bg-background/90 text-muted-foreground shadow-sm backdrop-blur transition-all hover:-translate-x-0.5 hover:text-foreground"
                    onClick={returnToAskMueHome}
                    size="icon"
                    variant="outline"
                  >
                    <ArrowLeftIcon className="size-4" />
                  </Button>
                </Tooltip>
              </div>
              <div
                aria-live="polite"
                className="mx-auto flex w-full max-w-[760px] flex-col gap-7 pb-8"
              >
                {messages.map((message) =>
                  message.role === "user" ? (
                    <div
                      className="ml-auto max-w-[82%] rounded-2xl rounded-br-md border border-border/70 bg-white px-4 py-3 text-slate-900 text-sm leading-6 shadow-sm"
                      key={message.id}
                    >
                      <AskMueUserMessage content={message.content} />
                    </div>
                  ) : (
                    <motion.div
                      animate={{ opacity: 1, y: 0 }}
                      className="block"
                      initial={{ opacity: 0.85, y: 2 }}
                      key={message.id}
                      transition={{ duration: 0.12, ease: "easeOut" }}
                    >
                      <div className="min-w-0 flex-1 text-sm leading-6">
                        {message.content ? (
                          <>
                            {message.suggestion ? (
                              <AskMueTypedText
                                content={message.content}
                                instant={message.restored}
                                onComplete={() =>
                                  setStreamingMessageId((current) =>
                                    current === message.id ? null : current,
                                  )
                                }
                              />
                            ) : (
                              <AskMueStreamingContent
                                asset={message.asset}
                                content={message.content}
                                streaming={streamingMessageId === message.id}
                              />
                            )}
                            {streamingMessageId !== message.id &&
                              message.suggestion && (
                                <AskMueSuggestionReveal
                                  instant={message.restored}
                                  messageId={message.id}
                                  suggestion={message.suggestion}
                                />
                              )}
                            {streamingMessageId !== message.id && (
                              <AskMueMessageActions
                                content={message.content}
                                onRegenerate={() => {
                                  if (!isStreaming) {
                                    streamAssistantMessage(
                                      message.id,
                                      message.prompt,
                                      message.suggestion,
                                    );
                                  }
                                }}
                              />
                            )}
                          </>
                        ) : message.suggestion ? (
                          <AskMueThinkingTrace
                            phase={Math.max(0, thinkingPhase)}
                          />
                        ) : (
                          <motion.span
                            animate={{ opacity: [0.35, 0.9, 0.35] }}
                            aria-label="Mue prépare sa réponse"
                            className="block bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground bg-[length:200%_100%] bg-clip-text text-muted-foreground text-sm"
                            transition={{
                              duration: 0.8,
                              repeat: Number.POSITIVE_INFINITY,
                            }}
                          >
                            Mue réfléchit…
                          </motion.span>
                        )}
                      </div>
                    </motion.div>
                  ),
                )}
              </div>
            </div>

            <div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent px-[var(--chat-px)] pb-6 pt-5">
              <div className="mx-auto w-full max-w-[760px]">
                {composer}
                <p className="mt-2.5 text-center text-muted-foreground text-[11px]">
                  Ask Mue analyse votre espace. Les actions restent toujours
                  sous votre contrôle.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="relative z-[1] flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-[var(--chat-px)] pb-10 pt-16 lg:pt-[clamp(4rem,12vh,8rem)]"
            exit={{ opacity: 0, y: -12 }}
            initial={{ opacity: 0, y: 8 }}
            key="welcome"
            transition={{ duration: 0.22 }}
          >
            <div className="w-full max-w-[800px]">
              <header className="mb-8 text-center">
                <h1 className="font-medium text-2xl tracking-tight sm:text-3xl md:text-4xl">
                  Bonjour{accountName ? ` ${accountName}` : ""}
                </h1>
                <p
                  className="mt-3 min-h-6 text-muted-foreground"
                  aria-live="polite"
                >
                  {!emailAccountId
                    ? "Connectez une messagerie pour retrouver vos messages."
                    : summary
                      ? `Vous avez ${summary.unreadEmails.toLocaleString("fr-FR")} message${summary.unreadEmails === 1 ? "" : "s"} non lu${summary.unreadEmails === 1 ? "" : "s"}.`
                      : summaryError
                        ? "Le nombre de messages est momentanément indisponible."
                        : "Chargement de vos messages…"}
                </p>
                {priorityCount > 0 && (
                  <p
                    className="mt-2 font-medium text-blue-700 dark:text-blue-300"
                    aria-live="polite"
                  >
                    Mue a détecté {priorityCount} priorité
                    {priorityCount === 1 ? "" : "s"}.
                  </p>
                )}
              </header>

              <div className="mb-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
                {suggestions.map(({ id, label }) => (
                  <Button
                    className="group h-auto min-h-16 min-w-0 items-center justify-start whitespace-normal text-wrap rounded-xl border-blue-200/80 bg-blue-50/70 px-4 py-3 text-left shadow-sm transition-colors hover:border-blue-400 hover:bg-blue-100/70 focus-visible:ring-blue-500/40 dark:border-blue-900 dark:bg-blue-950/30 dark:hover:bg-blue-950/60"
                    key={label}
                    onClick={() => sendMessage(label, id)}
                    variant="outline"
                  >
                    <span className="min-w-0 whitespace-normal text-wrap break-words font-medium text-sm leading-5 sm:w-full">
                      {label}
                    </span>
                  </Button>
                ))}
              </div>
              <div className="rounded-[18px] bg-gradient-to-r from-sky-400 via-fuchsia-500 to-rose-400 p-px shadow-sm">
                {composer}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
