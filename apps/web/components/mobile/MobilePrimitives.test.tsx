// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MobileBottomBar,
  MobileBottomBarItem,
  MobileSkeleton,
} from "@/components/mobile/MobilePrimitives";

describe("mobile bottom navigation", () => {
  afterEach(cleanup);

  it("exposes the active destination without adding another main landmark", () => {
    const { container } = render(
      <>
        <main>Contenu</main>
        <MobileBottomBar>
          <MobileBottomBarItem
            active
            href="/tasks"
            icon={<span aria-hidden="true">T</span>}
            label="Tâches"
          />
        </MobileBottomBar>
      </>,
    );

    expect(
      screen.getByRole("navigation", { name: "Navigation principale" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("link", { name: "Tâches" }).getAttribute("href"),
    ).toBe("/tasks");
    expect(
      screen.getByRole("link", { name: "Tâches" }).getAttribute("aria-current"),
    ).toBe("page");
    expect(container.querySelectorAll("main")).toHaveLength(1);
  });

  it("keeps action items tactile and operable", () => {
    const onClick = vi.fn();

    render(
      <MobileBottomBar>
        <MobileBottomBarItem
          icon={<span aria-hidden="true">+</span>}
          label="Plus"
          onClick={onClick}
        />
      </MobileBottomBar>,
    );

    const action = screen.getByRole("button", { name: "Plus" });
    fireEvent.click(action);

    expect(onClick).toHaveBeenCalledOnce();
    expect(action.getAttribute("class")).toContain("min-h-11");
  });

  it("stops decorative loading motion when the system requests it", () => {
    const { container } = render(<MobileSkeleton rows={1} />);
    const skeletonRow = container.querySelector(".animate-pulse");

    expect(skeletonRow?.getAttribute("class")).toContain(
      "motion-reduce:animate-none",
    );
  });
});
