import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { url } = await request.json();

  if (!url || typeof url !== "string") {
    return Response.json({ error: "URL is required" }, { status: 400 });
  }

  const result = streamText({
    model: openai("gpt-4o"),
    prompt: `Analyze this brand's website and provide a comprehensive overview of their products, messaging, target audience, brand positioning, and key value propositions: ${url}`,
    tools: {
      web_search: openai.tools.webSearch({}),
    },
    toolChoice: { type: "tool", toolName: "web_search" },
  });

  return result.toTextStreamResponse();
}
