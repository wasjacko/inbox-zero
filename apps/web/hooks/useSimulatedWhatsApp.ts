"use client";
import { useSimulatedChannel } from "@/hooks/useSimulatedChannel";
export function useSimulatedWhatsApp(_emailAccountId: string) {
  return useSimulatedChannel("whatsapp");
}
