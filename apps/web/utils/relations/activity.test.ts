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
      followups: 1,
      messages: 0,
      replies: 1,
      tasks: 1,
    });
    expect(result.series.reduce((sum, item) => sum + item.total, 0)).toBe(3);
  });
});
