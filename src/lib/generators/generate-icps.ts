import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { ICPsSchema } from "../schemas/icps";
import { ICP_GENERATOR_SYSTEM_PROMPT } from "../prompts/icp-generator";

export async function generateICPs(
  brandAnalysis: string,
  customSystemPrompt?: string
): Promise<string[]> {
  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: ICPsSchema,
    system: customSystemPrompt ?? ICP_GENERATOR_SYSTEM_PROMPT,
    prompt: `Based on this brand analysis, generate 5 Ideal Customer Profiles:\n\n${brandAnalysis}`,
  });

  return object.icps;
}
