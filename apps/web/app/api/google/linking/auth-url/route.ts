import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { withAuth } from "@/utils/middleware";
import { getLinkingOAuth2Client } from "@/utils/gmail/client";
import { GOOGLE_LINKING_STATE_COOKIE_NAME } from "@/utils/gmail/constants";
import { getGoogleOnboardingLoginHint } from "@/utils/gmail/login-hint";
import { SCOPES } from "@/utils/gmail/scopes";
import { hasActiveAccountLinkingUser } from "@/utils/oauth/account-linking";
import { createOAuthLinkingAuditLogger } from "@/utils/oauth/linking-audit";
import {
  generateSignedOAuthState,
  oauthStateCookieOptions,
} from "@/utils/oauth/state";
import { normalizeInternalPath } from "@/utils/path";
import prisma from "@/utils/prisma";

export type GetAuthLinkUrlResponse = { url: string };

const getAuthUrl = ({
  userId,
  returnTo,
  loginHint,
}: {
  userId: string;
  returnTo?: string;
  loginHint?: string;
}) => {
  const googleAuth = getLinkingOAuth2Client();
  const stateNonce = randomUUID();

  const state = generateSignedOAuthState({
    userId,
    nonce: stateNonce,
    returnTo,
  });

  const url = googleAuth.generateAuthUrl({
    access_type: "offline",
    scope: [...new Set([...SCOPES, "openid", "email"])].join(" "),
    prompt: "consent",
    state,
    ...(loginHint ? { login_hint: loginHint } : {}),
  });

  return { url, state, stateNonce };
};

export const GET = withAuth("google/linking/auth-url", async (request) => {
  const userId = request.auth.userId;
  const hasActiveUser = await hasActiveAccountLinkingUser({
    targetUserId: userId,
    logger: request.logger,
  });

  if (!hasActiveUser) {
    return NextResponse.json(
      { error: "Unauthorized", isKnownError: true, redirectTo: "/logout" },
      { status: 401 },
    );
  }

  const returnTo =
    normalizeInternalPath(request.nextUrl.searchParams.get("returnTo")) ??
    undefined;
  const preferSignedInGoogleAccount =
    request.nextUrl.searchParams.get("preferSignedInGoogleAccount") === "1";
  const loginUser = preferSignedInGoogleAccount
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          accounts: { select: { provider: true } },
        },
      })
    : null;
  const loginHint = getGoogleOnboardingLoginHint({
    preferSignedInGoogleAccount,
    user: loginUser,
  });
  const {
    url: authUrl,
    state,
    stateNonce,
  } = getAuthUrl({
    userId,
    returnTo,
    loginHint,
  });
  const logger = createOAuthLinkingAuditLogger({
    actorUserId: userId,
    logger: request.logger,
    provider: "google",
    stateNonce,
    targetUserId: userId,
  });

  logger.info("OAuth linking flow initiated");

  const response = NextResponse.json({ url: authUrl });

  response.cookies.set(
    GOOGLE_LINKING_STATE_COOKIE_NAME,
    state,
    oauthStateCookieOptions,
  );

  return response;
});
