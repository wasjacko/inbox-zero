"use client";

import {
  ArchiveIcon,
  BarChart3Icon,
  Building2Icon,
  CalendarDaysIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  CrownIcon,
  HomeIcon,
  ListTodoIcon,
  LogOutIcon,
  MenuIcon,
  MessagesSquareIcon,
  SearchIcon,
  SettingsIcon,
  WorkflowIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MueIcon } from "@/components/MueIcon";
import { Gmail } from "@/components/new-landing/icons/Gmail";
import { Outlook } from "@/components/new-landing/icons/Outlook";
import { MobileSystemStatus } from "@/components/mobile/MobileSystemStatus";
import {
  MobileBottomBar,
  MobileBottomBarItem,
  MobileSheet,
  MobileTopBar,
} from "@/components/mobile/MobilePrimitives";
import { MobileMueSheet } from "@/components/mobile/MobileMueSheet";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_PREVIEW_WORKSPACE_NAME,
  PREVIEW_WORKSPACE_NAME_EVENT,
  PREVIEW_WORKSPACE_NAME_KEY,
} from "@/utils/preview-workspace";
import { cn } from "@/utils";
import { signOut } from "@/utils/auth-client";
import { usePreviewConnectedChannels } from "@/hooks/usePreviewConnectedChannels";

const pageTitles = [
  { path: "/chat", title: "Accueil IA" },
  { path: "/channels-v4", title: "Canaux" },
  { path: "/tasks", title: "Tâches" },
  { path: "/stats", title: "Relations clients" },
  { path: "/bulk-unsubscribe", title: "Désabonnement" },
  { path: "/bulk-archive", title: "Archivage" },
  { path: "/organization", title: "Organisation" },
  { path: "/settings", title: "Paramètres" },
  { path: "/premium", title: "Plan" },
  { path: "/help", title: "Centre d’aide" },
  { path: "/drive", title: "Documents" },
  { path: "/integrations", title: "Intégrations" },
  { path: "/calendars", title: "Calendriers" },
  { path: "/briefs", title: "Briefs" },
  { path: "/automation", title: "Automatisations" },
] as const;

const moreSections = [
  {
    label: "Suivi",
    items: [
      {
        label: "Relations clients",
        href: "/stats",
        Icon: BarChart3Icon,
      },
    ],
  },
  {
    label: "Outils",
    items: [
      {
        label: "Calendriers",
        href: "/calendars",
        Icon: CalendarDaysIcon,
      },
      {
        label: "Automatisations",
        href: "/automation",
        Icon: WorkflowIcon,
      },
    ],
  },
  {
    label: "Nettoyage",
    items: [
      {
        label: "Désabonnement",
        href: "/bulk-unsubscribe",
        Icon: MessagesSquareIcon,
      },
      { label: "Archivage", href: "/bulk-archive", Icon: ArchiveIcon },
    ],
  },
] as const;

const morePaths = new Set<string>(
  moreSections.flatMap(({ items }) => items.map(({ href }) => href)),
);

export function MobileAppNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const mueButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const workspaceButtonRef = useRef<HTMLButtonElement>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [mueOpen, setMueOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const connectedChannels = usePreviewConnectedChannels();
  const [workspaceName, setWorkspaceName] = useState(
    DEFAULT_PREVIEW_WORKSPACE_NAME,
  );

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setWorkspaceOpen(false);
    router.replace("/login");
    router.refresh();
  };

  useEffect(() => {
    setWorkspaceName(
      window.localStorage.getItem(PREVIEW_WORKSPACE_NAME_KEY) ??
        DEFAULT_PREVIEW_WORKSPACE_NAME,
    );
    const handleWorkspaceName = (event: Event) =>
      setWorkspaceName((event as CustomEvent<string>).detail);
    window.addEventListener(PREVIEW_WORKSPACE_NAME_EVENT, handleWorkspaceName);
    return () =>
      window.removeEventListener(
        PREVIEW_WORKSPACE_NAME_EVENT,
        handleWorkspaceName,
      );
  }, []);

  useEffect(() => {
    const restoreSearchFocus = () => {
      if (window.matchMedia("(max-width: 1023px)").matches) {
        searchButtonRef.current?.focus();
      }
    };
    window.addEventListener(
      "freescale:focus-search-trigger",
      restoreSearchFocus,
    );
    return () =>
      window.removeEventListener(
        "freescale:focus-search-trigger",
        restoreSearchFocus,
      );
  }, []);

  const pageTitle =
    pageTitles.find(({ path }) => pathname === path)?.title ?? "Freescale";
  const plusActive = morePaths.has(pathname);
  const restoreFocusAfterClose = (
    nextOpen: boolean,
    trigger: React.RefObject<HTMLButtonElement | null>,
  ) => {
    if (!nextOpen) window.setTimeout(() => trigger.current?.focus(), 0);
  };

  return (
    <>
      <a
        className="mobile-safe-top fixed left-3 top-0 z-[70] flex min-h-11 -translate-y-full items-center rounded-b-xl bg-foreground px-4 py-2 font-semibold text-background text-sm transition-transform duration-150 focus:translate-y-0 lg:hidden motion-reduce:transition-none"
        data-mobile-skip-link
        href="#mobile-main-content"
      >
        Aller au contenu
      </a>
      <p aria-live="polite" className="sr-only" role="status">
        Page {pageTitle}
      </p>
      <MobileSystemStatus />
      <MobileTopBar
        leading={
          <button
            aria-label={`Ouvrir les réglages de ${workspaceName}`}
            className="mobile-touch-target flex max-w-full items-center gap-2 rounded-xl px-1.5 text-left active:bg-muted"
            onClick={() => setWorkspaceOpen(true)}
            ref={workspaceButtonRef}
            type="button"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-teal-600 font-semibold text-white text-xs">
              {workspaceName.charAt(0).toLocaleUpperCase("fr") || "W"}
            </span>
          </button>
        }
        title={pageTitle}
        trailing={
          <>
            <Button
              aria-label="Rechercher dans Freescale"
              className="mobile-touch-target size-11 rounded-full"
              onClick={() =>
                window.dispatchEvent(new Event("freescale:open-command-center"))
              }
              size="icon"
              ref={searchButtonRef}
              variant="ghost"
            >
              <SearchIcon className="size-5" />
            </Button>
            <Button
              aria-label="Ouvrir Mue"
              className="mobile-touch-target size-11 rounded-full"
              onClick={() => setMueOpen(true)}
              ref={mueButtonRef}
              size="icon"
              variant="ghost"
            >
              <MueIcon size="md" />
            </Button>
          </>
        }
      />

      <MobileBottomBar>
        <MobileBottomBarItem
          active={pathname === "/chat"}
          href="/chat"
          icon={<HomeIcon className="size-5" />}
          label="Accueil"
        />
        <MobileBottomBarItem
          active={pathname === "/channels-v4"}
          href="/channels-v4"
          icon={<MessagesSquareIcon className="size-5" />}
          label="Canaux"
          onClick={() => router.push("/channels-v4")}
        />
        <MobileBottomBarItem
          active={pathname === "/tasks"}
          href="/tasks"
          icon={<ListTodoIcon className="size-5" />}
          label="Tâches"
          onClick={() => router.push("/tasks")}
        />
        <MobileBottomBarItem
          active={plusActive}
          buttonRef={moreButtonRef}
          icon={<MenuIcon className="size-5" />}
          label="Plus"
          onClick={() => setMoreOpen(true)}
        />
      </MobileBottomBar>

      <MobileMueSheet
        onOpenChange={(nextOpen) => {
          setMueOpen(nextOpen);
          restoreFocusAfterClose(nextOpen, mueButtonRef);
        }}
        open={mueOpen}
        pathname={pathname}
      />

      <MobileSheet
        description="Les outils utiles au quotidien."
        onOpenChange={(nextOpen) => {
          setMoreOpen(nextOpen);
          restoreFocusAfterClose(nextOpen, moreButtonRef);
        }}
        open={moreOpen}
        title="Plus"
      >
        <div className="space-y-5 pb-2">
          {moreSections.map(({ label, items }) => (
            <section key={label}>
              <h2 className="mb-1 px-1 font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
                {label}
              </h2>
              <div className="overflow-hidden rounded-2xl border bg-card">
                {items.map(({ label: itemLabel, href, Icon }, index) => (
                  <MobileNavigationRow
                    active={pathname === href}
                    href={href}
                    Icon={Icon}
                    key={href}
                    label={itemLabel}
                    last={index === items.length - 1}
                    onNavigate={() => setMoreOpen(false)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </MobileSheet>

      <MobileSheet
        description="Votre espace de travail actuel."
        onOpenChange={(nextOpen) => {
          setWorkspaceOpen(nextOpen);
          restoreFocusAfterClose(nextOpen, workspaceButtonRef);
        }}
        open={workspaceOpen}
        title={workspaceName}
      >
        <div className="space-y-5 pb-2">
          <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-600 font-semibold text-white">
              {workspaceName.charAt(0).toLocaleUpperCase("fr") || "W"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{workspaceName}</p>
              <p className="text-muted-foreground text-xs">Espace actuel</p>
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <p className="font-medium text-sm">Canaux connectés</p>
            {connectedChannels?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {connectedChannels.map((channel) => (
                  <span
                    className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm"
                    key={channel}
                  >
                    {channel === "gmail" ? (
                      <Gmail height={18} width={18} />
                    ) : (
                      <Outlook height={18} width={18} />
                    )}
                    {channel === "gmail" ? "Gmail" : "Outlook"}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-muted-foreground text-xs">
                Aucun canal connecté
              </p>
            )}
          </div>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <MobileNavigationRow
              href="/organization"
              Icon={Building2Icon}
              label="Gérer l’espace"
              onNavigate={() => setWorkspaceOpen(false)}
            />
            <MobileNavigationRow
              href="/settings"
              Icon={SettingsIcon}
              label="Paramètres"
              onNavigate={() => setWorkspaceOpen(false)}
            />
            <MobileNavigationRow
              href="/premium"
              Icon={CrownIcon}
              label="Gérer le plan"
              last
              onNavigate={() => setWorkspaceOpen(false)}
            />
          </div>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <MobileNavigationRow
              href="/help"
              Icon={CircleHelpIcon}
              label="Aide et support"
              onNavigate={() => setWorkspaceOpen(false)}
            />
            <button
              className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-red-600 transition-colors active:bg-muted disabled:opacity-60 dark:text-red-400"
              disabled={signingOut}
              onClick={() => handleSignOut().catch(() => undefined)}
              type="button"
            >
              <LogOutIcon className="size-5 shrink-0" />
              <span className="min-w-0 flex-1 font-medium text-sm">
                {signingOut ? "Déconnexion…" : "Déconnexion"}
              </span>
            </button>
          </div>
        </div>
      </MobileSheet>
    </>
  );
}

function MobileNavigationRow({
  href,
  Icon,
  label,
  active = false,
  destructive = false,
  last = false,
  onNavigate,
}: {
  href: string;
  Icon: typeof HomeIcon;
  label: string;
  active?: boolean;
  destructive?: boolean;
  last?: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-14 items-center gap-3 px-4 transition-colors active:bg-muted",
        !last && "border-b",
        active &&
          "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
        destructive && "text-red-600 dark:text-red-400",
      )}
      href={href}
      onClick={onNavigate}
    >
      <Icon className="size-5 shrink-0" />
      <span className="min-w-0 flex-1 font-medium text-sm">{label}</span>
      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
