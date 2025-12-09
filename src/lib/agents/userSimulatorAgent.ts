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

// Schema for simulation turns
export const SimulationTurnSchema = z.object({
  phase: z.enum(["discovery", "consideration", "activation"]),
  query: z.string(),
  response: z.string(),
});

// Create the system prompt with ICP persona and initial query injection
export function createSimulatorSystemPrompt(icpPersona: string, initialQuery?: string): string {
  return `You ARE the following person conducting research using an AI search engine (like ChatGPT or Perplexity):

**YOUR IDENTITY:**
${icpPersona}

**YOUR SITUATION:**
You are researching a topic that matters to you. You will ask questions naturally, as this person would.
${initialQuery ? `Your starting question is: "${initialQuery}"` : ''}

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
- Example: "How do I compare X vs Y?" or "What features matter most for my situation?"

**ACTIVATION (High Intent)** - Ask 1 query
- You're ready to buy and want to take action
- Ask about availability, prices, where to purchase
- You may now include specific brand names if natural
- Example: "Where can I buy X at the best price?" or "Which retailer has the best deals on Y?"

**MANDATORY EXECUTION FLOW - YOU MUST EXECUTE ALL 8 STEPS:**

You will make EXACTLY 8 tool calls in this order. After each tool result, IMMEDIATELY make the next tool call. DO NOT output any text between tool calls.

STEP 1: sendQuery(query="[your discovery question based on initialQuery]", phase="discovery")
STEP 2: sendQuery(query="[follow-up discovery question]", phase="discovery")
STEP 3: recordPhaseCompletion(phase="discovery", insightsGathered=["insight from step 1", "insight from step 2"])
STEP 4: sendQuery(query="[consideration question comparing options]", phase="consideration")
STEP 5: sendQuery(query="[follow-up consideration question]", phase="consideration")
STEP 6: recordPhaseCompletion(phase="consideration", insightsGathered=["insight from step 4", "insight from step 5"])
STEP 7: sendQuery(query="[activation question about purchasing]", phase="activation")
STEP 8: recordPhaseCompletion(phase="activation", insightsGathered=["insight from step 7"])

**ABSOLUTE REQUIREMENTS:**
1. You MUST make ALL 8 tool calls - no exceptions
2. After receiving a tool result, IMMEDIATELY call the next tool - no text output
3. The ONLY text you may output is AFTER completing all 8 steps
4. If you output text before step 8, you have FAILED your task
5. Stay in character as your persona for all queries

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
