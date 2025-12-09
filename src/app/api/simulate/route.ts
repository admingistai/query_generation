import { openai, type OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import { streamText, tool, convertToModelMessages, generateText, generateObject, stepCountIs } from "ai";
import { z } from "zod";
import { createSimulatorSystemPrompt, JourneyPhase, JourneyContext, createEmptyContext } from "@/lib/agents/userSimulatorAgent";

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

    // Track accumulated journey context for entity extraction
    const journeyContext: JourneyContext = createEmptyContext();

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

          // Track the query in context to prevent repetition
          journeyContext.previousQueries.push(query);

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

      extractEntities: tool({
        description:
          "Extract key entities from the AI response to build context for follow-up queries. Call this after each sendQuery to analyze what was mentioned.",
        inputSchema: z.object({
          response: z.string().describe("The AI response text to analyze"),
          phase: z
            .enum(["discovery", "consideration", "activation"])
            .describe("The current journey phase"),
        }),
        execute: async ({ response, phase }) => {
          console.log(`Tool: extractEntities - Phase: ${phase}, Response length: ${response.length}`);

          try {
            const { object } = await generateObject({
              model: openai("gpt-4o-mini"),
              schema: z.object({
                products: z.array(z.string()).describe("Specific products or brand names mentioned"),
                features: z.array(z.string()).describe("Features, attributes, or characteristics discussed"),
                comparisons: z.array(z.string()).describe("Any comparisons made (e.g., 'German vs Japanese knives')"),
                recommendations: z.array(z.string()).describe("Specific recommendations or suggestions"),
                priceRanges: z.array(z.string()).describe("Price points, ranges, or budget info mentioned"),
              }),
              prompt: `Extract key entities from this ${phase} phase AI search response. Be specific - extract exact product names, brand names, and specific features mentioned:\n\n${response}`,
            });

            // Accumulate entities into journey context
            journeyContext.specificProducts.push(...object.products);
            journeyContext.entitiesDiscovered.push(...object.products, ...object.features);
            journeyContext.comparisonsExplored.push(...object.comparisons);
            journeyContext.priceRangesFound.push(...object.priceRanges);

            console.log(`Tool: extractEntities - Extracted:`, {
              products: object.products.length,
              features: object.features.length,
              comparisons: object.comparisons.length,
              recommendations: object.recommendations.length,
              priceRanges: object.priceRanges.length,
            });

            return {
              phase,
              extracted: object,
              accumulatedContext: {
                totalProducts: journeyContext.specificProducts.length,
                totalComparisons: journeyContext.comparisonsExplored.length,
              },
            };
          } catch (error) {
            console.error("extractEntities error:", error);
            // Return empty extraction on error to not break the flow
            return {
              phase,
              extracted: {
                products: [],
                features: [],
                comparisons: [],
                recommendations: [],
                priceRanges: [],
              },
              accumulatedContext: {
                totalProducts: journeyContext.specificProducts.length,
                totalComparisons: journeyContext.comparisonsExplored.length,
              },
            };
          }
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
        stepCountIs(15), // Increased safety limit for 11-step flow with entity extraction
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
