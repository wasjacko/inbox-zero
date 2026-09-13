import { NextResponse } from "next/server";
import { withAuth } from "@/utils/middleware";
import prisma from "@/utils/prisma";

export const GET = withAuth("user/day-rate", async (request) => {
  const user = await prisma.user.findUnique({
    where: { id: request.auth.userId },
    select: { freescaleDayRateCents: true },
  });
  return NextResponse.json({
    dayRateCents: user?.freescaleDayRateCents ?? null,
  });
});
