"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hasPreviewOnboardingAccess } from "@/utils/preview-onboarding";

type GateState = "checking" | "allowed" | "redirecting";

const onboardingPath = "/onboarding";
const mobileViewportQuery = "(max-width: 1023px)";

export function PreviewOnboardingGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<GateState>(
    pathname === onboardingPath ? "allowed" : "checking",
  );

  useEffect(() => {
    if (pathname === onboardingPath) {
      setState("allowed");
      return;
    }

    const viewport = window.matchMedia(mobileViewportQuery);

    const verifyAccess = () => {
      if (!viewport.matches || hasPreviewOnboardingAccess(localStorage)) {
        setState("allowed");
        return;
      }

      setState("redirecting");
      router.replace(onboardingPath);
    };

    verifyAccess();
    // Older mobile Safari exposes the legacy MediaQueryList listener API only.
    // If the listener registration throws, the gate stays in `checking` and
    // the app appears as a completely blank page.
    const mediaQueryList = viewport as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };
    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", verifyAccess);
    } else {
      mediaQueryList.addListener?.(verifyAccess);
    }

    return () => {
      if (typeof mediaQueryList.removeEventListener === "function") {
        mediaQueryList.removeEventListener("change", verifyAccess);
      } else {
        mediaQueryList.removeListener?.(verifyAccess);
      }
    };
  }, [pathname, router]);

  return (
    <>
      <div
        aria-hidden={state !== "allowed" || undefined}
        className={state === "allowed" ? undefined : "hidden lg:contents"}
      >
        {children}
      </div>
      {state !== "allowed" ? (
        <div
          aria-label="Ouverture de l’onboarding"
          className="fixed inset-0 z-[200] bg-white lg:hidden dark:bg-slate-950"
          role="status"
        >
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500">
            Chargement de votre espace…
          </div>
        </div>
      ) : null}
    </>
  );
}
