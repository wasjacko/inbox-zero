import { describe, expect, it } from "vitest";
import { demoChannelKey, ownsConnectedDemo } from "./owned-demo-channel";

describe("demo connection ownership", () => {
  it("never exposes account A's connection to account B during a session switch", () => {
    const snapshot = {
      key: demoChannelKey("user-a", "whatsapp"),
      connected: true,
    };
    expect(
      ownsConnectedDemo(demoChannelKey("user-a", "whatsapp"), snapshot),
    ).toBe(true);
    expect(
      ownsConnectedDemo(demoChannelKey("user-b", "whatsapp"), snapshot),
    ).toBe(false);
    expect(
      ownsConnectedDemo(demoChannelKey(undefined, "whatsapp"), snapshot),
    ).toBe(false);
  });
  it("does not adopt legacy shared onboarding state or another channel", () => {
    const key = demoChannelKey("user-a", "slack");
    expect(
      ownsConnectedDemo(key, { key: "__onboarding__", connected: true }),
    ).toBe(false);
    expect(
      ownsConnectedDemo(key, {
        key: demoChannelKey("user-a", "whatsapp"),
        connected: true,
      }),
    ).toBe(false);
    expect(ownsConnectedDemo(key, { key, connected: false })).toBe(false);
  });
});
