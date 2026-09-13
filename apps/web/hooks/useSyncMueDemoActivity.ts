"use client";

import { useEffect } from "react";
import { useAccount } from "@/providers/EmailAccountProvider";
import {
  MUE_REPLIES_EVENT,
  readMueDemoReplies,
} from "@/utils/mue-demo-replies";
import { recordMueDemoReplyAction } from "@/utils/actions/mue-activity";
import { MUE_ACTIVITY_EVENT } from "@/utils/relations/savings";

export function useSyncMueDemoActivity() {
  const { emailAccountId } = useAccount();
  useEffect(() => {
    if (!emailAccountId) return;
    const synced = new Set<string>();
    let running = false;
    const sync = async () => {
      if (running) return;
      running = true;
      try {
        for (const reply of readMueDemoReplies(emailAccountId)) {
          if (
            synced.has(reply.id) ||
            (reply.conversationId !== "maya" &&
              reply.conversationId !== "mue-theo")
          )
            continue;
          const result = await recordMueDemoReplyAction(emailAccountId, {
            externalId: reply.id,
            conversationId: reply.conversationId,
            sentAt: reply.sentAt,
          });
          if (result?.data) synced.add(reply.id);
        }
        window.dispatchEvent(new Event(MUE_ACTIVITY_EVENT));
      } finally {
        running = false;
      }
    };
    const refresh = () => {
      sync().catch(() => {});
    };
    refresh();
    window.addEventListener(MUE_REPLIES_EVENT, refresh);
    window.addEventListener("online", refresh);
    return () => {
      window.removeEventListener(MUE_REPLIES_EVENT, refresh);
      window.removeEventListener("online", refresh);
    };
  }, [emailAccountId]);
}
