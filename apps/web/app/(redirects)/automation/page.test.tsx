import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchSite: "same-origin" as string | null,
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers(
      mocks.fetchSite ? { "sec-fetch-site": mocks.fetchSite } : undefined,
    ),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => mocks.redirect(path),
}));

import AutomationPage from "./page";

describe("AutomationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchSite = "same-origin";
  });

  it("keeps same-origin navigation on Automations", async () => {
    const page = await AutomationPage();

    expect(page).toBeTruthy();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it.each([
    "none",
    "cross-site",
  ])("opens Brief for a %s browser entry", async (fetchSite) => {
    mocks.fetchSite = fetchSite;

    await expect(AutomationPage()).rejects.toThrow("redirect:/chat");
    expect(mocks.redirect).toHaveBeenCalledWith("/chat");
  });
});
