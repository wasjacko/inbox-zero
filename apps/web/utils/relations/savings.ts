export const MUE_REPLY_ESTIMATE_SECONDS = 360;
export const MUE_SHARED_CONTEXT_ESTIMATE_SECONDS = 360;
export const MUE_ACTIVITY_EVENT = "freescale:activity-updated";
export const MUE_SAVINGS_SOURCE =
  "https://learn.microsoft.com/en-gb/viva/insights/org-team-insights/copilot-dashboard";

export function estimateSavingsValueCents(
  seconds: number,
  dayRateCents: number | null,
) {
  if (dayRateCents === null) return null;
  return Math.round((Math.max(0, seconds) / (8 * 60 * 60)) * dayRateCents);
}

export function formatSavingsTime(seconds: number) {
  const minutes = Math.round(Math.max(0, seconds) / 60);
  if (minutes < 60) return `${minutes} min`;
  const remaining = minutes % 60;
  return `${Math.floor(minutes / 60)} h${remaining ? ` ${remaining.toString().padStart(2, "0")}` : ""}`;
}
