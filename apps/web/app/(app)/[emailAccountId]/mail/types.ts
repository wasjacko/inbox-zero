export type MailLayoutMode = "list" | "split";

export const MailSplitKind = {
  INBOX: "inbox",
  UNREAD: "unread",
  CATEGORY: "category",
  LABEL: "label",
} as const;

export type MailSplitKind = (typeof MailSplitKind)[keyof typeof MailSplitKind];

export type MailboxType = "inbox" | "draft" | "sent" | "archive";

export type MailLabel = {
  id: string;
  name: string;
  color?: string;
};

export type MailFolder = {
  id: string;
  displayName: string;
  depth: number;
};

export type MailCount = {
  id: string;
  total: number;
  unread: number;
};

export type MailParticipant = {
  name: string;
  email: string;
};

export type MailMessage = {
  id: string;
  sender: MailParticipant;
  recipients: MailParticipant[];
  sentAt: string;
  body: string;
  isFromCurrentUser?: boolean;
};

export type MailThread = {
  id: string;
  subject: string;
  snippet: string;
  participant: MailParticipant;
  updatedAt: string;
  mailbox: MailboxType;
  category: string;
  labelIds: string[];
  unread: boolean;
  draft?: boolean;
  messages: MailMessage[];
};

export type ListThread = MailThread;

export type MailSplit = {
  id: string;
  name: string;
  kind: MailSplitKind;
  value: string | null;
};
