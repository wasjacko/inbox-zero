"use client";

import { useQueryState } from "nuqs";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ListToolbar } from "@/app/(app)/[emailAccountId]/mail/ListToolbar";
import {
  MAIL_CATEGORIES,
  type MailNavTarget,
  MailSidebar,
} from "@/app/(app)/[emailAccountId]/mail/MailSidebar";
import {
  createMockCounts,
  MOCK_CURRENT_USER,
  MOCK_FOLDERS,
  MOCK_LABELS,
  MOCK_THREADS,
} from "@/app/(app)/[emailAccountId]/mail/mock-data";
import type {
  NewSplitDraft,
  NewSplitOption,
} from "@/app/(app)/[emailAccountId]/mail/NewSplitPopover";
import { ShortcutsDialog } from "@/app/(app)/[emailAccountId]/mail/ShortcutsDialog";
import {
  type MailSplitTab,
  SplitTabs,
} from "@/app/(app)/[emailAccountId]/mail/SplitTabs";
import { ThreadList } from "@/app/(app)/[emailAccountId]/mail/ThreadList";
import { ThreadReader } from "@/app/(app)/[emailAccountId]/mail/ThreadReader";
import {
  type MailLayoutMode,
  type MailSplit,
  MailSplitKind,
  type MailThread,
} from "@/app/(app)/[emailAccountId]/mail/types";
import { useThreadSelection } from "@/app/(app)/[emailAccountId]/mail/use-thread-selection";
import type { ShortcutHandlers } from "@/lib/shortcuts/registry";
import { useShortcuts } from "@/lib/shortcuts/useShortcuts";

const BUILT_IN_SPLITS: MailSplit[] = [
  { id: "all", name: "All", kind: MailSplitKind.INBOX, value: null },
  { id: "unread", name: "Unread", kind: MailSplitKind.UNREAD, value: null },
];

export function MailShell({
  showMailboxSidebar = true,
}: {
  showMailboxSidebar?: boolean;
}) {
  const [allThreads, setAllThreads] = useState<MailThread[]>(MOCK_THREADS);
  const [labels, setLabels] = useState(MOCK_LABELS);
  const [customSplits, setCustomSplits] = useState<MailSplit[]>([
    {
      id: "customers",
      name: "Customers",
      kind: MailSplitKind.LABEL,
      value: "customers",
    },
  ]);
  const [layout, setLayout] = useState<MailLayoutMode>("split");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const previousThreads = useRef<MailThread[] | null>(null);

  const [openThreadId, setOpenThreadId] = useQueryState("thread-id", {
    defaultValue: MOCK_THREADS[0]?.id ?? "",
  });
  const [activeSplitId, setActiveSplitId] = useQueryState("split", {
    defaultValue: "all",
  });
  const [scopeType] = useQueryState("type");
  const [scopeLabelId] = useQueryState("labelId");
  const [scopeFolderId] = useQueryState("folderId");

  const countsById = useMemo(
    () => createMockCounts(allThreads, labels),
    [allThreads, labels],
  );
  const isScoped = Boolean(scopeLabelId || scopeFolderId || scopeType);

  const splits: MailSplitTab[] = useMemo(
    () => [
      ...BUILT_IN_SPLITS.map((split) => ({
        id: split.id,
        name: split.name,
        deletable: false,
      })),
      ...customSplits.map((split) => ({
        id: split.id,
        name: split.name,
        deletable: true,
      })),
    ],
    [customSplits],
  );

  const threads = useMemo(() => {
    if (scopeLabelId) {
      return allThreads.filter((thread) =>
        thread.labelIds.includes(scopeLabelId),
      );
    }
    if (scopeFolderId === "starred") {
      return allThreads.filter((thread) =>
        thread.labelIds.includes("priority"),
      );
    }
    if (scopeFolderId === "follow-up") {
      return allThreads.filter(
        (thread) => thread.mailbox === "inbox" && thread.unread,
      );
    }
    if (scopeType) {
      const isMailbox = ["inbox", "draft", "sent", "archive"].includes(
        scopeType,
      );
      return allThreads.filter((thread) =>
        isMailbox
          ? thread.mailbox === scopeType
          : thread.category === scopeType,
      );
    }

    const split =
      [...BUILT_IN_SPLITS, ...customSplits].find(
        (candidate) => candidate.id === activeSplitId,
      ) ?? BUILT_IN_SPLITS[0];

    if (split.kind === MailSplitKind.UNREAD) {
      return allThreads.filter(
        (thread) => thread.mailbox === "inbox" && thread.unread,
      );
    }
    if (split.kind === MailSplitKind.CATEGORY && split.value) {
      return allThreads.filter(
        (thread) =>
          thread.mailbox === "inbox" && thread.category === split.value,
      );
    }
    if (split.kind === MailSplitKind.LABEL && split.value) {
      return allThreads.filter(
        (thread) =>
          thread.mailbox === "inbox" && thread.labelIds.includes(split.value),
      );
    }
    return allThreads.filter((thread) => thread.mailbox === "inbox");
  }, [
    activeSplitId,
    allThreads,
    customSplits,
    scopeFolderId,
    scopeLabelId,
    scopeType,
  ]);

  const orderedIds = useMemo(
    () => threads.map((thread) => thread.id),
    [threads],
  );
  const selection = useThreadSelection(orderedIds);
  const clampIndex = useCallback(
    (index: number) =>
      Math.min(Math.max(0, index), Math.max(0, threads.length - 1)),
    [threads.length],
  );
  const clampedIndex = clampIndex(focusedIndex);
  const focusedThread = threads[clampedIndex];
  const openThread =
    threads.find((thread) => thread.id === openThreadId) ?? null;

  const hrefFor = useCallback((target: MailNavTarget) => {
    const params = new URLSearchParams();
    if (target.kind === "type") params.set("type", target.type);
    if (target.kind === "label") params.set("labelId", target.labelId);
    if (target.kind === "folder") params.set("folderId", target.folderId);
    return `?${params.toString()}`;
  }, []);

  const labelHref = useCallback(
    (labelId: string) => hrefFor({ kind: "label", labelId }),
    [hrefFor],
  );

  const openAt = useCallback(
    (index: number) => {
      const thread = threads[index];
      if (!thread) return;
      setFocusedIndex(index);
      setShowReplyComposer(false);
      setOpenThreadId(thread.id);
      setAllThreads((current) =>
        current.map((item) =>
          item.id === thread.id ? { ...item, unread: false } : item,
        ),
      );
    },
    [setOpenThreadId, threads],
  );

  const move = useCallback(
    (delta: number) => {
      const next = clampIndex(clampedIndex + delta);
      setFocusedIndex(next);
      if (layout === "split" && threads[next])
        setOpenThreadId(threads[next].id);
    },
    [clampIndex, clampedIndex, layout, setOpenThreadId, threads],
  );

  const extendSelection = useCallback(
    (delta: number) => {
      const next = clampIndex(clampedIndex + delta);
      selection.extendTo(next, clampedIndex);
      setFocusedIndex(next);
    },
    [clampIndex, clampedIndex, selection],
  );

  const undo = useCallback(() => {
    if (!previousThreads.current) return;
    setAllThreads(previousThreads.current);
    previousThreads.current = null;
    toast.success("Restored");
  }, []);

  const runAction = useCallback(
    (action: "archive" | "delete") => {
      const ids = selection.targetIds(focusedThread?.id);
      if (!ids.length) return;
      previousThreads.current = allThreads;
      const targets = new Set(ids);
      setAllThreads((current) =>
        action === "archive"
          ? current.map((thread) =>
              targets.has(thread.id)
                ? { ...thread, mailbox: "archive" }
                : thread,
            )
          : current.filter((thread) => !targets.has(thread.id)),
      );
      if (openThreadId && targets.has(openThreadId)) setOpenThreadId(null);
      selection.clear();
      toast.success(
        ids.length === 1
          ? action === "archive"
            ? "Archived"
            : "Deleted"
          : `${action === "archive" ? "Archived" : "Deleted"} ${ids.length} conversations`,
        { action: { label: "Undo", onClick: undo } },
      );
    },
    [
      allThreads,
      focusedThread?.id,
      openThreadId,
      selection,
      setOpenThreadId,
      undo,
    ],
  );

  const archiveTargets = useCallback(() => runAction("archive"), [runAction]);
  const deleteTargets = useCallback(() => runAction("delete"), [runAction]);
  const toggleLayout = useCallback(
    () => setLayout((current) => (current === "split" ? "list" : "split")),
    [],
  );

  const handlers: ShortcutHandlers = {
    next: () => move(1),
    previous: () => move(-1),
    open: () => openAt(clampedIndex),
    backToList: () => {
      setIsFocusMode(false);
      setOpenThreadId(null);
    },
    nextSplit: () => {
      const index = splits.findIndex((split) => split.id === activeSplitId);
      const next = splits[(index + 1) % splits.length];
      if (next) setActiveSplitId(next.id);
    },
    select: () => selection.toggle(clampedIndex),
    extendSelectionDown: () => extendSelection(1),
    extendSelectionUp: () => extendSelection(-1),
    archive: archiveTargets,
    delete: deleteTargets,
    reply: () => setShowReplyComposer(true),
    undo,
    toggleLayout,
    focusMode: () => setIsFocusMode((current) => !current),
    close: () => {
      if (showReplyComposer) setShowReplyComposer(false);
      else if (isFocusMode) setIsFocusMode(false);
      else if (selection.hasSelection) selection.clear();
      else if (layout === "list") setOpenThreadId(null);
    },
    help: () => setIsHelpOpen(true),
  };
  useShortcuts(handlers);

  const newSplitOptions: NewSplitOption[] = useMemo(
    () => [
      {
        id: "state:unread",
        name: "Unread",
        kind: MailSplitKind.UNREAD,
        value: null,
        group: "state",
      },
      ...MAIL_CATEGORIES.map((category) => ({
        id: `category:${category.type}`,
        name: category.name,
        kind: MailSplitKind.CATEGORY,
        value: category.type,
        group: "category" as const,
      })),
      ...labels.map((label) => ({
        id: `label:${label.id}`,
        name: label.name,
        kind: MailSplitKind.LABEL,
        value: label.id,
        group: "label" as const,
      })),
    ],
    [labels],
  );

  const onCreateSplit = useCallback((draft: NewSplitDraft) => {
    setCustomSplits((current) => [
      ...current,
      { ...draft, id: `split-${crypto.randomUUID()}` },
    ]);
    toast.success(`Created “${draft.name}”`);
  }, []);

  const onDeleteSplit = useCallback(
    (splitId: string) => {
      if (activeSplitId === splitId) setActiveSplitId("all");
      setCustomSplits((current) =>
        current.filter((split) => split.id !== splitId),
      );
    },
    [activeSplitId, setActiveSplitId],
  );

  const onCreateLabel = useCallback((name: string) => {
    setLabels((current) => [
      ...current,
      { id: `label-${crypto.randomUUID()}`, name },
    ]);
    toast.success(`Label “${name}” created`);
  }, []);

  const onRemoveLabel = useCallback(
    (labelId: string) => {
      if (!openThreadId) return;
      setAllThreads((current) =>
        current.map((thread) =>
          thread.id === openThreadId
            ? {
                ...thread,
                labelIds: thread.labelIds.filter((id) => id !== labelId),
              }
            : thread,
        ),
      );
    },
    [openThreadId],
  );

  const sendReply = useCallback(
    (body: string) => {
      if (!openThreadId) return;
      const sentAt = new Date().toISOString();
      setAllThreads((current) =>
        current.map((thread) =>
          thread.id === openThreadId
            ? {
                ...thread,
                snippet: body,
                updatedAt: sentAt,
                unread: false,
                messages: [
                  ...thread.messages,
                  {
                    id: `message-${crypto.randomUUID()}`,
                    sender: MOCK_CURRENT_USER,
                    recipients: [thread.participant],
                    sentAt,
                    body,
                    isFromCurrentUser: true,
                  },
                ],
              }
            : thread,
        ),
      );
      setShowReplyComposer(false);
      toast.success("Reply added to the mock conversation");
    },
    [openThreadId],
  );

  const showList = !isFocusMode && (layout === "split" || !openThreadId);
  const showReader = layout === "split" || Boolean(openThreadId);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="flex min-h-0 flex-1">
        {!isFocusMode && showMailboxSidebar ? (
          <MailSidebar
            activeFolderId={scopeFolderId}
            activeLabelId={scopeLabelId}
            activeType={
              scopeLabelId || scopeFolderId ? null : (scopeType ?? "inbox")
            }
            backToAppHref="/dashboard"
            categories={MAIL_CATEGORIES}
            categoryHeading="Categories"
            className="hidden lg:flex"
            countsById={countsById}
            folders={MOCK_FOLDERS}
            hrefFor={hrefFor}
            labelSingular="label"
            labels={labels}
            labelsHeading="Labels"
            onCompose={() =>
              toast.info("Compose is ready for your future backend")
            }
            onCreateLabel={onCreateLabel}
            onOpenShortcuts={() => setIsHelpOpen(true)}
          />
        ) : null}

        {showList ? (
          <section
            className={
              layout === "split"
                ? "flex min-h-0 w-[clamp(258px,32vw,400px)] shrink-0 flex-col border-r border-border"
                : "flex min-h-0 min-w-0 flex-1 flex-col"
            }
          >
            <ListToolbar
              layout={layout}
              onOpenSearch={() =>
                toast.info("Search is ready for your future data source")
              }
              onToggleAssistant={() =>
                toast.info("Assistant is ready for your future backend")
              }
              onToggleLayout={toggleLayout}
            />
            {!isScoped ? (
              <SplitTabs
                activeSplitId={activeSplitId}
                newSplitOptions={newSplitOptions}
                onCreateSplit={onCreateSplit}
                onDelete={onDeleteSplit}
                onSelect={setActiveSplitId}
                splits={splits}
              />
            ) : null}
            <ThreadList
              emptyTitle="Nothing in this view"
              focusedIndex={clampedIndex}
              isLoadingMore={false}
              isSelected={selection.isSelected}
              labels={labels}
              layout={layout}
              onArchiveSelected={archiveTargets}
              onClearSelection={selection.clear}
              onDeleteSelected={deleteTargets}
              onLoadMore={() => {}}
              onOpenThread={openAt}
              onSelectRangeTo={selection.selectRangeTo}
              onToggleSelect={selection.toggle}
              selectedCount={selection.selectedCount}
              showLoadMore={false}
              threads={threads}
            />
          </section>
        ) : null}

        {showReader ? (
          <ThreadReader
            isFocusMode={isFocusMode}
            labelHref={labelHref}
            labels={labels}
            layout={layout}
            onArchive={archiveTargets}
            onBack={() => setOpenThreadId(null)}
            onCancelReply={() => setShowReplyComposer(false)}
            onDelete={deleteTargets}
            onRemoveLabel={onRemoveLabel}
            onReply={() => setShowReplyComposer(true)}
            onSendReply={sendReply}
            onToggleFocusMode={() => setIsFocusMode((current) => !current)}
            position={
              openThread
                ? { index: clampedIndex + 1, total: threads.length }
                : undefined
            }
            showReplyComposer={showReplyComposer}
            thread={openThread}
          />
        ) : null}
      </div>

      <ShortcutsDialog onOpenChange={setIsHelpOpen} open={isHelpOpen} />
    </div>
  );
}
