// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PreviewDataGate } from "@/components/PreviewDataGate";

const navigation = vi.hoisted(() => ({ pathname: "/channels-v4" }));
const account = vi.hoisted(() => ({
  emailAccount: undefined as { id: string } | undefined,
  isLoading: false,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

vi.mock("@/providers/EmailAccountProvider", () => ({
  useAccount: () => account,
}));

describe("PreviewDataGate", () => {
  afterEach(cleanup);

  beforeEach(() => {
    navigation.pathname = "/channels-v4";
    account.emailAccount = undefined;
    account.isLoading = false;
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
    account.emailAccount = { id: "gmail-account" };

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
