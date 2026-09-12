"use client";

import type { ComponentProps, ReactNode, Ref } from "react";
import { AlertCircleIcon, ChevronLeftIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/utils";

export function MobileOnly({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("lg:hidden", className)} {...props} />;
}

export function MobileTopBar({
  title,
  leading,
  trailing,
  className,
}: {
  title: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "mobile-safe-top fixed inset-x-0 top-0 z-40 border-b border-border/80 bg-background/92 backdrop-blur lg:hidden motion-reduce:transition-none",
        className,
      )}
    >
      <div className="mobile-safe-x-sm grid h-[var(--mobile-topbar-height)] grid-cols-[minmax(44px,1fr)_minmax(0,2fr)_minmax(44px,1fr)] items-center gap-2 max-[359px]:grid-cols-[44px_minmax(0,1fr)_88px]">
        <div className="flex min-w-0 justify-start">{leading}</div>
        <h1 className="truncate text-center font-semibold text-sm max-[359px]:sr-only">
          {title}
        </h1>
        <div className="flex min-w-0 justify-end gap-1">{trailing}</div>
      </div>
    </header>
  );
}

export function MobileBackButton({
  label = "Retour",
  onClick,
}: {
  label?: string;
  onClick: () => void;
}) {
  return (
    <Button
      aria-label={label}
      className="mobile-touch-target size-11 rounded-full"
      onClick={onClick}
      size="icon"
      variant="ghost"
    >
      <ChevronLeftIcon className="size-5" />
    </Button>
  );
}

export function MobileBottomBar({
  children,
  className,
  label = "Navigation principale",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={cn(
        "mobile-safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/94 backdrop-blur lg:hidden motion-reduce:transition-none",
        className,
      )}
    >
      <div className="mobile-safe-x-xs mx-auto grid h-[var(--mobile-bottombar-height)] max-w-lg grid-flow-col auto-cols-fr items-stretch">
        {children}
      </div>
    </nav>
  );
}

export function MobileBottomBarItem({
  active = false,
  icon,
  label,
  badge,
  buttonRef,
  className,
  href,
  onClick,
}: {
  active?: boolean;
  icon: ReactNode;
  label: string;
  badge?: string | number;
  buttonRef?: Ref<HTMLButtonElement>;
  className?: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="relative grid size-6 place-items-center">
        {icon}
        {badge !== undefined ? (
          <span className="absolute -right-2 -top-1 min-w-4 rounded-full bg-blue-600 px-1 text-center font-semibold text-[9px] text-white leading-4">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="max-w-full text-center leading-tight">{label}</span>
    </>
  );
  const itemClassName = cn(
    "relative flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-1 font-medium text-[10px] text-muted-foreground transition-colors duration-150 active:bg-muted motion-reduce:transition-none",
    active && "text-foreground",
    className,
  );

  if (href) {
    return (
      <Link
        aria-current={active ? "page" : undefined}
        className={itemClassName}
        href={href}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      aria-current={active ? "page" : undefined}
      className={itemClassName}
      onClick={onClick}
      ref={buttonRef}
      type="button"
    >
      {content}
    </button>
  );
}

export function MobileSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className={cn(
          "max-h-[92dvh] w-full max-w-none gap-0 overflow-hidden rounded-t-[var(--mobile-sheet-radius)] border-x-0 p-0 ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:duration-200 data-[state=open]:duration-300 lg:hidden motion-reduce:transition-none motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none [&>button]:hidden",
          className,
        )}
        side="bottom"
      >
        <span
          aria-hidden="true"
          className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/25"
        />
        <SheetHeader className="mobile-safe-x border-b pb-4 pt-3 text-left">
          <div className="flex min-h-11 items-start gap-3">
            <div className="min-w-0 flex-1 pt-1">
              <SheetTitle>{title}</SheetTitle>
              {description ? (
                <SheetDescription className="mt-1.5">
                  {description}
                </SheetDescription>
              ) : null}
            </div>
            <Button
              aria-label={`Fermer ${title}`}
              className="mobile-touch-target -mr-2 size-11 shrink-0 rounded-full"
              onClick={() => onOpenChange(false)}
              size="icon"
              variant="ghost"
            >
              <XIcon className="size-5" />
            </Button>
          </div>
        </SheetHeader>
        <div className="mobile-safe-x min-h-0 flex-1 overflow-y-auto overscroll-contain py-4">
          {children}
        </div>
        {footer ? (
          <div className="mobile-safe-bottom mobile-safe-x shrink-0 border-t bg-background py-3">
            {footer}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function MobileFullScreenDialog({
  open,
  onOpenChange,
  title,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="inset-0 flex h-dvh w-screen max-w-none flex-col gap-0 border-0 p-0 ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:duration-200 data-[state=open]:duration-250 lg:hidden motion-reduce:transition-none motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none [&>button]:hidden"
        side="right"
      >
        <MobileTopBar
          leading={
            <Button
              aria-label="Fermer"
              className="mobile-touch-target size-11 rounded-full"
              onClick={() => onOpenChange(false)}
              size="icon"
              variant="ghost"
            >
              <XIcon className="size-5" />
            </Button>
          }
          title={title}
        />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-[calc(var(--mobile-safe-top)+var(--mobile-topbar-height))]">
          {children}
        </div>
        {footer ? (
          <div className="mobile-safe-bottom mobile-safe-x shrink-0 border-t bg-background py-3">
            {footer}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function MobilePageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mobile-safe-x pb-4 pt-5 lg:hidden", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-balance font-semibold text-2xl tracking-tight">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 text-muted-foreground text-sm leading-5">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

export function MobileFilterBar({
  children,
  className,
  label = "Filtres",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      aria-label={label}
      className={cn(
        "scrollbar-none flex snap-x gap-2 overflow-x-auto px-5 pb-3 lg:hidden",
        className,
      )}
      role="group"
    >
      {children}
    </div>
  );
}

export function MobileActionBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mobile-safe-bottom fixed inset-x-0 bottom-0 z-50 border-t bg-background/96 px-4 py-3 shadow-[0_-12px_30px_-20px_rgba(15,23,42,0.35)] backdrop-blur lg:hidden",
        className,
      )}
    >
      <div className="mx-auto flex max-w-lg items-center gap-2">{children}</div>
    </div>
  );
}

export function MobileListItem({
  leading,
  title,
  description,
  meta,
  trailing,
  className,
  ...props
}: ComponentProps<"button"> & {
  leading?: ReactNode;
  title: string;
  description?: string;
  meta?: string;
  trailing?: ReactNode;
}) {
  return (
    <button
      className={cn(
        "flex min-h-16 w-full items-center gap-3 px-5 py-3 text-left transition-colors duration-150 active:bg-muted/70 lg:hidden motion-reduce:transition-none",
        className,
      )}
      type="button"
      {...props}
    >
      {leading ? <span className="shrink-0">{leading}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-medium text-sm">{title}</span>
          {meta ? (
            <span className="shrink-0 text-muted-foreground text-xs">
              {meta}
            </span>
          ) : null}
        </span>
        {description ? (
          <span className="mt-0.5 line-clamp-2 block text-muted-foreground text-xs leading-5">
            {description}
          </span>
        ) : null}
      </span>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </button>
  );
}

export function MobileEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center lg:hidden",
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        {icon}
      </span>
      <h2 className="mt-4 font-semibold text-sm">{title}</h2>
      <p className="mt-1.5 max-w-xs text-muted-foreground text-sm leading-5">
        <span className="break-words">{description}</span>
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function MobileErrorState({
  title = "Impossible de charger ce contenu",
  description = "Vérifiez votre connexion, puis réessayez.",
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <MobileEmptyState
      action={action}
      className={className}
      description={description}
      icon={<AlertCircleIcon className="size-5" />}
      title={title}
    />
  );
}

export function MobileSkeleton({
  rows = 4,
  className,
  label = "Chargement du contenu",
}: {
  rows?: number;
  className?: string;
  label?: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className={cn("space-y-3 lg:hidden", className)}
      role="status"
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div
          className="flex min-h-20 animate-pulse items-center gap-3 rounded-2xl border bg-card px-4 motion-reduce:animate-none"
          key={`mobile-skeleton-${index.toString()}`}
        >
          <span className="size-10 shrink-0 rounded-xl bg-muted" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-3 w-2/5 rounded-full bg-muted" />
            <span className="block h-2.5 w-4/5 rounded-full bg-muted" />
          </span>
        </div>
      ))}
    </div>
  );
}
