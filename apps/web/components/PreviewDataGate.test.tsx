// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PreviewDataGate } from "@/components/PreviewDataGate";
import { savePreviewConnectedChannels } from "@/utils/preview-onboarding";

const navigation = vi.hoisted(() => ({ pathname: "/channels-v4" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

describe("PreviewDataGate", () => {
  afterEach(cleanup);

  beforeEach(() => {
    localStorage.clear();
    navigation.pathname = "/channels-v4";
  });

  it("does not invent channel data when nothing is connected", async () => {
    render(
      <PreviewDataGate>
        <p>Conversations simulées</p>
      </PreviewDataGate>,
    );

    expect(
      await screen.findByRole("heading", { name: "Aucun canal connecté" }),
    ).not.toBeNull();
    expect(screen.queryByText("Conversations simulées")).toBeNull();
  });

  it("reveals data pages after a channel is connected", async () => {
    savePreviewConnectedChannels(["gmail"]);

    render(
      <PreviewDataGate>
        <p>Conversations réelles</p>
      </PreviewDataGate>,
    );

    expect(await screen.findByText("Conversations réelles")).not.toBeNull();
  });

  it("keeps configuration pages available without a channel", async () => {
    navigation.pathname = "/help";

    render(
      <PreviewDataGate>
        <p>Centre d’aide</p>
      </PreviewDataGate>,
    );

    await waitFor(() =>
      expect(screen.getByText("Centre d’aide")).not.toBeNull(),
    );
  });

  it("keeps manual task management available without a channel", async () => {
    navigation.pathname = "/tasks";

    render(
      <PreviewDataGate>
        <p>Créer une tâche manuelle</p>
      </PreviewDataGate>,
    );

    expect(await screen.findByText("Créer une tâche manuelle")).not.toBeNull();
  });
});
