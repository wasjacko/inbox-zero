// https://www.prisma.io/blog/testing-series-1-8eRB5p0Y8o#why-mock-prisma-client
import type { PrismaClient } from "@/generated/prisma/client";
import { beforeEach } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";

const prisma = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prisma);
  // Existing feature tests exercise an eligible account unless they override its access state.
  prisma.user.findUnique.mockImplementation((args) => {
    if (args?.select?.freescaleTrialStartedAt) {
      return Promise.resolve({
        freescaleTrialStartedAt: new Date(),
        premium: null,
      }) as never;
    }
    return Promise.resolve(null) as never;
  });
});

export default prisma;
