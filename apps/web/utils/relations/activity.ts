import { MUE_SHARED_CONTEXT_ESTIMATE_SECONDS } from "./savings";

export const freescaleActivityPeriods = ["7d", "31d", "90d"] as const;

export type FreescaleActivityPeriod = (typeof freescaleActivityPeriods)[number];

export type FreescaleActivityType =
  | "REPLY_SENT"
  | "FOLLOW_UP_SENT"
  | "MESSAGE_SENT"
  | "TASK_COMPLETED";

type Activity = {
  createdAt: Date;
  type: FreescaleActivityType;
  assisted?: boolean;
  demo?: boolean;
  estimatedSeconds?: number;
  source?: string | null;
  externalId?: string | null;
};

const daysByPeriod: Record<FreescaleActivityPeriod, number> = {
  "7d": 7,
  "31d": 31,
  "90d": 90,
};

export function summarizeFreescaleActivity({
  activities,
  now = new Date(),
  period,
}: {
  activities: Activity[];
  now?: Date;
  period: FreescaleActivityPeriod;
}) {
  const days = daysByPeriod[period];
  const start = startOfDay(now);
  start.setDate(start.getDate() - days + 1);
  const bucketCount = days === 7 ? 7 : 6;
  const bucketDays = Math.ceil(days / bucketCount);
  const series = Array.from({ length: bucketCount }, (_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + index * bucketDays);
    return {
      label: new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
      }).format(date),
      total: 0,
      replies: 0,
      followups: 0,
    };
  });

  const summary = {
    actions: 0,
    followups: 0,
    messages: 0,
    replies: 0,
    tasks: 0,
    assistedActions: 0,
    demoActions: 0,
    estimatedSeconds: 0,
    contextSeconds: 0,
  };
  const countedPlans = new Set<string>();

  for (const activity of activities) {
    if (activity.createdAt < start || activity.createdAt > now) continue;
    summary.actions += 1;
    if (activity.assisted) {
      summary.assistedActions += 1;
      summary.estimatedSeconds += Math.max(0, activity.estimatedSeconds ?? 0);
      if (activity.demo && activity.source === "home") {
        const planId =
          activity.externalId?.replace(/:reply-(theo|maya)$/, "") ??
          "legacy-home";
        if (!countedPlans.has(planId)) {
          countedPlans.add(planId);
          summary.contextSeconds += MUE_SHARED_CONTEXT_ESTIMATE_SECONDS;
          summary.estimatedSeconds += MUE_SHARED_CONTEXT_ESTIMATE_SECONDS;
        }
      }
    }
    if (activity.demo) summary.demoActions += 1;
    if (activity.type === "REPLY_SENT" && !activity.demo) summary.replies += 1;
    if (activity.type === "FOLLOW_UP_SENT" && !activity.demo)
      summary.followups += 1;
    if (activity.type === "MESSAGE_SENT" && !activity.demo)
      summary.messages += 1;
    if (activity.type === "TASK_COMPLETED") summary.tasks += 1;

    const dayOffset = Math.floor(
      (startOfDay(activity.createdAt).getTime() - start.getTime()) / 86_400_000,
    );
    const bucket =
      series[Math.min(Math.floor(dayOffset / bucketDays), bucketCount - 1)];
    if (!bucket) continue;
    bucket.total += 1;
    if (activity.type === "REPLY_SENT") bucket.replies += 1;
    if (activity.type === "FOLLOW_UP_SENT") bucket.followups += 1;
  }

  return { period, start, summary, series };
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}
