const PREFIX = "freescale-page-data-v1:";
const MAX_AGE = 5 * 60_000;

export function readPageData<T>(accountId: string, url: string): T | undefined {
  if (!accountId || typeof window === "undefined") return;
  try {
    const key = `${PREFIX}${accountId}:${url}`;
    const entry = JSON.parse(window.sessionStorage.getItem(key) ?? "null");
    if (!entry || typeof entry.savedAt !== "number") return;
    if (Date.now() - entry.savedAt >= MAX_AGE) {
      window.sessionStorage.removeItem(key);
      return;
    }
    return entry.data;
  } catch {
    return;
  }
}

export function writePageData(accountId: string, url: string, data: unknown) {
  if (!accountId || typeof window === "undefined" || data === undefined) return;
  try {
    window.sessionStorage.setItem(
      `${PREFIX}${accountId}:${url}`,
      JSON.stringify({ data, savedAt: Date.now() }),
    );
  } catch {
    // Private browsing / storage quotas must never block live data fetching.
  }
}

export function clearPageData() {
  if (typeof window === "undefined") return;
  try {
    for (const key of Object.keys(window.sessionStorage)) {
      if (key.startsWith(PREFIX)) window.sessionStorage.removeItem(key);
    }
  } catch {
    // Signing out must work even when session storage is unavailable.
  }
}
