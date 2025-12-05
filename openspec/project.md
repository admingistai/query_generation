# Project Context

## Purpose
Brand Query Generator - A pipeline that takes brand URLs as input and generates customer journey queries for AI search optimization.

**Core Flow:**
1. Input: Brand URL(s)
2. Analyze brand → Generate 5 Topics + 5 ICPs
3. Create (Topic, ICP) pairings
4. For each pairing → Generate 3 journey-stage queries:
   - **Discovery**: Informational, problem-aware, not brand-specific
   - **Consideration**: Comparative, category-level evaluation
   - **Activation**: Action-oriented, purchase-ready

**Example Output:**
```
ICP: A young kid who skateboards
Topic: Footwear

DISCOVERY: "What kind of footwear is best for young kids learning to skateboard?"
CONSIDERATION: "What are the most durable skate shoes for kids who skate daily?"
ACTIVATION: "Where can I buy kid-sized skate shoes that are in stock right now?"
```

## Tech Stack
- **Runtime**: Bun
- **Language**: TypeScript (strict mode)
- **AI SDK**: Vercel AI SDK (`ai` + `@ai-sdk/openai`)
- **Schema Validation**: Zod
- **Testing**: Bun test runner

## Project Conventions

### Code Style
- Use `generateObject` with Zod schemas for structured AI outputs
- Prefer `.nullable()` over `.optional()` for OpenAI structured outputs
- Functional approach with pure functions where possible
- Named exports, descriptive function names

### Architecture Patterns
**Modular Pipeline Design:**
```
src/
├── prompts/           # System prompts as constants
│   ├── topic-generator.ts
│   ├── icp-generator.ts
│   └── query-generator.ts
├── schemas/           # Zod schemas for AI outputs
│   ├── topics.ts
│   ├── icps.ts
│   └── queries.ts
├── generators/        # Core generation functions
│   ├── generate-topics.ts
│   ├── generate-icps.ts
│   └── generate-queries.ts
├── pipeline/          # Orchestration
│   └── run-pipeline.ts
└── index.ts           # Entry point
```

### Testing Strategy
- Unit test each generator function in isolation
- Mock AI responses for deterministic tests
- Integration tests with real API calls (manual/CI with API key)
- Test with `bun test`

### Git Workflow
- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`
- Feature branches off `main`

## Domain Context

### Customer Journey Stages
| Stage | Intent Level | Query Characteristics |
|-------|-------------|----------------------|
| Discovery | Early | Informational, problem-focused, no brand mention |
| Consideration | Mid | Comparative, feature-focused, category-level |
| Activation | High | Action-oriented, purchase-ready, may include brand |

### Topic Requirements
- 2-4 words each
- Reflect: product-use intents, category searches, style motives, practical needs
- NO brand slogans, invented heritage, vague abstractions

### ICP Requirements
- 1-2 sentences each
- Focus on: needs, motivations, lifestyle context, behavioral drivers
- Psychographic/behavioral focus, NOT demographic labels

## Important Constraints
- OpenAI API rate limits and costs
- Structured outputs require `.nullable()` not `.optional()` in Zod schemas
- Topics must be grounded in real product demand
- ICPs must avoid generic audience labels

## External Dependencies
- **OpenAI API**: GPT-4o for structured generation
- **Environment**: `OPENAI_API_KEY` required
