export const PREVIEW_FREELANCER_NAME_KEY = "freescale-preview-freelancer-name";
export const PREVIEW_FREELANCER_NAME_EVENT = "freescale:freelancer-name-change";
export const DEFAULT_PREVIEW_FREELANCER_NAME = "Wassil";

export function getPreviewGreeting(name: string) {
  const normalizedName = name.trim();
  return normalizedName ? `Bonjour ${normalizedName}` : "Bonjour";
}

export function getActiveAccountFirstName({
  accountName,
  accountEmail,
  fallbackName,
}: {
  accountName?: string | null;
  accountEmail?: string | null;
  fallbackName?: string | null;
}) {
  const emailName = accountEmail
    ?.split("@")[0]
    ?.replace(/[._-]+/g, " ")
    .trim();
  const resolvedName = accountName?.trim() || emailName || fallbackName?.trim();
  return resolvedName?.split(/\s+/)[0] ?? "";
}

export function savePreviewFreelancerName(name: string, userId?: string) {
  const normalizedName = name.trim();
  if (!normalizedName) return;
  if (userId) {
    window.localStorage.setItem(
      `${PREVIEW_FREELANCER_NAME_KEY}:${userId}`,
      normalizedName,
    );
  }
  window.localStorage.setItem(PREVIEW_FREELANCER_NAME_KEY, normalizedName);
  window.dispatchEvent(
    new CustomEvent(PREVIEW_FREELANCER_NAME_EVENT, {
      detail: normalizedName,
    }),
  );
}
