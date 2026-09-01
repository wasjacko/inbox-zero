// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePreviewConnectedChannels } from "@/hooks/usePreviewConnectedChannels";

const account = vi.hoisted(() => ({
  emailAccount: undefined as { id: string } | undefined,
  isLoading: false,
  provider: "",
}));

vi.mock("@/providers/EmailAccountProvider", () => ({
  useAccount: () => account,
}));

describe("usePreviewConnectedChannels", () => {
  beforeEach(() => {
    account.emailAccount = undefined;
    account.isLoading = false;
    account.provider = "";
  });

  it("unlocks Gmail from the real connected Google account", () => {
    account.emailAccount = { id: "google-account" };
    account.provider = "google";

    const { result } = renderHook(() => usePreviewConnectedChannels());

    expect(result.current).toEqual(["gmail"]);
  });

  it("unlocks Outlook from the real connected Microsoft account", () => {
    account.emailAccount = { id: "microsoft-account" };
    account.provider = "microsoft";

    const { result } = renderHook(() => usePreviewConnectedChannels());

    expect(result.current).toEqual(["outlook"]);
  });

  it("keeps the SaaS locked without a real account", () => {
    const { result } = renderHook(() => usePreviewConnectedChannels());

    expect(result.current).toEqual([]);
  });
});
