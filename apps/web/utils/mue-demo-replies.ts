export const MUE_REPLIES_EVENT = "freescale:mue-demo-replies";
const storageKey = "freescale:mue-demo-replies:v1";

type DemoReply = {
  id: string;
  conversationId: string;
  name: string;
  channel: "gmail" | "whatsapp";
  body: string;
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
  const replies = readMueDemoReplies(accountId).filter(
    (item) => item.id !== reply.id,
  );
  localStorage.setItem(
    `${storageKey}:${accountId}`,
    JSON.stringify([...replies, reply]),
  );
  window.dispatchEvent(new Event(MUE_REPLIES_EVENT));
}
