"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  getAppPageFromNavItem,
  getAppPageFromPathname,
  getAppPageProperties,
  PRODUCT_ANALYTICS_EVENTS,
  APP_PAGES,
} from "@/utils/analytics/product";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon | ((props: ComponentProps<"svg">) => React.ReactNode);
  target?: "_blank";
  count?: number;
  hideInMail?: boolean;
  active?: boolean;
  beta?: boolean;
  new?: boolean;
};

export function SideNavMenu({
  items,
  activeHref,
  nativeNavigation = false,
}: {
  items: NavItem[];
  activeHref: string;
  nativeNavigation?: boolean;
}) {
  const { closeMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const posthog = usePostHog();
  const currentAppPage = getAppPageFromPathname(pathname);

  return (
    <SidebarMenu>
      {items.map((item) => {
        const handleClick = () => {
          const destinationAppPage = getAppPageFromNavItem({
            name: item.name,
            href: item.href,
          });

          try {
            posthog.capture(PRODUCT_ANALYTICS_EVENTS.navigationClicked, {
              ...getAppPageProperties(currentAppPage),
              destination_page: destinationAppPage,
              destination_page_label: destinationAppPage
                ? APP_PAGES[destinationAppPage].label
                : undefined,
              nav_item: item.name,
              nav_href_type: getNavHrefType(item.href),
            });
          } catch {
            // Analytics must never prevent navigation.
          }
          closeMobileSidebar("left-sidebar");
        };
        const content = (
          <>
            <item.icon />
            <span>{item.name}</span>
            {item.new && (
              <Badge variant="green" className="ml-auto text-[10px]">
                New!
              </Badge>
            )}
            {item.beta && (
              <Badge variant="secondary" className="ml-auto text-[10px]">
                Beta
              </Badge>
            )}
          </>
        );

        return (
          <SidebarMenuItem key={item.name} className="font-semibold">
            <SidebarMenuButton
              asChild
              isActive={item.active || activeHref === item.href}
              className="h-9"
              tooltip={item.name}
              sidebarName="left-sidebar"
            >
              {nativeNavigation ? (
                <a href={item.href} onClick={handleClick}>
                  {content}
                </a>
              ) : (
                <Link href={item.href} onClick={handleClick}>
                  {content}
                </Link>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function getNavHrefType(href: string) {
  if (href.startsWith("?")) return "query";
  if (href.startsWith("http")) return "external";
  return "internal";
}
