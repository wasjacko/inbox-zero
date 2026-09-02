"use client";

import { useEffect, useRef, useState } from "react";
import { usePreloadedPageData } from "@/hooks/usePreloadedPageData";
import type { ThreadsListResponse } from "@/app/api/threads/route";
import type { NewsletterStatsResponse } from "@/app/api/user/stats/newsletters/route";
import { useAccount } from "@/providers/EmailAccountProvider";
import { useStatLoader } from "@/providers/StatLoaderProvider";
import { EMAIL_ACCOUNT_HEADER } from "@/utils/config";
import {
  BULK_UNSUBSCRIBE_CACHE_KEY,
  BULK_UNSUBSCRIBE_THREADS_CACHE_KEY,
  CHANNELS_THREADS_CACHE_KEY,
} from "@/utils/preview-data";

const CHANNELS_BACKGROUND_CACHE_LIMIT = 1000;

export function PreviewDataPreloader() {
  const { emailAccountId } = useAccount();
  const { onLoad } = useStatLoader();
  const statsPreloadStartedFor = useRef<string | null>(null);
  const enabled = Boolean(emailAccountId);

  const { data: channelsData, mutate: updateChannelsData } =
    usePreloadedPageData<ThreadsListResponse>(
      enabled ? CHANNELS_THREADS_CACHE_KEY : null,
      {
        dedupingInterval: 60_000,
        revalidateOnFocus: false,
      },
    );
  const [channelsPageLoading, setChannelsPageLoading] = useState(false);
  const failedChannelsPageToken = useRef<string | null>(null);
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
    const nextPageToken = channelsData?.nextPageToken;
    if (
      !emailAccountId ||
      !nextPageToken ||
      channelsData.threads.length >= CHANNELS_BACKGROUND_CACHE_LIMIT ||
      channelsPageLoading ||
      failedChannelsPageToken.current === nextPageToken
    ) {
      return;
    }

    setChannelsPageLoading(true);
    fetch(
      `${CHANNELS_THREADS_CACHE_KEY}&nextPageToken=${encodeURIComponent(nextPageToken)}`,
      { headers: { [EMAIL_ACCOUNT_HEADER]: emailAccountId } },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("channels_preload_failed");
        const page = (await response.json()) as ThreadsListResponse;
        await updateChannelsData(
          (current) => {
            if (!current) return page;
            const merged = new Map(
              [...current.threads, ...page.threads].map((thread) => [
                thread.id,
                thread,
              ]),
            );
            return {
              ...current,
              threads: [...merged.values()],
              nextPageToken: page.nextPageToken,
              totalCount: current.totalCount ?? page.totalCount,
              unreadCount: current.unreadCount ?? page.unreadCount,
            };
          },
          { revalidate: false },
        );
      })
      .catch(() => {
        failedChannelsPageToken.current = nextPageToken;
      })
      .finally(() => {
        setChannelsPageLoading(false);
      });
  }, [channelsData, channelsPageLoading, emailAccountId, updateChannelsData]);

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
