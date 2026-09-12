import { NextResponse } from "next/server";
import { NewsletterStatus } from "@/generated/prisma/enums";
import { withEmailProvider } from "@/utils/middleware";
import prisma from "@/utils/prisma";
import { getEmailAccountWithAi } from "@/utils/user/get";
import { filterThreadsByMutedSenders } from "@/utils/channels/muted-threads";
import { detectBriefTasks } from "@/utils/ai/brief/detect-brief-tasks";

export const maxDuration = 60;

export const GET = withEmailProvider("user/brief-tasks", async (request) => {
  const emailAccountId = request.auth.emailAccountId;
  const [emailAccount, page, muted] = await Promise.all([
    getEmailAccountWithAi({ emailAccountId }),
    request.emailProvider.getThreadsWithQuery({
      query: { type: "inbox" },
      maxResults: 20,
      messageFormat: "full",
    }),
    prisma.newsletter.findMany({
      where: {
        emailAccountId,
        status: {
          in: [NewsletterStatus.UNSUBSCRIBED, NewsletterStatus.AUTO_ARCHIVED],
        },
      },
      select: { email: true },
    }),
  ]);
  if (!emailAccount)
    return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
  const visibleThreads = filterThreadsByMutedSenders(
    page.threads,
    muted.map(({ email }) => email),
  );
  const tasks = await detectBriefTasks({
    emailAccount,
    threads: visibleThreads,
  });
  return NextResponse.json(
    { tasks },
    {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
      },
    },
  );
});
