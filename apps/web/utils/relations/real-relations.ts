import type { RealChannelConversation } from "@/utils/channels/real-conversations";

export type RealRelation = {
  address: string;
  channel: "gmail" | "outlook";
  conversationCount: number;
  initials: string;
  latestSubject: string;
  latestThreadId: string;
  name: string;
  time: string;
  unreadCount: number;
};

export function toRealRelations(
  conversations: RealChannelConversation[],
): RealRelation[] {
  const relations = new Map<string, RealRelation>();

  for (const conversation of conversations) {
    const key = conversation.address.trim().toLocaleLowerCase("fr");
    if (!key) continue;
    const existing = relations.get(key);
    if (existing) {
      existing.conversationCount += 1;
      existing.unreadCount += Number(conversation.unread);
      continue;
    }

    relations.set(key, {
      address: conversation.address,
      channel: conversation.channel,
      conversationCount: 1,
      initials: conversation.initials,
      latestSubject: conversation.subject,
      latestThreadId: conversation.id,
      name: conversation.name,
      time: conversation.time,
      unreadCount: Number(conversation.unread),
    });
  }

  return [...relations.values()];
}
