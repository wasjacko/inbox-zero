import { describe, expect, it } from "vitest";
import { summarizeFreescaleActivity } from "./activity";

describe("summarizeFreescaleActivity", () => {
  it("counts only real activities inside the selected period", () => {
    const result = summarizeFreescaleActivity({
      now: new Date("2026-09-01T12:00:00.000Z"),
      period: "7d",
      activities: [
        { createdAt: new Date("2026-09-01T10:00:00.000Z"), type: "REPLY_SENT" },
        {
          createdAt: new Date("2026-08-31T10:00:00.000Z"),
          type: "FOLLOW_UP_SENT",
        },
        {
          createdAt: new Date("2026-08-30T10:00:00.000Z"),
          type: "TASK_COMPLETED",
        },
        {
          createdAt: new Date("2026-08-01T10:00:00.000Z"),
          type: "MESSAGE_SENT",
        },
      ],
    });

    expect(result.summary).toEqual({
      actions: 3,
      assistedActions: 0,
      demoActions: 0,
      estimatedSeconds: 0,
      contextSeconds: 0,
      followups: 1,
      messages: 0,
      replies: 1,
      tasks: 1,
    });
    expect(result.series.reduce((sum, item) => sum + item.total, 0)).toBe(3);
  });

  it("counts assisted demo replies without presenting them as real sends", () => {
    const result = summarizeFreescaleActivity({
      now: new Date("2026-09-01T12:00:00.000Z"),
      period: "7d",
      activities: [
        {
          createdAt: new Date("2026-09-01T10:00:00.000Z"),
          type: "REPLY_SENT",
          assisted: true,
          demo: true,
          estimatedSeconds: 360,
          source: "home",
          externalId: "mue-demo:plan-1:reply-theo",
        },
        {
          createdAt: new Date("2026-09-01T11:00:00.000Z"),
          type: "REPLY_SENT",
          assisted: true,
          demo: true,
          estimatedSeconds: 360,
          source: "home",
          externalId: "mue-demo:plan-1:reply-maya",
        },
      ],
    });
    expect(result.summary).toMatchObject({
      actions: 2,
      assistedActions: 2,
      demoActions: 2,
      replies: 0,
      estimatedSeconds: 1080,
      contextSeconds: 360,
    });
  });
});
