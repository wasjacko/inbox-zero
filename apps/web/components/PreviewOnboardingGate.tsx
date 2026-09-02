"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  grantPreviewOnboardingAccess,
  hasPreviewOnboardingAccess,
} from "@/utils/preview-onboarding";
import { useAccount } from "@/providers/EmailAccountProvider";

type GateState = "allowed" | "redirecting";

const onboardingPath = "/onboarding";
const mobileViewportQuery = "(max-width: 1023px)";

export function PreviewOnboardingGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { emailAccount, isLoading: isAccountLoading } = useAccount();
  // Render the app immediately. Starting in a hidden `checking` state means
  // mobile users only see a blank screen until the whole client bundle has
  // hydrated, which is especially painful after returning from Google OAuth.
  const [state, setState] = useState<GateState>("allowed");

  useEffect(() => {
    if (pathname === onboardingPath) {
      setState("allowed");
      return;
    }

    const viewport = window.matchMedia(mobileViewportQuery);

    const verifyAccess = () => {
      const params = new URLSearchParams(window.location.search);
      const returningExistingAccount =
        params.get("notice") === "existing-account";
      const oauthSuccess = [
        "account_created_and_linked",
        "tokens_updated",
        "account_merged",
      ].includes(params.get("success") ?? "");

      // A real mailbox already attached to the authenticated user is the
      // authoritative signal that this is an existing workspace. Never gate
      // it behind browser-local onboarding state.
      if (emailAccount) {
        try {
          grantPreviewOnboardingAccess(localStorage, "completed");
        } catch {
          // Server account state remains authoritative when storage is blocked.
        }
        setState("allowed");
        return;
      }

      // Keep the already-rendered app visible while account state resolves.
      if (isAccountLoading) {
        setState("allowed");
        return;
      }

      if (oauthSuccess || returningExistingAccount) {
        try {
          grantPreviewOnboardingAccess(localStorage, "completed");
        } catch {
          // Storage can be unavailable in private/in-app mobile browsers. The
          // successful OAuth callback is sufficient proof for this visit.
        }
        setState("allowed");
        return;
      }

      let hasAccess = false;
      try {
        hasAccess = hasPreviewOnboardingAccess(localStorage);
      } catch {
        // Keep the authenticated app usable when mobile storage is blocked.
        hasAccess = true;
      }

      if (!viewport.matches || hasAccess) {
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
  }, [emailAccount, isAccountLoading, pathname, router]);

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
