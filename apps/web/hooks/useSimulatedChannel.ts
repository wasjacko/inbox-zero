"use client";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/utils/auth-client";
import { demoChannelKey, ownsConnectedDemo } from "@/utils/owned-demo-channel";

const EVENT = "freescale:owned-demo-channel-change";

export function useSimulatedChannel(channel: "whatsapp" | "slack") {
  const { data: session, isPending } = useSession();
  const userId = isPending ? undefined : session?.user?.id;
  const key = demoChannelKey(userId, channel);
  const [snapshot, setSnapshot] = useState({
    key: null as string | null,
    connected: false,
  });
  useEffect(() => {
    const sync = () => {
      let connected = false;
      try {
        connected = !!key && localStorage.getItem(key) === "1";
      } catch {}
      setSnapshot({ key, connected });
    };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [key]);
  const update = useCallback(
    (connected: boolean) => {
      if (!key) return;
      localStorage.setItem(key, connected ? "1" : "0");
      setSnapshot({ key, connected });
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );
  return {
    connected: ownsConnectedDemo(key, snapshot),
    connect: useCallback(() => update(true), [update]),
    disconnect: useCallback(() => update(false), [update]),
  };
}
