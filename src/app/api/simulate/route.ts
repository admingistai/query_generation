import { openai, type OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import { streamText, tool, convertToModelMessages, generateText, stepCountIs } from "ai";
import { z } from "zod";
import { createSimulatorSystemPrompt, JourneyPhase } from "@/lib/agents/userSimulatorAgent";

export const maxDuration = 120; // Allow longer simulations

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Simulate API - Raw request body:", JSON.stringify(body, null, 2));

    const { messages, icpPersona, initialQuery, model = "gpt-4o" } = body;

    if (!icpPersona || typeof icpPersona !== "string") {
      console.log("Validation failed: icpPersona is missing or invalid", { icpPersona });
      return Response.json(
        { error: "ICP persona description is required" },
        { status: 400 }
      );
    }

    if (!initialQuery || typeof initialQuery !== "string") {
      console.log("Validation failed: initialQuery is missing or invalid", { initialQuery });
      return Response.json(
        { error: "Initial query is required" },
        { status: 400 }
      );
    }

    if (!messages || !Array.isArray(messages)) {
      console.log("Validation failed: messages is missing or not an array", { messages });
      return Response.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    console.log("Simulate API - Starting simulation with:", {
      icpPersona: icpPersona.substring(0, 50) + "...",
      initialQuery,
      model,
      messageCount: messages.length,
    });

    // Track completed phases
    const completedPhases: Set<JourneyPhase> = new Set();

    // Convert messages from UI format to model format
    const modelMessages = convertToModelMessages(messages);

    // Define tools separately for type inference
    const simulationTools = {
      sendQuery: tool({
        description:
          "Send a query to the AI search engine as the ICP persona. Use this to ask questions during your research journey.",
        inputSchema: z.object({
          query: z.string().describe("The query to send to the AI"),
          phase: z
            .enum(["discovery", "consideration", "activation"])
            .describe("The current journey phase"),
        }),
        execute: async ({ query, phase }) => {
          console.log(`Tool: sendQuery - Phase: ${phase}, Query: ${query}`);

          // Generate realistic AI search response using LLM with web search
          const phaseGuidance: Record<JourneyPhase, string> = {
            discovery: "The user is in early research. Provide helpful informational content. Do NOT mention specific brand names - focus on general categories, features to consider, and educational information.",
            consideration: "The user is comparing options. Provide balanced comparisons of different types/categories. You may mention general characteristics but avoid specific brand endorsements.",
            activation: "The user is ready to buy. Provide specific, actionable recommendations including where to purchase, price ranges, and specific product suggestions if helpful.",
          };

          const { text, sources } = await generateText({
            model: openai("gpt-4o-mini"),
            system: `You are an AI search engine like ChatGPT or Perplexity with live web access.
Run focused searches and use the most relevant pages so your response reflects the latest information.
Keep responses concise - 2-3 short paragraphs maximum.
Be conversational and helpful, like a knowledgeable friend.
Reference supporting sources naturally in your response.

Phase guidance: ${phaseGuidance[phase]}`,
            prompt: query,
            tools: {
              web_search: openai.tools.webSearch({
                userLocation: { type: "approximate", country: "US" },
              }),
            },
            toolChoice: { type: "tool", toolName: "web_search" },
          });

          // Extract citation URLs from sources
          const citations = sources
            .filter((source) => source.sourceType === "url")
            .map((source) => ({
              url: source.url,
              title: source.title || source.url,
            }));

          return {
            query,
            phase,
            response: text,
            citations,
            timestamp: new Date().toISOString(),
          };
        },
      }),

      recordPhaseCompletion: tool({
        description:
          "Record when a journey phase is complete. Call this when you have gathered enough information in the current phase before moving to the next phase.",
        inputSchema: z.object({
          phase: z
            .enum(["discovery", "consideration", "activation"])
            .describe("The phase that is now complete"),
          insightsGathered: z
            .array(z.string())
            .describe("Key insights gathered during this phase"),
        }),
        execute: async ({ phase, insightsGathered }) => {
          console.log(`Tool: recordPhaseCompletion - Phase: ${phase}, Insights: ${insightsGathered.length}`);
          completedPhases.add(phase);

          const nextPhase: Record<JourneyPhase, JourneyPhase | "complete"> = {
            discovery: "consideration",
            consideration: "activation",
            activation: "complete",
          };

          return {
            phase,
            completed: true,
            insightsGathered,
            nextPhase: nextPhase[phase],
            allPhasesComplete: completedPhases.size === 3,
          };
        },
      }),
    };

    const result = streamText({
      model: openai(model),
      system: createSimulatorSystemPrompt(icpPersona, initialQuery),
      messages: modelMessages,
      tools: simulationTools,
      // Use stopWhen with stepCountIs as a safety limit (AI SDK v5 pattern)
      // Combined with custom activation check via array of conditions
      stopWhen: [
        stepCountIs(10), // Safety limit
        // Custom condition: stop when activation phase is complete
        ({ steps }) => {
          return steps.some((step) =>
            step.toolResults?.some(
              (r) =>
                r.toolName === "recordPhaseCompletion" &&
                (r.output as { phase?: string })?.phase === "activation"
            )
          );
        },
      ],
      // Dynamic tool choice: required until activation complete, then auto
      prepareStep: ({ steps }) => {
        const hasActivation = steps.some((step) =>
          step.toolResults?.some(
            (r) =>
              r.toolName === "recordPhaseCompletion" &&
              (r.output as { phase?: string })?.phase === "activation"
          )
        );
        return {
          toolChoice: hasActivation ? undefined : ("required" as const),
        };
      },
      providerOptions: {
        openai: {
          parallelToolCalls: false,
        } satisfies OpenAIResponsesProviderOptions,
      },
      onStepFinish: async ({ toolResults }) => {
        if (toolResults) {
          for (const toolResult of toolResults) {
            console.log(`Step finished - Tool: ${toolResult.toolName}`);
          }
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Simulate API error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
