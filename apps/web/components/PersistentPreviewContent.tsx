"use client";

import { usePathname } from "next/navigation";
import { ChatPreview } from "@/components/preview/ChatPreview";
import { cn } from "@/utils";

function isChatPath(pathname: string) {
  return pathname === "/chat" || /^\/[^/]+\/chat$/.test(pathname);
}

export function PersistentPreviewContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const chatIsVisible = isChatPath(pathname);

  return (
    <>
      <div
        aria-hidden={!chatIsVisible}
        className={cn("min-h-0 min-w-0 flex-1", !chatIsVisible && "hidden")}
      >
        <ChatPreview />
      </div>
      <div
        aria-hidden={chatIsVisible}
        className={cn("min-h-0 min-w-0 flex-1", chatIsVisible && "hidden")}
      >
        {children}
      </div>
    </>
  );
}
