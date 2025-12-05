import { z } from "zod";

export const TopicsSchema = z.object({
  topics: z
    .array(z.string())
    .length(5)
    .describe("Exactly 5 search-intent topics, each 2-4 words"),
});

export type TopicsOutput = z.infer<typeof TopicsSchema>;
