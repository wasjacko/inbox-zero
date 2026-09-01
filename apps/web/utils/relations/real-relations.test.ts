import { describe, expect, it } from "vitest";
import { toRealRelations } from "./real-relations";

describe("toRealRelations", () => {
  it("groups conversations by normalized email address", () => {
    const relations = toRealRelations([
      conversation({ id: "new", address: "Client@Example.com", unread: true }),
      conversation({ id: "old", address: "client@example.com", unread: false }),
    ]);

    expect(relations).toEqual([
      expect.objectContaining({
        latestThreadId: "new",
        conversationCount: 2,
        unreadCount: 1,
      }),
    ]);
  });

  it("keeps the first conversation as the latest one", () => {
    const relations = toRealRelations([
      conversation({ id: "latest", subject: "Sujet récent" }),
      conversation({ id: "older", subject: "Ancien sujet" }),
    ]);

    expect(relations[0]?.latestSubject).toBe("Sujet récent");
  });
});

function conversation(
  overrides: Partial<Parameters<typeof toRealRelations>[0][number]>,
): Parameters<typeof toRealRelations>[0][number] {
  return {
    id: "thread",
    name: "Client Test",
    initials: "CT",
    address: "client@example.com",
    channel: "gmail",
    contactType: "client",
    subject: "Sujet",
    preview: "Aperçu",
    time: "Aujourd’hui · 10:00",
    unread: false,
    starred: false,
    attachment: false,
    messages: [],
    ...overrides,
  };
}
