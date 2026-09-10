"use server";

import {
  setSenderStatusBody,
  setFreescaleSenderVisibilityBody,
  setFreescaleSendersVisibilityBody,
  unsubscribeSenderBody,
} from "@/utils/actions/unsubscriber.validation";
import { actionClient } from "@/utils/actions/safe-action";
import { createEmailProvider } from "@/utils/email/provider";
import { NewsletterStatus } from "@/generated/prisma/enums";
import {
  setSenderStatusWithAutoArchive,
  setSenderStatus,
  setSenderStatuses,
  unsubscribeSenderAndMark,
} from "@/utils/senders/unsubscribe";

export const setFreescaleSenderVisibilityAction = actionClient
  .metadata({ name: "setFreescaleSenderVisibility" })
  .inputSchema(setFreescaleSenderVisibilityBody)
  .action(
    async ({ parsedInput: { senderEmail, hidden }, ctx: { emailAccountId } }) =>
      setSenderStatus({
        emailAccountId,
        senderEmail,
        status: hidden ? NewsletterStatus.UNSUBSCRIBED : null,
      }),
  );

export const setFreescaleSendersVisibilityAction = actionClient
  .metadata({ name: "setFreescaleSendersVisibility" })
  .inputSchema(setFreescaleSendersVisibilityBody)
  .action(
    async ({
      parsedInput: { senderEmails, hidden },
      ctx: { emailAccountId },
    }) =>
      setSenderStatuses({
        emailAccountId,
        senderEmails,
        status: hidden ? NewsletterStatus.UNSUBSCRIBED : null,
      }),
  );

export const setSenderStatusAction = actionClient
  .metadata({ name: "setSenderStatus" })
  .inputSchema(setSenderStatusBody)
  .action(
    async ({
      parsedInput: { senderEmail, status, labelId, labelName },
      ctx: { emailAccountId, provider, logger },
    }) => {
      const emailProvider = await createEmailProvider({
        emailAccountId,
        provider,
        logger,
      });

      return setSenderStatusWithAutoArchive({
        emailAccountId,
        emailProvider,
        senderEmail,
        status,
        labelId,
        labelName,
      });
    },
  );

export const unsubscribeSenderAction = actionClient
  .metadata({ name: "unsubscribeSender" })
  .inputSchema(unsubscribeSenderBody)
  .action(
    async ({
      parsedInput: { senderEmail, unsubscribeLink, listUnsubscribeHeader },
      ctx: { emailAccountId, logger },
    }) =>
      unsubscribeSenderAndMark({
        emailAccountId,
        senderEmail,
        unsubscribeLink,
        listUnsubscribeHeader,
        logger,
      }),
  );
