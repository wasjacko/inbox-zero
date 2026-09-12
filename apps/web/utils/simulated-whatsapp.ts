export const SIMULATED_WHATSAPP_STORAGE_KEY =
  "freescale-simulated-whatsapp-accounts";
export const SIMULATED_WHATSAPP_EVENT = "freescale:simulated-whatsapp-change";
export const SIMULATED_WHATSAPP_PENDING_ACCOUNT_ID = "__onboarding__";

export function isSimulatedWhatsAppConnected(
  storage: Pick<Storage, "getItem">,
  emailAccountId: string,
) {
  if (!emailAccountId) return false;

  try {
    const value = JSON.parse(
      storage.getItem(SIMULATED_WHATSAPP_STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(value) && value.includes(emailAccountId);
  } catch {
    return false;
  }
}

export function setSimulatedWhatsAppConnected(
  emailAccountId: string,
  connected: boolean,
) {
  if (!emailAccountId) return;

  let accountIds: string[] = [];
  try {
    const value = JSON.parse(
      window.localStorage.getItem(SIMULATED_WHATSAPP_STORAGE_KEY) ?? "[]",
    );
    if (Array.isArray(value)) {
      accountIds = value.filter(
        (accountId): accountId is string => typeof accountId === "string",
      );
    }
  } catch {
    accountIds = [];
  }

  const nextAccountIds = connected
    ? [...new Set([...accountIds, emailAccountId])]
    : accountIds.filter((accountId) => accountId !== emailAccountId);

  window.localStorage.setItem(
    SIMULATED_WHATSAPP_STORAGE_KEY,
    JSON.stringify(nextAccountIds),
  );
  window.dispatchEvent(new Event(SIMULATED_WHATSAPP_EVENT));
}
