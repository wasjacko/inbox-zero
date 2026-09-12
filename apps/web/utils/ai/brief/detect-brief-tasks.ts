import { z } from "zod";
import type { EmailAccountWithAI } from "@/utils/llms/types";
import type { EmailThread } from "@/utils/email/types";
import { createGenerateObject } from "@/utils/llms";
import { getModelForUseCase, LlmUseCase } from "@/utils/llms/use-cases";
import {
  extractEmailAddress,
  extractNameFromEmail,
  isSameEmailAddress,
} from "@/utils/email";

export type MueBriefTask = {
  threadId: string;
  title: string;
  summary: string;
  senderName: string;
  senderEmail: string;
  subject: string;
};

export async function detectBriefTasks({
  emailAccount,
  threads,
}: {
  emailAccount: EmailAccountWithAI & { name: string | null };
  threads: EmailThread[];
}): Promise<MueBriefTask[]> {
  const candidates = threads
    .flatMap((thread) => {
      const messages = [...thread.messages].sort(
        (a, b) => Number(a.internalDate ?? 0) - Number(b.internalDate ?? 0),
      );
      const latest = messages.at(-1);
      if (
        !latest ||
        isSameEmailAddress(latest.headers.from, emailAccount.email)
      )
        return [];
      const senderEmail = extractEmailAddress(latest.headers.from);
      const senderName =
        extractNameFromEmail(latest.headers.from).replace(/^"|"$/g, "") ||
        senderEmail.split("@")[0] ||
        "Contact";
      return [
        {
          threadId: thread.id,
          senderEmail,
          senderName,
          subject: latest.subject || "Sans objet",
          messages: messages.slice(-3).map((message) => ({
            direction: isSameEmailAddress(
              message.headers.from,
              emailAccount.email,
            )
              ? "sent"
              : "received",
            text: (message.textPlain || message.snippet || "").slice(0, 1800),
          })),
        },
      ];
    })
    .slice(0, 20);
  if (!candidates.length) return [];

  const modelOptions = getModelForUseCase(
    emailAccount.user,
    LlmUseCase.Summarise,
  );
  const generateObject = createGenerateObject({
    emailAccount,
    label: "Mue brief task detection",
    modelOptions,
    promptHardening: { trust: "untrusted", level: "full" },
  });
  const result = await generateObject({
    ...modelOptions,
    system: `Tu es Mue, l'assistant de travail de Freescale. Tu dois repérer uniquement les tâches réelles, explicites et encore à accomplir par l'utilisateur dans ses conversations email récentes.

Une tâche valide exige une demande concrète adressée à l'utilisateur (envoyer, répondre avec une information, valider, préparer, corriger, planifier, livrer, rappeler, payer, etc.).

Exclus impérativement : newsletters, publicités, prospection, réseaux sociaux, notifications automatiques, reçus, confirmations, alertes, contenus éditoriaux, invitations génériques, informations sans demande, actions demandées à quelqu'un d'autre, demandes déjà satisfaites dans un message envoyé plus récent, et toute déduction incertaine.

Ne crée jamais une tâche à partir du seul objet ou d'un mot isolé. Lis le fil. En cas de doute, n'inclus rien. Retourne au maximum trois tâches, les plus urgentes et concrètes, en français. Le threadId doit être recopié exactement depuis l'entrée correspondante.`,
    prompt: candidates
      .map(
        (candidate) => `<conversation threadId="${candidate.threadId}">
<sender>${candidate.senderName} &lt;${candidate.senderEmail}&gt;</sender>
<subject>${candidate.subject}</subject>
${candidate.messages.map((message) => `<message direction="${message.direction}">${message.text}</message>`).join("\n")}
</conversation>`,
      )
      .join("\n\n"),
    schema: z.object({
      tasks: z
        .array(
          z.object({
            threadId: z.string(),
            title: z.string().max(100),
            summary: z.string().max(240),
          }),
        )
        .max(3),
    }),
  });
  const byId = new Map(
    candidates.map((candidate) => [candidate.threadId, candidate]),
  );
  return result.object.tasks.flatMap((task) => {
    const candidate = byId.get(task.threadId);
    return candidate
      ? [
          {
            threadId: task.threadId,
            title: task.title,
            summary: task.summary,
            senderName: candidate.senderName,
            senderEmail: candidate.senderEmail,
            subject: candidate.subject,
          },
        ]
      : [];
  });
}
