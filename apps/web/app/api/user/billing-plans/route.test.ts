import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/user/billing-plans/route";

const { retrieve, priceId } = vi.hoisted(() => ({
  retrieve: vi.fn(),
  priceId: vi.fn(),
}));
vi.mock("@/utils/middleware", () => ({
  withAuth: (_scope: string, handler: unknown) => handler,
}));
vi.mock("@/ee/billing/stripe", () => ({
  getStripe: () => ({ prices: { retrieve } }),
}));
vi.mock("@/app/(app)/premium/config", () => ({ getStripePriceId: priceId }));

describe("billing plan availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    priceId.mockImplementation(({ tier }) => tier);
  });

  it("displays the configured processor prices instead of fictitious prices", async () => {
    retrieve.mockImplementation(async (id) => ({
      active: true,
      unit_amount: id === "STARTER_MONTHLY" ? 2900 : 22_800,
      currency: "eur",
      recurring: {
        interval: id === "STARTER_MONTHLY" ? "month" : "year",
        interval_count: 1,
      },
    }));
    const response = await GET({} as never, { params: Promise.resolve({}) });
    expect(await response.json()).toEqual([
      {
        tier: "STARTER_MONTHLY",
        available: true,
        amount: 2900,
        currency: "eur",
        interval: "month",
      },
      {
        tier: "STARTER_ANNUALLY",
        available: true,
        amount: 22_800,
        currency: "eur",
        interval: "year",
      },
    ]);
  });

  it("does not offer payment for missing, unreachable or mismatched prices", async () => {
    priceId.mockReturnValue(undefined);
    expect(
      (
        await (await GET({} as never, { params: Promise.resolve({}) })).json()
      ).every((plan: { available: boolean }) => !plan.available),
    ).toBe(true);
    priceId.mockReturnValue("configured-price");
    retrieve.mockRejectedValue(new Error("Unavailable"));
    expect(
      (
        await (await GET({} as never, { params: Promise.resolve({}) })).json()
      ).every((plan: { available: boolean }) => !plan.available),
    ).toBe(true);
    retrieve.mockResolvedValue({
      active: true,
      unit_amount: 2900,
      currency: "eur",
      recurring: { interval: "week", interval_count: 1 },
    });
    expect(
      (
        await (await GET({} as never, { params: Promise.resolve({}) })).json()
      ).every((plan: { available: boolean }) => !plan.available),
    ).toBe(true);
  });
});
