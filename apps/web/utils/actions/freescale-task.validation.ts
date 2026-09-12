import { z } from "zod";

export const createFreescaleTasksBody = z.object({
  due: z.string().date(),
  tasks: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(100),
        title: z.string().trim().min(1).max(300),
      }),
    )
    .min(1)
    .max(20),
});
