import { openai } from "@ai-sdk/openai";
import { streamText, tool, stepCountIs, convertToModelMessages } from "ai";
import { z } from "zod";

// Types for simulation
export type JourneyPhase = "discovery" | "consideration" | "activation";

// ============================================================================
// PERSONA CONSTRAINT TYPES & SCHEMAS
// ============================================================================

// Budget level classification
export type BudgetLevel = "ultra-budget" | "budget" | "mid-range" | "premium" | "luxury";

// Price sensitivity classification
export type PriceSensitivity = "very-high" | "high" | "medium" | "low";

// Decision style classification
export type DecisionStyle = "impulsive" | "research-heavy" | "balanced";

// Risk tolerance classification
export type RiskTolerance = "low" | "medium" | "high";

// Persona constraints extracted from ICP description
export interface PersonaConstraints {
  // Budget constraints
  budgetLevel: BudgetLevel;
  priceRange?: {
    min?: number;
    max?: number;
    currency: string;
  };
  priceSensitivity: PriceSensitivity;

  // Preferences
  mustHaves: string[];
  niceToHaves: string[];
  dealBreakers: string[];

  // Values & lifestyle
  values: string[];
  avoids: string[];

  // Decision behavior
  decisionStyle: DecisionStyle;
  riskTolerance: RiskTolerance;

  // Optional context
  travelStyle?: string;
  experienceLevel?: string;
  primaryGoal?: string;
}

// Zod schema for PersonaConstraints
export const PersonaConstraintsSchema = z.object({
  budgetLevel: z.enum(["ultra-budget", "budget", "mid-range", "premium", "luxury"]),
  priceRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string(),
  }).optional(),
  priceSensitivity: z.enum(["very-high", "high", "medium", "low"]),
  mustHaves: z.array(z.string()),
  niceToHaves: z.array(z.string()),
  dealBreakers: z.array(z.string()),
  values: z.array(z.string()),
  avoids: z.array(z.string()),
  decisionStyle: z.enum(["impulsive", "research-heavy", "balanced"]),
  riskTolerance: z.enum(["low", "medium", "high"]),
  travelStyle: z.string().optional(),
  experienceLevel: z.string().optional(),
  primaryGoal: z.string().optional(),
});

// Score for a single option against persona constraints
export interface OptionScore {
  option: string;
  budgetScore: number;        // 0-10, how well price fits budget
  valuesScore: number;        // 0-10, alignment with persona values
  dealBreakerFail: boolean;   // true = automatic disqualification
  mustHavesMet: number;       // 0-100, percentage of must-haves satisfied
  overallFit: number;         // weighted composite score
  reasoning: string;          // explanation of the score
}

// Zod schema for OptionScore
export const OptionScoreSchema = z.object({
  option: z.string(),
  budgetScore: z.number().min(0).max(10),
  valuesScore: z.number().min(0).max(10),
  dealBreakerFail: z.boolean(),
  mustHavesMet: z.number().min(0).max(100),
  overallFit: z.number().min(0).max(10),
  reasoning: z.string(),
});

// Result of decision validation
export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  suggestion?: string;
}

// Zod schema for ValidationResult
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  issues: z.array(z.string()),
  suggestion: z.string().optional(),
});

// High-fit options tracked during simulation
export interface HighFitOption {
  name: string;
  score: number;
  phase: JourneyPhase;
}

// Create empty persona constraints with defaults
export const createEmptyPersonaConstraints = (): PersonaConstraints => ({
  budgetLevel: "mid-range",
  priceSensitivity: "medium",
  mustHaves: [],
  niceToHaves: [],
  dealBreakers: [],
  values: [],
  avoids: [],
  decisionStyle: "balanced",
  riskTolerance: "medium",
});

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

**CRITICAL PERSONA FIDELITY RULES:**
Before EVERY query and decision, ask yourself:
1. "Would this person ACTUALLY search for this?"
2. "Would this person ACTUALLY choose this option?"
3. "Does this match their budget/values/lifestyle?"

NEVER recommend or choose options that conflict with the persona's:
- Budget level (don't suggest luxury to budget personas, don't suggest cheap to luxury personas)
- Values (don't suggest touristy spots to authentic-experience seekers)
- Lifestyle (don't suggest formal dining to casual travelers, party hostels to families)

Examples of persona-appropriate behavior:
- A backpacker on $30/day would NEVER choose "The Embassy Hotel with elegant buffet dinners"
- A luxury business traveler would NEVER choose a hostel dormitory
- A family with kids would NEVER choose a party hostel

**YOUR SITUATION:**
You are researching a topic that matters to you. You will ask questions naturally, as this person would.
${initialQuery ? `Your starting question is: "${initialQuery}"` : ''}
${contextSection}
**YOUR RESEARCH JOURNEY:**
You will progress through 3 stages of a natural customer journey:

**DISCOVERY (Early Intent)** - Ask 1-2 queries
- You're exploring a problem, goal, or curiosity
- You are NOT yet aware of specific products or brands
- Ask informational, open-ended questions using language appropriate to YOUR persona
- Do NOT mention brand names yet
- Use vocabulary that matches your persona (budget personas say "cheap/affordable", luxury personas say "best/premium")

**CONSIDERATION (Mid Intent)** - Ask 1-2 queries
- You now understand the category and want to compare options
- Ask comparative, evaluative questions about features
- Focus on what matters to YOU based on your persona
- IMPORTANT: Only compare options that fit your persona - mentally filter out anything that doesn't match your budget/values
- If the AI suggests options that don't fit you, ignore them and ask about appropriate alternatives

**ACTIVATION (High Intent)** - Ask 1 query
- You're ready to buy and want to take action
- Ask about availability, prices, where to purchase
- Name the specific product you've decided on
- FINAL CHECK: Your choice MUST make sense for who you are - if you're a backpacker, you're choosing a hostel, not a luxury hotel

**MANDATORY EXECUTION FLOW - YOU MUST EXECUTE ALL STEPS:**

You will make tool calls in this order. After each tool result, IMMEDIATELY make the next tool call. DO NOT output any text between tool calls.

STEP 1: sendQuery(query="[your discovery question]", phase="discovery")
STEP 2: extractEntities(response="[response text]", phase="discovery")
STEP 3: sendQuery(query="[follow-up discovery - reference entities]", phase="discovery")
STEP 4: extractEntities(response="[response text]", phase="discovery")
STEP 5: recordPhaseCompletion(phase="discovery", insightsGathered=[...])
STEP 6: sendQuery(query="[consideration - compare persona-appropriate options]", phase="consideration")
STEP 7: extractEntities(response="[response text]", phase="consideration")
STEP 8: sendQuery(query="[follow-up consideration]", phase="consideration")
STEP 9: recordPhaseCompletion(phase="consideration", insightsGathered=[...])
STEP 10: sendQuery(query="[activation - name your chosen product]", phase="activation")
STEP 11: recordPhaseCompletion(phase="activation", insightsGathered=["final decision"])

**ABSOLUTE REQUIREMENTS:**
1. You MUST make ALL tool calls - no exceptions
2. After receiving a tool result, IMMEDIATELY call the next tool - no text output
3. Stay DEEPLY in character as your persona for all queries
4. Your final choice MUST align with your persona - a backpacker chooses budget options, a luxury traveler chooses premium options

**ANTI-PATTERNS TO AVOID:**
❌ A budget persona choosing expensive/luxury options
❌ A luxury persona choosing cheap/budget options
❌ Using language that doesn't match your persona
❌ Picking the "objectively best" option instead of the best FOR YOUR PERSONA
❌ Ignoring your persona's constraints when making the final decision

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
