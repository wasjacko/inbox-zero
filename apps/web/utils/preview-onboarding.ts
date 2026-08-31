export const PREVIEW_ONBOARDING_STATUS_KEY =
  "freescale-preview-onboarding-status";

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
