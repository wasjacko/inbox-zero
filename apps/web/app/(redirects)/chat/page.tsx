import { ChatPreview } from "@/components/preview/ChatPreview";

const chatViews = ["brief", "ask", "history", "assistant"] as const;
type ChatView = (typeof chatViews)[number];

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ chatView?: string; onboarding?: string }>;
}) {
  const params = await searchParams;
  const initialView = chatViews.includes(params.chatView as ChatView)
    ? (params.chatView as ChatView)
    : "brief";

  return (
    <ChatPreview
      initialView={initialView}
      onboardingComplete={params.onboarding === "complete"}
    />
  );
}
