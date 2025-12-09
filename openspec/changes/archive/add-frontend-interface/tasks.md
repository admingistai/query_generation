# Tasks: Add Frontend Interface

## 1. Project Conversion to Next.js
- [x] 1.1 Initialize Next.js with App Router, TypeScript, Tailwind (`bunx create-next-app@latest . --typescript --tailwind --app --src-dir`)
- [x] 1.2 Move existing `src/` code to `src/lib/` (generators, schemas, prompts, types)
- [x] 1.3 Remove CLI entry point (`src/index.ts`)
- [x] 1.4 Verify existing generators work with new structure

## 2. Install and Configure shadcn/ui
- [x] 2.1 Initialize shadcn/ui (`npx shadcn@latest init`)
- [x] 2.2 Add required components:
  ```bash
  npx shadcn@latest add button card tabs collapsible textarea progress badge table resizable input
  ```
- [x] 2.3 Install lucide-react icons (`bun add lucide-react`)

## 3. Modify Generators for Custom Prompts
- [x] 3.1 Update `generate-topics.ts` to accept optional `systemPrompt` parameter
- [x] 3.2 Update `generate-icps.ts` to accept optional `systemPrompt` parameter
- [x] 3.3 Update `generate-queries.ts` to accept optional `systemPrompt` parameter
- [x] 3.4 Export default prompts from `prompts/` for frontend use

## 4. API Routes (Streaming)
- [x] 4.1 Create `/api/analyze-brand/route.ts` with web search streaming
- [x] 4.2 Create `/api/generate-topics/route.ts` with `streamObject`
- [x] 4.3 Create `/api/generate-icps/route.ts` with `streamObject`
- [x] 4.4 Create `/api/generate-queries/route.ts` with `streamObject`

## 5. Frontend Components (using shadcn/ui)
- [x] 5.1 Create `PromptEditor.tsx` - Collapsible + Textarea + Button (reset)
- [x] 5.2 Create `UrlInput.tsx` - Card + Input + Button (add/remove URLs)
- [x] 5.3 Create `TopicsList.tsx` - Badge components for topics
- [x] 5.4 Create `IcpsList.tsx` - Card components for ICPs
- [x] 5.5 Create `PairingsTable.tsx` - Table for (topic, icp) → queries
- [x] 5.6 Create `ResultsPanel.tsx` - Progress + results display

## 6. Main Page Integration
- [x] 6.1 Create `app/page.tsx` with ResizablePanelGroup layout
- [x] 6.2 Wire up prompt editors with useState
- [x] 6.3 Implement `runPipeline()` function with sequential streaming
- [x] 6.4 Add Export JSON functionality

## 7. Testing & Polish
- [x] 7.1 Add loading states and error handling with shadcn components
- [ ] 7.2 Test with real URLs (vans.com, nike.com)
- [ ] 7.3 Update README with new usage instructions
