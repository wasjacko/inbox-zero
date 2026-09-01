import { NextResponse } from "next/server";
import { env } from "@/env";
import { normalizeInternalPath } from "@/utils/path";

export function createAccountLinkingRedirect(params?: {
  query?: Record<string, string | null | undefined>;
  returnTo?: string;
  stateCookieName?: string;
}) {
  const returnTo = normalizeInternalPath(params?.returnTo) ?? "/accounts";
  const redirectUrl = new URL(returnTo, env.NEXT_PUBLIC_BASE_URL);

  for (const [key, value] of Object.entries(params?.query ?? {})) {
    if (value != null) {
      redirectUrl.searchParams.set(key, value);
    }
  }

  const response = NextResponse.redirect(redirectUrl);

  if (params?.stateCookieName) {
    response.cookies.delete(params.stateCookieName);
  }

  return response;
}
