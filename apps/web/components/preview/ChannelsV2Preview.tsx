"use client";

import {
  ArrowLeftIcon,
  AtSignIcon,
  CheckCheckIcon,
  ChevronRightIcon,
  CircleDotIcon,
  Clock3Icon,
  InboxIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  PaperclipIcon,
  PenLineIcon,
  SearchIcon,
  SendHorizontalIcon,
  SparklesIcon,
  StarIcon,
  WandSparklesIcon,
  ZapIcon,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Gmail } from "@/components/new-landing/icons/Gmail";
import { Outlook } from "@/components/new-landing/icons/Outlook";
import { PageHeader } from "@/components/PageHeader";
import { PageWrapper } from "@/components/PageWrapper";
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
import { toastSuccess } from "@/components/Toast";
import { cn } from "@/utils";

type Channel = "gmail" | "outlook" | "whatsapp" | "slack" | "telegram";
type Lens = "all" | "reply" | "mentions" | "ai";
type Message = {
  id: string;
  author: "me" | "contact";
  body: string;
  time: string;
};
type Signal = {
  id: string;
  name: string;
  initials: string;
  address: string;
  channel: Channel;
  company: string;
  role: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  starred?: boolean;
  mention?: boolean;
  aiPriority: "high" | "medium" | "low";
  sentiment: "Positive" | "Neutral" | "Needs attention";
  intent: string;
  nextStep: string;
  messages: Message[];
};

const initialSignals: Signal[] = [
  {
    id: "sarah",
    name: "Sarah Lemoine",
    initials: "SL",
    address: "+33 6 12 34 56 78",
    channel: "whatsapp",
    company: "Maison Lemoine",
    role: "Client",
    subject: "Landing page feedback",
    preview: "The direction is right. Could we make the header feel calmer?",
    time: "12 min",
    unread: true,
    starred: true,
    aiPriority: "high",
    sentiment: "Positive",
    intent: "Project feedback",
    nextStep: "Confirm the header revision and share a delivery date.",
    messages: [
      {
        id: "sm1",
        author: "me",
        body: "I’ve integrated the latest feedback into the landing page.",
        time: "10:16",
      },
      {
        id: "sm2",
        author: "contact",
        body: "The direction is right. Could we make the header feel calmer and reduce the contrast a little?",
        time: "10:20",
      },
      {
        id: "sm3",
        author: "contact",
        body: "If possible, I’d love to review the final version tomorrow morning.",
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
    company: "Northstar",
    role: "Prospect",
    subject: "Re: Partnership proposal",
    preview: "The revised scope looks good. Can you send the final pricing?",
    time: "38 min",
    unread: true,
    aiPriority: "high",
    sentiment: "Positive",
    intent: "Commercial decision",
    nextStep: "Send final pricing and propose a 20-minute call.",
    messages: [
      {
        id: "mm1",
        author: "me",
        body: "I’ve updated the partnership scope based on our call.",
        time: "09:32",
      },
      {
        id: "mm2",
        author: "contact",
        body: "The revised scope looks good. Can you send the final pricing and available start dates?",
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
    company: "Freescale",
    role: "Team",
    subject: "Launch review notes",
    preview: "@Wacil I added the final review notes to the shared document.",
    time: "1h",
    unread: true,
    mention: true,
    aiPriority: "medium",
    sentiment: "Neutral",
    intent: "Team coordination",
    nextStep: "Review the notes and acknowledge the launch checklist.",
    messages: [
      {
        id: "am1",
        author: "contact",
        body: "@Wacil I added the final review notes to the shared document. Two items need your approval.",
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
    company: "Aubry Studio",
    role: "Contractor",
    subject: "Signed agreement",
    preview: "I’ve signed everything. Sending the final PDF now.",
    time: "2h",
    unread: false,
    aiPriority: "low",
    sentiment: "Positive",
    intent: "Document delivery",
    nextStep: "Archive the agreement and confirm receipt.",
    messages: [
      {
        id: "tm1",
        author: "me",
        body: "Could you return the signed agreement today?",
        time: "08:02",
      },
      {
        id: "tm2",
        author: "contact",
        body: "I’ve signed everything. Sending the final PDF now.",
        time: "08:17",
      },
    ],
  },
  {
    id: "jon",
    name: "Jon Bell",
    initials: "JB",
    address: "jon@atlaslabs.io",
    channel: "outlook",
    company: "Atlas Labs",
    role: "Client",
    subject: "First week feedback",
    preview: "We noticed one issue with the invite flow on mobile.",
    time: "Yesterday",
    unread: false,
    aiPriority: "medium",
    sentiment: "Needs attention",
    intent: "Support request",
    nextStep: "Create a bug report and confirm investigation.",
    messages: [
      {
        id: "jm1",
        author: "contact",
        body: "The first week has been very positive. We noticed one issue with the invite flow on mobile.",
        time: "Yesterday",
      },
    ],
  },
];

const lenses: Array<{ id: Lens; label: string; icon: typeof InboxIcon }> = [
  { id: "all", label: "All signals", icon: InboxIcon },
  { id: "reply", label: "Needs reply", icon: MessageCircleIcon },
  { id: "mentions", label: "Mentions", icon: AtSignIcon },
  { id: "ai", label: "AI priority", icon: SparklesIcon },
];

export function ChannelsV2Preview() {
  const [signals, setSignals] = useState(initialSignals);
  const [lens, setLens] = useState<Lens>("all");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(initialSignals[0]?.id ?? "");
  const [reply, setReply] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  const active = signals.find((signal) => signal.id === activeId) ?? null;
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return signals.filter((signal) => {
      const matchesLens =
        lens === "all" ||
        (lens === "reply" && signal.unread) ||
        (lens === "mentions" && signal.mention) ||
        (lens === "ai" && signal.aiPriority === "high");
      const haystack =
        `${signal.name} ${signal.company} ${signal.subject} ${signal.preview}`.toLowerCase();
      return matchesLens && (!normalized || haystack.includes(normalized));
    });
  }, [lens, query, signals]);

  const openSignal = (id: string) => {
    setActiveId(id);
    setMobileOpen(true);
    setReply("");
    setSignals((current) =>
      current.map((signal) =>
        signal.id === id ? { ...signal, unread: false } : signal,
      ),
    );
  };

  const sendReply = () => {
    const cleanReply = reply.trim();
    if (!active || !cleanReply) return;
    setSignals((current) =>
      current.map((signal) =>
        signal.id === active.id
          ? {
              ...signal,
              preview: cleanReply,
              time: "Now",
              messages: [
                ...signal.messages,
                {
                  id: crypto.randomUUID(),
                  author: "me",
                  body: cleanReply,
                  time: "Now",
                },
              ],
            }
          : signal,
      ),
    );
    setReply("");
    toastSuccess({
      description: `Reply sent via ${channelLabel(active.channel)}.`,
    });
  };

  const toggleStar = () => {
    if (!active) return;
    setSignals((current) =>
      current.map((signal) =>
        signal.id === active.id
          ? { ...signal, starred: !signal.starred }
          : signal,
      ),
    );
  };

  return (
    <PageWrapper className="mb-0 flex h-[calc(100svh-4rem)] max-w-none flex-col px-4 py-4 xl:px-8 2xl:px-10">
      <div className="flex shrink-0 items-start justify-between gap-4">
        <PageHeader
          title="Channels V2"
          description="One signal center for every customer conversation."
        />
        <Button
          Icon={PenLineIcon}
          onClick={() => setComposeOpen(true)}
          size="sm"
          variant="primaryBlack"
        >
          New conversation
        </Button>
      </div>

      <Card className="mt-4 flex min-h-0 flex-1 overflow-hidden">
        <section className="flex min-w-0 flex-1 flex-col bg-muted/20">
          <SignalToolbar
            activeLens={lens}
            onLensChange={setLens}
            onQueryChange={setQuery}
            query={query}
            signals={signals}
          />
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4">
            <div className="mx-auto max-w-3xl">
              <QueueSummary signals={signals} />
              <div className="mt-4 space-y-2.5">
                {filtered.map((signal) => (
                  <SignalCard
                    active={signal.id === activeId}
                    key={signal.id}
                    onOpen={() => openSignal(signal.id)}
                    signal={signal}
                  />
                ))}
                {filtered.length === 0 ? <EmptyQueue /> : null}
              </div>
            </div>
          </div>
        </section>

        <ConversationWorkspace
          active={active}
          className="hidden w-[42%] max-w-[590px] lg:flex"
          onReplyChange={setReply}
          onSend={sendReply}
          onToggleStar={toggleStar}
          reply={reply}
        />
      </Card>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent className="w-full p-0 sm:max-w-xl" side="right">
          <SheetHeader className="sr-only">
            <SheetTitle>{active?.name ?? "Conversation"}</SheetTitle>
            <SheetDescription>Conversation workspace</SheetDescription>
          </SheetHeader>
          <ConversationWorkspace
            active={active}
            className="flex h-full"
            mobile
            onBack={() => setMobileOpen(false)}
            onReplyChange={setReply}
            onSend={sendReply}
            onToggleStar={toggleStar}
            reply={reply}
          />
        </SheetContent>
      </Sheet>

      <ComposeDialog onOpenChange={setComposeOpen} open={composeOpen} />
    </PageWrapper>
  );
}

function SignalToolbar({
  activeLens,
  onLensChange,
  onQueryChange,
  query,
  signals,
}: {
  activeLens: Lens;
  onLensChange: (lens: Lens) => void;
  onQueryChange: (value: string) => void;
  query: string;
  signals: Signal[];
}) {
  return (
    <div className="shrink-0 border-b bg-background px-3 py-3 sm:px-5">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          {lenses.map(({ id, label, icon: Icon }) => {
            const count =
              id === "reply"
                ? signals.filter((signal) => signal.unread).length
                : id === "mentions"
                  ? signals.filter((signal) => signal.mention).length
                  : id === "ai"
                    ? signals.filter((signal) => signal.aiPriority === "high")
                        .length
                    : signals.length;
            return (
              <Button
                className="shrink-0 gap-2"
                key={id}
                onClick={() => onLensChange(id)}
                size="sm"
                variant={activeLens === id ? "default" : "ghost"}
              >
                <Icon className="size-4" />
                {label}
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px]",
                    activeLens === id ? "bg-background/20" : "bg-muted",
                  )}
                >
                  {count}
                </span>
              </Button>
            );
          })}
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 bg-muted/40 pl-9"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search people, companies, or messages..."
            value={query}
          />
        </div>
      </div>
    </div>
  );
}

function QueueSummary({ signals }: { signals: Signal[] }) {
  const unread = signals.filter((signal) => signal.unread).length;
  const priority = signals.filter(
    (signal) => signal.aiPriority === "high",
  ).length;
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-background px-4 py-3">
      <div>
        <div className="flex items-center gap-2">
          <CircleDotIcon className="size-4 text-blue-600" />
          <p className="font-medium text-sm">Live signal queue</p>
        </div>
        <p className="mt-1 text-muted-foreground text-xs">
          Updated just now across 5 connected platforms
        </p>
      </div>
      <div className="flex items-center gap-4 text-right">
        <div>
          <p className="font-semibold text-sm">{unread}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Unread
          </p>
        </div>
        <div className="h-7 w-px bg-border" />
        <div>
          <p className="font-semibold text-amber-600 text-sm">{priority}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Priority
          </p>
        </div>
      </div>
    </div>
  );
}

function SignalCard({
  active,
  onOpen,
  signal,
}: {
  active: boolean;
  onOpen: () => void;
  signal: Signal;
}) {
  return (
    <button
      className={cn(
        "group w-full rounded-xl border bg-background p-4 text-left transition-all hover:border-foreground/20 hover:shadow-sm",
        active && "border-blue-300 ring-2 ring-blue-100 dark:ring-blue-900/40",
      )}
      onClick={onOpen}
      type="button"
    >
      <div className="flex gap-3">
        <ChannelAvatar signal={signal} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold text-sm">
                  {signal.name}
                </span>
                <Badge className="border-0 bg-muted px-1.5 py-0 text-[10px] text-muted-foreground">
                  {signal.role}
                </Badge>
                {signal.unread ? (
                  <span className="size-1.5 shrink-0 rounded-full bg-blue-600" />
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-muted-foreground text-xs">
                {signal.company} · {channelLabel(signal.channel)}
              </p>
            </div>
            <span className="shrink-0 text-muted-foreground text-xs">
              {signal.time}
            </span>
          </div>
          <div className="mt-3 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-sm">{signal.subject}</p>
              <p className="mt-1 line-clamp-2 text-muted-foreground text-sm leading-5">
                {signal.preview}
              </p>
            </div>
            <ChevronRightIcon className="mt-2 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <PriorityBadge priority={signal.aiPriority} />
            {signal.mention ? (
              <Badge className="gap-1" variant="outline">
                <AtSignIcon className="size-3" /> Mention
              </Badge>
            ) : null}
            {signal.starred ? (
              <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}

function ConversationWorkspace({
  active,
  className,
  mobile = false,
  onBack,
  onReplyChange,
  onSend,
  onToggleStar,
  reply,
}: {
  active: Signal | null;
  className?: string;
  mobile?: boolean;
  onBack?: () => void;
  onReplyChange: (value: string) => void;
  onSend: () => void;
  onToggleStar: () => void;
  reply: string;
}) {
  const [aiOpen, setAiOpen] = useState(true);
  if (!active)
    return (
      <div className={cn("items-center justify-center border-l", className)}>
        Select a signal
      </div>
    );

  return (
    <aside className={cn("min-w-0 flex-col border-l bg-background", className)}>
      <div className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
        {mobile ? (
          <Button
            aria-label="Back to signals"
            Icon={ArrowLeftIcon}
            onClick={onBack}
            size="icon"
            variant="ghost"
          />
        ) : null}
        <ChannelAvatar signal={active} small />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-sm">{active.name}</p>
          <p className="truncate text-muted-foreground text-xs">
            {active.address} · {channelLabel(active.channel)}
          </p>
        </div>
        <Button
          aria-label="Star conversation"
          Icon={StarIcon}
          onClick={onToggleStar}
          size="icon"
          variant="ghost"
        />
        <Button
          aria-label="More actions"
          Icon={MoreHorizontalIcon}
          size="icon"
          variant="ghost"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{active.subject}</p>
              <p className="mt-1 text-muted-foreground text-xs">
                Conversation with {active.company}
              </p>
            </div>
            <Button Icon={CheckCheckIcon} size="sm" variant="outline">
              Resolve
            </Button>
          </div>
        </div>

        <div className="space-y-4 px-4 py-5">
          {active.messages.map((message) => (
            <div
              className={cn("flex", message.author === "me" && "justify-end")}
              key={message.id}
            >
              <div
                className={cn(
                  "max-w-[86%]",
                  message.author === "me" && "text-right",
                )}
              >
                <div
                  className={cn(
                    "rounded-xl border px-3.5 py-3 text-left text-sm leading-5",
                    message.author === "me"
                      ? "border-foreground bg-foreground text-background"
                      : "bg-background shadow-sm",
                  )}
                >
                  {message.body}
                </div>
                <span className="mt-1 inline-block text-[10px] text-muted-foreground">
                  {message.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mx-4 mb-4 overflow-hidden rounded-xl border bg-blue-50/50 dark:bg-blue-950/20">
          <button
            className="flex w-full items-center gap-2 px-3.5 py-3 text-left"
            onClick={() => setAiOpen((value) => !value)}
            type="button"
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              <SparklesIcon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm">Freescale AI brief</p>
              <p className="text-muted-foreground text-xs">
                Context and recommended action
              </p>
            </div>
            <ChevronRightIcon
              className={cn(
                "size-4 transition-transform",
                aiOpen && "rotate-90",
              )}
            />
          </button>
          {aiOpen ? (
            <div className="space-y-3 border-t px-3.5 py-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <Insight label="Intent" value={active.intent} />
                <Insight label="Sentiment" value={active.sentiment} />
              </div>
              <div className="rounded-lg bg-background p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Best next step
                </p>
                <p className="mt-1 leading-5">{active.nextStep}</p>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => onReplyChange(aiReplyFor(active))}
                size="sm"
                variant="outline"
              >
                <WandSparklesIcon className="size-4 text-blue-600" />
                Draft a reply
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t p-3">
        <div className="overflow-hidden rounded-xl border bg-background focus-within:ring-2 focus-within:ring-ring">
          <div className="flex items-center gap-2 border-b px-3 py-2 text-muted-foreground text-xs">
            <ChannelIcon channel={active.channel} /> Reply via{" "}
            {channelLabel(active.channel)}
          </div>
          <Textarea
            className="min-h-20 resize-none border-0 shadow-none focus-visible:ring-0"
            onChange={(event) => onReplyChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            placeholder={`Reply to ${active.name}...`}
            value={reply}
          />
          <div className="flex items-center gap-1 border-t p-2">
            <Button
              aria-label="Attach file"
              Icon={PaperclipIcon}
              size="icon"
              variant="ghost"
            />
            <Button
              className="gap-1.5"
              onClick={() => onReplyChange(aiReplyFor(active))}
              size="sm"
              variant="ghost"
            >
              <SparklesIcon className="size-4 text-blue-600" />
              AI draft
            </Button>
            <Button
              aria-label="Send reply"
              className="ml-auto"
              disabled={!reply.trim()}
              Icon={SendHorizontalIcon}
              onClick={onSend}
              size="icon"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

function ComposeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [channel, setChannel] = useState<Channel>("gmail");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const submit = () => {
    if (!recipient.trim() || !message.trim()) return;
    toastSuccess({
      description: `New conversation started via ${channelLabel(channel)}.`,
    });
    setRecipient("");
    setMessage("");
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a conversation</DialogTitle>
          <DialogDescription>
            Choose any connected channel without leaving your workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-medium text-sm" htmlFor="v2-channel">
              Channel
            </label>
            <Select
              onValueChange={(value) => setChannel(value as Channel)}
              value={channel}
            >
              <SelectTrigger id="v2-channel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  [
                    "gmail",
                    "outlook",
                    "whatsapp",
                    "slack",
                    "telegram",
                  ] as Channel[]
                ).map((item) => (
                  <SelectItem key={item} value={item}>
                    {channelLabel(item)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="font-medium text-sm" htmlFor="v2-recipient">
              Recipient
            </label>
            <Input
              id="v2-recipient"
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="Email, username, or phone number"
              value={recipient}
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-medium text-sm" htmlFor="v2-message">
              Message
            </label>
            <Textarea
              id="v2-message"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write your message..."
              value={message}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button
            disabled={!recipient.trim() || !message.trim()}
            onClick={submit}
          >
            Send via {channelLabel(channel)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChannelAvatar({
  signal,
  small = false,
}: {
  signal: Signal;
  small?: boolean;
}) {
  return (
    <div className="relative shrink-0">
      <Avatar className={small ? "size-8" : "size-10"}>
        <AvatarFallback className={avatarColor(signal.channel)}>
          {signal.initials}
        </AvatarFallback>
      </Avatar>
      {!small ? (
        <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-background bg-background">
          <ChannelIcon channel={signal.channel} />
        </span>
      ) : null}
    </div>
  );
}

function ChannelIcon({ channel }: { channel: Channel }) {
  if (channel === "gmail") return <Gmail height="12" width="14" />;
  if (channel === "outlook") return <Outlook height="13" width="14" />;
  if (channel === "whatsapp")
    return <MessageCircleIcon className="size-3 text-green-500" />;
  if (channel === "slack")
    return <Image alt="Slack" height={13} src="/images/slack.svg" width={13} />;
  return (
    <Image alt="Telegram" height={13} src="/images/telegram.svg" width={13} />
  );
}

function PriorityBadge({ priority }: { priority: Signal["aiPriority"] }) {
  return (
    <Badge
      className={cn(
        "gap-1 border-0 px-1.5 py-0 text-[10px]",
        priority === "high" && "bg-amber-50 text-amber-700",
        priority === "medium" && "bg-blue-50 text-blue-700",
        priority === "low" && "bg-muted text-muted-foreground",
      )}
    >
      {priority === "high" ? (
        <ZapIcon className="size-3" />
      ) : (
        <Clock3Icon className="size-3" />
      )}
      {priority} priority
    </Badge>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background p-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1 font-medium text-xs">{value}</p>
    </div>
  );
}

function EmptyQueue() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-background py-16 text-center">
      <InboxIcon className="size-8 text-muted-foreground/40" />
      <p className="mt-3 font-medium text-sm">No signals found</p>
      <p className="mt-1 text-muted-foreground text-xs">
        Try another lens or search term.
      </p>
    </div>
  );
}

function channelLabel(channel: Channel) {
  return {
    gmail: "Gmail",
    outlook: "Outlook",
    whatsapp: "WhatsApp",
    slack: "Slack",
    telegram: "Telegram",
  }[channel];
}

function avatarColor(channel: Channel) {
  return {
    gmail: "bg-rose-50 text-rose-700",
    outlook: "bg-blue-50 text-blue-700",
    whatsapp: "bg-green-50 text-green-700",
    slack: "bg-violet-50 text-violet-700",
    telegram: "bg-sky-50 text-sky-700",
  }[channel];
}

function aiReplyFor(signal: Signal) {
  if (signal.id === "sarah")
    return "Absolutely — I’ll soften the header and reduce the contrast today. I’ll send you the final version tomorrow morning for review.";
  if (signal.id === "maya")
    return "Great, I’ll send the final pricing and available start dates today. Would a quick 20-minute call tomorrow work for you?";
  if (signal.id === "alex")
    return "Thanks, Alex. I’ll review the two pending items and update the launch checklist shortly.";
  if (signal.id === "thomas")
    return "Perfect, thank you. I’ve received the signed agreement and will archive it with the project documents.";
  return "Thanks for flagging this. I’m creating a bug report now and will confirm the next steps as soon as the investigation starts.";
}
