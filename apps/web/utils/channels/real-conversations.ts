import type { ThreadsListResponse } from "@/app/api/threads/route";
import type { ThreadResponse } from "@/app/api/threads/[id]/route";
import {
  extractEmailAddress,
  extractEmailAddresses,
  extractNameFromEmail,
  isSameEmailAddress,
} from "@/utils/email";

type Channel = "gmail" | "outlook";

export type RealChannelConversation = {
  id: string;
  name: string;
  initials: string;
  address: string;
  channel: Channel;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  starred: boolean;
  attachment: boolean;
  messages: Array<{
    id: string;
    author: "me" | "contact";
    body: string;
    time: string;
    attachment?: string;
  }>;
};

type ThreadLike =
  | ThreadsListResponse["threads"][number]
  | ThreadResponse["thread"];
type MessageLike = ThreadLike["messages"][number];

export function toRealChannelConversations({
  provider,
  threads,
  userEmail,
}: {
  provider: string;
  threads: ThreadLike[];
  userEmail: string;
}): RealChannelConversation[] {
  return [...threads]
    .sort(
      (left, right) =>
        threadLatestTimestamp(right) - threadLatestTimestamp(left),
    )
    .map((thread) =>
      toRealChannelConversation({ provider, thread, userEmail }),
    );
}

export function toRealChannelConversation({
  provider,
  thread,
  userEmail,
}: {
  provider: string;
  thread: ThreadLike;
  userEmail: string;
}): RealChannelConversation {
  const messages = [...thread.messages].sort(
    (left, right) => messageTimestamp(left) - messageTimestamp(right),
  );
  const latest = messages.at(-1);
  const contactHeader = findContactHeader(messages, userEmail);
  const address = extractEmailAddress(contactHeader);
  const extractedName = extractNameFromEmail(contactHeader).replace(
    /^"|"$/g,
    "",
  );
  const name =
    extractedName && extractedName !== address
      ? extractedName
      : address.split("@")[0] || address || "Contact Gmail";

  return {
    id: thread.id,
    name,
    initials: getInitials(name),
    address,
    channel: provider === "microsoft" ? "outlook" : "gmail",
    subject: latest?.subject || "Sans objet",
    preview: latest?.snippet || thread.snippet || "",
    time: formatMessageTime(latest),
    unread: messages.some((message) => message.labelIds?.includes("UNREAD")),
    starred: messages.some((message) => message.labelIds?.includes("STARRED")),
    attachment: messages.some(
      (message) =>
        "attachments" in message && Boolean(message.attachments?.length),
    ),
    messages: messages.map((message) => ({
      id: message.id,
      author: isSameEmailAddress(message.headers.from, userEmail)
        ? "me"
        : "contact",
      body:
        ("textPlain" in message && message.textPlain?.trim()) ||
        message.snippet ||
        "Message sans aperçu",
      time: formatMessageTime(message),
      attachment:
        "attachments" in message
          ? message.attachments?.at(0)?.filename
          : undefined,
    })),
  };
}

function findContactHeader(messages: MessageLike[], userEmail: string) {
  for (const message of [...messages].reverse()) {
    if (!isSameEmailAddress(message.headers.from, userEmail)) {
      return message.headers.from;
    }
  }

  for (const message of [...messages].reverse()) {
    const recipient = extractEmailAddresses(message.headers.to).find(
      (email) => !isSameEmailAddress(email, userEmail),
    );
    if (recipient) return recipient;
  }

  return "Contact Gmail";
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function formatMessageTime(message?: MessageLike) {
  if (!message) return "";
  const date = new Date(
    message.internalDate ? Number(message.internalDate) : message.date,
  );
  if (Number.isNaN(date.getTime())) return message.date;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const daysAgo = Math.round(
    (today.getTime() - messageDay.getTime()) / (24 * 60 * 60 * 1000),
  );
  const clock = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (daysAgo === 0) return `Aujourd’hui · ${clock}`;
  if (daysAgo === 1) return `Hier · ${clock}`;

  return `${new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(date)} · ${clock}`;
}

function messageTimestamp(message: MessageLike) {
  const value = message.internalDate
    ? Number(message.internalDate)
    : new Date(message.date).getTime();
  return Number.isFinite(value) ? value : 0;
}

function threadLatestTimestamp(thread: ThreadLike) {
  return Math.max(0, ...thread.messages.map(messageTimestamp));
}
