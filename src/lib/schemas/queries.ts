import { z } from "zod";

export const QueriesSchema = z.object({
  discovery: z.string().describe("Informational, problem-aware query for early-stage exploration"),
  consideration: z.string().describe("Comparative, category-level query for mid-stage evaluation"),
  activation: z.string().describe("Action-oriented, purchase-ready query for high-intent conversion"),
});

export type QueriesOutput = z.infer<typeof QueriesSchema>;
