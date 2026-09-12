"use client";
import { useAccount } from "@/providers/EmailAccountProvider";
import { useSimulatedChannel } from "@/hooks/useSimulatedChannel";
export function usePreviewConnectedChannels() {
  const { emailAccount, isLoading, provider } = useAccount();
  const { connected: whatsapp } = useSimulatedChannel("whatsapp");
  const { connected: slack } = useSimulatedChannel("slack");
  if (isLoading) return null;
  const channels: string[] = [];
  if (emailAccount && provider === "google") channels.push("gmail");
  if (emailAccount && provider === "microsoft") channels.push("outlook");
  if (whatsapp) channels.push("whatsapp");
  if (slack) channels.push("slack");
  return channels;
}
