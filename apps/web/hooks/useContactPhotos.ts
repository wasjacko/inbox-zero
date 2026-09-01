"use client";

import { useMemo } from "react";
import useSWR from "swr";
import type { ContactPhotosResponse } from "@/app/api/google/contact-photos/route";
import { useAccount } from "@/providers/EmailAccountProvider";
import { EMAIL_ACCOUNT_HEADER } from "@/utils/config";

export function useContactPhotos(addresses: string[]) {
  const { emailAccountId, provider } = useAccount();
  const emails = useMemo(
    () =>
      [...new Set(addresses.map((address) => address.trim().toLowerCase()))]
        .filter((address) => address.includes("@"))
        .sort(),
    [addresses],
  );
  const cacheKey = emails.join(",");

  const { data } = useSWR<ContactPhotosResponse>(
    provider === "google" && emailAccountId && emails.length
      ? ["/api/google/contact-photos", cacheKey, emailAccountId]
      : null,
    async ([url, _key, activeEmailAccountId]: [string, string, string]) => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [EMAIL_ACCOUNT_HEADER]: activeEmailAccountId,
        },
        body: JSON.stringify({ emails }),
      });
      if (!response.ok) throw new Error("contact_photos_unavailable");
      return response.json();
    },
    {
      dedupingInterval: 5 * 60_000,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  return data?.photos ?? {};
}
