// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPreviewGreeting,
  PREVIEW_FREELANCER_NAME_EVENT,
  PREVIEW_FREELANCER_NAME_KEY,
  savePreviewFreelancerName,
} from "@/utils/preview-profile";

describe("preview freelancer profile", () => {
  afterEach(() => window.localStorage.clear());

  it("keeps the freelancer name separate and normalized", () => {
    const listener = vi.fn();
    window.addEventListener(PREVIEW_FREELANCER_NAME_EVENT, listener);

    savePreviewFreelancerName("  Maya  ");

    expect(window.localStorage.getItem(PREVIEW_FREELANCER_NAME_KEY)).toBe(
      "Maya",
    );
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(PREVIEW_FREELANCER_NAME_EVENT, listener);
  });

  it("builds the home greeting from the freelancer name", () => {
    expect(getPreviewGreeting("Maya")).toBe("Bonjour Maya");
    expect(getPreviewGreeting("   ")).toBe("Bonjour");
  });
});
