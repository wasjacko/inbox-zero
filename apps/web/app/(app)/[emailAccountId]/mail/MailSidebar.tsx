"use client";

import {
  ArchiveIcon,
  ArrowLeftIcon,
  BellIcon,
  FileIcon,
  FolderIcon,
  InboxIcon,
  KeyboardIcon,
  type LucideIcon,
  MegaphoneIcon,
  MessagesSquareIcon,
  PenLineIcon,
  PlusIcon,
  SendIcon,
  UserIcon,
  Users2Icon,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, type ReactNode, useState } from "react";
import type {
  MailCount,
  MailFolder,
  MailLabel,
} from "@/app/(app)/[emailAccountId]/mail/types";
import { Kbd } from "@/components/Kbd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getShortcutHint } from "@/lib/shortcuts/registry";
import { cn } from "@/utils";

/** Where a sidebar row navigates. Mirrors the mail page's `?type=` query shape. */
export type MailNavTarget =
  | { kind: "type"; type: string }
  | { kind: "label"; labelId: string }
  | { kind: "folder"; folderId: string };

export type MailSidebarProps = {
  /** `?type=` of the current view — `inbox` when nothing is selected. */
  activeType: string | null;
  /** `?labelId=` of the current view, when a user label is open. */
  activeLabelId: string | null;
  /** `?folderId=` of the current view, when a custom folder is open. */
  activeFolderId: string | null;
  /** Builds the href for a row so the sidebar never owns routing. */
  hrefFor: (target: MailNavTarget) => string;
  labels: MailLabel[];
  folders: MailFolder[];
  countsById: Map<string, MailCount>;
  categories: MailCategory[];
  categoryHeading: string;
  labelsHeading: string;
  labelSingular: string;
  backToAppHref: string;
  onCompose: () => void;
  onCreateLabel: (name: string) => void;
  onOpenShortcuts: () => void;
  className?: string;
};

const SYSTEM_ITEMS = [
  { name: "Inbox", type: "inbox", countId: "inbox", Icon: InboxIcon },
  { name: "Drafts", type: "draft", countId: "draft", Icon: FileIcon },
  { name: "Sent", type: "sent", countId: "sent", Icon: SendIcon },
  {
    name: "Archived",
    type: "archive",
    countId: "archive",
    Icon: ArchiveIcon,
  },
] as const;

export type MailCategory = {
  name: string;
  type: string;
  Icon: LucideIcon;
  showCount: boolean;
};

export const MAIL_CATEGORIES: MailCategory[] = [
  {
    name: "Personal",
    type: "personal",
    Icon: UserIcon,
    showCount: true,
  },
  {
    name: "Social",
    type: "social",
    Icon: Users2Icon,
    showCount: true,
  },
  {
    name: "Updates",
    type: "updates",
    Icon: BellIcon,
    showCount: true,
  },
  {
    name: "Forums",
    type: "forums",
    Icon: MessagesSquareIcon,
    showCount: true,
  },
  {
    name: "Promotions",
    type: "promotions",
    Icon: MegaphoneIcon,
    showCount: true,
  },
];

export function MailSidebar({
  activeType,
  activeLabelId,
  activeFolderId,
  hrefFor,
  labels,
  folders,
  countsById,
  categories,
  categoryHeading,
  labelsHeading,
  labelSingular,
  backToAppHref,
  onCompose,
  onCreateLabel,
  onOpenShortcuts,
  className,
}: MailSidebarProps) {
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");

  const submitNewLabel = (event: FormEvent) => {
    event.preventDefault();
    const name = newLabelName.trim();
    if (!name) return;
    onCreateLabel(name);
    setNewLabelName("");
    setIsAddingLabel(false);
  };

  return (
    <aside
      className={cn(
        "flex w-[236px] shrink-0 flex-col overflow-hidden border-border border-r bg-sidebar px-2.5 pt-3 pb-2.5",
        className,
      )}
    >
      <Link
        href={backToAppHref}
        className="mb-2.5 flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-muted-foreground text-xs hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeftIcon className="size-3.5 shrink-0" />
        <span className="flex-1 truncate">Back to dashboard</span>
        <Kbd>{getShortcutHint("backToApp")}</Kbd>
      </Link>

      <Button
        variant="gradient"
        onClick={onCompose}
        className="mb-3.5 w-full shrink-0 justify-start gap-2 rounded-xl px-3"
      >
        <PenLineIcon className="size-4 shrink-0" />
        <span className="flex-1 text-left">Compose</span>
        <Kbd variant="onColor">{getShortcutHint("compose")}</Kbd>
      </Button>

      {/* The negative margin lets the scrollbar sit in the sidebar's own
          padding, so a platform-width bar can't crowd the unread counts. */}
      <div className="-mr-1.5 flex min-h-0 flex-1 flex-col overflow-y-auto pr-1.5 scrollbar-thin">
        <nav className="flex flex-col gap-px">
          {SYSTEM_ITEMS.map(({ name, type, countId, Icon }) => (
            <NavRow
              key={type}
              href={hrefFor({ kind: "type", type })}
              active={!activeLabelId && !activeFolderId && activeType === type}
              icon={<Icon className="size-4 shrink-0" />}
              name={name}
              count={countId ? displayCount(countsById.get(countId)) : null}
              emphasizeCount
            />
          ))}
        </nav>

        {categories.length > 0 && (
          <>
            <GroupHeading>{categoryHeading}</GroupHeading>
            <nav className="flex flex-col gap-px">
              {categories.map(({ name, type, Icon, showCount }) => (
                <NavRow
                  key={type}
                  href={hrefFor({ kind: "type", type })}
                  active={
                    !activeLabelId && !activeFolderId && activeType === type
                  }
                  icon={<Icon className="size-3.5 shrink-0" />}
                  name={name}
                  count={showCount ? displayCount(countsById.get(type)) : null}
                />
              ))}
            </nav>
          </>
        )}

        {folders.length > 0 && (
          <>
            <GroupHeading>Folders</GroupHeading>
            <nav className="flex flex-col gap-px">
              {folders.map((folder) => (
                <NavRow
                  key={folder.id}
                  href={hrefFor({ kind: "folder", folderId: folder.id })}
                  active={activeFolderId === folder.id}
                  icon={
                    <FolderIcon
                      className="size-3.5 shrink-0"
                      style={{ marginLeft: folder.depth * 12 }}
                    />
                  }
                  name={folder.displayName}
                  count={displayCount(countsById.get(folder.id))}
                />
              ))}
            </nav>
          </>
        )}

        <GroupHeading
          action={
            <button
              type="button"
              onClick={() => setIsAddingLabel((open) => !open)}
              aria-expanded={isAddingLabel}
              aria-label={`Create ${labelSingular}`}
              className="rounded-md p-0.5 text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <PlusIcon className="size-3.5" />
            </button>
          }
        >
          {labelsHeading}
        </GroupHeading>
        <nav className="flex flex-col gap-px">
          {labels.map((label) => (
            <NavRow
              key={label.id}
              href={hrefFor({ kind: "label", labelId: label.id })}
              active={activeLabelId === label.id}
              icon={
                <span
                  className="size-2.5 shrink-0 rounded-full bg-muted-foreground/40"
                  style={
                    label.color ? { backgroundColor: label.color } : undefined
                  }
                />
              }
              name={label.name}
              count={displayCount(countsById.get(label.id))}
            />
          ))}
        </nav>

        {isAddingLabel && (
          <form onSubmit={submitNewLabel} className="flex gap-1.5 px-2.5 py-2">
            <Input
              value={newLabelName}
              onChange={(event) => setNewLabelName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setIsAddingLabel(false);
              }}
              placeholder={`${labelSingular} name`}
              aria-label={`New ${labelSingular} name`}
              autoFocus
              className="h-7 min-w-0 flex-1 px-2 text-xs"
            />
            <Button
              type="submit"
              variant="gradient"
              size="xs-2"
              disabled={!newLabelName.trim()}
            >
              Add
            </Button>
          </form>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenShortcuts}
        className="mt-2 flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-muted-foreground text-xs hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <KeyboardIcon className="size-3.5 shrink-0" />
        <span className="flex-1 text-left">Keyboard shortcuts</span>
        <Kbd>{getShortcutHint("help")}</Kbd>
      </button>
    </aside>
  );
}

function GroupHeading({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 pt-4 pb-1.5">
      <span className="flex-1 font-medium text-muted-foreground text-xs">
        {children}
      </span>
      {action}
    </div>
  );
}

function NavRow({
  href,
  active,
  icon,
  name,
  count,
  emphasizeCount,
}: {
  href: string;
  active: boolean;
  icon: ReactNode;
  name: string;
  count: number | null;
  emphasizeCount?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-background font-medium text-foreground shadow-sm ring-1 ring-border"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {icon}
      <span className="flex-1 truncate">{name}</span>
      {count !== null && (
        <span
          className={cn(
            "shrink-0 text-xs",
            emphasizeCount
              ? "rounded-full bg-primary/10 px-1.5 py-px font-medium text-primary"
              : "text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

/**
 * Drafts are never unread, so the only number worth showing there is the total.
 * A zero is noise, so it renders as nothing at all.
 */
function displayCount(count: MailCount | undefined): number | null {
  if (!count) return null;
  const value = count.id === "draft" ? count.total : count.unread;
  return value > 0 ? value : null;
}
