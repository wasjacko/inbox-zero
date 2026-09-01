"use client";

import { useAccount } from "@/providers/EmailAccountProvider";

export function usePreviewConnectedChannels() {
  const { emailAccount, isLoading, provider } = useAccount();

  if (isLoading) return null;
  if (!emailAccount) return [];
  if (provider === "google") return ["gmail"];
  if (provider === "microsoft") return ["outlook"];
  return [];
}
