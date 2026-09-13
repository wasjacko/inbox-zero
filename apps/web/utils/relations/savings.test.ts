import { expect, it } from "vitest";
import {
  estimateSavingsValueCents,
  formatSavingsTime,
  MUE_REPLY_ESTIMATE_SECONDS,
  MUE_SHARED_CONTEXT_ESTIMATE_SECONDS,
} from "./savings";

it("estimates eighteen minutes for two replies with shared context and values them only with a day rate", () => {
  const duration =
    2 * MUE_REPLY_ESTIMATE_SECONDS + MUE_SHARED_CONTEXT_ESTIMATE_SECONDS;
  expect(formatSavingsTime(duration)).toBe("18 min");
  expect(estimateSavingsValueCents(duration, null)).toBeNull();
  expect(estimateSavingsValueCents(duration, 50_000)).toBe(1875);
});
