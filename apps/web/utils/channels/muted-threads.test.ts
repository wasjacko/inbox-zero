import { describe, expect, it } from "vitest";
import { filterThreadsByMutedSenders } from "./muted-threads";

describe("filterThreadsByMutedSenders", () => {
  it("removes every thread containing a muted sender", () => {
    const threads = [
      {
        id: "muted",
        messages: [
          { headers: { from: "Newsletter <NEWS@example.com>" } },
          { headers: { from: "me@example.com" } },
        ],
      },
      {
        id: "visible",
        messages: [{ headers: { from: "client@example.com" } }],
      },
    ];

    expect(filterThreadsByMutedSenders(threads, ["news@example.com"])).toEqual([
      threads[1],
    ]);
  });

  it("keeps threads without a matching sender", () => {
    const threads = [
      { id: "visible", messages: [{ headers: { from: "a@example.com" } }] },
    ];

    expect(filterThreadsByMutedSenders(threads, [])).toBe(threads);
  });
});
