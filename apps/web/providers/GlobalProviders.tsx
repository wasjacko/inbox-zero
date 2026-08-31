"use client";

import type React from "react";
import { useEffect } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SerwistProvider, useSerwist } from "@serwist/next/react";

export function GlobalProviders(props: { children: React.ReactNode }) {
  return (
    // Registers the service worker built by `serwist build`; the @serwist/next
    // webpack plugin used to inject this registration, but it doesn't support
    // Turbopack. cacheOnNavigation={false} matches the old plugin default.
    <SerwistProvider
      swUrl="/sw.js"
      register={false}
      cacheOnNavigation={false}
      reloadOnOnline={false}
      disable={process.env.NODE_ENV !== "production"}
    >
      <RegisterServiceWorker />
      <NuqsAdapter>{props.children}</NuqsAdapter>
    </SerwistProvider>
  );
}

// SerwistProvider's own register drops the promise, so the failures that come
// with crawlers, webviews and private browsing surface as unhandled rejections.
// The worker only precaches static build assets and the neutral offline shell,
// so swallowing registration failures is safe.
function RegisterServiceWorker() {
  const { serwist } = useSerwist();

  useEffect(() => {
    if (!serwist) return;

    let hasActiveController = Boolean(navigator.serviceWorker.controller);
    const handleControllerChange = () => {
      if (hasActiveController) {
        window.dispatchEvent(new Event("freescale:app-update-ready"));
        return;
      }

      // The first controller belongs to the initial install, not an update.
      hasActiveController = true;
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    );
    serwist?.register().catch(() => {});

    return () =>
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
  }, [serwist]);

  return null;
}
