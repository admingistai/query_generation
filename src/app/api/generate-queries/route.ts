import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { QueriesSchema } from "@/lib/schemas/queries";
import { QUERY_GENERATOR_SYSTEM_PROMPT } from "@/lib/prompts";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { icp, topic, systemPrompt } = await request.json();

  if (!icp || typeof icp !== "string") {
    return Response.json({ error: "ICP is required" }, { status: 400 });
  }

  if (!topic || typeof topic !== "string") {
    return Response.json({ error: "Topic is required" }, { status: 400 });
  }

  const result = streamObject({
    model: openai("gpt-4o"),
    schema: QueriesSchema,
    system: systemPrompt ?? QUERY_GENERATOR_SYSTEM_PROMPT,
    prompt: `ICP: ${icp}\nTopic: ${topic}\n\nGenerate one query for each journey stage (Discovery, Consideration, Activation).`,
  });

  return result.toTextStreamResponse();
}
