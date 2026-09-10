"use client";

import { useRef, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { fetchWithAccount } from "@/utils/fetch";
import { captureException, getActionErrorMessage } from "@/utils/error";
import { toastError, toastSuccess, toastInfo } from "@/components/Toast";
import { linkSlackWorkspaceAction } from "@/utils/actions/messaging-channels";
import type { GetSlackAuthUrlResponse } from "@/app/api/slack/auth-url/route";
import { redirectToSafeUrl } from "@/utils/redirect";

export function useSlackConnect({
  emailAccountId,
  onConnected,
  openInNewTab = true,
}: {
  emailAccountId: string;
  onConnected?: () => void;
  openInNewTab?: boolean;
}) {
  const [connecting, setConnecting] = useState(false);
  const connectingRef = useRef(false);

  const { executeAsync: linkSlack } = useAction(
    linkSlackWorkspaceAction.bind(null, emailAccountId),
  );

  const connect = async () => {
    if (connecting || connectingRef.current) return;

    connectingRef.current = true;
    setConnecting(true);
    try {
      const res = await fetchWithAccount({
        url: "/api/slack/auth-url",
        emailAccountId,
      });
      if (!res.ok) throw new Error("Impossible de démarrer la connexion Slack");
      const data: GetSlackAuthUrlResponse = await res.json();

      if (data.existingWorkspace) {
        const result = await linkSlack({
          teamId: data.existingWorkspace.teamId,
        });

        if (!result?.serverError && !result?.validationErrors) {
          toastSuccess({ description: "Slack connected" });
          onConnected?.();
          return;
        }

        const linkError = getActionErrorMessage(
          {
            serverError: result?.serverError,
            validationErrors: result?.validationErrors,
          },
          "Failed to link Slack workspace",
        );

        if (linkError.includes("Could not find your Slack account")) {
          toastInfo({
            title: "Email not found in Slack",
            description: "Redirecting to Slack authorization...",
          });
        } else {
          toastInfo({
            title: "Continue in Slack",
            description: "Redirecting to Slack authorization...",
          });
        }
        // Always fall through to OAuth so the user isn't stuck.
      }

      if (data.url) {
        if (openInNewTab) {
          window.open(data.url, "_blank", "noopener,noreferrer");
        } else {
          redirectToSafeUrl(data.url, { allowExternal: true });
        }
      } else {
        throw new Error("Slack n’a renvoyé aucune URL de connexion");
      }
    } catch (error) {
      captureException(error, { extra: { context: "Slack connect" } });
      toastError({
        title: "Impossible de connecter Slack",
        description:
          "La connexion Slack n’est pas encore configurée ou a échoué. Réessayez dans quelques instants.",
      });
    } finally {
      connectingRef.current = false;
      setConnecting(false);
    }
  };

  return { connect, connecting };
}
