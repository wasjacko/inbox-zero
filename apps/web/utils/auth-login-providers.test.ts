import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("better-auth", () => ({
  betterAuth: vi.fn((options: unknown) => ({
    api: {
      getSession: vi.fn(),
    },
    options,
  })),
}));

vi.mock("@/utils/prisma");
vi.mock("@googleapis/people", () => ({
  people: vi.fn(),
}));
vi.mock("@googleapis/gmail", () => ({
  auth: {
    OAuth2: vi.fn(),
  },
}));
vi.mock("@/utils/encryption", () => ({
  encryptToken: vi.fn((token) => token),
}));

describe("betterAuthConfig login providers", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@/utils/oauth/login-providers");
  });

  it("does not register social providers when only SSO login is enabled", async () => {
    const betterAuthConfig = await loadBetterAuthConfig(["sso"]);

    expect(betterAuthConfig.options.socialProviders).toEqual({});
  });

  it("registers only enabled social providers", async () => {
    const betterAuthConfig = await loadBetterAuthConfig(["apple"]);

    expect(Object.keys(betterAuthConfig.options.socialProviders)).toEqual([
      "apple",
    ]);
  });

  it("keeps Google sign-in limited to identity scopes", async () => {
    const betterAuthConfig = await loadBetterAuthConfig(["google"]);

    expect(betterAuthConfig.options.socialProviders.google.scope).toEqual([
      "openid",
      "email",
      "profile",
    ]);
  });

  it("does not overwrite Gmail grants during an identity-only sign-in", async () => {
    const betterAuthConfig = await loadBetterAuthConfig(["google"]);
    const beforeAccountUpdate =
      betterAuthConfig.options.databaseHooks.account.update.before;

    await expect(
      beforeAccountUpdate({ scope: "openid,email,profile" }),
    ).resolves.toBe(false);
    await expect(
      beforeAccountUpdate({
        scope:
          "openid,email,profile,https://www.googleapis.com/auth/gmail.modify",
      }),
    ).resolves.toBeUndefined();
  });
});

async function loadBetterAuthConfig(enabledProviders: string[]) {
  vi.resetModules();
  vi.doMock("@/utils/oauth/login-providers", () => ({
    getEnabledLoginProviders: () => new Set(enabledProviders),
  }));

  const { betterAuthConfig } = await import("@/utils/auth");

  return betterAuthConfig as any;
}
