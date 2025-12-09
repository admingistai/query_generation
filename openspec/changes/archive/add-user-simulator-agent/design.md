## Context

The demo page needs to become an interactive simulation platform for testing AI customer journey scenarios. This involves creating an AI agent using the Vercel AI SDK v5 that can adopt ICP personas and conduct multi-turn conversations progressing through Discovery → Consideration → Activation phases.

**Stakeholders**: Gist GEO team, brand analysts, marketing teams
**Constraints**: AI SDK v5 (already in project), existing PhoneChatbot component patterns, OpenAI API

## Goals / Non-Goals

**Goals**:
- Create a User Simulator Agent using AI SDK v5 `Experimental_Agent`
- Split-panel UI with configuration on left, simulation on right
- Agent progresses through 3 journey phases with natural transitions
- Visual indicators for current phase and conversation progress
- Reuse existing IPhoneFrame component for consistency

**Non-Goals**:
- Multi-LLM support (ChatGPT, Perplexity) - future enhancement
- Brand visibility analytics/scoring - future enhancement
- Concurrent multi-ICP simulations - future enhancement
- Convex database persistence - future enhancement

## Decisions

### Decision 1: AI SDK v5 Agent Implementation
**What**: Use `Experimental_Agent` with `stopWhen` and `prepareStep` for journey control.
**Why**: Native AI SDK support for multi-step agents with fine-grained loop control, already in project dependencies.

**Alternatives considered**:
- LangChain agents: More complexity, additional dependency
- Custom loop implementation: Less maintainable, reinventing the wheel

### Decision 2: Split-Panel Layout
**What**: Left panel (40%) for configuration, right panel (60%) for iPhone-framed chatbot.
**Why**: Matches user's requirement for inputs on left, simulation on right. Reuses existing IPhoneFrame component.

### Decision 3: Tool-Based Phase Progression
**What**: Agent uses tools to send queries, record phase completions, and track journey state.
**Why**: Enables structured data capture and clean phase transition logic.

**Key Tools**:
```typescript
tools: {
  sendQuery: tool({
    description: "Send a query as the ICP persona",
    inputSchema: z.object({
      query: z.string(),
      phase: z.enum(["discovery", "consideration", "activation"]),
    }),
    execute: async ({ query, phase }) => {
      // Forward query to chat API, return response
    },
  }),

  recordPhaseCompletion: tool({
    description: "Record when a journey phase is complete",
    inputSchema: z.object({
      phase: z.enum(["discovery", "consideration", "activation"]),
      insightsGathered: z.array(z.string()),
    }),
    execute: async ({ phase }) => phase,
  }),
}
```

### Decision 4: Stop Condition - Journey Complete
**What**: Custom `stopWhen` condition that checks all 3 phases are complete OR step limit (15) reached.
**Why**: Ensures natural journey completion while preventing runaway loops.

```typescript
stopWhen: [journeyComplete, stepCountIs(15)]
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    /demo Page (Split Panel)                  │
├──────────────────────┬──────────────────────────────────────┤
│  SimulationPanel     │         SimulatorChatbot             │
│  ─────────────────   │         ──────────────────           │
│  - ICP Description   │         ┌──────────────────┐         │
│  - Initial Query     │         │   IPhoneFrame    │         │
│  - Journey Phase     │         │  ┌────────────┐  │         │
│    Indicator         │         │  │ Chatbot    │  │         │
│  - Start/Reset       │         │  │ with Agent │  │         │
│    Buttons           │         │  └────────────┘  │         │
│                      │         └──────────────────┘         │
└──────────────────────┴──────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   /api/simulate Route                        │
│  ─────────────────────────────────────────────────────────  │
│  - Receives ICP persona + initial query                      │
│  - Creates UserSimulatorAgent with persona injected          │
│  - Streams agent responses back to client                    │
│  - Tracks phase progression in response metadata             │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────┐
│             UserSimulatorAgent (AI SDK v5)                   │
│  ─────────────────────────────────────────────────────────  │
│  model: "openai/gpt-4o"                                      │
│  system: Dynamic prompt with {icpPersona} injection          │
│  tools: sendQuery, recordPhaseCompletion                     │
│  stopWhen: [journeyComplete, stepCountIs(15)]                │
│  prepareStep: Force sendQuery tool on first step             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **User configures simulation**: Enters ICP description and initial query in left panel
2. **Starts simulation**: Clicks "Start Simulation" button
3. **API receives config**: POST to `/api/simulate` with ICP persona and query
4. **Agent initialized**: UserSimulatorAgent created with persona in system prompt
5. **Simulation runs**: Agent generates queries, receives responses, progresses through phases
6. **Streaming updates**: Each turn streams to frontend with phase metadata
7. **Journey complete**: Agent stops when all 3 phases recorded complete
8. **UI updates**: Phase indicators show completion, conversation visible in chatbot

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Agent may not naturally progress through phases | Use `prepareStep` to guide tool selection and add explicit phase progression instructions in system prompt |
| Long conversations could exceed context limits | Step limit of 15, summarize if needed |
| ICP persona drift during conversation | Strong system prompt reinforcement, check persona consistency in `prepareStep` |
| API timeouts for long simulations | Set `maxDuration: 120` on API route, implement client-side timeout handling |

## Migration Plan

1. Keep existing `/demo` functionality working until new implementation complete
2. Implement in parallel, can initially deploy to `/demo-v2` for testing
3. Once validated, replace `/demo` with new implementation
4. No rollback needed - old chatbot remains available at `/demo2` (multi-grid)

## Open Questions

- Should we persist simulation results to a database for analysis? (Defer to future enhancement)
- Do we need abort/stop functionality mid-simulation? (Recommended: yes)
- Should phase transitions be automatic or require user confirmation? (Proposed: automatic with visual indicator)
