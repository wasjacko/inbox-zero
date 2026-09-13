export const MUE_REPLIES_EVENT = "freescale:mue-demo-replies";
const storageKey = "freescale:mue-demo-replies:v1";

type DemoReply = {
  id: string;
  conversationId: string;
  name: string;
  channel: "gmail" | "whatsapp";
  body: string;
  sentAt?: string;
};

export function readMueDemoReplies(accountId: string): DemoReply[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(
      localStorage.getItem(`${storageKey}:${accountId}`) ?? "[]",
    );
  } catch {
    return [];
  }
}

export function saveMueDemoReply(accountId: string, reply: DemoReply) {
  const storedReplies = readMueDemoReplies(accountId);
  const previousReply = storedReplies.find((item) => item.id === reply.id);
  const replies = storedReplies.filter((item) => item.id !== reply.id);
  localStorage.setItem(
    `${storageKey}:${accountId}`,
    JSON.stringify([
      ...replies,
      {
        ...reply,
        sentAt:
          reply.sentAt ?? previousReply?.sentAt ?? new Date().toISOString(),
      },
    ]),
  );
  window.dispatchEvent(new Event(MUE_REPLIES_EVENT));
}
