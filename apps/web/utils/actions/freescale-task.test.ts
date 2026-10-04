import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/utils/__mocks__/prisma";
import { createFreescaleTasksAction } from "./freescale-task";

vi.mock("server-only", () => ({}));
vi.mock("@sentry/nextjs", () => import("@/__tests__/mocks/sentry-nextjs.mock"));
vi.mock("@/utils/prisma");
vi.mock("@/utils/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: "owner", email: "owner@example.com" },
  })),
}));
vi.mock("@/env", () => ({ env: { NODE_ENV: "test" } }));

const input = {
  due: "2026-10-04",
  tasks: [
    {
      id: "theo",
      title: "Confirm the plan",
      contactName: "Théo",
      contactAvatarPosition: "center",
    },
    { id: "maya", title: "Follow up", contactName: "Maya" },
  ],
};

describe("confirming a Mue plan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.emailAccount.findUnique.mockResolvedValue({
      email: "owner@example.com",
      account: { userId: "owner", provider: "google" },
    } as never);
  });

  it("returns the saved identifiers only after the entire plan is committed", async () => {
    const saved = [
      { id: "saved-theo", title: "Confirm the plan" },
      { id: "saved-maya", title: "Follow up" },
    ];
    prisma.$transaction.mockResolvedValue(saved);
    const result = await createFreescaleTasksAction("account", input);
    expect(result?.data?.tasks).toEqual(saved);
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(prisma.freescaleTask.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          emailAccountId_sourceThreadId: {
            emailAccountId: "account",
            sourceThreadId: "ask-mue-priority:2026-10-04:theo",
          },
        },
        create: expect.objectContaining({
          contactName: "Théo",
          contactAvatarPosition: "center",
          emailAccountId: "account",
        }),
        update: {
          title: "Confirm the plan",
          contactName: "Théo",
          contactAvatarPosition: "center",
        },
      }),
    );
  });

  it("does not confirm a plan if the transaction fails", async () => {
    prisma.$transaction.mockRejectedValue(new Error("database unavailable"));
    const result = await createFreescaleTasksAction("account", input);
    expect(result?.data).toBeUndefined();
    expect(result?.serverError).toBeTruthy();
  });

  it("rejects a plan submitted for another user's account", async () => {
    prisma.emailAccount.findUnique.mockResolvedValue({
      email: "other@example.com",
      account: { userId: "other", provider: "google" },
    } as never);
    const result = await createFreescaleTasksAction("account", input);
    expect(result?.serverError).toBeTruthy();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
