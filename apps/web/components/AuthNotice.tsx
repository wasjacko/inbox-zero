"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toastSuccess } from "@/components/Toast";

export function AuthNotice() {
  const searchParams = useSearchParams();
  const shownNotice = useRef<string | null>(null);
  const notice = searchParams.get("notice");

  useEffect(() => {
    if (notice !== "existing-account" || shownNotice.current === notice) {
      return;
    }

    shownNotice.current = notice;
    toastSuccess({
      title: "Compte déjà existant",
      description: "Nous vous avons connecté à votre compte Freescale.",
    });

    const url = new URL(window.location.href);
    url.searchParams.delete("notice");
    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [notice]);

  return null;
}
