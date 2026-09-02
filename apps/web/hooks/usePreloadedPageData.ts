"use client";

import { useEffect, useMemo } from "react";
import useSWR, { type SWRConfiguration } from "swr";
import { useAccount } from "@/providers/EmailAccountProvider";
import { readPageData, writePageData } from "@/utils/preview-data-cache";

export function usePreloadedPageData<Data, Error = unknown>(
  url: string | null,
  config: SWRConfiguration<Data, Error> = {},
) {
  const { emailAccountId } = useAccount();
  const fallbackData = useMemo(
    () => (url ? readPageData<Data>(emailAccountId, url) : undefined),
    [emailAccountId, url],
  );
  const result = useSWR<Data, Error>(
    url && emailAccountId ? [url, emailAccountId] : null,
    {
      ...config,
      fallbackData,
      dedupingInterval: 60_000,
      revalidateOnFocus: false,
      // Never carry a previous mailbox or filter's rows into a new key.
      keepPreviousData: false,
    },
  );

  useEffect(() => {
    // Do not renew the TTL merely by reading the saved fallback.
    if (url && result.data !== fallbackData) {
      writePageData(emailAccountId, url, result.data);
    }
  }, [emailAccountId, fallbackData, result.data, url]);

  return {
    ...result,
    isLoading: result.isLoading && result.data === undefined,
  };
}
