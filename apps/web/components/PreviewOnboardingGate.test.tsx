// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PreviewOnboardingGate } from "@/components/PreviewOnboardingGate";
import { grantPreviewOnboardingAccess } from "@/utils/preview-onboarding";

const navigation = vi.hoisted(() => ({
  pathname: "/chat",
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace: navigation.replace }),
}));

function setMobileViewport(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
}

describe("PreviewOnboardingGate", () => {
  afterEach(cleanup);

  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, "", "/chat");
    navigation.pathname = "/chat";
    navigation.replace.mockReset();
    setMobileViewport(true);
  });

  it("redirects a new mobile visitor to onboarding", async () => {
    render(
      <PreviewOnboardingGate>
        <p>Application</p>
      </PreviewOnboardingGate>,
    );

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith("/onboarding"),
    );
    expect(
      screen.getByRole("status", { name: "Ouverture de l’onboarding" }),
    ).not.toBeNull();
  });

  it("allows mobile visitors who completed onboarding", async () => {
    grantPreviewOnboardingAccess(localStorage, "completed");

    render(
      <PreviewOnboardingGate>
        <p>Application</p>
      </PreviewOnboardingGate>,
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("status", { name: "Ouverture de l’onboarding" }),
      ).toBeNull(),
    );
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("allows a mobile visitor returning from successful Google OAuth", async () => {
    window.history.replaceState(
      null,
      "",
      "/chat?channelConnected=gmail&success=tokens_updated",
    );

    render(
      <PreviewOnboardingGate>
        <p>Application</p>
      </PreviewOnboardingGate>,
    );

    await waitFor(() => expect(screen.getByText("Application")).not.toBeNull());
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(localStorage.getItem("freescale-preview-onboarding-status")).toBe(
      "completed",
    );
  });

  it("does not change the desktop preview", async () => {
    setMobileViewport(false);

    render(
      <PreviewOnboardingGate>
        <p>Application</p>
      </PreviewOnboardingGate>,
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("status", { name: "Ouverture de l’onboarding" }),
      ).toBeNull(),
    );
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
