import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { TopicsSchema } from "../schemas/topics";
import { TOPIC_GENERATOR_SYSTEM_PROMPT } from "../prompts/topic-generator";

export async function generateTopics(
  brandAnalysis: string,
  customSystemPrompt?: string
): Promise<string[]> {
  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: TopicsSchema,
    system: customSystemPrompt ?? TOPIC_GENERATOR_SYSTEM_PROMPT,
    prompt: `Based on this brand analysis, generate 5 search-intent topics:\n\n${brandAnalysis}`,
  });

  return object.topics;
}
