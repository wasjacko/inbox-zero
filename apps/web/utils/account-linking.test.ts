import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAccountLinkingUrl } from "./account-linking";

describe("getAccountLinkingUrl", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the OAuth URL on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        url: "https://accounts.google.com/o/oauth2/v2/auth",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAccountLinkingUrl("google")).resolves.toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/google/linking/auth-url", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
  });

  it("returns the redirect URL when the server asks the client to log out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ redirectTo: "/logout" }),
      }),
    );

    await expect(getAccountLinkingUrl("google")).resolves.toBe("/logout");
  });

  it("passes an onboarding return path to the OAuth endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://accounts.google.com/oauth" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await getAccountLinkingUrl("google", { returnTo: "/onboarding" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/google/linking/auth-url?returnTo=%2Fonboarding",
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );
  });

  it("asks onboarding to reuse the signed-in Google account", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://accounts.google.com/oauth" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await getAccountLinkingUrl("google", {
      returnTo: "/onboarding",
      preferSignedInGoogleAccount: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/google/linking/auth-url?returnTo=%2Fonboarding&preferSignedInGoogleAccount=1",
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );
  });
});
