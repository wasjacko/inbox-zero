// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPageData,
  readPageData,
  writePageData,
} from "./preview-data-cache";

describe("preloaded page data", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("restores preloaded data for the same mailbox and query only", () => {
    const data = { threads: [{ id: "thread-1" }] };
    writePageData("account-a", "/api/threads?limit=8", data);
    expect(readPageData("account-a", "/api/threads?limit=8")).toEqual(data);
    expect(readPageData("account-b", "/api/threads?limit=8")).toBeUndefined();
    expect(readPageData("account-a", "/api/threads?limit=100")).toBeUndefined();
    expect(readPageData("", "/api/threads?limit=8")).toBeUndefined();
  });

  it("expires data without extending its lifetime on every navigation", () => {
    writePageData("account-a", "/api/threads", { threads: [] });
    vi.advanceTimersByTime(4 * 60_000);
    expect(readPageData("account-a", "/api/threads")).toEqual({ threads: [] });
    vi.advanceTimersByTime(60_000);
    expect(readPageData("account-a", "/api/threads")).toBeUndefined();
  });

  it("removes mailbox data on logout without clearing unrelated preferences", () => {
    sessionStorage.setItem("theme", "light");
    writePageData("account-a", "/api/threads", { threads: [] });
    writePageData("account-b", "/api/newsletters", { newsletters: [] });
    clearPageData();
    expect(readPageData("account-a", "/api/threads")).toBeUndefined();
    expect(readPageData("account-b", "/api/newsletters")).toBeUndefined();
    expect(sessionStorage.getItem("theme")).toBe("light");
  });

  it("tolerates corrupt cache and storage blocked by the browser", () => {
    writePageData("account-a", "/api/threads", { threads: [] });
    const key = sessionStorage.key(0)!;
    sessionStorage.setItem(key, "not json");
    expect(readPageData("account-a", "/api/threads")).toBeUndefined();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    expect(() => writePageData("account-a", "/api/threads", {})).not.toThrow();
  });
});
