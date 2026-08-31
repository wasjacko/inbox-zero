"use client";

import {
  ArchiveIcon,
  ArrowUpDownIcon,
  InboxIcon,
  MoreHorizontalIcon,
  PanelLeftIcon,
  PaperclipIcon,
  PlusIcon,
  ReplyIcon,
  SearchIcon,
  SendIcon,
  SquarePenIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallbackColor } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/utils";

type Tag = {
  id: string;
  name: string;
  color: string;
};

type Conversation = {
  id: string;
  sender: string;
  email: string;
  subject: string;
  preview: string;
  body: string;
  time: string;
  tagId: string;
  folder: "inbox" | "sent" | "draft" | "trash";
  favorite?: boolean;
  unread?: boolean;
  attachment?: string;
};

const initialTags: Tag[] = [
  { id: "client", name: "Client", color: "bg-blue-600" },
  { id: "prospect", name: "Prospect", color: "bg-rose-600" },
  { id: "contractor", name: "Contractor", color: "bg-amber-600" },
  { id: "team", name: "Team", color: "bg-green-600" },
  { id: "unclassified", name: "Unclassified", color: "bg-slate-600" },
];

const conversations: Conversation[] = [
  {
    id: "lucas",
    sender: "Lucas Martin",
    email: "lucas@northstar.io",
    subject: "Support agreement for 2026",
    preview:
      "Hi, we would like to validate the terms for technical support in 2026.",
    body: "Hi Wacil,\n\nWe would like to validate the terms for technical support in 2026 before our next planning meeting. Could you confirm the proposed scope and availability?\n\nThank you,\nLucas",
    time: "3h",
    tagId: "client",
    folder: "inbox",
  },
  {
    id: "sarah",
    sender: "Sarah Lemoine",
    email: "sarah@atelier-studio.fr",
    subject: "Landing page brief",
    preview:
      "I also sent you the brief by email. Let me know if you received it.",
    body: "Hi Wacil,\n\nI also sent you the landing page brief by email. Let me know if you received it and if anything is missing before we move forward.\n\nSarah",
    time: "8h",
    tagId: "client",
    folder: "inbox",
  },
  {
    id: "jon",
    sender: "Jon Bell",
    email: "jon@northstar.io",
    subject: "Invitation workspace — accès toujours bloqué",
    preview: "L’incident d’invitation n’est toujours pas résolu.",
    body: "Bonjour Wacil,\n\nJe viens de réessayer l’invitation, mais l’accès au workspace est toujours bloqué. Peux-tu regarder aujourd’hui ? Cela retarde l’arrivée de deux personnes de l’équipe.\n\nMerci,\nJon",
    time: "3h",
    tagId: "client",
    folder: "inbox",
    unread: true,
  },
  {
    id: "marc",
    sender: "Marc Lemaire",
    email: "marc@cloudbase.dev",
    subject: "Cloud hosting invoice",
    preview: "Your cloud hosting invoice has been generated for this month.",
    body: "Hello,\n\nYour cloud hosting invoice has been generated for this month. The detailed PDF is attached to this conversation.\n\nBest,\nMarc",
    time: "9h",
    tagId: "contractor",
    folder: "inbox",
    unread: true,
    attachment: "Invoice-August.pdf",
  },
  {
    id: "maya",
    sender: "Maya Chen",
    email: "maya@acme.co",
    subject: "Acme renewal — final scope",
    preview: "The revised scope looks good. Could you send the final timeline?",
    body: "Hi Wacil,\n\nThe revised scope looks good. Could you send the final timeline before our call tomorrow?\n\nMaya",
    time: "1d",
    tagId: "prospect",
    folder: "inbox",
    favorite: true,
  },
  {
    id: "alex",
    sender: "Alex Morgan",
    email: "alex@freescale.team",
    subject: "Weekly product notes",
    preview: "Here is the summary from this week's product review.",
    body: "Here is the summary from this week's product review. I added the decisions and next steps to the shared workspace.",
    time: "2d",
    tagId: "team",
    folder: "sent",
  },
];

type ActiveView =
  | "inbox"
  | "favorite"
  | "sent"
  | "draft"
  | "trash"
  | "gmail"
  | `tag:${string}`;

export function InboxPreview() {
  const [activeView, setActiveView] = useState<ActiveView>("inbox");
  const [query, setQuery] = useState("");
  const [ascending, setAscending] = useState(false);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [tags, setTags] = useState(initialTags);

  useEffect(() => {
    const focusedConversation = new URLSearchParams(window.location.search).get(
      "focus",
    );
    if (!focusedConversation) return;

    const conversation = conversations.find(
      (item) => item.id === focusedConversation,
    );
    if (conversation) setSelected(conversation);
  }, []);

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = conversations.filter((conversation) => {
      const matchesSearch =
        !normalizedQuery ||
        `${conversation.sender} ${conversation.subject} ${conversation.preview}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesView =
        activeView === "gmail"
          ? conversation.folder === "inbox"
          : activeView === "favorite"
            ? conversation.favorite
            : activeView.startsWith("tag:")
              ? conversation.tagId === activeView.slice(4)
              : conversation.folder === activeView;
      return matchesSearch && matchesView;
    });
    return ascending ? [...result].reverse() : result;
  }, [activeView, ascending, query]);

  const counts = useMemo(() => {
    const tagCounts = new Map<string, number>();
    for (const conversation of conversations) {
      tagCounts.set(
        conversation.tagId,
        (tagCounts.get(conversation.tagId) ?? 0) + 1,
      );
    }
    return tagCounts;
  }, []);

  const navigation = (
    <InboxNavigation
      activeView={activeView}
      counts={counts}
      onSelect={(view) => {
        setActiveView(view);
        setMobileNavOpen(false);
      }}
      onTagsChange={setTags}
      tags={tags}
    />
  );

  return (
    <div className="flex h-[calc(100svh-4rem)] min-h-0 flex-1 bg-background">
      <aside className="hidden w-60 shrink-0 border-r bg-sidebar md:flex">
        {navigation}
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent className="w-64 p-0" side="left">
          {navigation}
        </SheetContent>
      </Sheet>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 p-4 pb-3">
          <Button
            aria-label="Open inbox navigation"
            className="md:hidden"
            onClick={() => setMobileNavOpen(true)}
            size="icon"
            variant="ghost"
          >
            <PanelLeftIcon className="size-5" />
          </Button>
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 border-0 bg-muted/70 pl-10 text-base shadow-none focus-visible:ring-1"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search conversations..."
              value={query}
            />
          </div>
          <Button
            aria-label="Reverse conversation order"
            onClick={() => setAscending((current) => !current)}
            size="icon"
            variant="ghost"
          >
            <ArrowUpDownIcon
              className={cn(
                "size-5 text-muted-foreground transition-transform",
                ascending && "rotate-180",
              )}
            />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-8 sm:px-4">
          {filteredConversations.length ? (
            <div aria-label="Conversations" className="space-y-1" role="list">
              {filteredConversations.map((conversation) => (
                <ConversationRow
                  conversation={conversation}
                  key={conversation.id}
                  onOpen={() => setSelected(conversation)}
                  tag={tags.find((tag) => tag.id === conversation.tagId)}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <InboxIcon className="mb-3 size-8 text-muted-foreground/50" />
              <p className="font-medium">No conversations here</p>
              <p className="mt-1 text-muted-foreground text-sm">
                Try another folder, tag, or search.
              </p>
            </div>
          )}
        </div>
      </main>

      <ConversationReader
        conversation={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        tag={tags.find((tag) => tag.id === selected?.tagId)}
      />
    </div>
  );
}

function InboxNavigation({
  activeView,
  counts,
  onSelect,
  tags,
  onTagsChange,
}: {
  activeView: ActiveView;
  counts: Map<string, number>;
  onSelect: (view: ActiveView) => void;
  tags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}) {
  const [addingTag, setAddingTag] = useState(false);
  const [tagName, setTagName] = useState("");
  const systemItems = [
    { id: "inbox" as const, name: "Primary", icon: InboxIcon, count: 3 },
    { id: "favorite" as const, name: "Starred", icon: StarIcon },
    { id: "sent" as const, name: "Sent", icon: SendIcon },
    { id: "draft" as const, name: "Drafts", icon: SquarePenIcon },
    { id: "trash" as const, name: "Trash", icon: Trash2Icon },
  ];

  return (
    <div className="flex min-h-0 w-full flex-col overflow-y-auto p-3">
      <nav className="space-y-1">
        {systemItems.map(({ id, name, icon: Icon, count }) => (
          <NavigationButton
            active={activeView === id}
            count={count}
            icon={<Icon className="size-4" />}
            key={id}
            label={name}
            onClick={() => onSelect(id)}
          />
        ))}
      </nav>

      <div className="my-4 border-t" />
      <NavigationButton
        active={activeView === "gmail"}
        count={3}
        icon={<GmailMiniIcon />}
        label="Gmail"
        onClick={() => onSelect("gmail")}
      />
      <div className="my-4 border-t" />

      <nav className="space-y-1">
        {tags.map((tag) => (
          <NavigationButton
            active={activeView === `tag:${tag.id}`}
            count={counts.get(tag.id) ?? 0}
            icon={<span className={cn("size-2.5 rounded-sm", tag.color)} />}
            key={tag.id}
            label={tag.name}
            onClick={() => onSelect(`tag:${tag.id}`)}
          />
        ))}
      </nav>

      {addingTag ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const name = tagName.trim();
            if (!name) return;
            const id = name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
            onTagsChange([...tags, { id, name, color: "bg-indigo-600" }]);
            setTagName("");
            setAddingTag(false);
          }}
        >
          <Input
            autoFocus
            className="h-8 min-w-0 flex-1"
            onChange={(event) => setTagName(event.target.value)}
            placeholder="Tag name"
            value={tagName}
          />
          <Button disabled={!tagName.trim()} size="xs-2" type="submit">
            Add
          </Button>
        </form>
      ) : (
        <Button
          className="mt-3 justify-start gap-2 text-blue-600"
          onClick={() => setAddingTag(true)}
          size="sm"
          variant="ghost"
        >
          <PlusIcon className="size-4" /> New tag
        </Button>
      )}
    </div>
  );
}

function NavigationButton({
  active,
  count,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  count?: number;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors",
        active
          ? "bg-accent font-medium text-foreground"
          : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
      )}
      onClick={onClick}
      type="button"
    >
      <span className="flex size-5 items-center justify-center">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined ? (
        <span className="text-muted-foreground text-xs">{count}</span>
      ) : null}
    </button>
  );
}

function ConversationRow({
  conversation,
  onOpen,
  tag,
}: {
  conversation: Conversation;
  onOpen: () => void;
  tag?: Tag;
}) {
  return (
    <button
      className="group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/55 sm:items-center sm:px-4"
      onClick={onOpen}
      type="button"
    >
      <Avatar className="size-11 ring-2 ring-background sm:size-12">
        <AvatarFallbackColor
          className="font-semibold text-sm"
          content={initials(conversation.sender)}
        />
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "truncate text-sm sm:text-base",
              conversation.unread ? "font-semibold" : "font-medium",
            )}
          >
            {conversation.sender}
          </span>
          {tag ? (
            <Badge
              className={cn(
                "shrink-0 border-0 px-2 py-0.5 font-medium",
                tag.id === "client" && "bg-blue-50 text-blue-700",
                tag.id === "prospect" && "bg-rose-50 text-rose-700",
                tag.id === "contractor" && "bg-amber-50 text-amber-700",
                tag.id === "team" && "bg-green-50 text-green-700",
                tag.id === "unclassified" && "bg-slate-100 text-slate-700",
              )}
              variant="outline"
            >
              {tag.name}
            </Badge>
          ) : null}
          {conversation.favorite ? (
            <StarIcon className="size-4 shrink-0 fill-amber-400 text-amber-400" />
          ) : null}
        </div>
        <p
          className={cn(
            "mt-1 truncate text-sm",
            conversation.unread
              ? "font-medium text-foreground"
              : "text-muted-foreground",
          )}
        >
          {conversation.preview}
        </p>
        {conversation.attachment ? (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-muted-foreground text-xs">
            <PaperclipIcon className="size-3.5" /> 1 attachment
          </span>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2 pt-0.5 text-muted-foreground text-sm sm:pt-0">
        {conversation.unread ? (
          <span className="size-2 rounded-full bg-blue-600" />
        ) : null}
        <span className={cn(conversation.unread && "text-blue-600")}>
          {conversation.time}
        </span>
      </div>
    </button>
  );
}

function ConversationReader({
  conversation,
  onOpenChange,
  tag,
}: {
  conversation: Conversation | null;
  onOpenChange: (open: boolean) => void;
  tag?: Tag;
}) {
  return (
    <Sheet open={Boolean(conversation)} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full max-w-xl flex-col p-0" size="5xl">
        {conversation ? (
          <>
            <SheetHeader className="border-b px-6 py-5 pr-12">
              <SheetTitle>{conversation.subject}</SheetTitle>
              <SheetDescription>
                {conversation.sender} · {conversation.email}
              </SheetDescription>
            </SheetHeader>

            <div className="flex items-center gap-1 border-b px-5 py-2">
              <Button size="sm" variant="ghost">
                <ReplyIcon className="mr-2 size-4" /> Reply
              </Button>
              <Button size="sm" variant="ghost">
                <ArchiveIcon className="mr-2 size-4" /> Archive
              </Button>
              <Button size="iconSm" variant="ghost">
                <MoreHorizontalIcon className="size-4" />
              </Button>
              {tag ? (
                <Badge className="ml-auto" variant="secondary">
                  {tag.name}
                </Badge>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <div className="mb-6 flex items-center gap-3">
                <Avatar>
                  <AvatarFallbackColor
                    content={initials(conversation.sender)}
                  />
                </Avatar>
                <div>
                  <p className="font-medium">{conversation.sender}</p>
                  <p className="text-muted-foreground text-xs">
                    to Wacil · {conversation.time}
                  </p>
                </div>
              </div>
              <div className="whitespace-pre-line text-sm leading-7">
                {conversation.body}
              </div>
              {conversation.attachment ? (
                <div className="mt-8 flex items-center gap-3 rounded-lg border p-3">
                  <PaperclipIcon className="size-4 text-muted-foreground" />
                  <span className="text-sm">{conversation.attachment}</span>
                  <Button className="ml-auto" size="sm" variant="outline">
                    Open
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="border-t p-4">
              <Button className="w-full justify-start" variant="outline">
                <ReplyIcon className="mr-2 size-4" /> Reply to{" "}
                {conversation.sender}
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function GmailMiniIcon() {
  return (
    <span className="font-bold text-red-500 text-sm" aria-hidden="true">
      M
    </span>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
