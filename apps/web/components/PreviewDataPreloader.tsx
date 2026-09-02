"use client";

import { useEffect, useRef } from "react";
import { usePreloadedPageData } from "@/hooks/usePreloadedPageData";
import type { ThreadsListResponse } from "@/app/api/threads/route";
import type { NewsletterStatsResponse } from "@/app/api/user/stats/newsletters/route";
import { useAccount } from "@/providers/EmailAccountProvider";
import { useStatLoader } from "@/providers/StatLoaderProvider";
import {
  BULK_UNSUBSCRIBE_CACHE_KEY,
  BULK_UNSUBSCRIBE_THREADS_CACHE_KEY,
  CHANNELS_THREADS_CACHE_KEY,
} from "@/utils/preview-data";

export function PreviewDataPreloader() {
  const { emailAccountId } = useAccount();
  const { onLoad } = useStatLoader();
  const statsPreloadStartedFor = useRef<string | null>(null);
  const enabled = Boolean(emailAccountId);

  usePreloadedPageData<ThreadsListResponse>(
    enabled ? CHANNELS_THREADS_CACHE_KEY : null,
    {
      dedupingInterval: 60_000,
      revalidateOnFocus: false,
    },
  );
  const {
    data: newsletterData,
    isLoading: newsletterLoading,
    mutate: refreshNewsletters,
  } = usePreloadedPageData<NewsletterStatsResponse>(
    enabled ? BULK_UNSUBSCRIBE_CACHE_KEY : null,
    {
      dedupingInterval: 60_000,
      revalidateOnFocus: false,
    },
  );
  usePreloadedPageData<ThreadsListResponse>(
    enabled && newsletterData?.newsletters.length === 0
      ? BULK_UNSUBSCRIBE_THREADS_CACHE_KEY
      : null,
    {
      dedupingInterval: 60_000,
      revalidateOnFocus: false,
    },
  );

  useEffect(() => {
    if (!emailAccountId || newsletterLoading || !newsletterData) return;
    if (newsletterData.newsletters.length > 0) return;
    if (statsPreloadStartedFor.current === emailAccountId) return;

    statsPreloadStartedFor.current = emailAccountId;
    const preloadNewsletterStats = async () => {
      await onLoad({ loadBefore: false, showToast: false });
      await refreshNewsletters();
    };
    preloadNewsletterStats().catch(() => undefined);
  }, [
    emailAccountId,
    newsletterData,
    newsletterLoading,
    onLoad,
    refreshNewsletters,
  ]);

  return null;
}
