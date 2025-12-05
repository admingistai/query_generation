import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { ICPsSchema } from "@/lib/schemas/icps";
import { ICP_GENERATOR_SYSTEM_PROMPT } from "@/lib/prompts";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { brandAnalysis, systemPrompt } = await request.json();

  if (!brandAnalysis || typeof brandAnalysis !== "string") {
    return Response.json({ error: "Brand analysis is required" }, { status: 400 });
  }

  const result = streamObject({
    model: openai("gpt-4o"),
    schema: ICPsSchema,
    system: systemPrompt ?? ICP_GENERATOR_SYSTEM_PROMPT,
    prompt: `Based on this brand analysis, generate 5 Ideal Customer Profiles:\n\n${brandAnalysis}`,
  });

  return result.toTextStreamResponse();
}
