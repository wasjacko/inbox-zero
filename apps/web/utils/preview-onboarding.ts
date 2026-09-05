export const PREVIEW_ONBOARDING_STATUS_KEY =
  "freescale-preview-onboarding-status";
export const PREVIEW_CONNECTED_CHANNELS_KEY =
  "freescale-preview-connected-channels";
export const PREVIEW_CONNECTED_CHANNELS_EVENT =
  "freescale:connected-channels-change";
export const PREVIEW_POST_ONBOARDING_SORT_PARAM = "postOnboardingSort";

export const PREVIEW_ONBOARDING_ACCESS_VALUES = [
  "completed",
  "skipped",
] as const;

export type PreviewOnboardingAccess =
  (typeof PREVIEW_ONBOARDING_ACCESS_VALUES)[number];

export function hasPreviewOnboardingAccess(storage: Pick<Storage, "getItem">) {
  const value = storage.getItem(PREVIEW_ONBOARDING_STATUS_KEY);
  return PREVIEW_ONBOARDING_ACCESS_VALUES.some((status) => status === value);
}

export function grantPreviewOnboardingAccess(
  storage: Pick<Storage, "setItem">,
  status: PreviewOnboardingAccess,
) {
  storage.setItem(PREVIEW_ONBOARDING_STATUS_KEY, status);
}

export function startPreviewOnboarding(storage: Pick<Storage, "setItem">) {
  storage.setItem(PREVIEW_ONBOARDING_STATUS_KEY, "pending");
}

export function getPreviewOnboardingDestination(connectedChannels: string[]) {
  return connectedChannels.length > 0
    ? `/chat?onboarding=complete&${PREVIEW_POST_ONBOARDING_SORT_PARAM}=1`
    : "/setup?onboarding=complete";
}

export function getVerifiedMailboxChannels(
  emailAccounts: { account: { provider: string } }[],
) {
  return Array.from(
    new Set(
      emailAccounts.flatMap(({ account }) => {
        if (account.provider === "google") return ["gmail"];
        if (account.provider === "microsoft") return ["outlook"];
        return [];
      }),
    ),
  );
}

export function getPreviewConnectedChannels(storage: Pick<Storage, "getItem">) {
  const value = storage.getItem(PREVIEW_CONNECTED_CHANNELS_KEY);
  if (!value) return [];

  try {
    const channels = JSON.parse(value);
    return Array.isArray(channels)
      ? channels.filter(
          (channel): channel is string => typeof channel === "string",
        )
      : [];
  } catch {
    return [];
  }
}

export function savePreviewConnectedChannels(channels: string[]) {
  const normalizedChannels = [...new Set(channels)];
  window.localStorage.setItem(
    PREVIEW_CONNECTED_CHANNELS_KEY,
    JSON.stringify(normalizedChannels),
  );
  window.dispatchEvent(
    new CustomEvent(PREVIEW_CONNECTED_CHANNELS_EVENT, {
      detail: normalizedChannels,
    }),
  );
}
