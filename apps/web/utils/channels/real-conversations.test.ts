import { describe, expect, it } from "vitest";
import { toRealChannelConversations } from "./real-conversations";

describe("toRealChannelConversations", () => {
  it("maps a Gmail thread to a real Freescale conversation", () => {
    const [conversation] = toRealChannelConversations({
      provider: "google",
      userEmail: "owner@example.com",
      threads: [
        {
          id: "thread-1",
          snippet: "Dernier aperçu",
          plan: undefined,
          plans: [],
          messages: [
            message({
              id: "received",
              headers: {
                from: "Sarah Lemoine <sarah@client.fr>",
                to: "owner@example.com",
              },
              labelIds: ["INBOX", "UNREAD", "STARRED"],
              snippet: "Bonjour, voici le brief.",
            }),
          ],
        },
      ],
    });

    expect(conversation).toMatchObject({
      id: "thread-1",
      name: "Sarah Lemoine",
      initials: "SL",
      address: "sarah@client.fr",
      channel: "gmail",
      subject: "Projet Atlas",
      preview: "Bonjour, voici le brief.",
      unread: true,
      starred: true,
    });
    expect(conversation).not.toHaveProperty("contactType");
    expect(conversation?.messages[0]).toMatchObject({
      id: "received",
      author: "contact",
      body: "Bonjour, voici le brief.",
    });
  });

  it("uses the external recipient for a sent-only thread", () => {
    const [conversation] = toRealChannelConversations({
      provider: "google",
      userEmail: "owner@example.com",
      threads: [
        {
          id: "thread-sent",
          snippet: "Devis envoyé",
          plan: undefined,
          plans: [],
          messages: [
            message({
              headers: {
                from: "owner@example.com",
                to: "Jon <jon@client.fr>",
              },
              labelIds: ["SENT"],
            }),
          ],
        },
      ],
    });

    expect(conversation).toMatchObject({
      name: "jon",
      address: "jon@client.fr",
    });
    expect(conversation?.messages[0]?.author).toBe("me");
  });
});

function message({
  headers,
  id = "message-1",
  labelIds = ["INBOX"],
  snippet = "Message",
}: {
  headers: { from: string; to: string };
  id?: string;
  labelIds?: string[];
  snippet?: string;
}) {
  return {
    id,
    threadId: "thread-1",
    snippet,
    subject: "Projet Atlas",
    date: "2026-09-01T08:30:00.000Z",
    internalDate: "1788251400000",
    labelIds,
    headers: {
      ...headers,
      date: "2026-09-01T08:30:00.000Z",
      subject: "Projet Atlas",
    },
  };
}
