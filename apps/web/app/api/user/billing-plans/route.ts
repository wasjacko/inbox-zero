import { NextResponse } from "next/server";
import { withAuth } from "@/utils/middleware";
import { getStripe } from "@/ee/billing/stripe";
import { getStripePriceId } from "@/app/(app)/premium/config";

async function getPlans() {
  return Promise.all(
    (["STARTER_MONTHLY", "STARTER_ANNUALLY"] as const).map(async (tier) => {
      const priceId = getStripePriceId({ tier });
      if (!priceId)
        return {
          tier,
          available: false,
          amount: null,
          currency: "eur",
          interval: null,
        };
      try {
        const price = await getStripe().prices.retrieve(priceId);
        return {
          tier,
          available:
            price.active &&
            price.unit_amount !== null &&
            price.recurring?.interval ===
              (tier === "STARTER_MONTHLY" ? "month" : "year") &&
            price.recurring.interval_count === 1,
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval ?? null,
        };
      } catch {
        return {
          tier,
          available: false,
          amount: null,
          currency: "eur",
          interval: null,
        };
      }
    }),
  );
}

export const GET = withAuth("user/billing-plans", async () =>
  NextResponse.json(await getPlans(), {
    headers: { "Cache-Control": "private, no-store" },
  }),
);
export type BillingPlansResponse = Awaited<ReturnType<typeof getPlans>>;
