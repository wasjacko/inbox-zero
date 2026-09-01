import type { people_v1 } from "@googleapis/people";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContactsClient } from "@/utils/gmail/client";
import { withEmailAccount } from "@/utils/middleware";
import prisma from "@/utils/prisma";

const contactPhotosBody = z.object({
  emails: z.array(z.string().email()).max(30),
});

export type ContactPhotosResponse = {
  photos: Record<string, string>;
  requiresContactsPermission: boolean;
};

export const POST = withEmailAccount(
  "google/contact-photos",
  async (request) => {
    const { emails } = contactPhotosBody.parse(await request.json());
    const normalizedEmails = new Set(
      emails.map((email) => email.trim().toLowerCase()),
    );

    if (normalizedEmails.size === 0) {
      return NextResponse.json<ContactPhotosResponse>({
        photos: {},
        requiresContactsPermission: false,
      });
    }

    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id: request.auth.emailAccountId },
      select: {
        account: {
          select: {
            access_token: true,
            refresh_token: true,
            provider: true,
          },
        },
      },
    });

    if (emailAccount?.account.provider !== "google") {
      return NextResponse.json<ContactPhotosResponse>({
        photos: {},
        requiresContactsPermission: false,
      });
    }

    const client = getContactsClient({
      accessToken: emailAccount.account.access_token,
      refreshToken: emailAccount.account.refresh_token,
    });

    const photos: Record<string, string> = {};
    let requiresContactsPermission = false;

    try {
      Object.assign(
        photos,
        await findSavedContactPhotos(client, normalizedEmails),
      );
    } catch (error) {
      requiresContactsPermission = true;
      request.logger.warn("Unable to load saved Google contact photos", {
        error,
      });
    }

    const missingEmails = new Set(
      [...normalizedEmails].filter((email) => !photos[email]),
    );
    if (missingEmails.size > 0) {
      try {
        Object.assign(
          photos,
          await findOtherContactPhotos(client, missingEmails),
        );
      } catch (error) {
        requiresContactsPermission = true;
        request.logger.warn("Unable to load automatic Google contact photos", {
          error,
        });
      }
    }

    return NextResponse.json<ContactPhotosResponse>({
      photos,
      requiresContactsPermission,
    });
  },
);

async function findSavedContactPhotos(
  client: people_v1.People,
  wantedEmails: Set<string>,
) {
  const photos: Record<string, string> = {};
  let pageToken: string | undefined;
  let pageCount = 0;

  do {
    const response = await client.people.connections.list({
      resourceName: "people/me",
      personFields: "emailAddresses,photos",
      pageSize: 1000,
      pageToken,
      sources: ["READ_SOURCE_TYPE_CONTACT", "READ_SOURCE_TYPE_PROFILE"],
    });

    collectPhotos(response.data.connections, wantedEmails, photos);

    pageToken = response.data.nextPageToken ?? undefined;
    pageCount += 1;
  } while (
    pageToken &&
    pageCount < 5 &&
    Object.keys(photos).length < wantedEmails.size
  );

  return photos;
}

async function findOtherContactPhotos(
  client: people_v1.People,
  wantedEmails: Set<string>,
) {
  const photos: Record<string, string> = {};
  let pageToken: string | undefined;
  let pageCount = 0;

  do {
    const response = await client.otherContacts.list({
      readMask: "emailAddresses,photos",
      pageSize: 1000,
      pageToken,
      sources: ["READ_SOURCE_TYPE_CONTACT", "READ_SOURCE_TYPE_PROFILE"],
    });

    collectPhotos(response.data.otherContacts, wantedEmails, photos);
    pageToken = response.data.nextPageToken ?? undefined;
    pageCount += 1;
  } while (
    pageToken &&
    pageCount < 5 &&
    Object.keys(photos).length < wantedEmails.size
  );

  return photos;
}

function collectPhotos(
  people: people_v1.Schema$Person[] | null | undefined,
  wantedEmails: Set<string>,
  photos: Record<string, string>,
) {
  for (const person of people ?? []) {
    const photo = person.photos?.find(
      ({ default: isDefault }) => !isDefault,
    )?.url;
    if (!photo) continue;

    for (const emailAddress of person.emailAddresses ?? []) {
      const email = emailAddress.value?.trim().toLowerCase();
      if (email && wantedEmails.has(email)) photos[email] = photo;
    }
  }
}
