import { describe, expect, it, vi } from "vitest";

vi.mock("@/utils/branding", () => ({
  BRAND_ICON_URL: "/icon.png",
  BRAND_NAME: "Freescale",
}));

import manifest from "@/app/manifest";

describe("mobile app manifest", () => {
  it("launches the installed app inside the Freescale workspace", () => {
    const value = manifest();

    expect(value.name).toBe("Freescale");
    expect(value.lang).toBe("fr");
    expect(value.display).toBe("standalone");
    expect(value.start_url).toBe("/chat");
    expect(value.scope).toBe("/");
    expect(value.orientation).toBeUndefined();
  });

  it("provides adaptive icons and useful mobile shortcuts", () => {
    const value = manifest();
    const icons = value.icons ?? [];

    expect(icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sizes: "192x192",
          purpose: "any maskable",
        }),
        expect.objectContaining({
          sizes: "512x512",
          purpose: "any maskable",
        }),
      ]),
    );
    expect(value.shortcuts?.map(({ url }) => url)).toEqual([
      "/chat",
      "/channels-v4",
      "/tasks",
    ]);
  });
});
