import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/utils/__mocks__/prisma";
import { startFreescaleTrialAction } from "@/utils/actions/trial";

vi.mock("@/utils/prisma");
vi.mock("@/utils/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: "trial-user", email: "trial@example.com" },
  })),
}));
vi.mock("@/utils/email/watch-manager", () => ({
  ensureEmailAccountsWatched: vi.fn(async () => []),
}));

describe("trial activation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("starts an account's full trial without creating a payment subscription", async () => {
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.findUnique.mockResolvedValue({
      freescaleTrialStartedAt: new Date(),
      premium: null,
    } as never);
    const result = await startFreescaleTrialAction();
    expect(result?.data).toMatchObject({
      state: "active",
      daysRemaining: 14,
      canUseProduct: true,
    });
    expect(prisma.premium.create).not.toHaveBeenCalled();
  });

  it("cannot restart an expired trial", async () => {
    prisma.user.updateMany.mockResolvedValue({ count: 0 });
    prisma.user.findUnique.mockResolvedValue({
      freescaleTrialStartedAt: new Date("2020-01-01"),
      premium: null,
    } as never);
    const result = await startFreescaleTrialAction();
    expect(result?.data).toMatchObject({
      state: "expired",
      canUseProduct: false,
      expiresAt: "2020-01-15T00:00:00.000Z",
    });
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: "trial-user", freescaleTrialStartedAt: null },
      data: { freescaleTrialStartedAt: expect.any(Date) },
    });
  });
});
