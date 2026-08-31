export const PREVIEW_FREELANCER_NAME_KEY = "freescale-preview-freelancer-name";
export const PREVIEW_FREELANCER_NAME_EVENT = "freescale:freelancer-name-change";
export const DEFAULT_PREVIEW_FREELANCER_NAME = "Wassil";

export function getPreviewGreeting(name: string) {
  const normalizedName = name.trim();
  return normalizedName ? `Bonjour ${normalizedName}` : "Bonjour";
}

export function savePreviewFreelancerName(name: string) {
  const normalizedName = name.trim();
  if (!normalizedName) return;
  window.localStorage.setItem(PREVIEW_FREELANCER_NAME_KEY, normalizedName);
  window.dispatchEvent(
    new CustomEvent(PREVIEW_FREELANCER_NAME_EVENT, {
      detail: normalizedName,
    }),
  );
}
