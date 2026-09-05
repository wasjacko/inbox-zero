import { describe, expect, it } from "vitest";
import { syncChannelSetupStep } from "./usePreviewSetupProgress";

describe("syncChannelSetupStep", () => {
  it("only completes the channel step when a real channel exists", () => {
    expect(syncChannelSetupStep([false, true, false, true], ["gmail"])).toEqual(
      [true, true, false, true],
    );
  });

  it("clears a stale completed channel step when the server has no channel", () => {
    expect(syncChannelSetupStep([true, true, false, false], [])).toEqual([
      false,
      true,
      false,
      false,
    ]);
  });
});
