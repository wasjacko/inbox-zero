import { describe, expect, it } from "vitest";
import { getPreviewWorkspaceInitial } from "./preview-workspace";

describe("getPreviewWorkspaceInitial", () => {
  it.each([
    ["Atelier Ayumi", "A"],
    ["  studio nova", "S"],
    ["Élan créatif", "É"],
    ["42 Studio", "4"],
    ["---", "E"],
    ["", "E"],
  ])("uses the first meaningful character from %s", (name, expected) => {
    expect(getPreviewWorkspaceInitial(name)).toBe(expected);
  });
});
