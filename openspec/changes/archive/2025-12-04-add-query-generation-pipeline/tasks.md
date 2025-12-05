# Tasks: Add Query Generation Pipeline

## 1. Project Setup
- [ ] 1.1 Initialize Bun project with `bun init`
- [ ] 1.2 Install dependencies: `ai`, `@ai-sdk/openai`, `zod`
- [ ] 1.3 Configure TypeScript strict mode in `tsconfig.json`
- [ ] 1.4 Create `.env` file with `OPENAI_API_KEY` placeholder
- [ ] 1.5 Add `.env` to `.gitignore`

## 2. Schema Definitions
- [ ] 2.1 Create `src/schemas/topics.ts` with TopicsSchema
- [ ] 2.2 Create `src/schemas/icps.ts` with ICPsSchema
- [ ] 2.3 Create `src/schemas/queries.ts` with QueriesSchema
- [ ] 2.4 Create `src/types.ts` with shared type definitions

## 3. System Prompts
- [ ] 3.1 Create `src/prompts/topic-generator.ts` with topic system prompt
- [ ] 3.2 Create `src/prompts/icp-generator.ts` with ICP system prompt
- [ ] 3.3 Create `src/prompts/query-generator.ts` with query system prompt

## 4. Generator Functions
- [ ] 4.1 Create `src/generators/analyze-brand.ts` using `generateText` + `webSearch` tool
- [ ] 4.2 Create `src/generators/generate-topics.ts` using `generateObject`
- [ ] 4.3 Create `src/generators/generate-icps.ts` using `generateObject`
- [ ] 4.4 Create `src/generators/generate-queries.ts` using `generateObject`

## 5. Pipeline Orchestration
- [ ] 5.1 Create `src/pipeline/run-pipeline.ts` to coordinate all generators
- [ ] 5.2 Share brand analysis across Topic and ICP generation
- [ ] 5.3 Implement (Topic, ICP) pairing logic (5×5 = 25 pairings)
- [ ] 5.4 Add error handling for API failures

## 6. CLI Entry Point
- [ ] 6.1 Create `src/index.ts` with CLI argument parsing
- [ ] 6.2 Output results as formatted JSON to stdout

## 7. Testing
- [ ] 7.1 Create unit tests for schema validation
- [ ] 7.2 Create integration test with real URL (e.g., vans.com)
- [ ] 7.3 Document manual testing steps in README

## 8. Documentation
- [ ] 8.1 Create README.md with usage instructions
- [ ] 8.2 Document environment setup and API key configuration
