import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/utils/__mocks__/prisma";
import { redis } from "@/utils/redis";
import { getEmailAccount } from "./account-validation";

const mockedEnv = vi.hoisted(() => ({
  UPSTASH_REDIS_URL: undefined as string | undefined,
  UPSTASH_REDIS_TOKEN: undefined as string | undefined,
}));
vi.mock("server-only", () => ({}));
vi.mock("@/utils/prisma");
vi.mock("@/env", () => ({ env: mockedEnv }));
vi.mock("@/utils/redis", () => ({
  redis: { get: vi.fn(), set: vi.fn(), del: vi.fn() },
}));

describe("account ownership without Redis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedEnv.UPSTASH_REDIS_URL = undefined;
    mockedEnv.UPSTASH_REDIS_TOKEN = undefined;
  });

  it("checks ownership directly without contacting an unconfigured cache", async () => {
    prisma.emailAccount.findUnique.mockResolvedValue({
      email: "owner@example.com",
    } as never);
    await expect(
      getEmailAccount({ userId: "owner", emailAccountId: "account" }),
    ).resolves.toBe("owner@example.com");
    expect(redis.get).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();
    expect(prisma.emailAccount.findUnique).toHaveBeenCalledWith({
      where: { id: "account", userId: "owner" },
      select: { email: true },
    });
  });

  it("does not authorize an account belonging to someone else", async () => {
    prisma.emailAccount.findUnique.mockResolvedValue(null);
    await expect(
      getEmailAccount({ userId: "other", emailAccountId: "account" }),
    ).resolves.toBeNull();
  });

  it("still checks the database when a configured cache fails", async () => {
    mockedEnv.UPSTASH_REDIS_URL = "https://cache.example.com";
    mockedEnv.UPSTASH_REDIS_TOKEN = "test-token";
    vi.mocked(redis.get).mockRejectedValue(new Error("unavailable"));
    vi.mocked(redis.set).mockRejectedValue(new Error("unavailable"));
    prisma.emailAccount.findUnique.mockResolvedValue({
      email: "owner@example.com",
    } as never);
    await expect(
      getEmailAccount({ userId: "owner", emailAccountId: "account" }),
    ).resolves.toBe("owner@example.com");
  });
});
