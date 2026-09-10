import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import type { NewsletterStatus } from "@/generated/prisma/enums";
import { canonicalizeEmailAddress } from "@/utils/email";
import prisma from "@/utils/prisma";

type NewsletterRecordChanges = {
  categoryId?: string | null;
  lastAnalyzedAt?: Date | null;
  name?: string | null;
  patternAnalyzed?: boolean;
  status?: NewsletterStatus | null;
};

export function extractEmailOrThrow(senderEmail: string) {
  const email = canonicalizeEmailAddress(senderEmail);
  if (!email) throw new Error("Invalid sender email address");
  return email;
}

export async function upsertSenderRecord({
  emailAccountId,
  senderEmail,
  changes,
}: {
  emailAccountId: string;
  senderEmail: string;
  changes: NewsletterRecordChanges;
}) {
  const email = extractEmailOrThrow(senderEmail);

  const existing = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id"
    FROM "Newsletter"
    WHERE "emailAccountId" = ${emailAccountId}
      AND LOWER("email") = ${email}
  `;

  if (existing.length > 0) {
    const [updated] = await prisma.newsletter.updateManyAndReturn({
      where: { id: { in: existing.map(({ id }) => id) } },
      data: changes,
    });

    if (updated) return updated;
  }

  return prisma.newsletter.upsert({
    where: {
      email_emailAccountId: { email, emailAccountId },
    },
    create: {
      email,
      emailAccountId,
      ...changes,
    },
    update: changes,
  });
}

export async function upsertSenderRecords({
  emailAccountId,
  senderEmails,
  changes,
}: {
  emailAccountId: string;
  senderEmails: string[];
  changes: { status: NewsletterStatus | null };
}) {
  const emails = [
    ...new Set(
      senderEmails.map((senderEmail) => extractEmailOrThrow(senderEmail)),
    ),
  ];
  if (emails.length === 0) return { count: 0, senderEmails: emails };

  const rows = emails.map(
    (email) => Prisma.sql`(${randomUUID()}::text, ${email}::text)`,
  );

  // One database round trip updates legacy casing variants and inserts any
  // missing normalized sender records. This replaces N server actions and up
  // to 2N database calls in the bulk visibility flow.
  await prisma.$executeRaw`
    WITH input("id", "email") AS (
      VALUES ${Prisma.join(rows)}
    ), updated AS (
      UPDATE "Newsletter" AS newsletter
      SET
        "status" = ${changes.status}::"NewsletterStatus",
        "updatedAt" = NOW()
      FROM input
      WHERE newsletter."emailAccountId" = ${emailAccountId}
        AND LOWER(newsletter."email") = input."email"
      RETURNING LOWER(newsletter."email") AS "email"
    )
    INSERT INTO "Newsletter" (
      "id",
      "email",
      "emailAccountId",
      "status",
      "createdAt",
      "updatedAt"
    )
    SELECT
      input."id",
      input."email",
      ${emailAccountId},
      ${changes.status}::"NewsletterStatus",
      NOW(),
      NOW()
    FROM input
    WHERE NOT EXISTS (
      SELECT 1 FROM updated WHERE updated."email" = input."email"
    )
    ON CONFLICT ("email", "emailAccountId") DO UPDATE SET
      "status" = EXCLUDED."status",
      "updatedAt" = NOW()
  `;

  return { count: emails.length, senderEmails: emails };
}
