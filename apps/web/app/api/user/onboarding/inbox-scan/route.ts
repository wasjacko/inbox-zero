import { NextResponse } from "next/server";
import { EMAIL_ACCOUNT_HEADER } from "@/utils/config";
import type { EmailProvider } from "@/utils/email/types";
import { withEmailProvider } from "@/utils/middleware";

export type GetOnboardingInboxScanResponse = Awaited<
  ReturnType<typeof getInboxScan>
>;

export const GET = withEmailProvider(
  "user/onboarding/inbox-scan",
  async (request) => {
    const result = await getInboxScan(request.emailProvider);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        Vary: `Cookie, ${EMAIL_ACCOUNT_HEADER}`,
      },
    });
  },
);

async function getInboxScan(emailProvider: EmailProvider) {
  const { total, unread } = await emailProvider.getInboxStats({ exact: true });

  return {
    totalCount: total,
    unreadCount: unread,
  };
}
