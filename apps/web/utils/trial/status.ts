export const TRIAL_DURATION_DAYS = 14;

export function getTrialStatus({
  startedAt,
  paid,
  now = new Date(),
}: {
  startedAt: Date | string | null;
  paid: boolean;
  now?: Date;
}) {
  const expiresAt = startedAt
    ? new Date(new Date(startedAt).getTime() + TRIAL_DURATION_DAYS * 86_400_000)
    : null;
  const active = !!expiresAt && expiresAt.getTime() > now.getTime();
  return {
    state: paid
      ? "subscribed"
      : !startedAt
        ? "not_started"
        : active
          ? "active"
          : "expired",
    expiresAt: expiresAt?.toISOString() ?? null,
    daysRemaining:
      active && expiresAt
        ? Math.ceil((expiresAt.getTime() - now.getTime()) / 86_400_000)
        : 0,
    canUseProduct: paid || active,
  };
}
