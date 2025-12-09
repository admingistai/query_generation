import { openai } from "@ai-sdk/openai";
import { streamText, tool, stepCountIs, convertToModelMessages } from "ai";
import { z } from "zod";

// Types for simulation
export type JourneyPhase = "discovery" | "consideration" | "activation";

export interface SimulationConfig {
  icpPersona: string;
  initialQuery: string;
  model?: string;
}

export interface PhaseStatus {
  discovery: boolean;
  consideration: boolean;
  activation: boolean;
}

// Journey context for tracking accumulated knowledge
export interface JourneyContext {
  entitiesDiscovered: string[];
  comparisonsExplored: string[];
  emergingPreference: string;
  specificProducts: string[];
  priceRangesFound: string[];
  previousQueries: string[];
}

export const createEmptyContext = (): JourneyContext => ({
  entitiesDiscovered: [],
  comparisonsExplored: [],
  emergingPreference: "",
  specificProducts: [],
  priceRangesFound: [],
  previousQueries: [],
});

// Schema for simulation turns
export const SimulationTurnSchema = z.object({
  phase: z.enum(["discovery", "consideration", "activation"]),
  query: z.string(),
  response: z.string(),
});

// Create the system prompt with ICP persona, initial query, and optional context injection
export function createSimulatorSystemPrompt(
  icpPersona: string,
  initialQuery?: string,
  context?: JourneyContext
): string {
  // Build context section if we have accumulated knowledge
  const contextSection = context && context.specificProducts.length > 0 ? `

**ACCUMULATED KNOWLEDGE FROM AI RESPONSES:**
- Products/brands discovered: ${[...new Set(context.specificProducts)].join(", ") || "none yet"}
- Comparisons explored: ${[...new Set(context.comparisonsExplored)].join(", ") || "none yet"}
- Price ranges found: ${[...new Set(context.priceRangesFound)].join(", ") || "unknown"}
- Your previous queries: ${context.previousQueries.join("; ")}

**MANDATORY CONTEXT RULES:**
1. Your next query MUST reference specific entities from the above knowledge
2. In Consideration: Compare specific products by name (e.g., "Brand X vs Brand Y")
3. In Activation: State your preference and ask where to buy that specific product
4. NEVER ask a question you already asked - check "Your previous queries" above
` : "";

  return `You ARE the following person conducting research using an AI search engine (like ChatGPT or Perplexity):

**YOUR IDENTITY:**
${icpPersona}

**YOUR SITUATION:**
You are researching a topic that matters to you. You will ask questions naturally, as this person would.
${initialQuery ? `Your starting question is: "${initialQuery}"` : ''}
${contextSection}
**YOUR RESEARCH JOURNEY:**
You will progress through 3 stages of a natural customer journey:

**DISCOVERY (Early Intent)** - Ask 1-2 queries
- You're exploring a problem, goal, or curiosity
- You are NOT yet aware of specific products or brands
- Ask informational, open-ended questions
- Do NOT mention brand names yet
- Example: "What are the best options for X?" or "What should I consider when looking for Y?"

**CONSIDERATION (Mid Intent)** - Ask 1-2 queries
- You now understand the category and want to compare options
- Ask comparative, evaluative questions about features
- Focus on what matters to YOU based on your persona
- IMPORTANT: Reference specific products/brands from the AI responses you received in Discovery
- Example: "How does [Product A from discovery] compare to [Product B]?"

**ACTIVATION (High Intent)** - Ask 1 query
- You're ready to buy and want to take action
- Ask about availability, prices, where to purchase
- IMPORTANT: Name the specific product you've decided on based on your Consideration phase
- Example: "Where can I buy [specific product you chose] at the best price?"

**MANDATORY EXECUTION FLOW - YOU MUST EXECUTE ALL 11 STEPS:**

You will make EXACTLY 11 tool calls in this order. After each tool result, IMMEDIATELY make the next tool call. DO NOT output any text between tool calls.

STEP 1: sendQuery(query="[your discovery question based on initialQuery]", phase="discovery")
STEP 2: extractEntities(response="[copy the response text from step 1]", phase="discovery")
STEP 3: sendQuery(query="[follow-up discovery question - MUST reference something specific from step 1's response]", phase="discovery")
STEP 4: extractEntities(response="[copy the response text from step 3]", phase="discovery")
STEP 5: recordPhaseCompletion(phase="discovery", insightsGathered=["insight 1", "insight 2"])
STEP 6: sendQuery(query="[consideration question - MUST compare specific products by name from discovery]", phase="consideration")
STEP 7: extractEntities(response="[copy the response text from step 6]", phase="consideration")
STEP 8: sendQuery(query="[follow-up consideration - drill deeper into the comparison]", phase="consideration")
STEP 9: recordPhaseCompletion(phase="consideration", insightsGathered=["insight 1", "insight 2"])
STEP 10: sendQuery(query="[activation - MUST name the specific product you prefer and ask where to buy]", phase="activation")
STEP 11: recordPhaseCompletion(phase="activation", insightsGathered=["final decision insight"])

**ABSOLUTE REQUIREMENTS:**
1. You MUST make ALL 11 tool calls - no exceptions
2. After receiving a tool result, IMMEDIATELY call the next tool - no text output
3. The ONLY text you may output is AFTER completing all 11 steps
4. If you output text before step 11, you have FAILED your task
5. Stay in character as your persona for all queries
6. CRITICAL: Each query after step 1 MUST reference specific entities from previous responses
7. Discovery Q2 must reference something from Q1's response
8. Consideration queries must mention specific products by name
9. Activation query must name your chosen product

**ANTI-PATTERNS TO AVOID:**
❌ Asking "what should I consider" twice
❌ Generic questions like "where can I buy X" without specifying what X is
❌ Ignoring specific recommendations from previous responses
❌ Repeating questions with slightly different wording

**BEGIN IMMEDIATELY:** Call sendQuery with your first discovery question now.`;
}

// Run the user simulator agent
export function runUserSimulator(config: SimulationConfig) {
  const { icpPersona, initialQuery, model = "gpt-4o" } = config;

  // Track completed phases
  const completedPhases: Set<JourneyPhase> = new Set();
  const conversationHistory: Array<{ role: string; content: string }> = [];

  // Add initial context
  conversationHistory.push({
    role: "user",
    content: `Begin your research journey. Your first query in the DISCOVERY phase is: "${initialQuery}"

Use the sendQuery tool to send this query and receive a response. Then analyze the response and decide whether to ask more questions in this phase or move to the next phase.`,
  });

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
        // In a real implementation, this would call another LLM to simulate the target AI
        // For now, we'll return a simulated response
        const responses: Record<JourneyPhase, string[]> = {
          discovery: [
            "Based on your question, here are some key things to consider. There are several options available in the market, each with different features and price points. Would you like me to elaborate on any specific aspect?",
            "Great question! This is a common concern. Many people start by researching the basics before diving into specific products. The main factors to consider are quality, price, and your specific needs.",
          ],
          consideration: [
            "When comparing options, you'll want to look at features like durability, price-to-value ratio, and user reviews. Popular choices include several well-known brands that offer different advantages.",
            "Here's a comparison of the top options: Option A offers premium quality at a higher price, Option B provides good value for money, and Option C is budget-friendly with decent features.",
          ],
          activation: [
            "You can purchase these from major retailers like Amazon, Target, or directly from the manufacturer's website. Current prices range from $X to $Y depending on the model you choose.",
            "To buy, I recommend checking the official website for the latest deals. Many retailers also offer price matching and free shipping on orders over a certain amount.",
          ],
        };

        const phaseResponses = responses[phase];
        const response =
          phaseResponses[Math.floor(Math.random() * phaseResponses.length)];

        return {
          query,
          phase,
          response,
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
    system: createSimulatorSystemPrompt(icpPersona),
    messages: convertToModelMessages(conversationHistory as any),
    // Group tools and maxSteps together for proper type inference
    ...{
      tools: simulationTools,
      maxSteps: 10, // Enable tool execution loop
    },
    stopWhen: stepCountIs(15), // Safety limit
    onStepFinish: async ({ toolResults }) => {
      // Log phase completions for debugging
      if (toolResults) {
        for (const toolResult of toolResults) {
          if (toolResult.toolName === "recordPhaseCompletion") {
            console.log(`Phase completed: ${JSON.stringify(toolResult)}`);
          }
        }
      }
    },
  });

  return result;
}
