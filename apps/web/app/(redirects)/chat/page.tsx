import { Suspense } from "react";
import { ChatPreview } from "@/components/preview/ChatPreview";

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPreview />
    </Suspense>
  );
}
