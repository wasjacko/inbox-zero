// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isSimulatedWhatsAppConnected,
  setSimulatedWhatsAppConnected,
  SIMULATED_WHATSAPP_EVENT,
} from "@/utils/simulated-whatsapp";

describe("simulated WhatsApp connection", () => {
  afterEach(() => window.localStorage.clear());

  it("persists the simulation per Freescale account", () => {
    setSimulatedWhatsAppConnected("account-a", true);

    expect(isSimulatedWhatsAppConnected(window.localStorage, "account-a")).toBe(
      true,
    );
    expect(isSimulatedWhatsAppConnected(window.localStorage, "account-b")).toBe(
      false,
    );
  });

  it("disconnects and announces the change", () => {
    const listener = vi.fn();
    window.addEventListener(SIMULATED_WHATSAPP_EVENT, listener);

    setSimulatedWhatsAppConnected("account-a", true);
    setSimulatedWhatsAppConnected("account-a", false);

    expect(isSimulatedWhatsAppConnected(window.localStorage, "account-a")).toBe(
      false,
    );
    expect(listener).toHaveBeenCalledTimes(2);
    window.removeEventListener(SIMULATED_WHATSAPP_EVENT, listener);
  });
});
