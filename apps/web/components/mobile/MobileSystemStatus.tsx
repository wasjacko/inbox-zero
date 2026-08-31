"use client";

import {
  CheckCircle2Icon,
  RefreshCwIcon,
  WifiOffIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils";

type ConnectionState = "online" | "offline" | "restored";

export function MobileSystemStatus({
  onReload = () => window.location.reload(),
}: {
  onReload?: () => void;
}) {
  const [connection, setConnection] = useState<ConnectionState>("online");
  const [updateReady, setUpdateReady] = useState(false);
  const restoredTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    setConnection(navigator.onLine ? "online" : "offline");

    const handleOffline = () => {
      if (restoredTimer.current) clearTimeout(restoredTimer.current);
      setConnection("offline");
    };
    const handleOnline = () => {
      setConnection("restored");
      restoredTimer.current = setTimeout(() => setConnection("online"), 2600);
    };
    const handleUpdateReady = () => setUpdateReady(true);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("freescale:app-update-ready", handleUpdateReady);
    return () => {
      if (restoredTimer.current) clearTimeout(restoredTimer.current);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener(
        "freescale:app-update-ready",
        handleUpdateReady,
      );
    };
  }, []);

  const offline = connection === "offline";
  const showUpdate = !offline && updateReady;
  const showRestored = !offline && !updateReady && connection === "restored";

  if (!offline && !showUpdate && !showRestored) return null;

  return (
    <div
      aria-live="polite"
      className="mobile-safe-x-sm fixed inset-x-0 top-[calc(var(--mobile-safe-top)+var(--mobile-topbar-height)+.5rem)] z-[60] animate-in fade-in slide-in-from-top-2 duration-200 lg:hidden motion-reduce:animate-none"
      role="status"
    >
      <div
        className={cn(
          "mx-auto flex min-h-11 max-w-lg items-center gap-2.5 rounded-2xl border p-2 pl-3 text-sm shadow-xl backdrop-blur",
          offline &&
            "border-amber-200 bg-amber-50/95 text-amber-950 dark:border-amber-900 dark:bg-amber-950/95 dark:text-amber-100",
          showRestored &&
            "border-emerald-200 bg-emerald-50/95 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/95 dark:text-emerald-100",
          showUpdate && "border-border/80 bg-background/95",
        )}
      >
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl",
            showUpdate && "bg-primary/10 text-primary",
          )}
        >
          {offline ? (
            <WifiOffIcon aria-hidden="true" className="size-4" />
          ) : showUpdate ? (
            <RefreshCwIcon aria-hidden="true" className="size-4" />
          ) : (
            <CheckCircle2Icon aria-hidden="true" className="size-4" />
          )}
        </span>

        <span className="min-w-0 flex-1 leading-5">
          {offline ? (
            "Hors ligne. Certaines actions sont temporairement indisponibles."
          ) : showUpdate ? (
            <>
              <span className="block font-medium">Freescale a évolué</span>
              <span className="block truncate text-muted-foreground text-xs">
                Actualisez pour utiliser la nouvelle version.
              </span>
            </>
          ) : (
            "Connexion rétablie."
          )}
        </span>

        {showUpdate ? (
          <>
            <button
              className="mobile-touch-target shrink-0 rounded-xl bg-primary px-3 font-medium text-primary-foreground text-sm active:scale-[.98]"
              onClick={onReload}
              type="button"
            >
              Actualiser
            </button>
            <button
              aria-label="Ignorer cette mise à jour"
              className="mobile-touch-target grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground active:bg-muted"
              onClick={() => setUpdateReady(false)}
              type="button"
            >
              <XIcon aria-hidden="true" className="size-4" />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
