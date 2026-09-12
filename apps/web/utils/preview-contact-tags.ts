export const PREVIEW_CONTACT_TAGS_KEY = "freescale:contact-tags";
export const PREVIEW_CONTACT_TAGS_EVENT = "freescale:contact-tags-changed";

export type PreviewContactTags = Record<string, string[]>;

export function normalizeContactAddress(address: string) {
  return address.trim().toLowerCase();
}

export function readPreviewContactTags(): PreviewContactTags {
  if (typeof window === "undefined") return {};

  try {
    const stored = window.localStorage.getItem(PREVIEW_CONTACT_TAGS_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};

    return Object.fromEntries(
      Object.entries(parsed).flatMap(([address, tags]) => {
        if (!Array.isArray(tags)) return [];
        const validTags = tags.filter(
          (tag): tag is string => typeof tag === "string" && Boolean(tag),
        );
        return validTags.length
          ? [[normalizeContactAddress(address), [...new Set(validTags)]]]
          : [];
      }),
    );
  } catch {
    return {};
  }
}

export function writePreviewContactTags(tags: PreviewContactTags) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREVIEW_CONTACT_TAGS_KEY, JSON.stringify(tags));
  window.dispatchEvent(new Event(PREVIEW_CONTACT_TAGS_EVENT));
}

export function hasPreviewContactTag(
  assignments: PreviewContactTags,
  address: string,
) {
  return Boolean(assignments[normalizeContactAddress(address)]?.length);
}
