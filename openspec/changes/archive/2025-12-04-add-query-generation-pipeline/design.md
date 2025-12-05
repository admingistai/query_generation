# Design: Query Generation Pipeline

## Context
This is a greenfield backend project that uses the Vercel AI SDK with OpenAI to transform brand URLs into customer journey queries. The pipeline has three sequential stages, each using structured output via `generateObject` with Zod schemas.

**Stakeholders**: Marketing teams, SEO specialists, AI search optimization engineers

## Goals / Non-Goals

**Goals:**
- Generate 5 topics from a brand URL that reflect real search-intent themes
- Generate 5 ICPs from a brand URL with psychographic/behavioral focus
- Generate 3 journey-stage queries (Discovery, Consideration, Activation) per (Topic, ICP) pair
- Provide typed, validated outputs at each stage
- Enable easy testing with a single URL input

**Non-Goals:**
- Frontend/UI (backend only for this phase)
- Batch processing of multiple URLs (single URL input for now)
- URL scraping/fetching (AI model analyzes URL directly via web browsing capability)
- Persistence/database storage
- Authentication/authorization

## Decisions

### Decision 1: Use Vercel AI SDK with Web Search + Structured Output
**Rationale**: The AI SDK provides:
- `openai.tools.webSearch()` for live URL/brand analysis
- `generateObject` with Zod schemas for structured outputs
- Type-safe validation and clean async/await API

**Two-Step Pattern for Topics/ICPs:**
```typescript
// Step 1: Web search to analyze brand URL
const { text: brandAnalysis, sources } = await generateText({
  model: openai('gpt-4o'),
  prompt: `Analyze this brand: ${url}`,
  tools: {
    web_search: openai.tools.webSearch({})
  },
  toolChoice: { type: 'tool', toolName: 'web_search' }
});

// Step 2: Structured output from analysis
const { object } = await generateObject({
  model: openai('gpt-4o'),
  schema: TopicsSchema,
  system: TOPIC_GENERATOR_SYSTEM_PROMPT,
  prompt: `Based on this brand analysis:\n${brandAnalysis}\n\nGenerate 5 topics.`
});
```

**Alternatives considered**:
- Single `generateText` with JSON parsing: Less reliable, no schema validation
- Raw OpenAI SDK: More boilerplate, manual JSON parsing
- LangChain: Over-engineered for this use case

### Decision 2: Sequential Pipeline (not parallel for Topics/ICPs)
**Rationale**: Topics and ICPs are generated from the same URL analysis. Running them sequentially allows potential optimization later (shared context), though they could be parallelized. Queries depend on both, so must run after.

```
URL → [Topic Generator] → 5 Topics
    → [ICP Generator]   → 5 ICPs
    → [Query Generator] → 25 × 3 = 75 Queries (5 topics × 5 ICPs × 3 stages)
```

**Alternative considered**:
- Parallel Topics + ICPs: Viable, adds complexity, minimal time savings for 2 API calls

### Decision 3: Use `.nullable()` not `.optional()` in Zod Schemas
**Rationale**: OpenAI structured outputs require `.nullable()` for optional fields. Using `.optional()` causes `NoObjectGeneratedError`.

### Decision 4: System Prompts as Constants
**Rationale**: Store prompts in `src/prompts/` as exported constants for:
- Version control visibility
- Easy testing and iteration
- Type safety with template literals

### Decision 5: Bun Runtime
**Rationale**:
- Fast TypeScript execution without compilation step
- Built-in test runner
- Native ES modules

## Architecture

```
src/
├── prompts/
│   ├── topic-generator.ts    # TOPIC_GENERATOR_SYSTEM_PROMPT
│   ├── icp-generator.ts      # ICP_GENERATOR_SYSTEM_PROMPT
│   └── query-generator.ts    # QUERY_GENERATOR_SYSTEM_PROMPT
├── schemas/
│   ├── topics.ts             # TopicsSchema (array of 5 strings)
│   ├── icps.ts               # ICPsSchema (array of 5 strings)
│   └── queries.ts            # QueriesSchema (discovery, consideration, activation)
├── generators/
│   ├── analyze-brand.ts      # analyzeBrand(url: string) → { analysis, sources }
│   ├── generate-topics.ts    # generateTopics(analysis: string) → Topic[]
│   ├── generate-icps.ts      # generateICPs(analysis: string) → ICP[]
│   └── generate-queries.ts   # generateQueries(icp: string, topic: string) → JourneyQueries
├── pipeline/
│   └── run-pipeline.ts       # runPipeline(url: string) → PipelineResult
├── types.ts                  # Shared type definitions
└── index.ts                  # CLI entry point
```

## Data Flow

```typescript
// Input
const url = "https://vans.com";

// Stage 0: Analyze brand with web search (shared across Topics & ICPs)
const { text: brandAnalysis, sources } = await analyzeBrand(url);

// Stage 1 & 2 (can run in parallel - use same brandAnalysis)
const topics = await generateTopics(brandAnalysis);  // ["skateboarding shoes", ...]
const icps = await generateICPs(brandAnalysis);      // ["Teen skaters needing...", ...]

// Stage 3 (runs for each pairing - no web search needed)
const results: PairingResult[] = [];
for (const topic of topics) {
  for (const icp of icps) {
    const queries = await generateQueries(icp, topic);
    results.push({ topic, icp, queries });
  }
}
```

**API Call Count:**
- 1 web search call (brand analysis)
- 1 generateObject call (topics)
- 1 generateObject call (ICPs)
- 25 generateObject calls (queries for 5×5 pairings)
- **Total: 28 API calls per URL**

## Output Schema

```typescript
interface PipelineResult {
  url: string;
  topics: string[];        // 5 topics
  icps: string[];          // 5 ICPs
  pairings: PairingResult[];  // 25 pairings
}

interface PairingResult {
  topic: string;
  icp: string;
  queries: {
    discovery: string;
    consideration: string;
    activation: string;
  };
}
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| OpenAI rate limits with 25+ sequential query calls | Batch with `Promise.all` in chunks of 5 |
| Cost: ~27 API calls per URL | Start with GPT-4o-mini for development |
| URL content changes over time | Results are point-in-time; no caching needed |
| Model may not have current URL data | Accept limitation; model uses training data + web browsing |

## Testing Strategy

1. **Unit Tests**: Mock `generateObject` responses, test schema validation
2. **Integration Tests**: Real API calls with known brand URLs (e.g., vans.com, nike.com)
3. **Manual Testing**: CLI with `bun run src/index.ts <url>`

```bash
# Run single URL test
bun run src/index.ts https://vans.com

# Run tests
bun test
```

## Open Questions

1. **Pairing strategy**: Should we generate all 25 pairings (5×5) or a subset? Current design: all 25.
2. **Rate limiting**: Need to implement retry logic for OpenAI 429 errors?
3. **Output format**: JSON to stdout, or write to file?
