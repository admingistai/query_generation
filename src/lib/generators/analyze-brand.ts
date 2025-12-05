import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import type { BrandAnalysis } from "../types";

export async function analyzeBrand(url: string): Promise<BrandAnalysis> {
  const { text, sources } = await generateText({
    model: openai("gpt-4o"),
    prompt: `Analyze this brand's website and provide a comprehensive overview of their products, messaging, target audience, brand positioning, and key value propositions: ${url}`,
    tools: {
      web_search: openai.tools.webSearch({}),
    },
    toolChoice: { type: "tool", toolName: "web_search" },
  });

  // Extract URL sources from the response
  const urlSources = sources
    ?.filter((s): s is typeof s & { url: string } => "url" in s && typeof s.url === "string")
    .map((s) => ({ type: s.sourceType, url: s.url })) ?? [];

  return {
    analysis: text,
    sources: urlSources,
  };
}
