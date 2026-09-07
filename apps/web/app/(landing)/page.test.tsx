import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  redirectToEmailAccountPath: vi.fn((path: string) => {
    throw new Error(`account-redirect:${path}`);
  }),
}));

vi.mock("@/utils/auth", () => ({
  auth: () => mocks.auth(),
}));

vi.mock("@/utils/account", () => ({
  redirectToEmailAccountPath: (path: string) =>
    mocks.redirectToEmailAccountPath(path),
}));

import NewLanding from "./page";

describe("NewLanding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(null);
  });

  it("keeps the public landing page for signed-out visitors", async () => {
    const page = await NewLanding();
    const markup = renderToStaticMarkup(page);

    expect(page).toBeTruthy();
    expect(markup).toContain(".fx-hero-chip");
    expect(markup).toContain(".headline .hl-word");
    expect(markup).toContain('src="/home/script.js?v=1202"');
    expect(mocks.redirectToEmailAccountPath).not.toHaveBeenCalled();
  });

  it("opens the Brief page for a remembered session", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });

    await expect(NewLanding()).rejects.toThrow("account-redirect:/chat");

    expect(mocks.redirectToEmailAccountPath).toHaveBeenCalledWith("/chat");
  });
});
