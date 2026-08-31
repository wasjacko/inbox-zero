// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPreviewConnectedChannels,
  PREVIEW_CONNECTED_CHANNELS_EVENT,
  PREVIEW_CONNECTED_CHANNELS_KEY,
  savePreviewConnectedChannels,
} from "@/utils/preview-onboarding";

describe("preview onboarding connections", () => {
  afterEach(() => window.localStorage.clear());

  it("keeps skipped onboarding empty", () => {
    savePreviewConnectedChannels([]);

    expect(getPreviewConnectedChannels(window.localStorage)).toEqual([]);
    expect(window.localStorage.getItem(PREVIEW_CONNECTED_CHANNELS_KEY)).toBe(
      "[]",
    );
  });

  it("persists unique connected channels and announces the change", () => {
    const listener = vi.fn();
    window.addEventListener(PREVIEW_CONNECTED_CHANNELS_EVENT, listener);

    savePreviewConnectedChannels(["gmail", "whatsapp", "gmail"]);

    expect(getPreviewConnectedChannels(window.localStorage)).toEqual([
      "gmail",
      "whatsapp",
    ]);
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(PREVIEW_CONNECTED_CHANNELS_EVENT, listener);
  });
});
