import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const suppliedToken = request.headers.get("x-purge-token") ?? "";
  const expectedToken = process.env.ONE_TIME_PURGE_TOKEN ?? "";

  if (!tokensMatch(suppliedToken, expectedToken)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.$transaction(async (transaction) => {
    const before = {
      users: await transaction.user.count(),
      accounts: await transaction.account.count(),
      emailAccounts: await transaction.emailAccount.count(),
      sessions: await transaction.session.count(),
    };

    await transaction.user.deleteMany();

    const after = {
      users: await transaction.user.count(),
      accounts: await transaction.account.count(),
      emailAccounts: await transaction.emailAccount.count(),
      sessions: await transaction.session.count(),
    };

    return { before, after };
  });

  return NextResponse.json(result);
}

function tokensMatch(suppliedToken: string, expectedToken: string) {
  if (!suppliedToken || !expectedToken) return false;

  const supplied = Buffer.from(suppliedToken);
  const expected = Buffer.from(expectedToken);
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  );
}
