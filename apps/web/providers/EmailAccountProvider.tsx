"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";
import type { GetEmailAccountsResponse } from "@/app/api/user/email-accounts/route";
import { setLastEmailAccountAction } from "@/utils/actions/email-account-cookie";

type Context = {
  emailAccount: GetEmailAccountsResponse["emailAccounts"][number] | undefined;
  emailAccountId: string;
  userEmail: string;
  isLoading: boolean;
  provider: string;
  providerRateLimit:
    | GetEmailAccountsResponse["emailAccounts"][number]["providerRateLimit"]
    | null;
  refreshAccounts: () => Promise<GetEmailAccountsResponse | null>;
};

const EmailAccountContext = createContext<Context | undefined>(undefined);

const previewContextValue: Context = {
  emailAccount: undefined,
  emailAccountId: "",
  userEmail: "",
  isLoading: false,
  provider: "",
  providerRateLimit: null,
  refreshAccounts: async () => null,
};

export function EmailAccountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ emailAccountId: string | undefined }>();
  const emailAccountId = params.emailAccountId;
  const [data, setData] = useState<GetEmailAccountsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAccounts = useCallback(async () => {
    try {
      // Not using SWR here because this will lead to a circular provider tree.
      const response = await fetch(
        `/api/user/email-accounts?refreshedAt=${Date.now()}`,
        { cache: "no-store" },
      );
      if (response.status === 401) {
        window.location.replace("/login");
        return null;
      }
      if (!response.ok) return null;

      const result: GetEmailAccountsResponse = await response.json();
      setData(result);
      return result;
    } catch (error) {
      console.error("Error fetching accounts:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  useEffect(() => {
    if (emailAccountId) {
      setLastEmailAccountAction({ emailAccountId }).catch(() => {});
    }
  }, [emailAccountId]);

  const lastKnownEmailAccountId = data?.lastEmailAccountId ?? null;

  const emailAccount = useMemo(() => {
    if (data?.emailAccounts) {
      // Priority: URL param > last known from cookie > first account
      const currentEmailAccount =
        data.emailAccounts.find((acc) => acc.id === emailAccountId) ??
        data.emailAccounts.find((acc) => acc.id === lastKnownEmailAccountId) ??
        data.emailAccounts[0];

      return currentEmailAccount;
    }
  }, [data, emailAccountId, lastKnownEmailAccountId]);

  const resolvedEmailAccountId = emailAccountId ?? emailAccount?.id ?? "";

  return (
    <EmailAccountContext.Provider
      value={{
        emailAccount,
        isLoading,
        emailAccountId: resolvedEmailAccountId,
        userEmail: emailAccount?.email ?? "",
        provider: emailAccount?.account?.provider ?? "",
        providerRateLimit: emailAccount?.providerRateLimit ?? null,
        refreshAccounts,
      }}
    >
      {children}
    </EmailAccountContext.Provider>
  );
}

export function EmailAccountPreviewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EmailAccountContext.Provider value={previewContextValue}>
      {children}
    </EmailAccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(EmailAccountContext);

  if (context === undefined) {
    throw new Error(
      "useEmailAccount must be used within an EmailAccountProvider",
    );
  }

  return context;
}
