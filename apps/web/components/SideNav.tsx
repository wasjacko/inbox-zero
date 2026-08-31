"use client";

import {
  AlertCircleIcon,
  ArchiveIcon,
  ArrowLeftIcon,
  BarChartBigIcon,
  Building2Icon,
  BrushIcon,
  ChevronsUpDownIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FileIcon,
  CircleHelpIcon,
  InboxIcon,
  LightbulbIcon,
  ListTodoIcon,
  LogOutIcon,
  type LucideIcon,
  MailsIcon,
  MessageSquareIcon,
  MessagesSquareIcon,
  MicIcon,
  PenIcon,
  PersonStandingIcon,
  RatioIcon,
  SendIcon,
  SettingsIcon,
  SparklesIcon,
  Users2Icon,
  CrownIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { LoadingContent } from "@/components/LoadingContent";
import { Logo } from "@/components/Logo";
import { NavUser } from "@/components/NavUser";
import { PremiumCard } from "@/components/PremiumCard";
import { SetupProgressCard } from "@/components/SetupProgressCard";
import { SideNavMenu } from "@/components/SideNavMenu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CommandShortcut } from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { toastSuccess } from "@/components/Toast";
import { signOut, useSession } from "@/utils/auth-client";
import { useSplitLabels } from "@/hooks/useLabels";
import {
  useCleanerEnabled,
  useMeetingRecorderEnabled,
} from "@/hooks/useFeatureFlags";
import { useComposeModal } from "@/providers/ComposeModalProvider";
import { useAccount } from "@/providers/EmailAccountProvider";
import type { EmailLabel } from "@/providers/email-label-types";
import { isGoogleProvider } from "@/utils/email/provider-types";
import { prefixPath } from "@/utils/path";
import { getEmailTerminology } from "@/utils/terminology";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon | (() => React.ReactNode);
  target?: "_blank";
  count?: number;
  hideInMail?: boolean;
  active?: boolean;
  beta?: boolean;
  new?: boolean;
};

const FREESCALE_LOGO_SRC =
  "data:image/png;base64,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";

export const FREESCALE_MENU_LOGO_SRC = FREESCALE_LOGO_SRC.replace(
  "Tolong",
  "Tlong",
);

export const useNavigation = (previewMode = false) => {
  const cleanerEnabled = useCleanerEnabled();
  const meetingRecorderEnabled = useMeetingRecorderEnabled();

  const { emailAccount, emailAccountId, provider } = useAccount();
  const currentEmailAccountId = emailAccount?.id || emailAccountId;
  const showCleaner = previewMode ? false : cleanerEnabled;
  const showMeetingRecorder = previewMode ? false : meetingRecorderEnabled;

  const manageItems: NavItem[] = useMemo(
    () => [
      {
        name: previewMode ? "Accueil IA" : "Chat",
        href: previewMode
          ? "/chat"
          : prefixPath(currentEmailAccountId, "/assistant"),
        icon: previewMode ? SparklesIcon : MessageSquareIcon,
      },
      ...(!previewMode
        ? [
            {
              name: "Assistant",
              href: prefixPath(currentEmailAccountId, "/automation"),
              icon: SparklesIcon,
            },
          ]
        : []),
      ...(previewMode
        ? [
            {
              name: "Canaux",
              href: "/channels-v4",
              icon: MessagesSquareIcon,
            },
          ]
        : [
            {
              name: "Canaux",
              href: prefixPath(currentEmailAccountId, "/channels"),
              icon: MessagesSquareIcon,
            },
          ]),
      {
        name: "Tâches",
        href: prefixPath(currentEmailAccountId, "/tasks"),
        icon: ListTodoIcon,
      },
      {
        name: "Relations clients",
        href: prefixPath(currentEmailAccountId, "/stats"),
        icon: BarChartBigIcon,
      },
      ...(showMeetingRecorder
        ? [
            {
              name: "Réunions",
              href: prefixPath(currentEmailAccountId, "/meetings"),
              icon: MicIcon,
              beta: true,
            },
          ]
        : []),
    ],
    [currentEmailAccountId, previewMode, showMeetingRecorder],
  );

  const cleanupItems: NavItem[] = useMemo(
    () => [
      {
        name: "Désabonnement",
        href: prefixPath(currentEmailAccountId, "/bulk-unsubscribe"),
        icon: MailsIcon,
      },
      {
        name: "Archivage",
        href: prefixPath(currentEmailAccountId, "/bulk-archive"),
        icon: ArchiveIcon,
      },
      ...(isGoogleProvider(provider) && showCleaner
        ? [
            {
              name: "Nettoyage avancé",
              href: prefixPath(currentEmailAccountId, "/clean"),
              icon: BrushIcon,
              beta: true,
            },
          ]
        : []),
    ],
    [currentEmailAccountId, provider, showCleaner],
  );

  return {
    homeHref: previewMode
      ? "/chat"
      : prefixPath(currentEmailAccountId, "/automation"),
    manageItems,
    cleanupItems,
  };
};

const topMailLinks: NavItem[] = [
  {
    name: "Boîte de réception",
    icon: InboxIcon,
    href: "?type=inbox",
  },
  {
    name: "Brouillons",
    icon: FileIcon,
    href: "?type=draft",
  },
  {
    name: "Envoyés",
    icon: SendIcon,
    href: "?type=sent",
  },
  {
    name: "Archivés",
    icon: ArchiveIcon,
    href: "?type=archive",
  },
];

const bottomMailLinks: NavItem[] = [
  {
    name: "Personnel",
    icon: PersonStandingIcon,
    href: "?type=CATEGORY_PERSONAL",
  },
  {
    name: "Réseaux sociaux",
    icon: Users2Icon,
    href: "?type=CATEGORY_SOCIAL",
  },
  {
    name: "Mises à jour",
    icon: AlertCircleIcon,
    href: "?type=CATEGORY_UPDATES",
  },
  {
    name: "Forums",
    icon: MessagesSquareIcon,
    href: "?type=CATEGORY_FORUMS",
  },
  {
    name: "Promotions",
    icon: RatioIcon,
    href: "?type=CATEGORY_PROMOTIONS",
  },
];

export function SideNav({
  previewMode = false,
  ...props
}: React.ComponentProps<typeof Sidebar> & { previewMode?: boolean }) {
  const navigation = useNavigation(previewMode);
  const path = usePathname();
  const showMailNav = path.includes("/compose");

  const visibleBottomLinks = useMemo(
    () =>
      showMailNav
        ? [
            {
              name: "Retour",
              href: "/automation",
              icon: ArrowLeftIcon,
            },
          ]
        : [],
    [showMailNav],
  );

  const { state } = useSidebar();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="gap-0 pb-0">
        {state.includes("left-sidebar") ? (
          <div className="flex items-center rounded-md pl-2 pr-0.5 py-3 text-foreground justify-between">
            <Link href={navigation.homeHref}>
              {previewMode ? (
                <Image
                  src={FREESCALE_MENU_LOGO_SRC}
                  alt="Freescale"
                  width={592}
                  height={102}
                  className="h-5 w-auto dark:brightness-0 dark:invert"
                  priority
                  unoptimized
                />
              ) : (
                <Logo className="h-3.5" />
              )}
            </Link>
            <SidebarTrigger name="left-sidebar" />
          </div>
        ) : (
          <div className="pb-2">
            <SidebarTrigger name="left-sidebar" />
          </div>
        )}
        {!previewMode && <AccountSwitcher />}
      </SidebarHeader>

      <SidebarContent>
        {state.includes("left-sidebar") ? (
          <SetupProgressCard
            previewProgress={
              previewMode ? { completed: 0, total: 4 } : undefined
            }
          />
        ) : null}

        <SidebarGroupContent>
          {showMailNav ? (
            <MailNav path={path} />
          ) : (
            <>
              <SidebarGroup>
                <SidebarGroupLabel>Gérer</SidebarGroupLabel>
                <SideNavMenu items={navigation.manageItems} activeHref={path} />
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel>Nettoyage</SidebarGroupLabel>
                <SideNavMenu
                  items={navigation.cleanupItems}
                  activeHref={path}
                />
              </SidebarGroup>
            </>
          )}
        </SidebarGroupContent>
      </SidebarContent>

      {!previewMode ? (
        <PremiumCard isCollapsed={!state.includes("left-sidebar")} />
      ) : null}

      <SidebarFooter className="pb-4">
        <SideNavMenu items={visibleBottomLinks} activeHref={path} />

        <SidebarMenu>
          <SidebarMenuItem>
            {previewMode ? (
              <SidebarMenuButton
                asChild
                className="h-9 font-semibold"
                sidebarName="left-sidebar"
                tooltip="Aide & support"
              >
                <Link href="/help">
                  <CircleHelpIcon />
                  <span>Aide & support</span>
                </Link>
              </SidebarMenuButton>
            ) : (
              <FeedbackDialog />
            )}
          </SidebarMenuItem>
        </SidebarMenu>

        {previewMode ? <PreviewAccount placement="footer" /> : <NavUser />}
      </SidebarFooter>
    </Sidebar>
  );
}

function PreviewAccount({ placement }: { placement: "header" | "footer" }) {
  const isFooter = placement === "footer";
  const { closeMobileSidebar, isMobile, state } = useSidebar();
  const router = useRouter();
  const { data: session } = useSession();
  const isExpandedSidebar = state.includes("left-sidebar");
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const displayName = session?.user.name?.trim() || "Mon compte";
  const displayEmail = session?.user.email || "";
  const initial = displayName.charAt(0).toLocaleUpperCase("fr") || "M";

  const handleSignOut = async () => {
    closeMobileSidebar("left-sidebar");
    await signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                sidebarName="left-sidebar"
                size="lg"
              >
                <Avatar className={isFooter ? "size-8 rounded-lg" : "size-10"}>
                  <AvatarFallback
                    className={
                      isFooter
                        ? "rounded-lg bg-[#c9340b] text-white"
                        : "bg-[#c9340b] text-lg text-white"
                    }
                  >
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span
                    className={
                      isFooter
                        ? "truncate font-medium"
                        : "truncate font-semibold"
                    }
                  >
                    {displayName}
                  </span>
                  <span className="truncate text-muted-foreground text-xs">
                    {displayEmail}
                  </span>
                </div>
                <ChevronsUpDownIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isExpandedSidebar ? "start" : "end"}
              className="min-w-52 rounded-md md:data-[side=top]:w-[--radix-dropdown-menu-trigger-width]"
              side={isMobile ? "bottom" : isExpandedSidebar ? "top" : "right"}
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <PreviewAccountMenuLink href="/settings" icon={SettingsIcon}>
                  Paramètres
                </PreviewAccountMenuLink>
                <PreviewAccountMenuLink
                  href="/organization"
                  icon={Building2Icon}
                >
                  Organisation
                </PreviewAccountMenuLink>
                <PreviewAccountMenuLink href="/premium" icon={CrownIcon}>
                  Plan
                </PreviewAccountMenuLink>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setSuggestionOpen(true)}>
                  <LightbulbIcon className="mr-2 size-4" />
                  Suggestions de fonctionnalités
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  handleSignOut().catch(() => undefined);
                }}
              >
                <LogOutIcon className="mr-2 size-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      {suggestionOpen && (
        <Dialog open={suggestionOpen} onOpenChange={setSuggestionOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Proposer une fonctionnalité</DialogTitle>
              <DialogDescription>
                Quelle amélioration rendrait Freescale plus utile pour vous ?
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={suggestion}
              onChange={(event) => setSuggestion(event.target.value)}
              placeholder="Décrivez votre idée en quelques mots…"
              className="min-h-28 resize-none transition-colors focus-visible:border-blue-400 focus-visible:ring-0 focus-visible:ring-offset-0 dark:focus-visible:border-blue-600"
              autoFocus
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSuggestionOpen(false)}
              >
                Annuler
              </Button>
              <Button
                disabled={!suggestion.trim()}
                onClick={() => {
                  toastSuccess({
                    description: "Merci, votre suggestion a bien été envoyée.",
                  });
                  setSuggestion("");
                  setSuggestionOpen(false);
                }}
              >
                Envoyer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );

  function PreviewAccountMenuLink({
    children,
    href,
    icon: Icon,
  }: {
    children: React.ReactNode;
    href: string;
    icon: LucideIcon;
  }) {
    return (
      <DropdownMenuItem asChild>
        <Link href={href} onClick={() => closeMobileSidebar("left-sidebar")}>
          <Icon className="mr-2 size-4" />
          {children}
        </Link>
      </DropdownMenuItem>
    );
  }
}

function MailNav({ path }: { path: string }) {
  const { onOpen } = useComposeModal();
  const [showHiddenLabels, setShowHiddenLabels] = useState(false);
  const { visibleLabels, hiddenLabels, isLoading } = useSplitLabels();
  const { provider } = useAccount();
  const terminology = getEmailTerminology(provider);

  const [currentType] = useQueryState("type");
  const [currentLabelId] = useQueryState("labelId");
  // The mail page defaults to the inbox when no type is selected
  const activeType = currentLabelId ? null : (currentType ?? "inbox");

  const labelNavItems = useMemo(
    () => visibleLabels.map((label) => labelToNavItem(label, currentLabelId)),
    [visibleLabels, currentLabelId],
  );

  const hiddenLabelNavItems = useMemo(
    () => hiddenLabels.map((label) => labelToNavItem(label, currentLabelId)),
    [hiddenLabels, currentLabelId],
  );

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-9 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              onClick={onOpen}
              sidebarName="left-sidebar"
            >
              <PenIcon className="size-4" />
              <span className="truncate font-semibold">Nouveau message</span>
              <CommandShortcut>C</CommandShortcut>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SideNavMenu
          items={markActiveType(topMailLinks, activeType)}
          activeHref={path}
        />
      </SidebarGroup>
      {isGoogleProvider(provider) && (
        <SidebarGroup>
          <SidebarGroupLabel>Catégories</SidebarGroupLabel>
          <SideNavMenu
            items={markActiveType(bottomMailLinks, activeType)}
            activeHref={path}
          />
        </SidebarGroup>
      )}

      <SidebarGroup>
        <SidebarGroupLabel>
          {terminology.label.pluralCapitalized}
        </SidebarGroupLabel>
        <LoadingContent loading={isLoading}>
          {visibleLabels.length > 0 ? (
            <SideNavMenu items={labelNavItems} activeHref={path} />
          ) : (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Aucun {terminology.label.plural}
            </div>
          )}

          {/* Hidden labels toggle */}
          {hiddenLabels.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowHiddenLabels(!showHiddenLabels)}
                className="flex w-full items-center px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {showHiddenLabels ? (
                  <ChevronDownIcon className="mr-1 size-4" />
                ) : (
                  <ChevronRightIcon className="mr-1 size-4" />
                )}
                <span>Plus</span>
              </button>

              {showHiddenLabels && (
                <SideNavMenu items={hiddenLabelNavItems} activeHref={path} />
              )}
            </>
          )}
        </LoadingContent>
      </SidebarGroup>
    </>
  );
}

function markActiveType(items: NavItem[], activeType: string | null) {
  return items.map((item) => ({
    ...item,
    active: item.href === `?type=${activeType}`,
  }));
}

function labelToNavItem(
  label: EmailLabel,
  currentLabelId: string | null,
): NavItem {
  return {
    name: label.name,
    icon: () => (
      <span
        className="size-2.5 shrink-0 rounded-full"
        // Match Gmail/Outlook: labels without an assigned color are gray
        style={{
          backgroundColor: label.color?.backgroundColor || "#9CA3AF",
        }}
      />
    ),
    href: `?type=label&labelId=${encodeURIComponent(label.id)}`,
    active: currentLabelId === label.id,
  };
}
