"use client";

import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarClockIcon,
  CheckCheckIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleDotIcon,
  Clock3Icon,
  FileTextIcon,
  FolderKanbanIcon,
  InboxIcon,
  Link2Icon,
  ListChecksIcon,
  MessageCircleIcon,
  PaperclipIcon,
  SearchIcon,
  SendHorizontalIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TimerResetIcon,
  UserRoundCheckIcon,
  WandSparklesIcon,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Gmail } from "@/components/new-landing/icons/Gmail";
import { Outlook } from "@/components/new-landing/icons/Outlook";
import { PageHeader } from "@/components/PageHeader";
import { PageWrapper } from "@/components/PageWrapper";
import { toastSuccess } from "@/components/Toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils";

type View = "brief" | "attention" | "projects" | "commitments";
type AttentionState = "decide" | "do" | "follow" | "waiting" | "qualify";
type Channel = "gmail" | "outlook" | "whatsapp" | "slack" | "telegram";
type CommitmentStatus = "today" | "overdue" | "week" | "done";

type TimelineEvent = {
  id: string;
  type: "message" | "decision" | "commitment" | "file";
  channel?: Channel;
  author?: "me" | "contact";
  title: string;
  detail: string;
  time: string;
};

type Situation = {
  id: string;
  state: AttentionState;
  projectId: string;
  project: string;
  client: string;
  contact: string;
  initials: string;
  channel: Channel;
  subject: string;
  excerpt: string;
  why: string;
  recommendation: string;
  age: string;
  confidence: "High" | "Confirm";
  timeline: TimelineEvent[];
};

type Commitment = {
  id: string;
  title: string;
  contact: string;
  project: string;
  due: string;
  status: CommitmentStatus;
  source: string;
};

type Project = {
  id: string;
  name: string;
  client: string;
  status: "On track" | "At risk" | "Waiting";
  color: string;
  openItems: number;
  lastActivity: string;
  summary: string;
  nextMilestone: string;
  channels: Channel[];
};

const situations: Situation[] = [
  {
    id: "landing-review",
    state: "do",
    projectId: "lemoine",
    project: "Landing page redesign",
    client: "Maison Lemoine",
    contact: "Sarah Lemoine",
    initials: "SL",
    channel: "whatsapp",
    subject: "Final review requested tomorrow morning",
    excerpt:
      "Can we make the header feel calmer? I’d love to review the final version tomorrow morning.",
    why: "You promised a revised version, and Sarah requested a review tomorrow morning.",
    recommendation:
      "Confirm the revisions and commit to a precise delivery time.",
    age: "18 min",
    confidence: "High",
    timeline: [
      {
        id: "l1",
        type: "message",
        channel: "gmail",
        author: "contact",
        title: "Initial feedback",
        detail:
          "The new direction feels much closer to the brand. The header still feels a little intense.",
        time: "Yesterday · 16:40",
      },
      {
        id: "l2",
        type: "decision",
        title: "Direction approved",
        detail:
          "The overall visual direction is approved. Only the header treatment remains open.",
        time: "Today · 09:54",
      },
      {
        id: "l3",
        type: "message",
        channel: "whatsapp",
        author: "contact",
        title: "Sarah Lemoine",
        detail:
          "Can we make the header feel calmer? I’d love to review the final version tomorrow morning.",
        time: "Today · 10:21",
      },
      {
        id: "l4",
        type: "commitment",
        title: "Your commitment",
        detail: "Share the final landing page version tomorrow morning.",
        time: "Detected from your reply",
      },
    ],
  },
  {
    id: "northstar-pricing",
    state: "decide",
    projectId: "northstar",
    project: "Northstar partnership",
    client: "Northstar",
    contact: "Maya Chen",
    initials: "MC",
    channel: "gmail",
    subject: "Final pricing and start date requested",
    excerpt:
      "The revised scope looks good. Can you send the final pricing and available start dates?",
    why: "The scope is approved. Your pricing response is the only remaining commercial decision.",
    recommendation: "Send the €8,400 proposal and offer two onboarding dates.",
    age: "47 min",
    confidence: "High",
    timeline: [
      {
        id: "n1",
        type: "file",
        title: "Scope-v3.pdf",
        detail: "Final partnership scope shared with Maya.",
        time: "Yesterday · 14:12",
      },
      {
        id: "n2",
        type: "message",
        channel: "gmail",
        author: "contact",
        title: "Maya Chen",
        detail:
          "The revised scope looks good. Can you send the final pricing and available start dates?",
        time: "Today · 09:48",
      },
      {
        id: "n3",
        type: "decision",
        title: "Scope approved",
        detail: "No further scope changes requested by Northstar.",
        time: "Detected today",
      },
    ],
  },
  {
    id: "atlas-mobile",
    state: "follow",
    projectId: "atlas",
    project: "Atlas client portal",
    client: "Atlas Labs",
    contact: "Jon Bell",
    initials: "JB",
    channel: "outlook",
    subject: "Mobile invitation flow may block rollout",
    excerpt:
      "We still can’t invite a second workspace member from mobile. Is this already being investigated?",
    why: "The same issue was reported twice and may block next week’s client rollout.",
    recommendation:
      "Create a bug task, confirm ownership, and give Jon an investigation window.",
    age: "2h",
    confidence: "High",
    timeline: [
      {
        id: "a1",
        type: "message",
        channel: "outlook",
        author: "contact",
        title: "Jon Bell",
        detail: "We noticed an issue inviting team members from mobile.",
        time: "Monday · 11:22",
      },
      {
        id: "a2",
        type: "message",
        channel: "slack",
        author: "me",
        title: "Internal follow-up",
        detail:
          "I’ll reproduce the issue and create a ticket before Wednesday.",
        time: "Monday · 13:04",
      },
      {
        id: "a3",
        type: "message",
        channel: "outlook",
        author: "contact",
        title: "Jon Bell",
        detail:
          "We still can’t invite a second workspace member from mobile. Is this already being investigated?",
        time: "Today · 08:35",
      },
    ],
  },
  {
    id: "aurelia-assets",
    state: "waiting",
    projectId: "aurelia",
    project: "Aurélia brand system",
    client: "Studio Aurélia",
    contact: "Lina Moreau",
    initials: "LM",
    channel: "telegram",
    subject: "Waiting for the final photography selection",
    excerpt:
      "I’ll send the selected photos once the team signs off, hopefully by Thursday.",
    why: "The next design milestone depends on assets owned by the client.",
    recommendation:
      "Keep this waiting until Thursday, then suggest a gentle follow-up.",
    age: "Yesterday",
    confidence: "High",
    timeline: [
      {
        id: "u1",
        type: "message",
        channel: "telegram",
        author: "contact",
        title: "Lina Moreau",
        detail:
          "I’ll send the selected photos once the team signs off, hopefully by Thursday.",
        time: "Yesterday · 17:08",
      },
    ],
  },
  {
    id: "unknown-invoice",
    state: "qualify",
    projectId: "",
    project: "Unassigned",
    client: "Unknown",
    contact: "finance@orbital.so",
    initials: "FO",
    channel: "gmail",
    subject: "Invoice details for August",
    excerpt:
      "Could you confirm the purchase order reference we should include on the August invoice?",
    why: "Freescale could not confidently associate this exchange with a project.",
    recommendation:
      "Choose the related client or mark the message as informational.",
    age: "3h",
    confidence: "Confirm",
    timeline: [
      {
        id: "q1",
        type: "message",
        channel: "gmail",
        author: "contact",
        title: "finance@orbital.so",
        detail:
          "Could you confirm the purchase order reference we should include on the August invoice?",
        time: "Today · 07:58",
      },
    ],
  },
];

const initialCommitments: Commitment[] = [
  {
    id: "c1",
    title: "Send the final landing page V2",
    contact: "Sarah Lemoine",
    project: "Landing page redesign",
    due: "Today · 17:00",
    status: "today",
    source: "WhatsApp · 10:22",
  },
  {
    id: "c2",
    title: "Send final pricing and start dates",
    contact: "Maya Chen",
    project: "Northstar partnership",
    due: "Today · 14:00",
    status: "today",
    source: "Gmail · 09:48",
  },
  {
    id: "c3",
    title: "Confirm investigation of mobile invite issue",
    contact: "Jon Bell",
    project: "Atlas client portal",
    due: "2 days overdue",
    status: "overdue",
    source: "Slack · Monday",
  },
  {
    id: "c4",
    title: "Share the onboarding checklist",
    contact: "Thomas Aubry",
    project: "Freescale operations",
    due: "Friday · 11:00",
    status: "week",
    source: "Telegram · Tuesday",
  },
];

const projects: Project[] = [
  {
    id: "lemoine",
    name: "Landing page redesign",
    client: "Maison Lemoine",
    status: "On track",
    color: "bg-emerald-500",
    openItems: 2,
    lastActivity: "18 min ago",
    summary:
      "Visual direction approved. Header refinement and final client review remain.",
    nextMilestone: "Final review · Tomorrow, 09:00",
    channels: ["gmail", "whatsapp"],
  },
  {
    id: "northstar",
    name: "Northstar partnership",
    client: "Northstar",
    status: "On track",
    color: "bg-blue-500",
    openItems: 1,
    lastActivity: "47 min ago",
    summary:
      "Scope approved. Commercial terms and onboarding date are ready to send.",
    nextMilestone: "Proposal decision · This week",
    channels: ["gmail", "slack"],
  },
  {
    id: "atlas",
    name: "Atlas client portal",
    client: "Atlas Labs",
    status: "At risk",
    color: "bg-rose-500",
    openItems: 3,
    lastActivity: "2h ago",
    summary:
      "Mobile invitation issue may block the client’s rollout next week.",
    nextMilestone: "Client rollout · Monday",
    channels: ["outlook", "slack"],
  },
  {
    id: "aurelia",
    name: "Aurélia brand system",
    client: "Studio Aurélia",
    status: "Waiting",
    color: "bg-amber-500",
    openItems: 1,
    lastActivity: "Yesterday",
    summary:
      "Design work is paused until the client supplies the final photography selection.",
    nextMilestone: "Asset delivery · Thursday",
    channels: ["telegram", "gmail"],
  },
];

const attentionTabs: Array<{ id: AttentionState | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "decide", label: "To decide" },
  { id: "do", label: "To do" },
  { id: "follow", label: "To follow" },
  { id: "waiting", label: "Waiting" },
  { id: "qualify", label: "To qualify" },
];

export function ChannelsV3Preview() {
  const [view, setView] = useState<View>("brief");
  const [attentionFilter, setAttentionFilter] = useState<
    AttentionState | "all"
  >("all");
  const [query, setQuery] = useState("");
  const [activeSituation, setActiveSituation] = useState<Situation | null>(
    null,
  );
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [commitments, setCommitments] = useState(initialCommitments);
  const [checkpointOpen, setCheckpointOpen] = useState(false);
  const [lastCheckpoint, setLastCheckpoint] = useState("Yesterday · 18:04");

  const openCheckpoint = () => setCheckpointOpen(true);

  return (
    <PageWrapper className="mb-0 flex h-[calc(100svh-4rem)] max-w-none flex-col px-4 py-4 xl:px-8 2xl:px-10">
      <div className="flex shrink-0 items-start justify-between gap-4">
        <PageHeader
          title="Channels V3"
          description="Turn every client exchange into a clear next step."
        />
        <Button
          Icon={CheckCheckIcon}
          onClick={openCheckpoint}
          size="sm"
          variant="primaryBlack"
        >
          Start checkpoint
        </Button>
      </div>

      <Card className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
        <WorkspaceNavigation active={view} onChange={setView} />
        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20">
          {view === "brief" ? (
            <BriefView
              lastCheckpoint={lastCheckpoint}
              onOpenCheckpoint={openCheckpoint}
              onOpenCommitments={() => setView("commitments")}
              onOpenSituation={setActiveSituation}
            />
          ) : null}
          {view === "attention" ? (
            <AttentionView
              activeFilter={attentionFilter}
              onFilterChange={setAttentionFilter}
              onOpen={setActiveSituation}
              onQueryChange={setQuery}
              query={query}
            />
          ) : null}
          {view === "projects" ? (
            <ProjectsView onOpen={setActiveProject} />
          ) : null}
          {view === "commitments" ? (
            <CommitmentsView
              commitments={commitments}
              onChange={setCommitments}
              onOpenSource={(id) =>
                setActiveSituation(
                  situations.find((situation) => situation.id === id) ??
                    situations[0] ??
                    null,
                )
              }
            />
          ) : null}
        </div>
      </Card>

      <SituationWorkbench
        onOpenChange={(open) => !open && setActiveSituation(null)}
        open={Boolean(activeSituation)}
        situation={activeSituation}
      />
      <ProjectWorkspace
        onOpenChange={(open) => !open && setActiveProject(null)}
        open={Boolean(activeProject)}
        project={activeProject}
      />
      <CheckpointDialog
        onComplete={() => {
          setCheckpointOpen(false);
          setLastCheckpoint("Just now");
          setView("brief");
          toastSuccess({
            description: "Checkpoint complete. Your workspace is up to date.",
          });
        }}
        onOpenChange={setCheckpointOpen}
        open={checkpointOpen}
      />
    </PageWrapper>
  );
}

function WorkspaceNavigation({
  active,
  onChange,
}: {
  active: View;
  onChange: (view: View) => void;
}) {
  const items: Array<{
    id: View;
    label: string;
    icon: typeof InboxIcon;
    count?: number;
  }> = [
    { id: "brief", label: "Brief", icon: SparklesIcon },
    { id: "attention", label: "Attention", icon: CircleDotIcon, count: 5 },
    { id: "projects", label: "Projects", icon: FolderKanbanIcon },
    {
      id: "commitments",
      label: "Commitments",
      icon: UserRoundCheckIcon,
      count: 3,
    },
  ];
  return (
    <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b bg-background px-3 py-2 sm:px-5">
      {items.map(({ id, label, icon: Icon, count }) => (
        <Button
          className="shrink-0 gap-2"
          key={id}
          onClick={() => onChange(id)}
          size="sm"
          variant={active === id ? "secondary" : "ghost"}
        >
          <Icon className="size-4" />
          {label}
          {count ? (
            <span className="rounded bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {count}
            </span>
          ) : null}
        </Button>
      ))}
      <div className="ml-auto hidden items-center gap-2 text-muted-foreground text-xs md:flex">
        <ShieldCheckIcon className="size-4 text-green-600" />
        All channels synced
      </div>
    </div>
  );
}

function BriefView({
  lastCheckpoint,
  onOpenCheckpoint,
  onOpenCommitments,
  onOpenSituation,
}: {
  lastCheckpoint: string;
  onOpenCheckpoint: () => void;
  onOpenCommitments: () => void;
  onOpenSituation: (situation: Situation) => void;
}) {
  const risk = situations.find((situation) => situation.id === "atlas-mobile");
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b bg-gradient-to-r from-blue-50/80 via-background to-amber-50/60 px-5 py-5 dark:from-blue-950/20 dark:to-amber-950/10 sm:px-7 sm:py-7">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-blue-700 text-xs dark:text-blue-300">
                <SparklesIcon className="size-4" />
                Since your last checkpoint · {lastCheckpoint}
              </div>
              <h2 className="mt-3 font-semibold text-2xl tracking-tight sm:text-3xl">
                Here is what changed while you were focused.
              </h2>
              <p className="mt-3 text-muted-foreground text-sm leading-6 sm:text-base">
                Northstar approved the scope and needs final pricing. Sarah
                wants a revised landing tomorrow. The Atlas rollout may be
                blocked by a mobile issue.
              </p>
            </div>
            <Button
              Icon={ArrowRightIcon}
              onClick={onOpenCheckpoint}
              variant="primaryBlack"
            >
              Review 5 situations
            </Button>
          </div>
        </div>
        <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <BriefMetric
            icon={MessageCircleIcon}
            label="Clients waiting"
            tone="blue"
            value="3"
          />
          <BriefMetric
            icon={CalendarClockIcon}
            label="Due today"
            tone="amber"
            value="2"
          />
          <BriefMetric
            icon={AlertTriangleIcon}
            label="Project at risk"
            tone="rose"
            value="1"
          />
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h3 className="font-semibold">Your commitments</h3>
              <p className="mt-0.5 text-muted-foreground text-xs">
                Promises you made to clients
              </p>
            </div>
            <Button onClick={onOpenCommitments} size="sm" variant="ghost">
              View all <ChevronRightIcon className="ml-1 size-4" />
            </Button>
          </div>
          <div className="divide-y">
            {initialCommitments.slice(0, 3).map((item) => (
              <CommitmentRow compact item={item} key={item.id} />
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="border-rose-200 p-5 dark:border-rose-900/60">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40">
                <AlertTriangleIcon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">Project at risk</p>
                  <Badge className="border-0 bg-rose-50 text-rose-700">
                    Atlas
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-5">
                  A mobile invitation issue may block next week’s client
                  rollout.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => risk && onOpenSituation(risk)}
                  size="sm"
                  variant="outline"
                >
                  Open situation
                </Button>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2Icon className="size-4 text-green-600" />
              <p className="font-semibold text-sm">Quietly handled</p>
            </div>
            <p className="mt-2 text-muted-foreground text-sm leading-5">
              Freescale classified 11 updates as informational, including
              receipts, acknowledgements, and automated notifications.
            </p>
            <Button className="mt-3 px-0" size="sm" variant="link">
              Review classifications
            </Button>
          </Card>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl border bg-background px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-green-50 text-green-700">
            <ShieldCheckIcon className="size-4" />
          </span>
          <div>
            <p className="font-medium text-sm">
              Your workspace is ready for review
            </p>
            <p className="text-muted-foreground text-xs">
              Complete a checkpoint to establish a reliable new baseline.
            </p>
          </div>
        </div>
        <Button
          className="hidden sm:inline-flex"
          onClick={onOpenCheckpoint}
          size="sm"
        >
          Start checkpoint
        </Button>
      </div>
    </div>
  );
}

function BriefMetric({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof InboxIcon;
  label: string;
  tone: "blue" | "amber" | "rose";
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 sm:px-7">
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-lg",
          tone === "blue" && "bg-blue-50 text-blue-700",
          tone === "amber" && "bg-amber-50 text-amber-700",
          tone === "rose" && "bg-rose-50 text-rose-700",
        )}
      >
        <Icon className="size-4" />
      </span>
      <div>
        <p className="font-semibold text-xl">{value}</p>
        <p className="text-muted-foreground text-xs">{label}</p>
      </div>
    </div>
  );
}

function AttentionView({
  activeFilter,
  onFilterChange,
  onOpen,
  onQueryChange,
  query,
}: {
  activeFilter: AttentionState | "all";
  onFilterChange: (filter: AttentionState | "all") => void;
  onOpen: (situation: Situation) => void;
  onQueryChange: (query: string) => void;
  query: string;
}) {
  const filtered = useMemo(
    () =>
      situations.filter((situation) => {
        const matchesState =
          activeFilter === "all" || situation.state === activeFilter;
        const normalized = query.trim().toLowerCase();
        const matchesQuery =
          !normalized ||
          `${situation.project} ${situation.client} ${situation.contact} ${situation.subject}`
            .toLowerCase()
            .includes(normalized);
        return matchesState && matchesQuery;
      }),
    [activeFilter, query],
  );
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h2 className="font-semibold text-xl">Attention</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Situations with an unclear responsibility or next step.
          </p>
        </div>
        <div className="relative w-full lg:w-80">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="bg-background pl-9"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search situations..."
            value={query}
          />
        </div>
      </div>
      <div className="mt-5 flex gap-1 overflow-x-auto rounded-lg border bg-background p-1">
        {attentionTabs.map((tab) => (
          <Button
            className="shrink-0 gap-2"
            key={tab.id}
            onClick={() => onFilterChange(tab.id)}
            size="sm"
            variant={activeFilter === tab.id ? "secondary" : "ghost"}
          >
            {tab.label}
            <span className="text-[10px] text-muted-foreground">
              {tab.id === "all"
                ? situations.length
                : situations.filter((situation) => situation.state === tab.id)
                    .length}
            </span>
          </Button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {filtered.map((situation) => (
          <SituationCard
            key={situation.id}
            onOpen={() => onOpen(situation)}
            situation={situation}
          />
        ))}
        {!filtered.length ? (
          <div className="rounded-xl border border-dashed bg-background py-16 text-center">
            <InboxIcon className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-sm">
              Nothing needs attention here
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SituationCard({
  onOpen,
  situation,
}: {
  onOpen: () => void;
  situation: Situation;
}) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-sm">
      <button
        className="w-full p-4 text-left sm:p-5"
        onClick={onOpen}
        type="button"
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <Avatar className="size-10">
            <AvatarFallback className={avatarTone(situation.channel)}>
              {situation.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StateBadge state={situation.state} />
                  <span className="text-muted-foreground text-xs">
                    {situation.project}
                  </span>
                  {situation.confidence === "Confirm" ? (
                    <Badge
                      className="border-amber-200 bg-amber-50 text-amber-700"
                      variant="outline"
                    >
                      Association to confirm
                    </Badge>
                  ) : null}
                </div>
                <h3 className="mt-2 font-semibold text-sm sm:text-base">
                  {situation.subject}
                </h3>
                <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                  {situation.excerpt}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-muted-foreground text-xs">
                <ChannelIcon channel={situation.channel} />
                {situation.age}
              </div>
            </div>
            <div className="mt-4 grid gap-3 rounded-lg bg-muted/50 p-3 md:grid-cols-2">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Why this is here
                </p>
                <p className="mt-1 text-xs leading-5">{situation.why}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Suggested next step
                </p>
                <p className="mt-1 text-xs leading-5">
                  {situation.recommendation}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-muted-foreground text-xs">
                {situation.contact} · {situation.client}
              </p>
              <span className="flex items-center gap-1 font-medium text-xs">
                Review <ChevronRightIcon className="size-4" />
              </span>
            </div>
          </div>
        </div>
      </button>
    </Card>
  );
}

function ProjectsView({ onOpen }: { onOpen: (project: Project) => void }) {
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div>
        <h2 className="font-semibold text-xl">Projects</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Every message, decision, file, and commitment in project context.
        </p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <button
            className="group rounded-xl border bg-background p-5 text-left transition-all hover:border-foreground/20 hover:shadow-sm"
            key={project.id}
            onClick={() => onOpen(project)}
            type="button"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    project.color,
                  )}
                />
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{project.name}</h3>
                  <p className="text-muted-foreground text-xs">
                    {project.client}
                  </p>
                </div>
              </div>
              <ProjectStatus status={project.status} />
            </div>
            <p className="mt-4 text-muted-foreground text-sm leading-6">
              {project.summary}
            </p>
            <div className="mt-4 flex items-center gap-1">
              {project.channels.map((channel) => (
                <span
                  className="flex size-7 items-center justify-center rounded-md border bg-background"
                  key={channel}
                >
                  <ChannelIcon channel={channel} />
                </span>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 border-t pt-4 text-xs">
              <div>
                <p className="text-muted-foreground">Next milestone</p>
                <p className="mt-1 font-medium">{project.nextMilestone}</p>
              </div>
              <div className="border-l pl-4">
                <p className="text-muted-foreground">Open items</p>
                <p className="mt-1 font-medium">
                  {project.openItems} · Activity {project.lastActivity}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-1 font-medium text-xs">
              Open project timeline{" "}
              <ChevronRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CommitmentsView({
  commitments,
  onChange,
  onOpenSource,
}: {
  commitments: Commitment[];
  onChange: (items: Commitment[]) => void;
  onOpenSource: (situationId: string) => void;
}) {
  const toggle = (id: string) => {
    onChange(
      commitments.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "done" ? "today" : "done" }
          : item,
      ),
    );
    toastSuccess({ description: "Commitment status updated." });
  };
  const groups: Array<{
    id: CommitmentStatus;
    label: string;
    description: string;
  }> = [
    {
      id: "overdue",
      label: "Overdue",
      description: "Needs immediate attention",
    },
    {
      id: "today",
      label: "Today",
      description: "Promises due before the day ends",
    },
    {
      id: "week",
      label: "Later this week",
      description: "Upcoming commitments",
    },
    { id: "done", label: "Completed", description: "Promises already kept" },
  ];
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-semibold text-xl">Commitments</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Promises detected in your client conversations.
          </p>
        </div>
        <Button Icon={CalendarClockIcon} size="sm" variant="outline">
          Calendar view
        </Button>
      </div>
      <div className="mt-5 space-y-5">
        {groups.map((group) => {
          const items = commitments.filter((item) => item.status === group.id);
          if (!items.length && group.id !== "done") return null;
          return (
            <section key={group.id}>
              <div className="mb-2 flex items-end justify-between">
                <div>
                  <h3
                    className={cn(
                      "font-semibold text-sm",
                      group.id === "overdue" && "text-rose-700",
                    )}
                  >
                    {group.label}
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {group.description}
                  </p>
                </div>
                <span className="text-muted-foreground text-xs">
                  {items.length}
                </span>
              </div>
              <Card className="divide-y overflow-hidden">
                {items.length ? (
                  items.map((item) => (
                    <CommitmentRow
                      item={item}
                      key={item.id}
                      onOpenSource={() =>
                        onOpenSource(commitmentSituation(item.id))
                      }
                      onToggle={() => toggle(item.id)}
                    />
                  ))
                ) : (
                  <div className="p-5 text-center text-muted-foreground text-sm">
                    Completed commitments will appear here.
                  </div>
                )}
              </Card>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function CommitmentRow({
  compact = false,
  item,
  onOpenSource,
  onToggle,
}: {
  compact?: boolean;
  item: Commitment;
  onOpenSource?: () => void;
  onToggle?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3",
        !compact && "sm:items-center sm:px-5 sm:py-4",
      )}
    >
      <button
        aria-label={`Mark ${item.title} complete`}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors sm:mt-0",
          item.status === "done" && "border-green-600 bg-green-600 text-white",
        )}
        onClick={onToggle}
        type="button"
      >
        {item.status === "done" ? <CheckCheckIcon className="size-3" /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "font-medium text-sm",
            item.status === "done" && "text-muted-foreground line-through",
          )}
        >
          {item.title}
        </p>
        <p className="mt-1 text-muted-foreground text-xs">
          {item.project} · {item.contact}
        </p>
        {!compact ? (
          <button
            className="mt-2 flex items-center gap-1 text-blue-700 text-xs hover:underline"
            onClick={onOpenSource}
            type="button"
          >
            <Link2Icon className="size-3" />
            Source: {item.source}
          </button>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        <p
          className={cn(
            "font-medium text-xs",
            item.status === "overdue" && "text-rose-700",
            item.status === "today" && "text-amber-700",
          )}
        >
          {item.due}
        </p>
        {!compact ? (
          <Button className="mt-1" size="xs" variant="ghost">
            Reschedule
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function SituationWorkbench({
  open,
  onOpenChange,
  situation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  situation: Situation | null;
}) {
  const [reply, setReply] = useState("");
  const [contextOpen, setContextOpen] = useState(true);
  if (!situation) return null;
  const send = () => {
    if (!reply.trim()) return;
    toastSuccess({
      description: `Reply sent via ${channelName(situation.channel)}.`,
    });
    setReply("");
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-2xl">
        <SheetHeader className="border-b px-5 py-4 pr-12 text-left">
          <div className="flex items-center gap-2">
            <StateBadge state={situation.state} />
            <span className="text-muted-foreground text-xs">
              {situation.project}
            </span>
          </div>
          <SheetTitle className="mt-2 text-lg">{situation.subject}</SheetTitle>
          <SheetDescription>
            {situation.contact} · {situation.client}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b bg-muted/30 px-5 py-4">
            <button
              className="flex w-full items-center gap-3 text-left"
              onClick={() => setContextOpen((value) => !value)}
              type="button"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <SparklesIcon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">Freescale understanding</p>
                <p className="text-muted-foreground text-xs">
                  Why this needs attention and what to do next
                </p>
              </div>
              <ChevronDownIcon
                className={cn(
                  "size-4 transition-transform",
                  !contextOpen && "-rotate-90",
                )}
              />
            </button>
            {contextOpen ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoBlock label="Why this is here" value={situation.why} />
                <InfoBlock
                  label="Recommended action"
                  value={situation.recommendation}
                />
                <div className="sm:col-span-2 flex flex-wrap items-center gap-2 rounded-lg border bg-background p-3 text-xs">
                  <ShieldCheckIcon className="size-4 text-green-600" />
                  <span>
                    Project association: <strong>{situation.project}</strong>
                  </span>
                  <Badge variant="outline">
                    {situation.confidence} confidence
                  </Badge>
                  <Button className="ml-auto" size="xs" variant="ghost">
                    Correct
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="px-5 py-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Project timeline</h3>
              <Badge variant="outline">Multiple sources</Badge>
            </div>
            <div className="relative mt-5 space-y-5 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-border">
              {situation.timeline.map((event) => (
                <TimelineItem event={event} key={event.id} />
              ))}
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t bg-background p-3">
          <div className="overflow-hidden rounded-xl border focus-within:ring-2 focus-within:ring-ring">
            <div className="flex items-center gap-2 border-b px-3 py-2 text-muted-foreground text-xs">
              <ChannelIcon channel={situation.channel} />
              Reply to {situation.contact} via {channelName(situation.channel)}
            </div>
            <Textarea
              className="min-h-20 resize-none border-0 shadow-none focus-visible:ring-0"
              onChange={(event) => setReply(event.target.value)}
              placeholder="Write your reply..."
              value={reply}
            />
            <div className="flex items-center gap-1 border-t p-2">
              <Button
                aria-label="Attach file"
                Icon={PaperclipIcon}
                size="iconSm"
                variant="ghost"
              />
              <Button
                className="gap-1.5"
                onClick={() => setReply(suggestedReply(situation.id))}
                size="sm"
                variant="ghost"
              >
                <WandSparklesIcon className="size-4 text-blue-600" />
                Draft with AI
              </Button>
              <Button
                aria-label="Send reply"
                className="ml-auto"
                disabled={!reply.trim()}
                Icon={SendHorizontalIcon}
                onClick={send}
                size="iconSm"
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ProjectWorkspace({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}) {
  if (!project) return null;
  const related = situations.filter(
    (situation) => situation.projectId === project.id,
  );
  const events = related.flatMap((situation) => situation.timeline).slice(0, 6);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <span className={cn("size-2.5 rounded-full", project.color)} />
            <ProjectStatus status={project.status} />
          </div>
          <SheetTitle className="mt-2">{project.name}</SheetTitle>
          <SheetDescription>
            {project.client} · Activity {project.lastActivity}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <InfoBlock label="Current context" value={project.summary} />
          <InfoBlock label="Next milestone" value={project.nextMilestone} />
        </div>
        <div className="mt-6 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Unified project timeline</h3>
          <div className="flex gap-1">
            {project.channels.map((channel) => (
              <span
                className="flex size-7 items-center justify-center rounded-md border"
                key={channel}
              >
                <ChannelIcon channel={channel} />
              </span>
            ))}
          </div>
        </div>
        <div className="relative mt-5 space-y-5 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-border">
          {events.length ? (
            events.map((event) => <TimelineItem event={event} key={event.id} />)
          ) : (
            <p className="text-muted-foreground text-sm">
              No timeline events yet.
            </p>
          )}
        </div>
        <Card className="mt-6 p-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-blue-600" />
            <p className="font-medium text-sm">Ask about this project</p>
          </div>
          <div className="mt-3 flex gap-2">
            <Input placeholder="Find a decision, file, or commitment..." />
            <Button Icon={ArrowRightIcon} size="icon" />
          </div>
          <p className="mt-2 text-muted-foreground text-xs">
            Answers will include links to the original sources.
          </p>
        </Card>
      </SheetContent>
    </Sheet>
  );
}

function CheckpointDialog({
  open,
  onOpenChange,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<AttentionState | "none">("do");
  const current = situations[index] ?? situations[0];
  const isLast = index === situations.length - 1;
  const next = () => {
    if (isLast) {
      setIndex(0);
      onComplete();
      return;
    }
    setIndex((value) => value + 1);
    setChoice("do");
  };
  if (!current) return null;
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) setIndex(0);
        onOpenChange(value);
      }}
    >
      <DialogContent className="max-h-[90svh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6 text-muted-foreground text-xs">
            <span>Daily checkpoint</span>
            <span>
              {index + 1} of {situations.length}
            </span>
          </div>
          <Progress
            className="mt-2 h-1.5"
            value={((index + 1) / situations.length) * 100}
          />
          <DialogTitle className="pt-3">
            Clarify the next responsibility
          </DialogTitle>
          <DialogDescription>
            Review what Freescale understood, then confirm what should happen
            next.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <Avatar className="size-9">
              <AvatarFallback className={avatarTone(current.channel)}>
                {current.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-sm">{current.contact}</span>
                <span className="text-muted-foreground text-xs">
                  {current.project}
                </span>
                <ChannelIcon channel={current.channel} />
              </div>
              <p className="mt-3 font-semibold">{current.subject}</p>
              <p className="mt-2 text-muted-foreground text-sm leading-6">
                “{current.excerpt}”
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoBlock label="Why Freescale surfaced this" value={current.why} />
          <InfoBlock
            label="Recommended next step"
            value={current.recommendation}
          />
        </div>
        <div>
          <p className="mb-2 font-medium text-sm">Who owns the next step?</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(
              [
                ["do", "I need to act", ListChecksIcon],
                ["waiting", "Waiting for client", Clock3Icon],
                ["follow", "Follow later", TimerResetIcon],
                ["decide", "Decision needed", CircleDotIcon],
                ["qualify", "Wrong project", FolderKanbanIcon],
                ["none", "No action", CheckCircle2Icon],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                className={cn(
                  "flex min-h-20 flex-col items-start justify-between rounded-lg border bg-background p-3 text-left transition-colors hover:bg-accent",
                  choice === id &&
                    "border-blue-500 bg-blue-50 ring-1 ring-blue-500 dark:bg-blue-950/20",
                )}
                key={id}
                onClick={() => setChoice(id)}
                type="button"
              >
                <Icon className="size-4" />
                <span className="font-medium text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>
        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            disabled={index === 0}
            Icon={ArrowLeftIcon}
            onClick={() => setIndex((value) => Math.max(0, value - 1))}
            variant="outline"
          >
            Back
          </Button>
          <Button onClick={next}>
            {isLast ? "Complete checkpoint" : "Confirm and continue"}
            <ArrowRightIcon className="ml-2 size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  const Icon =
    event.type === "decision"
      ? CheckCircle2Icon
      : event.type === "commitment"
        ? UserRoundCheckIcon
        : event.type === "file"
          ? FileTextIcon
          : MessageCircleIcon;
  return (
    <div className="relative z-10 flex gap-3">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full border bg-background",
          event.type === "decision" && "border-green-200 text-green-700",
          event.type === "commitment" && "border-amber-200 text-amber-700",
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1 rounded-lg border bg-background p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="font-medium text-xs">{event.title}</p>
            {event.channel ? <ChannelIcon channel={event.channel} /> : null}
          </div>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {event.time}
          </span>
        </div>
        <p className="mt-1.5 text-muted-foreground text-xs leading-5">
          {event.detail}
        </p>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1.5 text-xs leading-5">{value}</p>
    </div>
  );
}

function StateBadge({ state }: { state: AttentionState }) {
  const config = {
    decide: ["To decide", "bg-violet-50 text-violet-700"],
    do: ["To do", "bg-blue-50 text-blue-700"],
    follow: ["To follow", "bg-amber-50 text-amber-700"],
    waiting: ["Waiting", "bg-cyan-50 text-cyan-700"],
    qualify: ["To qualify", "bg-slate-100 text-slate-700"],
  }[state];
  return <Badge className={cn("border-0", config[1])}>{config[0]}</Badge>;
}

function ProjectStatus({ status }: { status: Project["status"] }) {
  return (
    <Badge
      className={cn(
        "border-0",
        status === "On track" && "bg-green-50 text-green-700",
        status === "At risk" && "bg-rose-50 text-rose-700",
        status === "Waiting" && "bg-amber-50 text-amber-700",
      )}
    >
      {status}
    </Badge>
  );
}

function ChannelIcon({ channel }: { channel: Channel }) {
  if (channel === "gmail") return <Gmail height="12" width="14" />;
  if (channel === "outlook") return <Outlook height="13" width="14" />;
  if (channel === "whatsapp")
    return <MessageCircleIcon className="size-3.5 text-green-500" />;
  if (channel === "slack")
    return <Image alt="Slack" height={14} src="/images/slack.svg" width={14} />;
  return (
    <Image alt="Telegram" height={14} src="/images/telegram.svg" width={14} />
  );
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
function avatarTone(channel: Channel) {
  return {
    gmail: "bg-rose-50 text-rose-700",
    outlook: "bg-blue-50 text-blue-700",
    whatsapp: "bg-green-50 text-green-700",
    slack: "bg-violet-50 text-violet-700",
    telegram: "bg-sky-50 text-sky-700",
  }[channel];
}
function commitmentSituation(id: string) {
  return (
    {
      c1: "landing-review",
      c2: "northstar-pricing",
      c3: "atlas-mobile",
      c4: "aurelia-assets",
    }[id] ?? "landing-review"
  );
}
function suggestedReply(id: string) {
  return (
    {
      "landing-review":
        "Absolutely — I’ll soften the header and reduce the contrast today. I’ll send the final version tomorrow at 9:00 for your review.",
      "northstar-pricing":
        "Great, thanks Maya. I’ll send the final €8,400 proposal today with two available onboarding dates.",
      "atlas-mobile":
        "Thanks for following up, Jon. I’m creating the investigation ticket now and will confirm ownership and timing before the end of the day.",
      "aurelia-assets":
        "Perfect, thanks Lina. I’ll keep the next milestone on hold until Thursday and will check in if I haven’t received the selection.",
      "unknown-invoice":
        "Thanks — I’m confirming the correct project and purchase order reference, and I’ll get back to you shortly.",
    }[id] ??
    "Thanks for the update. I’ll review this and confirm the next step shortly."
  );
}
