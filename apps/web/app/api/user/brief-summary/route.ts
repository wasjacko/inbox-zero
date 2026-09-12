import { NextResponse } from "next/server";
import { withEmailProvider } from "@/utils/middleware";

export const GET = withEmailProvider("user/brief-summary", async (request) => {
  const { unread } = await request.emailProvider.getInboxStats();
  return NextResponse.json(
    { unreadEmails: unread },
    {
      headers: { "Cache-Control": "private, no-store" },
    },
  );
});
