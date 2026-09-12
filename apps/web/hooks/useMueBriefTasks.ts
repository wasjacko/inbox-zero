"use client";

import useSWR from "swr";
import { useAccount } from "@/providers/EmailAccountProvider";
import { EMAIL_ACCOUNT_HEADER } from "@/utils/config";
import type { MueBriefTask } from "@/utils/ai/brief/detect-brief-tasks";

export function useMueBriefTasks() {
  const { emailAccountId } = useAccount();
  return useSWR<{ tasks: MueBriefTask[] }>(
    emailAccountId ? ["mue-brief-tasks", emailAccountId] : null,
    async () => {
      const response = await fetch("/api/user/brief-tasks", {
        headers: { [EMAIL_ACCOUNT_HEADER]: emailAccountId },
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok) throw new Error("Brief indisponible");
      return response.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    },
  );
}
