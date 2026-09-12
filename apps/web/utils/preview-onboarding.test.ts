// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPreviewConnectedChannels,
  getPreviewOnboardingDestination,
  getVerifiedMailboxChannels,
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

  it("opens home after onboarding with a connected channel", () => {
    expect(getPreviewOnboardingDestination(["gmail"])).toBe(
      "/chat?onboarding=complete",
    );
  });

  it("opens home when onboarding ends or is skipped without a channel", () => {
    expect(getPreviewOnboardingDestination([])).toBe(
      "/chat?onboarding=complete",
    );
  });

  it("only confirms mailbox channels returned by the server", () => {
    expect(
      getVerifiedMailboxChannels([
        { account: { provider: "google" } },
        { account: { provider: "microsoft" } },
        { account: { provider: "google" } },
      ]),
    ).toEqual(["gmail", "outlook"]);
    expect(getVerifiedMailboxChannels([])).toEqual([]);
  });
});
