import { NextResponse } from "next/server";
import { withAuth } from "@/utils/middleware";
import { getProductAccess } from "@/utils/trial/access";

export const GET = withAuth("user/product-access", async (request) =>
  NextResponse.json(await getProductAccess(request.auth.userId), {
    headers: { "Cache-Control": "private, no-store" },
  }),
);

export type ProductAccessResponse = Awaited<
  ReturnType<typeof getProductAccess>
>;
