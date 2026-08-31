"use client";

import { ChevronDownIcon, MailIcon, SendIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { ReaderToolbar } from "@/app/(app)/[emailAccountId]/mail/ReaderToolbar";
import type {
  MailLabel,
  MailLayoutMode,
  MailMessage,
  MailThread,
} from "@/app/(app)/[emailAccountId]/mail/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils";
import { formatShortDate } from "@/utils/date";

export type ThreadReaderProps = {
  thread: MailThread | null;
  labels: MailLabel[];
  layout: MailLayoutMode;
  isFocusMode: boolean;
  position?: { index: number; total: number };
  labelHref: (labelId: string) => string;
  onRemoveLabel?: (labelId: string) => void;
  onBack: () => void;
  onArchive: () => void;
  onReply: () => void;
  onDelete: () => void;
  onToggleFocusMode: () => void;
  showReplyComposer: boolean;
  onCancelReply: () => void;
  onSendReply: (body: string) => void;
};

export function ThreadReader({
  thread,
  labels: availableLabels,
  layout,
  isFocusMode,
  position,
  labelHref,
  onRemoveLabel,
  onBack,
  onArchive,
  onReply,
  onDelete,
  onToggleFocusMode,
  showReplyComposer,
  onCancelReply,
  onSendReply,
}: ThreadReaderProps) {
  const labels = useMemo(
    () =>
      (thread?.labelIds ?? [])
        .map((labelId) => availableLabels.find((label) => label.id === labelId))
        .filter((label): label is MailLabel => Boolean(label)),
    [availableLabels, thread?.labelIds],
  );

  if (!thread) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <MailIcon className="size-6 text-muted-foreground" />
        <div className="text-foreground text-sm">Nothing selected</div>
        <div className="text-muted-foreground text-xs">
          Pick another view, or head back to the inbox.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-background">
      <div className={readerMeasure({ layout, isFocusMode })}>
        <ReaderToolbar
          isFocusMode={isFocusMode}
          labelHref={labelHref}
          labels={labels}
          layout={layout}
          onArchive={onArchive}
          onBack={onBack}
          onDelete={onDelete}
          onRemoveLabel={onRemoveLabel}
          onReply={onReply}
          onToggleFocusMode={onToggleFocusMode}
          position={position}
          senderEmail={thread.participant.email}
          senderName={thread.participant.name}
          subject={thread.subject}
        />

        <Conversation
          key={thread.id}
          messages={thread.messages}
          onCancelReply={onCancelReply}
          onSendReply={onSendReply}
          showReplyComposer={showReplyComposer}
        />
      </div>
    </div>
  );
}

function Conversation({
  messages,
  showReplyComposer,
  onCancelReply,
  onSendReply,
}: {
  messages: MailMessage[];
  showReplyComposer: boolean;
  onCancelReply: () => void;
  onSendReply: (body: string) => void;
}) {
  const latestMessageId = messages.at(-1)?.id;
  const [expandedIds, setExpandedIds] = useState(
    new Set(latestMessageId ? [latestMessageId] : []),
  );
  const [reply, setReply] = useState("");

  return (
    <div className="pt-4">
      <ul className="space-y-2 sm:space-y-4">
        {messages.map((message) => {
          const expanded = expandedIds.has(message.id);
          return (
            <li
              className={cn(
                "bg-background p-4 shadow ring-1 ring-border/40 sm:rounded-lg",
                !expanded && "cursor-pointer",
              )}
              key={message.id}
              onClick={() => {
                if (expanded) return;
                setExpandedIds((current) => new Set(current).add(message.id));
              }}
              onKeyDown={(event) => {
                if (expanded || (event.key !== "Enter" && event.key !== " ")) {
                  return;
                }
                event.preventDefault();
                setExpandedIds((current) => new Set(current).add(message.id));
              }}
              role={expanded ? undefined : "button"}
              tabIndex={expanded ? undefined : 0}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-foreground text-sm">
                      {message.isFromCurrentUser ? "Me" : message.sender.name}
                    </span>
                    {expanded ? (
                      <span className="text-muted-foreground text-sm">
                        wrote
                      </span>
                    ) : null}
                  </div>
                  {expanded ? (
                    <div className="mt-0.5 truncate text-muted-foreground text-xs">
                      {message.sender.email} to{" "}
                      {message.recipients
                        .map((recipient) => recipient.name)
                        .join(", ")}
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2 text-muted-foreground text-xs">
                  <time dateTime={message.sentAt} suppressHydrationWarning>
                    {formatShortDate(new Date(message.sentAt))}
                  </time>
                  {!expanded ? <ChevronDownIcon className="size-3.5" /> : null}
                </div>
              </div>

              {expanded ? (
                <div className="mt-4 whitespace-pre-wrap text-foreground text-sm leading-6">
                  {message.body}
                </div>
              ) : (
                <div className="mt-1 truncate text-muted-foreground text-sm">
                  {message.body}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {showReplyComposer ? (
        <div className="mt-4 rounded-lg border border-border bg-background p-4 shadow-sm">
          <Textarea
            autoFocus
            className="min-h-28 resize-none"
            onChange={(event) => setReply(event.target.value)}
            placeholder="Write a reply…"
            value={reply}
          />
          <div className="mt-3 flex items-center gap-2">
            <Button
              disabled={!reply.trim()}
              onClick={() => {
                onSendReply(reply.trim());
                setReply("");
              }}
              size="sm"
              variant="gradient"
            >
              <SendIcon className="mr-1.5 size-3.5" />
              Send reply
            </Button>
            <Button onClick={onCancelReply} size="sm" variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function readerMeasure({
  layout,
  isFocusMode,
}: {
  layout: MailLayoutMode;
  isFocusMode: boolean;
}) {
  if (isFocusMode) return "mx-auto w-full max-w-[54rem] px-10 py-10";
  if (layout === "split") return "px-6 py-5";
  return "mx-auto w-full max-w-[54rem] px-6 py-5";
}
