import { z } from "zod";

export const ICPsSchema = z.object({
  icps: z
    .array(z.string())
    .length(5)
    .describe("Exactly 5 Ideal Customer Profiles, each 1-2 sentences"),
});

export type ICPsOutput = z.infer<typeof ICPsSchema>;
