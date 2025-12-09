# Product Requirements Document

## User Journey Simulation Agent for AI Customer Journey Lifecycle

**Version:** 1.0  
**Date:** December 8, 2025  
**Author:** Gist GEO Team  
**Status:** Draft

---

## Executive Summary

This PRD defines the requirements for building a **User Journey Simulation Agent** using the Vercel AI SDK v5. The agent will simulate authentic user conversations with AI search engines (ChatGPT, Perplexity, Claude) by adopting generated ICP personas and progressing through the Discovery → Consideration → Activation customer journey phases. This enables Gist GEO to understand how brands appear across AI-driven search experiences.

---

## Problem Statement

Brands need visibility into how AI search engines present their products during authentic customer journeys. Currently, there's no systematic way to:

- Simulate realistic user personas interacting with AI chatbots
- Track brand mentions across the full customer journey (awareness to purchase)
- Generate authentic, contextual queries that mirror real user behavior
- Evaluate AI responses for brand visibility and sentiment

---

## Goals & Success Metrics

### Primary Goals

1. Generate authentic ICP personas from brand URLs
2. Simulate multi-turn conversations that progress through journey phases
3. Capture and analyze AI responses for brand visibility metrics
4. Scale simulations across multiple ICPs and AI engines

### Success Metrics

| Metric                           | Target                                    |
| -------------------------------- | ----------------------------------------- |
| Query authenticity score         | >85% (human evaluation)                   |
| Journey completion rate          | >95% of simulations complete all 3 phases |
| Brand mention detection accuracy | >90% precision/recall                     |
| Simulation throughput            | 100+ journeys/hour                        |

---

## Technical Architecture Overview

### AI SDK v5 Foundation

The implementation will leverage the **Vercel AI SDK v5** released July 31, 2025, which provides:

- **Agent Class (`Experimental_Agent`)**: Encapsulates LLM configuration, tools, and behavior into reusable components
- **Loop Control (`stopWhen`, `prepareStep`)**: Fine-grained control over multi-step agent execution
- **Typed Chat Messages**: `UIMessage` and `ModelMessage` for type-safe conversation management
- **Global Provider System**: Simplified model references (`anthropic/claude-sonnet-4.5`, `openai/gpt-4o`)
- **Tool Calling**: Define tools with `inputSchema`/`outputSchema` using Zod validation

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Orchestrator Agent                            │
│  (coordinates workflow, manages state, tracks journey phase)     │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  ICP Generator  │ │ Query Generator │ │  User Simulator │
│     Agent       │ │     Agent       │ │      Agent      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │  Target LLM     │
                                    │  (ChatGPT/etc)  │
                                    └─────────────────┘
```

---

## Agent Specifications

### Agent 1: ICP Generator Agent

**Purpose:** Generate detailed Ideal Customer Profile personas from brand URLs.

**AI SDK Implementation:**

```typescript
import { Experimental_Agent as Agent, Output } from "ai";
import { z } from "zod";

const ICPSchema = z.object({
  persona: z.string().describe("One-line persona description"),
  demographics: z.object({
    role: z.string(),
    industry: z.string(),
    companySize: z.string().optional(),
  }),
  painPoints: z.array(z.string()),
  goals: z.array(z.string()),
  searchBehavior: z.object({
    preferredChannels: z.array(z.string()),
    queryStyle: z.enum(["detailed", "concise", "question-based"]),
    expertise: z.enum(["beginner", "intermediate", "expert"]),
  }),
  brandContext: z.object({
    awarenessLevel: z.enum(["unaware", "aware", "considering", "loyal"]),
    competitors: z.array(z.string()),
  }),
});

const icpGeneratorAgent = new Agent({
  model: "anthropic/claude-sonnet-4.5",
  system: `You are an expert market researcher specializing in B2B and B2C customer profiling. 
  
Given a brand URL and context, generate a realistic Ideal Customer Profile (ICP) that represents 
a typical buyer for this product/service. The persona should feel authentic and include:
- Specific job role and industry context
- Realistic pain points that lead to product search
- Natural search behavior patterns
- Appropriate brand awareness level for simulation`,

  tools: {
    scrapeUrl: urlScraperTool,
    analyzeCompetitors: competitorAnalysisTool,
  },

  experimental_output: Output.object({ schema: ICPSchema }),
  stopWhen: stepCountIs(5),
});
```

**Input:** Brand URL, optional vertical/industry hints  
**Output:** Structured ICP object with persona, demographics, pain points, goals, search behavior

**Example Output:**

```json
{
  "persona": "Preschool teachers prioritizing classroom-safe, educator-tested resources to facilitate engaging activities while ensuring a secure learning environment.",
  "demographics": {
    "role": "Preschool Teacher / Early Childhood Educator",
    "industry": "Education / Childcare"
  },
  "painPoints": [
    "Finding age-appropriate materials that meet safety standards",
    "Limited budget for classroom supplies",
    "Time constraints for activity preparation"
  ],
  "goals": [
    "Create engaging learning experiences",
    "Ensure child safety with all materials",
    "Find educator-recommended products"
  ],
  "searchBehavior": {
    "queryStyle": "question-based",
    "expertise": "intermediate"
  }
}
```

---

### Agent 2: Query Generator Agent

**Purpose:** Generate phase-appropriate queries based on ICP and journey stage.

**Journey Phase Definitions:**

| Phase             | Intent Level | Query Characteristics                                         | Example                                          |
| ----------------- | ------------ | ------------------------------------------------------------- | ------------------------------------------------ |
| **Discovery**     | Early        | Informational, open-ended, problem-focused, no brand mentions | "What are safe art tools for preschoolers?"      |
| **Consideration** | Mid          | Comparative, evaluative, category-level, feature-focused      | "Best non-toxic crayons vs markers for toddlers" |
| **Activation**    | High         | Action-oriented, shopping-focused, may include brand          | "Where to buy Crayola classroom packs near me"   |

**AI SDK Implementation:**

```typescript
const QuerySchema = z.object({
  query: z.string(),
  phase: z.enum(["discovery", "consideration", "activation"]),
  intent: z.string(),
  expectedResponseType: z.string(),
  followUpPotential: z.array(z.string()),
});

const queryGeneratorAgent = new Agent({
  model: "openai/gpt-4o",
  system: `You are a query generation expert that creates authentic search queries based on user personas.

Your queries must match the customer journey phase:

**DISCOVERY (Early Intent)**
- The user is exploring a problem, goal, or curiosity
- They are NOT yet aware of which specific product they need
- Queries should be: Informational, open-ended, NOT brand-specific, framed around the ICP's situation

**CONSIDERATION (Mid Intent)**  
- The user understands the category and is comparing options
- Queries should be: Comparative, evaluative, category-level (not brand-level), reflect ICP-specific needs

**ACTIVATION (High Intent)**
- The user is ready to buy and seeking availability, prices, sizing, or retailers
- Queries should be: Action-oriented, shopping-focused, may include brand if natural, immediately convertible

Generate queries that feel natural for the persona - match their expertise level and query style.`,

  experimental_output: Output.object({ schema: QuerySchema }),
});
```

**Input:** ICP object, current journey phase, conversation history (for context)  
**Output:** Single query with metadata about intent and expected response

---

### Agent 3: User Simulator Agent (Core)

**Purpose:** Conduct multi-turn conversations with target LLMs, maintaining persona consistency throughout the journey.

**AI SDK Implementation:**

```typescript
import { Experimental_Agent as Agent, stepCountIs, tool } from "ai";

// Custom stop condition: Stop when all 3 phases complete
const journeyComplete: StopCondition<typeof tools> = ({ steps }) => {
  const phases = steps
    .filter((s) =>
      s.toolResults?.some((r) => r.toolName === "recordPhaseCompletion")
    )
    .map(
      (s) =>
        s.toolResults.find((r) => r.toolName === "recordPhaseCompletion")
          ?.result
    );

  return (
    phases.includes("discovery") &&
    phases.includes("consideration") &&
    phases.includes("activation")
  );
};

const userSimulatorAgent = new Agent({
  model: "anthropic/claude-sonnet-4.5",

  system: `You are simulating a user conducting research on AI search engines.

**YOUR PERSONA:**
{icpPersona}

**YOUR OBJECTIVE:**
Progress through a natural customer journey by asking 3+ queries across these phases:
1. DISCOVERY: Explore the problem/need (1-2 queries)
2. CONSIDERATION: Compare options and features (1-2 queries)  
3. ACTIVATION: Seek purchase/action information (1 query)

**BEHAVIOR RULES:**
- Stay in character as the persona throughout
- React naturally to the AI's responses
- Ask follow-up questions when responses are vague or interesting
- Progress to next phase when you've gathered enough information
- Your queries should feel like a real person typing into ChatGPT/Perplexity

**CONVERSATION STYLE:**
- Match the persona's query style ({queryStyle})
- Match the persona's expertise level ({expertise})
- Include natural conversational elements (thanks, clarifications, etc.)`,

  tools: {
    sendQueryToLLM: tool({
      description: "Send a query to the target AI search engine",
      inputSchema: z.object({
        query: z.string(),
        phase: z.enum(["discovery", "consideration", "activation"]),
      }),
      execute: async ({ query, phase }) => {
        // Implementation calls target LLM API
        const response = await targetLLMClient.chat(query);
        return { response, phase, timestamp: Date.now() };
      },
    }),

    recordPhaseCompletion: tool({
      description: "Record when a journey phase is complete",
      inputSchema: z.object({
        phase: z.enum(["discovery", "consideration", "activation"]),
        queriesAsked: z.number(),
        insightsGathered: z.array(z.string()),
      }),
      execute: async ({ phase, queriesAsked, insightsGathered }) => {
        return phase; // Return phase for stop condition check
      },
    }),

    analyzeResponse: tool({
      description: "Analyze AI response for brand mentions and sentiment",
      inputSchema: z.object({
        response: z.string(),
        targetBrand: z.string(),
      }),
      execute: async ({ response, targetBrand }) => {
        // Brand visibility analysis logic
        return {
          brandMentioned: response
            .toLowerCase()
            .includes(targetBrand.toLowerCase()),
          sentiment: analyzeSentiment(response),
          position: findBrandPosition(response, targetBrand),
          competitors: extractCompetitorMentions(response),
        };
      },
    }),
  },

  stopWhen: [
    journeyComplete,
    stepCountIs(15), // Safety limit
  ],

  prepareStep: async ({ stepNumber, steps }) => {
    // Dynamically adjust based on conversation progress
    const completedPhases = countCompletedPhases(steps);

    if (completedPhases === 0) {
      return {
        toolChoice: { type: "tool", toolName: "sendQueryToLLM" },
      };
    }

    return {}; // Let model decide
  },
});
```

---

### Agent 4: Orchestrator Agent

**Purpose:** Coordinate the full workflow using the Orchestrator-Worker pattern.

**AI SDK Implementation:**

```typescript
const orchestratorAgent = new Agent({
  model: "openai/o4-mini", // Reasoning model for orchestration

  system: `You are the orchestrator for user journey simulations.

Your workflow:
1. Receive a brand URL and optional configuration
2. Generate ICP using the ICP Generator
3. Initialize User Simulator with the ICP persona
4. Monitor simulation progress and collect results
5. Aggregate insights and generate final report

Ensure each simulation:
- Completes all 3 journey phases
- Maintains persona consistency
- Captures all AI responses for analysis`,

  tools: {
    generateICP: tool({
      description: "Generate ICP from brand URL",
      inputSchema: z.object({ brandUrl: z.string() }),
      execute: async ({ brandUrl }) => {
        const result = await icpGeneratorAgent.generate({
          prompt: `Generate an ICP for: ${brandUrl}`,
        });
        return result.experimental_output;
      },
    }),

    runSimulation: tool({
      description: "Run a complete journey simulation",
      inputSchema: z.object({
        icp: ICPSchema,
        targetLLM: z.enum(["chatgpt", "perplexity", "claude"]),
        brandName: z.string(),
      }),
      execute: async ({ icp, targetLLM, brandName }) => {
        const result = await userSimulatorAgent.generate({
          prompt: `Begin your research journey as this persona: ${icp.persona}`,
        });
        return {
          conversationLog: result.steps,
          brandVisibility: aggregateBrandMetrics(result.steps),
        };
      },
    }),

    generateReport: tool({
      description: "Generate final simulation report",
      inputSchema: z.object({
        simulations: z.array(SimulationResultSchema),
      }),
      execute: async ({ simulations }) => {
        // Aggregate and format results
        return generateVisibilityReport(simulations);
      },
    }),
  },

  stopWhen: stepCountIs(10),
});
```

---

## Workflow Patterns Applied

### 1. Sequential Processing (Chain)

Used for the core simulation flow:

```
URL → ICP Generation → Query Generation → Simulation → Analysis
```

### 2. Orchestrator-Worker

The Orchestrator Agent coordinates specialized workers (ICP Generator, Query Generator, User Simulator).

### 3. Evaluator-Optimizer Loop

Query generation includes quality checks:

```typescript
// Generate query
const query = await queryGeneratorAgent.generate({ ... });

// Evaluate authenticity
const evaluation = await evaluatorAgent.generate({
  prompt: `Rate this query for authenticity: "${query}"`,
});

// Regenerate if score < 7
if (evaluation.authenticityScore < 7) {
  // Retry with feedback
}
```

### 4. Routing

Route to different simulation strategies based on ICP characteristics:

```typescript
const strategy =
  icp.searchBehavior.expertise === "expert"
    ? "technical-deep-dive"
    : icp.searchBehavior.queryStyle === "question-based"
    ? "conversational"
    : "direct-search";
```

---

## Data Models

### Conversation Turn

```typescript
interface ConversationTurn {
  id: string;
  timestamp: Date;
  phase: "discovery" | "consideration" | "activation";
  query: string;
  response: string;
  brandAnalysis: {
    brandMentioned: boolean;
    mentionPosition: number | null;
    sentiment: "positive" | "neutral" | "negative";
    competitorsMentioned: string[];
    recommendationStrength: number; // 1-10
  };
}
```

### Simulation Result

```typescript
interface SimulationResult {
  id: string;
  brandUrl: string;
  targetLLM: string;
  icp: ICP;
  conversations: ConversationTurn[];
  summary: {
    totalQueries: number;
    brandMentionRate: number;
    averageSentiment: number;
    journeyCompletionRate: number;
    competitorComparison: Record<string, number>;
  };
}
```

---

## Integration with Gist GEO

### Convex Database Schema

```typescript
// convex/schema.ts
export default defineSchema({
  simulations: defineTable({
    brandId: v.id('brands'),
    icpId: v.id('icps'),
    targetLLM: v.string(),
    status: v.string(),
    conversationLog: v.array(v.object({
      phase: v.string(),
      query: v.string(),
      response: v.string(),
      brandAnalysis: v.object({...}),
    })),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index('by_brand', ['brandId']),

  icps: defineTable({
    brandId: v.id('brands'),
    persona: v.string(),
    demographics: v.object({...}),
    painPoints: v.array(v.string()),
    // ...
  }),
});
```

### API Route (Next.js App Router)

```typescript
// app/api/simulate/route.ts
import { validateUIMessages } from "ai";

export async function POST(request: Request) {
  const { brandUrl, targetLLM, icpConfig } = await request.json();

  // Stream simulation progress
  return orchestratorAgent.respond({
    messages: await validateUIMessages({
      messages: [
        {
          role: "user",
          content: `Simulate journey for ${brandUrl} on ${targetLLM}`,
        },
      ],
    }),
  });
}
```

---

## Configuration Options

```typescript
interface SimulationConfig {
  // Target configuration
  brandUrl: string;
  brandName: string;
  targetLLMs: ("chatgpt" | "perplexity" | "claude")[];

  // ICP configuration
  icpCount: number; // Number of different ICPs to simulate
  icpSeeds?: Partial<ICP>[]; // Optional ICP hints

  // Journey configuration
  minQueriesPerPhase: number; // default: 1
  maxQueriesPerPhase: number; // default: 3
  allowFollowUps: boolean; // default: true

  // Model configuration
  orchestratorModel: string; // default: 'openai/o4-mini'
  simulatorModel: string; // default: 'anthropic/claude-sonnet-4.5'

  // Safety limits
  maxStepsPerSimulation: number; // default: 15
  timeoutMs: number; // default: 300000 (5 min)
}
```

---

## Error Handling

```typescript
const userSimulatorAgent = new Agent({
  // ... config

  onError: async (error) => {
    logger.error("Simulation error", { error });

    if (error.code === "RATE_LIMIT") {
      await sleep(60000);
      return "retry";
    }

    if (error.code === "CONTEXT_LENGTH_EXCEEDED") {
      // Compress conversation history
      return "compress_and_retry";
    }

    return "abort";
  },
});
```

---

## Testing Strategy

### Unit Tests

- ICP generation quality (persona coherence, completeness)
- Query authenticity per phase
- Brand mention detection accuracy

### Integration Tests

- Full journey completion across LLM targets
- Conversation continuity and persona consistency
- Convex data persistence

### Load Tests

- Concurrent simulation capacity
- API rate limit handling
- Memory usage over long simulations

---

## Deployment Considerations

### Vercel Deployment

- Use **Fluid Compute** for long-running agent executions
- Set `maxDuration` to 300-800 seconds for complex simulations
- Enable background task processing for batch simulations

### Environment Variables

```
OPENAI_API_KEY=xxx
ANTHROPIC_API_KEY=xxx
PERPLEXITY_API_KEY=xxx
CONVEX_URL=xxx
```

---

## Future Enhancements

1. **Multi-language support**: Simulate journeys in different languages
2. **Voice-to-text simulation**: Simulate voice search patterns
3. **Competitive benchmarking**: Run parallel simulations for competitor brands
4. **Real-time monitoring dashboard**: Live view of ongoing simulations
5. **A/B testing**: Compare different ICP configurations
6. **MCP Integration**: Use Model Context Protocol for tool interoperability

---

## Appendix: AI SDK v5 Key References

| Feature           | Documentation                                 |
| ----------------- | --------------------------------------------- |
| Agent Class       | `Experimental_Agent` from 'ai'                |
| Loop Control      | `stopWhen`, `stepCountIs`, `prepareStep`      |
| Structured Output | `Output.object({ schema })` with Zod          |
| Tool Definition   | `tool({ description, inputSchema, execute })` |
| Streaming         | `agent.stream()` with SSE-based responses     |
| Type Inference    | `InferAgentUIMessage<typeof agent>`           |

---

## Revision History

| Version | Date        | Author        | Changes       |
| ------- | ----------- | ------------- | ------------- |
| 1.0     | Dec 8, 2025 | Gist GEO Team | Initial draft |
