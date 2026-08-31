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
    viewport.addEventListener("change", verifyAccess);

    return () => viewport.removeEventListener("change", verifyAccess);
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
        />
      ) : null}
    </>
  );
}
