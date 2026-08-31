// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileSystemStatus } from "@/components/mobile/MobileSystemStatus";

describe("mobile system status", () => {
  afterEach(cleanup);

  it("stays out of the interface while the system is healthy", () => {
    render(<MobileSystemStatus />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("offers a controlled refresh when an update is ready", () => {
    const onReload = vi.fn();
    render(<MobileSystemStatus onReload={onReload} />);

    fireEvent(window, new Event("freescale:app-update-ready"));
    fireEvent.click(screen.getByRole("button", { name: "Actualiser" }));

    expect(screen.getByText("Freescale a évolué")).not.toBeNull();
    expect(onReload).toHaveBeenCalledOnce();
  });

  it("gives connection loss priority over a pending update", () => {
    render(<MobileSystemStatus />);

    fireEvent(window, new Event("freescale:app-update-ready"));
    fireEvent(window, new Event("offline"));

    expect(screen.getByText(/Hors ligne/)).not.toBeNull();
    expect(screen.queryByText("Freescale a évolué")).toBeNull();
  });

  it("reveals the pending update after the connection returns", () => {
    render(<MobileSystemStatus />);

    fireEvent(window, new Event("freescale:app-update-ready"));
    fireEvent(window, new Event("offline"));
    fireEvent(window, new Event("online"));

    expect(screen.getByText("Freescale a évolué")).not.toBeNull();
    expect(screen.queryByText("Connexion rétablie.")).toBeNull();
  });
});
