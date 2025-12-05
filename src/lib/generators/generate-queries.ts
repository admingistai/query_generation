import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { QueriesSchema, type QueriesOutput } from "../schemas/queries";
import { QUERY_GENERATOR_SYSTEM_PROMPT } from "../prompts/query-generator";

export async function generateQueries(
  icp: string,
  topic: string,
  customSystemPrompt?: string
): Promise<QueriesOutput> {
  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: QueriesSchema,
    system: customSystemPrompt ?? QUERY_GENERATOR_SYSTEM_PROMPT,
    prompt: `ICP: ${icp}\nTopic: ${topic}\n\nGenerate one query for each journey stage (Discovery, Consideration, Activation).`,
  });

  return object;
}
