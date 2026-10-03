import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/utils/__mocks__/prisma";
import {
  assertProductAccess,
  getProductAccess,
  requiresProductAccess,
  requiresProductAccessForAction,
} from "@/utils/trial/access";

vi.mock("@/utils/prisma");
vi.mock("@/env", () => ({ env: { NEXT_PUBLIC_BYPASS_PREMIUM_CHECKS: true } }));

describe("product access enforcement", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not grant free access when the legacy premium bypass is enabled", async () => {
    prisma.user.findUnique.mockResolvedValue({
      premium: null,
      freescaleTrialStartedAt: null,
    } as never);
    await expect(assertProductAccess("user")).rejects.toMatchObject({
      statusCode: 402,
    });
  });

  it("allows an active trial and blocks an expired one", async () => {
    prisma.user.findUnique.mockResolvedValue({
      premium: null,
      freescaleTrialStartedAt: new Date(),
    } as never);
    await expect(assertProductAccess("user")).resolves.toBeUndefined();
    prisma.user.findUnique.mockResolvedValue({
      premium: null,
      freescaleTrialStartedAt: new Date("2020-01-01"),
    } as never);
    await expect(assertProductAccess("user")).rejects.toMatchObject({
      statusCode: 402,
    });
  });

  it("recognizes real subscribers independently of the trial", async () => {
    prisma.user.findUnique.mockResolvedValue({
      premium: { tier: "STARTER_MONTHLY", stripeSubscriptionStatus: "active" },
      freescaleTrialStartedAt: null,
    } as never);
    await expect(getProductAccess("user")).resolves.toMatchObject({
      state: "subscribed",
      canUseProduct: true,
    });
  });

  it("keeps onboarding, billing and account deletion accessible, but blocks product routes", () => {
    for (const path of [
      "/api/user/product-access",
      "/api/chat/onboarding",
      "/api/user/onboarding/inbox-scan",
      "/api/google/linking/auth-url",
    ])
      expect(requiresProductAccess(path)).toBe(false);
    for (const path of [
      "/api/chat",
      "/api/user/brief-summary",
      "/api/user/tasks",
    ])
      expect(requiresProductAccess(path)).toBe(true);
    for (const name of [
      "startFreescaleTrial",
      "generateCheckoutSession",
      "deleteAccount",
      "getBillingPortalUrl",
    ])
      expect(requiresProductAccessForAction(name)).toBe(false);
    expect(requiresProductAccessForAction("createRule")).toBe(true);
  });
});
