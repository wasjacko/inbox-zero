import { describe, expect, it } from "vitest";
import { getTrialStatus } from "@/utils/trial/status";

describe("Freescale trial", () => {
  const startedAt = new Date("2026-10-04T10:00:00Z");

  it("requires explicit activation before providing product access", () => {
    expect(getTrialStatus({ startedAt: null, paid: false })).toMatchObject({
      state: "not_started",
      canUseProduct: false,
    });
  });

  it("provides full access for exactly fourteen days", () => {
    expect(
      getTrialStatus({
        startedAt,
        paid: false,
        now: new Date("2026-10-17T10:00:01Z"),
      }),
    ).toMatchObject({
      state: "active",
      canUseProduct: true,
      daysRemaining: 1,
      expiresAt: "2026-10-18T10:00:00.000Z",
    });
    expect(
      getTrialStatus({
        startedAt,
        paid: false,
        now: new Date("2026-10-18T10:00:00Z"),
      }),
    ).toMatchObject({
      state: "expired",
      canUseProduct: false,
      daysRemaining: 0,
    });
  });

  it("preserves access for subscribers after the trial expires", () => {
    expect(
      getTrialStatus({ startedAt, paid: true, now: new Date("2027-01-01") }),
    ).toMatchObject({ state: "subscribed", canUseProduct: true });
  });
});
