import { canonicalizeEmailAddress } from "@/utils/email";

type ThreadWithSenders = {
  messages: { headers?: { from?: string } }[];
};

export function filterThreadsByMutedSenders<T extends ThreadWithSenders>(
  threads: T[],
  senderEmails: Iterable<string>,
) {
  const mutedSenders = new Set(
    [...senderEmails].map(canonicalizeEmailAddress).filter(Boolean),
  );
  if (mutedSenders.size === 0) return threads;

  return threads.filter(
    (thread) =>
      !thread.messages.some((message) => {
        const from = message.headers?.from;
        return from ? mutedSenders.has(canonicalizeEmailAddress(from)) : false;
      }),
  );
}
