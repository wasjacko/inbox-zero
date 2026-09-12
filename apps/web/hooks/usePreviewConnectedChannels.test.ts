// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePreviewConnectedChannels } from "@/hooks/usePreviewConnectedChannels";
import { setSimulatedWhatsAppConnected } from "@/utils/simulated-whatsapp";
import { savePreviewConnectedChannels } from "@/utils/preview-onboarding";

const account = vi.hoisted(() => ({
  emailAccount: undefined as { id: string } | undefined,
  emailAccountId: "",
  isLoading: false,
  provider: "",
}));

vi.mock("@/providers/EmailAccountProvider", () => ({
  useAccount: () => account,
}));

describe("usePreviewConnectedChannels", () => {
  beforeEach(() => {
    account.emailAccount = undefined;
    account.emailAccountId = "";
    account.isLoading = false;
    account.provider = "";
    window.localStorage.clear();
  });

  it("unlocks Gmail from the real connected Google account", () => {
    account.emailAccount = { id: "google-account" };
    account.emailAccountId = "google-account";
    account.provider = "google";

    const { result } = renderHook(() => usePreviewConnectedChannels());

    expect(result.current).toEqual(["gmail"]);
  });

  it("unlocks Outlook from the real connected Microsoft account", () => {
    account.emailAccount = { id: "microsoft-account" };
    account.emailAccountId = "microsoft-account";
    account.provider = "microsoft";

    const { result } = renderHook(() => usePreviewConnectedChannels());

    expect(result.current).toEqual(["outlook"]);
  });

  it("keeps the SaaS locked without a real account", () => {
    const { result } = renderHook(() => usePreviewConnectedChannels());

    expect(result.current).toEqual([]);
  });

  it("restores WhatsApp saved by onboarding even before the mailbox context loads", () => {
    savePreviewConnectedChannels(["whatsapp"]);

    const { result } = renderHook(() => usePreviewConnectedChannels());

    expect(result.current).toEqual(["whatsapp"]);
  });

  it("adds the simulated WhatsApp channel only to the current account", () => {
    account.emailAccount = { id: "google-account" };
    account.emailAccountId = "google-account";
    account.provider = "google";

    const { result } = renderHook(() => usePreviewConnectedChannels());

    act(() => setSimulatedWhatsAppConnected("google-account", true));

    expect(result.current).toEqual(["gmail", "whatsapp"]);
  });
});
