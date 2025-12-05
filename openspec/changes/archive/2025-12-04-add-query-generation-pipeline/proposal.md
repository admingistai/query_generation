# Change: Add Query Generation Pipeline

## Why
Enable brands to generate customer journey queries for AI search optimization. The pipeline transforms brand URLs into actionable (ICP, Topic) pairs and produces Discovery, Consideration, and Activation queries that represent real user search behavior across the customer journey lifecycle.

## What Changes
- **NEW** Topic Generation capability: Extracts 5 search-intent topics from brand URL
- **NEW** ICP Generation capability: Generates 5 Ideal Customer Profiles from brand URL
- **NEW** Query Generation capability: Produces 3 journey-stage queries per (Topic, ICP) pairing
- **NEW** Pipeline orchestration: Coordinates the three generators into a cohesive flow

## Impact
- Affected specs: `topic-generation`, `icp-generation`, `query-generation` (all new)
- Affected code: `src/generators/`, `src/schemas/`, `src/prompts/`, `src/pipeline/`
- Dependencies: Vercel AI SDK (`ai`, `@ai-sdk/openai`), Zod, Bun runtime
