"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  ArchiveIcon,
  ArrowLeftIcon,
  BotIcon,
  CheckCircle2Icon,
  InboxIcon,
  ListTodoIcon,
  MailIcon,
  MoreHorizontalIcon,
  PaperclipIcon,
  PenLineIcon,
  SearchIcon,
  SendHorizontalIcon,
  SmileIcon,
  SparklesIcon,
  StarIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Gmail } from "@/components/new-landing/icons/Gmail";
import { Outlook } from "@/components/new-landing/icons/Outlook";
import { PageHeader } from "@/components/PageHeader";
import { PageWrapper } from "@/components/PageWrapper";
import { toastSuccess } from "@/components/Toast";
import { Avatar, AvatarFallbackColor } from "@/components/ui/avatar";
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
import { cn } from "@/utils";

const channelIds = [
  "gmail",
  "outlook",
  "whatsapp",
  "slack",
  "telegram",
] as const;

type ChannelId = (typeof channelIds)[number];
type SourceFilter = "all" | "email" | ChannelId;

type ConversationMessage = {
  id: string;
  author: "contact" | "me";
  body: string;
  time: string;
};

type UnifiedConversation = {
  id: string;
  name: string;
  address: string;
  channel: ChannelId;
  label: "Client" | "Prospect" | "Team" | "Contractor";
  preview: string;
  time: string;
  unread: boolean;
  starred?: boolean;
  attachment?: string;
  summary: string;
  aiReply: string;
  nextAction: string;
  messages: ConversationMessage[];
};

const initialConversations: UnifiedConversation[] = [
  {
    id: "theo-whatsapp",
    name: "Théo Manili",
    address: "+33 6 48 20 17 42",
    channel: "whatsapp",
    label: "Client",
    preview: "Peux-tu me confirmer le planning d’intégration ?",
    time: "24m",
    unread: true,
    summary:
      "Théo attend une confirmation sur les prochaines étapes et le planning d’intégration.",
    aiReply:
      "Bonjour Théo, je te confirme le planning aujourd’hui avec les prochaines étapes et les dates clés.",
    nextAction: "Confirmer le planning d’intégration à Théo.",
    messages: [
      {
        id: "theo-1",
        author: "contact",
        body: "Bonjour Wacil, peux-tu me confirmer le planning d’intégration et les prochaines étapes ?",
        time: "10:31",
      },
    ],
  },
  {
    id: "sarah-whatsapp",
    name: "Sarah Lemoine",
    address: "+33 6 12 34 56 78",
    channel: "whatsapp",
    label: "Client",
    preview: "Perfect for the new direction. I also sent the brief by email.",
    time: "29m",
    unread: true,
    starred: true,
    summary:
      "Sarah approved the new creative direction and wants the header typography and color contrast updated before the next review.",
    aiReply:
      "Thanks Sarah — I received the brief. I’ll update the header typography and color contrasts, then send you the revised version for review.",
    nextAction: "Create a task for the revised landing page header.",
    messages: [
      {
        id: "s1",
        author: "me",
        body: "I’m integrating the latest feedback into the landing page today.",
        time: "10:16",
      },
      {
        id: "s2",
        author: "contact",
        body: "Great, thank you! Please also update the header — the previous version did not work for the team.",
        time: "10:20",
      },
      {
        id: "s3",
        author: "me",
        body: "Understood. I’ll revise the header with the new proposals.",
        time: "10:22",
      },
      {
        id: "s4",
        author: "contact",
        body: "Perfect for the new direction. I also sent the brief by email.",
        time: "10:25",
      },
    ],
  },
  {
    id: "maya-gmail",
    name: "Maya Chen",
    address: "maya@acme.co",
    channel: "gmail",
    label: "Prospect",
    preview: "The revised scope looks good. Could you send the final timeline?",
    time: "1h",
    unread: true,
    summary:
      "Maya approved the scope and needs the final project timeline before tomorrow’s renewal call.",
    aiReply:
      "Absolutely — I’ll send the final timeline this afternoon so you have it ahead of tomorrow’s call.",
    nextAction: "Send the final renewal timeline today.",
    messages: [
      {
        id: "m1",
        author: "contact",
        body: "Hi Wacil, the revised scope looks good. Could you send the final timeline before our renewal call tomorrow?",
        time: "09:12",
      },
      {
        id: "m2",
        author: "me",
        body: "Thanks Maya. I’m consolidating the last milestones and will send the timeline shortly.",
        time: "09:28",
      },
    ],
  },
  {
    id: "alex-slack",
    name: "Alex Morgan",
    address: "#product-design",
    channel: "slack",
    label: "Team",
    preview: "I added the latest review notes to the shared document.",
    time: "2h",
    unread: false,
    summary:
      "Alex added product review notes and is waiting for confirmation on which items should enter the next sprint.",
    aiReply:
      "Thanks Alex. I’ll review the notes and flag the items we should move into the next sprint before stand-up.",
    nextAction: "Review the product notes before stand-up.",
    messages: [
      {
        id: "a1",
        author: "contact",
        body: "I added the latest review notes to the shared document. Can you confirm what should move into the next sprint?",
        time: "08:41",
      },
    ],
  },
  {
    id: "thomas-telegram",
    name: "Thomas Aubry",
    address: "@thomas_aubry",
    channel: "telegram",
    label: "Contractor",
    preview: "Can you send me the signed agreement today?",
    time: "3h",
    unread: true,
    attachment: "Service-agreement.pdf",
    summary:
      "Thomas needs the signed service agreement today and attached the latest contract version.",
    aiReply:
      "Yes — I have the latest version. I’ll sign it and send it back to you before the end of the day.",
    nextAction: "Sign and return the service agreement.",
    messages: [
      {
        id: "t1",
        author: "contact",
        body: "Can you send me the signed agreement today? I attached the latest version here.",
        time: "07:54",
      },
    ],
  },
  {
    id: "jon-outlook",
    name: "Jon Bell",
    address: "jon@northstar.io",
    channel: "outlook",
    label: "Client",
    preview: "Feedback from our first week has been very positive.",
    time: "5h",
    unread: false,
    summary:
      "Jon shared positive launch feedback and suggested a short retrospective next week.",
    aiReply:
      "That’s great to hear. I’d be happy to schedule a short retrospective next week and review the first results together.",
    nextAction: "Schedule a launch retrospective with Jon.",
    messages: [
      {
        id: "j1",
        author: "contact",
        body: "Feedback from our first week has been very positive. Would you be available for a short retrospective next week?",
        time: "06:37",
      },
    ],
  },
  {
    id: "priya-gmail",
    name: "Priya Kapoor",
    address: "priya@orbitlabs.com",
    channel: "gmail",
    label: "Prospect",
    preview: "Your customer communities overlap in a useful way.",
    time: "1d",
    unread: false,
    summary:
      "Priya sees a partnership opportunity and wants to explore a shared customer initiative.",
    aiReply:
      "I agree there is a strong overlap. Let’s schedule a short call to map the shared audience and identify a first pilot initiative.",
    nextAction: "Propose times for a partnership discovery call.",
    messages: [
      {
        id: "p1",
        author: "contact",
        body: "I think our customer communities overlap in a useful way. Would you be open to exploring a small joint initiative?",
        time: "Yesterday",
      },
    ],
  },
];

export function UnifiedChannelsPreview() {
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams.get("conversation");
  const requestedDraft = searchParams.get("draft");
  const requestedReply = searchParams.get("reply");
  const [conversations, setConversations] = useState(initialConversations);
  const [activeSource, setActiveSource] = useState<SourceFilter>("all");
  const [listFilter, setListFilter] = useState<"all" | "unread">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(
    initialConversations.some(
      (conversation) => conversation.id === requestedConversationId,
    )
      ? (requestedConversationId ?? "")
      : (initialConversations[0]?.id ?? ""),
  );
  const [mobileReaderOpen, setMobileReaderOpen] = useState(false);
  const [reply, setReply] = useState(requestedReply ?? "");
  const [assistantOpen, setAssistantOpen] = useState(
    requestedDraft === "reply",
  );
  const [composeOpen, setComposeOpen] = useState(false);

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const matchesSource =
        activeSource === "all" ||
        (activeSource === "email"
          ? conversation.channel === "gmail" ||
            conversation.channel === "outlook"
          : conversation.channel === activeSource);
      const matchesListFilter = listFilter === "all" || conversation.unread;
      const matchesQuery =
        !normalizedQuery ||
        `${conversation.name} ${conversation.address} ${conversation.preview}`
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesSource && matchesListFilter && matchesQuery;
    });
  }, [activeSource, conversations, listFilter, query]);

  const selected =
    conversations.find((conversation) => conversation.id === selectedId) ??
    filteredConversations[0] ??
    null;

  const openConversation = (id: string) => {
    setSelectedId(id);
    setMobileReaderOpen(true);
    setReply("");
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id
          ? { ...conversation, unread: false }
          : conversation,
      ),
    );
  };

  const sendReply = () => {
    const body = reply.trim();
    if (!selected || !body) return;
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selected.id
          ? {
              ...conversation,
              preview: body,
              time: "Now",
              messages: [
                ...conversation.messages,
                {
                  id: `message-${crypto.randomUUID()}`,
                  author: "me",
                  body,
                  time: "Now",
                },
              ],
            }
          : conversation,
      ),
    );
    setReply("");
    toastSuccess({
      description: `Reply sent via ${channelName(selected.channel)}.`,
    });
  };

  const toggleStar = () => {
    if (!selected) return;
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selected.id
          ? { ...conversation, starred: !conversation.starred }
          : conversation,
      ),
    );
  };

  return (
    <PageWrapper className="mb-0 flex h-[calc(100svh-4rem)] max-w-none flex-col px-4 py-4 xl:px-8 2xl:px-10">
      <div className="flex shrink-0 items-start justify-between gap-4">
        <PageHeader
          title="Canaux"
          description="Gérez toutes vos conversations clients depuis un seul espace."
        />
        <Button
          Icon={PenLineIcon}
          onClick={() => setComposeOpen(true)}
          size="sm"
          variant="primaryBlack"
        >
          New message
        </Button>
      </div>

      <Card className="mt-4 flex min-h-0 flex-1 overflow-hidden">
        <ChannelRail
          activeSource={activeSource}
          conversations={conversations}
          onSelect={setActiveSource}
        />

        <ConversationList
          activeFilter={listFilter}
          conversations={filteredConversations}
          mobileReaderOpen={mobileReaderOpen}
          onFilterChange={setListFilter}
          onOpen={openConversation}
          onQueryChange={setQuery}
          query={query}
          selectedId={selected?.id ?? ""}
        />

        <ConversationReader
          conversation={selected}
          mobileReaderOpen={mobileReaderOpen}
          onAssistantOpen={() => setAssistantOpen(true)}
          onBack={() => setMobileReaderOpen(false)}
          onReplyChange={setReply}
          onSendReply={sendReply}
          onToggleStar={toggleStar}
          reply={reply}
        />
      </Card>

      <AiAssistant
        conversation={selected}
        onOpenChange={setAssistantOpen}
        onUseReply={(value) => {
          setReply(value);
          setAssistantOpen(false);
        }}
        open={assistantOpen}
      />

      <ComposeMessageDialog
        onCreate={(conversation) => {
          setConversations((current) => [conversation, ...current]);
          setSelectedId(conversation.id);
          setMobileReaderOpen(true);
          setComposeOpen(false);
          toastSuccess({ description: "La conversation a été créée." });
        }}
        onOpenChange={setComposeOpen}
        open={composeOpen}
      />
    </PageWrapper>
  );
}

function ChannelRail({
  activeSource,
  conversations,
  onSelect,
}: {
  activeSource: SourceFilter;
  conversations: UnifiedConversation[];
  onSelect: (source: SourceFilter) => void;
}) {
  const items: Array<{
    id: SourceFilter;
    name: string;
    count: number;
    icon: React.ReactNode;
  }> = [
    {
      id: "all",
      name: "Toutes les conversations",
      count: conversations.filter((conversation) => conversation.unread).length,
      icon: <InboxIcon className="size-4" />,
    },
    {
      id: "email",
      name: "Email",
      count: conversations.filter(
        (conversation) =>
          conversation.unread &&
          (conversation.channel === "gmail" ||
            conversation.channel === "outlook"),
      ).length,
      icon: <MailIcon className="size-4" />,
    },
    ...(["whatsapp", "slack", "telegram"] as const).map((channel) => ({
      id: channel,
      name: channelName(channel),
      count: conversations.filter(
        (conversation) =>
          conversation.channel === channel && conversation.unread,
      ).length,
      icon: <ChannelLogo channel={channel} />,
    })),
  ];

  return (
    <aside className="hidden w-52 shrink-0 flex-col border-r bg-muted/20 p-3 xl:flex">
      <p className="px-2 pb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Inbox
      </p>
      <nav className="space-y-1">
        {items.map((item) => (
          <button
            className={cn(
              "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors",
              activeSource === item.id
                ? "bg-background font-medium text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
            )}
            key={item.id}
            onClick={() => onSelect(item.id)}
            type="button"
          >
            <span className="flex size-5 items-center justify-center">
              {item.icon}
            </span>
            <span className="min-w-0 flex-1 truncate">{item.name}</span>
            {item.count ? (
              <Badge
                className="size-5 justify-center p-0"
                variant="destructive"
              >
                {item.count}
              </Badge>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="my-4 border-t" />
      <p className="px-2 pb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Status
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground">
          <span className="size-2 rounded-full bg-blue-600" /> Needs reply
          <span className="ml-auto text-xs">
            {conversations.filter((conversation) => conversation.unread).length}
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground">
          <StarIcon className="size-4 text-amber-500" /> Starred
          <span className="ml-auto text-xs">
            {
              conversations.filter((conversation) => conversation.starred)
                .length
            }
          </span>
        </div>
      </div>

      <div className="mt-auto rounded-lg border bg-background p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-4 text-blue-600" />
          <p className="font-medium text-sm">Tri par l’IA</p>
        </div>
        <p className="mt-1.5 text-muted-foreground text-xs leading-5">
          Every conversation is summarized and prioritized automatically.
        </p>
      </div>
    </aside>
  );
}

function ConversationList({
  activeFilter,
  conversations,
  mobileReaderOpen,
  onFilterChange,
  onOpen,
  onQueryChange,
  query,
  selectedId,
}: {
  activeFilter: "all" | "unread";
  conversations: UnifiedConversation[];
  mobileReaderOpen: boolean;
  onFilterChange: (filter: "all" | "unread") => void;
  onOpen: (id: string) => void;
  onQueryChange: (query: string) => void;
  query: string;
  selectedId: string;
}) {
  return (
    <section
      className={cn(
        "min-h-0 w-full shrink-0 flex-col border-r md:w-[330px] lg:w-[360px]",
        mobileReaderOpen ? "hidden md:flex" : "flex",
      )}
    >
      <div className="border-b p-3">
        <div className="relative">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 bg-muted/60 pl-9 shadow-none"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Rechercher dans tous les canaux…"
            value={query}
          />
        </div>
        <div className="mt-3 flex items-center gap-1 rounded-md bg-muted p-1">
          {(["all", "unread"] as const).map((filter) => (
            <button
              className={cn(
                "flex-1 rounded-sm px-3 py-1.5 font-medium text-xs capitalize transition-colors",
                activeFilter === filter
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              key={filter}
              onClick={() => onFilterChange(filter)}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations.length ? (
          conversations.map((conversation) => (
            <ConversationListItem
              active={conversation.id === selectedId}
              conversation={conversation}
              key={conversation.id}
              onOpen={() => onOpen(conversation.id)}
            />
          ))
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <InboxIcon className="mb-3 size-7 text-muted-foreground/50" />
            <p className="font-medium text-sm">Aucune conversation trouvée</p>
            <p className="mt-1 text-muted-foreground text-xs">
              Try another channel or search.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ConversationListItem({
  active,
  conversation,
  onOpen,
}: {
  active: boolean;
  conversation: UnifiedConversation;
  onOpen: () => void;
}) {
  return (
    <button
      className={cn(
        "relative flex w-full items-start gap-3 border-b px-3 py-3 text-left transition-colors",
        active ? "bg-muted/70" : "hover:bg-muted/45",
        active &&
          "before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary",
      )}
      onClick={onOpen}
      type="button"
    >
      <div className="relative">
        <Avatar className="size-10">
          <AvatarFallbackColor content={initials(conversation.name)} />
        </Avatar>
        <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-background bg-background">
          <ChannelLogo channel={conversation.channel} compact />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              conversation.unread ? "font-semibold" : "font-medium",
            )}
          >
            {conversation.name}
          </span>
          <span className="shrink-0 text-muted-foreground text-xs">
            {conversation.time}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <ConversationLabel label={conversation.label} />
          {conversation.starred ? (
            <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
          ) : null}
          {conversation.unread ? (
            <span className="ml-auto size-2 rounded-full bg-blue-600" />
          ) : null}
        </div>
        <p className="mt-1.5 truncate text-muted-foreground text-xs">
          {conversation.preview}
        </p>
        {conversation.attachment ? (
          <span className="mt-2 inline-flex items-center gap-1 rounded bg-muted px-1.5 py-1 text-muted-foreground text-[11px]">
            <PaperclipIcon className="size-3" /> 1 attachment
          </span>
        ) : null}
      </div>
    </button>
  );
}

function ConversationReader({
  conversation,
  mobileReaderOpen,
  onAssistantOpen,
  onBack,
  onReplyChange,
  onSendReply,
  onToggleStar,
  reply,
}: {
  conversation: UnifiedConversation | null;
  mobileReaderOpen: boolean;
  onAssistantOpen: () => void;
  onBack: () => void;
  onReplyChange: (value: string) => void;
  onSendReply: () => void;
  onToggleStar: () => void;
  reply: string;
}) {
  return (
    <section
      className={cn(
        "min-h-0 min-w-0 flex-1 flex-col bg-muted/15",
        mobileReaderOpen ? "flex" : "hidden md:flex",
      )}
    >
      {conversation ? (
        <>
          <header className="flex shrink-0 items-center gap-3 border-b bg-background px-3 py-3 sm:px-4">
            <Button
              aria-label="Retour aux conversations"
              className="md:hidden"
              onClick={onBack}
              size="iconSm"
              variant="ghost"
            >
              <ArrowLeftIcon className="size-4" />
            </Button>
            <Avatar className="size-9">
              <AvatarFallbackColor content={initials(conversation.name)} />
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-semibold text-sm">
                  {conversation.name}
                </h2>
                <ConversationLabel label={conversation.label} />
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-muted-foreground text-xs">
                <ChannelLogo channel={conversation.channel} compact />
                <span>{channelName(conversation.channel)}</span>
                <span>·</span>
                <span className="truncate">{conversation.address}</span>
              </div>
            </div>
            <Button
              className="hidden gap-2 sm:inline-flex"
              onClick={onAssistantOpen}
              size="sm"
              variant="blue"
            >
              <SparklesIcon className="size-4" /> Ask AI
            </Button>
            <Button
              aria-label="Ajouter ou retirer des favoris"
              onClick={onToggleStar}
              size="iconSm"
              variant="ghost"
            >
              <StarIcon
                className={cn(
                  "size-4",
                  conversation.starred && "fill-amber-400 text-amber-400",
                )}
              />
            </Button>
            <Button aria-label="Plus d’actions" size="iconSm" variant="ghost">
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </header>

          <div className="flex shrink-0 items-center gap-1 border-b bg-background px-3 py-1.5">
            <Button size="sm" variant="ghost">
              <ArchiveIcon className="mr-2 size-4" /> Archive
            </Button>
            <Button size="sm" variant="ghost">
              <CheckCircle2Icon className="mr-2 size-4" /> Mark done
            </Button>
            <Button
              className="ml-auto sm:hidden"
              onClick={onAssistantOpen}
              size="iconSm"
              variant="blue"
            >
              <SparklesIcon className="size-4" />
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              <div className="mb-2 flex items-center justify-center">
                <Badge variant="secondary">Aujourd’hui</Badge>
              </div>
              {conversation.messages.map((message) => (
                <div
                  className={cn(
                    "flex max-w-[85%] flex-col",
                    message.author === "me"
                      ? "ml-auto items-end"
                      : "mr-auto items-start",
                  )}
                  key={message.id}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                      message.author === "me"
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md border bg-background",
                    )}
                  >
                    {message.body}
                  </div>
                  <span className="mt-1 px-1 text-muted-foreground text-[11px]">
                    {message.time}
                  </span>
                </div>
              ))}
              {conversation.attachment ? (
                <div className="mr-auto flex items-center gap-3 rounded-lg border bg-background p-3 shadow-sm">
                  <PaperclipIcon className="size-4 text-muted-foreground" />
                  <span className="text-sm">{conversation.attachment}</span>
                  <Button size="xs-2" variant="outline">
                    Open
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 border-t bg-background p-3 sm:p-4">
            <div className="mx-auto max-w-3xl overflow-hidden rounded-xl border bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <div className="flex items-center gap-2 border-b px-3 py-2 text-muted-foreground text-xs">
                <ChannelLogo channel={conversation.channel} compact />
                Reply via {channelName(conversation.channel)}
              </div>
              <Textarea
                className="min-h-20 resize-none border-0 bg-transparent px-3 py-3 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                onChange={(event) => onReplyChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    onSendReply();
                  }
                }}
                placeholder={`Reply to ${conversation.name}...`}
                value={reply}
              />
              <div className="flex items-center gap-1 border-t bg-muted/20 p-2">
                <Button
                  aria-label="Joindre un fichier"
                  size="iconSm"
                  variant="ghost"
                >
                  <PaperclipIcon className="size-4" />
                </Button>
                <Button
                  aria-label="Ajouter un emoji"
                  size="iconSm"
                  variant="ghost"
                >
                  <SmileIcon className="size-4" />
                </Button>
                <Button
                  className="gap-2"
                  onClick={onAssistantOpen}
                  size="sm"
                  variant="ghost"
                >
                  <SparklesIcon className="size-4 text-blue-600" />
                  <span className="hidden sm:inline">Écrire avec l’IA</span>
                </Button>
                <Button
                  className="ml-auto gap-2"
                  disabled={!reply.trim()}
                  onClick={onSendReply}
                  size="sm"
                >
                  Send <SendHorizontalIcon className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <InboxIcon className="mb-3 size-8 text-muted-foreground/40" />
          <p className="font-medium">Sélectionnez une conversation</p>
          <p className="mt-1 text-muted-foreground text-sm">
            Messages from every channel appear here.
          </p>
        </div>
      )}
    </section>
  );
}

function AiAssistant({
  conversation,
  onOpenChange,
  onUseReply,
  open,
}: {
  conversation: UnifiedConversation | null;
  onOpenChange: (open: boolean) => void;
  onUseReply: (reply: string) => void;
  open: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            <BotIcon className="size-5" />
          </div>
          <SheetTitle>Assistant IA</SheetTitle>
          <SheetDescription>
            Contextual help for {conversation?.name ?? "this conversation"}.
          </SheetDescription>
        </SheetHeader>

        {conversation ? (
          <div className="mt-6 space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <SparklesIcon className="size-4 text-blue-600" />
                <h3 className="font-medium text-sm">
                  Résumé de la conversation
                </h3>
              </div>
              <p className="mt-3 text-muted-foreground text-sm leading-6">
                {conversation.summary}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2">
                <ListTodoIcon className="size-4 text-amber-600" />
                <h3 className="font-medium text-sm">
                  Prochaine action suggérée
                </h3>
              </div>
              <p className="mt-3 text-sm">{conversation.nextAction}</p>
              <Button className="mt-4" size="sm" variant="outline">
                Create task
              </Button>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2">
                <PenLineIcon className="size-4 text-green-600" />
                <h3 className="font-medium text-sm">Réponse suggérée</h3>
              </div>
              <p className="mt-3 text-sm leading-6">{conversation.aiReply}</p>
              <div className="mt-4 flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => onUseReply(conversation.aiReply)}
                  size="sm"
                >
                  Use this reply
                </Button>
                <Button size="sm" variant="outline">
                  Regenerate
                </Button>
              </div>
            </Card>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function ComposeMessageDialog({
  onCreate,
  onOpenChange,
  open,
}: {
  onCreate: (conversation: UnifiedConversation) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [channel, setChannel] = useState<ChannelId>("gmail");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");

  const submit = () => {
    const cleanRecipient = recipient.trim();
    const cleanMessage = message.trim();
    if (!cleanRecipient || !cleanMessage) return;
    const name = cleanRecipient.includes("@")
      ? cleanRecipient.split("@")[0] || cleanRecipient
      : cleanRecipient;
    onCreate({
      id: `conversation-${crypto.randomUUID()}`,
      name,
      address: cleanRecipient,
      channel,
      label: "Prospect",
      preview: cleanMessage,
      time: "Now",
      unread: false,
      summary: "Conversation créée depuis Freescale.",
      aiReply: "",
      nextAction: "Attendre une réponse.",
      messages: [
        {
          id: `message-${crypto.randomUUID()}`,
          author: "me",
          body: cleanMessage,
          time: "Now",
        },
      ],
    });
    setRecipient("");
    setMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau message</DialogTitle>
          <DialogDescription>
            Démarrez une conversation sur un canal connecté.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-medium text-sm" htmlFor="compose-channel">
              Canal
            </label>
            <Select
              onValueChange={(value) => setChannel(value as ChannelId)}
              value={channel}
            >
              <SelectTrigger id="compose-channel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {channelIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {channelName(id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-sm" htmlFor="compose-recipient">
              Destinataire
            </label>
            <Input
              id="compose-recipient"
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="E-mail, identifiant ou numéro de téléphone"
              value={recipient}
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-sm" htmlFor="compose-message">
              Message
            </label>
            <Textarea
              id="compose-message"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Écrivez votre message…"
              value={message}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Annuler
          </Button>
          <Button
            disabled={!recipient.trim() || !message.trim()}
            onClick={submit}
          >
            Envoyer via {channelName(channel)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConversationLabel({ label }: { label: UnifiedConversation["label"] }) {
  return (
    <Badge
      className={cn(
        "border-0 px-1.5 py-0 font-medium text-[10px]",
        label === "Client" && "bg-blue-50 text-blue-700",
        label === "Prospect" && "bg-rose-50 text-rose-700",
        label === "Team" && "bg-green-50 text-green-700",
        label === "Contractor" && "bg-amber-50 text-amber-700",
      )}
      variant="outline"
    >
      {label === "Team"
        ? "Équipe"
        : label === "Contractor"
          ? "Prestataire"
          : label}
    </Badge>
  );
}

function ChannelLogo({
  channel,
  compact = false,
}: {
  channel: ChannelId;
  compact?: boolean;
}) {
  const size = compact ? 14 : 18;
  if (channel === "gmail") return <Gmail height={size} width={size} />;
  if (channel === "outlook") return <Outlook height={size} width={size} />;
  if (channel === "whatsapp")
    return <WhatsAppIcon className={compact ? "size-3.5" : "size-4.5"} />;
  return (
    <Image alt="" height={size} src={`/images/${channel}.svg`} width={size} />
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("text-green-500", className)}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12.04 2a9.84 9.84 0 0 0-8.5 14.78L2 22l5.36-1.5A9.87 9.87 0 1 0 12.04 2Zm0 17.75a7.8 7.8 0 0 1-3.98-1.09l-.29-.17-3.18.89.85-3.1-.19-.31a7.86 7.86 0 1 1 6.79 3.78Zm4.31-5.89c-.24-.12-1.4-.69-1.62-.77-.22-.08-.38-.12-.54.12-.16.24-.61.77-.75.93-.14.16-.28.18-.52.06-.24-.12-1-.37-1.91-1.18a7.18 7.18 0 0 1-1.32-1.64c-.14-.24-.01-.36.1-.48.1-.11.24-.28.35-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.63.3-.22.24-.83.81-.83 1.98s.85 2.3.97 2.46c.12.16 1.67 2.55 4.05 3.58.57.24 1.01.39 1.35.5.57.18 1.08.15 1.49.09.46-.07 1.4-.58 1.6-1.13.2-.55.2-1.03.14-1.13-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

function channelName(channel: ChannelId) {
  const names: Record<ChannelId, string> = {
    gmail: "Gmail",
    outlook: "Outlook",
    whatsapp: "WhatsApp",
    slack: "Slack",
    telegram: "Telegram",
  };
  return names[channel];
}

function initials(name: string) {
  return name
    .split(/[ @._-]/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
