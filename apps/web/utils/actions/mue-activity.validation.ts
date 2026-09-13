import { z } from "zod";

export const recordMueDemoReplySchema = z
  .object({
    externalId: z.string().trim().min(1).max(250),
    conversationId: z.enum(["maya", "mue-theo"]),
    sentAt: z.iso.datetime().optional(),
  })
  .refine(
    ({ externalId, conversationId }) =>
      externalId.endsWith(
        conversationId === "maya" ? ":reply-maya" : ":reply-theo",
      ),
    { message: "La réponse ne correspond pas à cette conversation." },
  );

export const saveFreescaleDayRateSchema = z.object({
  dayRateCents: z.number().int().min(0).max(10_000_000).nullable(),
});
