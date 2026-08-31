"use client";

import { useEffect, useState } from "react";
import {
  getPreviewConnectedChannels,
  PREVIEW_CONNECTED_CHANNELS_EVENT,
} from "@/utils/preview-onboarding";

export function usePreviewConnectedChannels() {
  const [connectedChannels, setConnectedChannels] = useState<string[] | null>(
    null,
  );

  useEffect(() => {
    setConnectedChannels(getPreviewConnectedChannels(window.localStorage));

    const handleChange = (event: Event) =>
      setConnectedChannels((event as CustomEvent<string[]>).detail);
    window.addEventListener(PREVIEW_CONNECTED_CHANNELS_EVENT, handleChange);
    return () =>
      window.removeEventListener(
        PREVIEW_CONNECTED_CHANNELS_EVENT,
        handleChange,
      );
  }, []);

  return connectedChannels;
}
