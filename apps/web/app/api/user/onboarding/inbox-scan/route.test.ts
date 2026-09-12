import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEmailProvider } = vi.hoisted(() => ({
  mockEmailProvider: {
    getInboxStats: vi.fn(),
  },
}));

vi.mock("@/utils/middleware", () => ({
  withEmailProvider:
    (_name: string, handler: (request: any) => Promise<Response>) =>
    (request: NextRequest) =>
      handler(
        Object.assign(request, {
          emailProvider: mockEmailProvider,
        }),
      ),
}));

import { GET } from "./route";

describe("GET /api/user/onboarding/inbox-scan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Gmail's exact inbox and unread counts without caching", async () => {
    mockEmailProvider.getInboxStats.mockResolvedValue({
      total: 93,
      unread: 5,
    });

    const response = await GET(
      new NextRequest("http://localhost/api/user/onboarding/inbox-scan"),
    );

    expect(mockEmailProvider.getInboxStats).toHaveBeenCalledWith({
      exact: true,
    });
    expect(await response.json()).toEqual({
      totalCount: 93,
      unreadCount: 5,
    });
    expect(response.headers.get("Cache-Control")).toBe(
      "private, no-store, max-age=0",
    );
  });
});
