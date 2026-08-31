import { describe, expect, it } from "vitest";
import { appViewport } from "@/app/viewport-config";

describe("mobile viewport", () => {
  it("lets the virtual keyboard resize the app content", () => {
    expect(appViewport.viewportFit).toBe("cover");
    expect(appViewport.interactiveWidget).toBe("resizes-content");
  });
});
