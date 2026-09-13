import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readMueDemoReplies, saveMueDemoReply } from "./mue-demo-replies";

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
});
afterEach(() => vi.unstubAllGlobals());

it("retains a reply once and isolates accounts", () => {
  const reply = {
    id: "message:maya",
    conversationId: "maya",
    name: "Maya",
    channel: "gmail" as const,
    body: "Bonjour",
  };
  saveMueDemoReply("account-a", reply);
  saveMueDemoReply("account-a", { ...reply, body: "Bonjour Maya" });
  expect(readMueDemoReplies("account-a")).toEqual([
    { ...reply, body: "Bonjour Maya" },
  ]);
  expect(readMueDemoReplies("account-b")).toEqual([]);
});

it("does not silently report a successful send when storage fails", () => {
  vi.stubGlobal("localStorage", {
    getItem: () => null,
    setItem: () => {
      throw new Error("quota");
    },
  });
  expect(() =>
    saveMueDemoReply("account-a", {
      id: "reply",
      conversationId: "maya",
      name: "Maya",
      channel: "gmail",
      body: "Bonjour",
    }),
  ).toThrow("quota");
});
