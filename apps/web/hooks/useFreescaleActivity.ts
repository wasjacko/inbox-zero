"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useAccount } from "@/providers/EmailAccountProvider";
import type { GetFreescaleActivityResponse } from "@/app/api/user/activity/route";
import { EMAIL_ACCOUNT_HEADER } from "@/utils/config";
import type { FreescaleActivityPeriod } from "@/utils/relations/activity";
import { MUE_ACTIVITY_EVENT } from "@/utils/relations/savings";

export function useFreescaleActivity(period: FreescaleActivityPeriod = "31d") {
  const { emailAccountId } = useAccount();
  const result = useSWR<GetFreescaleActivityResponse>(
    emailAccountId
      ? [`/api/user/activity?period=${period}`, emailAccountId]
      : null,
    async ([url, accountId]: [string, string]) => {
      const response = await fetch(url, {
        headers: { [EMAIL_ACCOUNT_HEADER]: accountId },
      });
      if (!response.ok) throw new Error("activity_load_failed");
      return response.json();
    },
    { keepPreviousData: false, dedupingInterval: 5000 },
  );
  const { mutate } = result;
  useEffect(() => {
    const refresh = () => {
      mutate();
    };
    window.addEventListener(MUE_ACTIVITY_EVENT, refresh);
    return () => window.removeEventListener(MUE_ACTIVITY_EVENT, refresh);
  }, [mutate]);
  return result;
}

export function useUnseenMueActivity() {
  const { emailAccountId } = useAccount();
  const { data } = useFreescaleActivity("90d");
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const key = `freescale:mue-activity-seen:${emailAccountId}`;
  useEffect(() => {
    const update = () => setSeenAt(localStorage.getItem(key));
    update();
    window.addEventListener(MUE_ACTIVITY_EVENT, update);
    return () => window.removeEventListener(MUE_ACTIVITY_EVENT, update);
  }, [key]);
  return Boolean(
    data?.latestAssistedAt &&
      (!seenAt ||
        new Date(data.latestAssistedAt).getTime() > new Date(seenAt).getTime()),
  );
}
