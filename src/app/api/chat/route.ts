import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { messages, model = "gpt-4o", webSearch = false } = await request.json();

    console.log("Chat API - webSearch enabled:", webSearch, "model:", model);

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Messages array is required" }, { status: 400 });
    }

    // AI SDK v5: Convert UIMessage[] from client to ModelMessage[] for streamText
    const modelMessages = convertToModelMessages(messages);

    // AI SDK v5: Use openai.responses() wrapper when web search is enabled
    // This is required for the webSearchPreview tool to work
    const result = streamText({
      model: webSearch ? openai.responses(model) : openai(model),
      // Add system prompt when web search is enabled to guide the model
      ...(webSearch && {
        system: "You have access to web search. When the user asks about websites, companies, current events, or anything that requires up-to-date information, you MUST use the web_search_preview tool to search the internet first before responding. Always provide accurate, current information from your search results.",
      }),
      messages: modelMessages,
      ...(webSearch && {
        tools: {
          web_search_preview: openai.tools.webSearchPreview({
            searchContextSize: "high",
          }),
        },
        // Let the model decide when to use the tool, but the system prompt guides it
        maxSteps: 3, // Allow multiple tool calls if needed
      }),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
