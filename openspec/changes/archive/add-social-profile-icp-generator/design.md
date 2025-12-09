# Design: Social Profile ICP Generator

## Context
The existing ICP generation capability generates ICPs from brand URLs (analyzing what a brand sells). This feature generates ICPs from social profile URLs (analyzing who follows a creator). This is a distinct use case requiring different data extraction and analysis patterns.

**Stakeholders**: Marketing teams, influencer marketing platforms, content strategists

## Goals / Non-Goals

### Goals
- Generate 3-6 distinct audience segment ICPs from any public social profile
- Support Instagram, TikTok, X/Twitter, YouTube, LinkedIn profiles
- Provide psychographic depth (why they follow, not just demographics)
- Stream results to UI for responsive UX

### Non-Goals
- Scraping private/protected profiles (respect privacy)
- Storing scraped profile data long-term (privacy compliance)
- Real-time follower data (use web search for public info only)
- Multi-profile comparison (future enhancement)

## Decisions

### Decision 1: Single Agent with Multi-Tool Pattern
**What**: Use a single AI agent with multiple tools rather than separate sub-agents

**Why**:
- Simpler implementation and debugging
- AI SDK v5 `streamText` with tools handles this well
- Sub-agent orchestration adds complexity without clear benefit for this use case
- Existing `userSimulatorAgent.ts` pattern proves single-agent works well

**Alternatives considered**:
- Multi-agent system (Orchestrator + Profile Scraper + Content Analyzer + ICP Generator): More complex, harder to debug, overkill for this task

### Decision 2: Web Search for Profile Data
**What**: Use OpenAI's `web_search` tool to gather profile information instead of direct scraping

**Why**:
- No need for scraping infrastructure (Bright Data, Firecrawl)
- Works within existing OpenAI API limits
- Respects robots.txt and platform ToS
- Already proven in `userSimulatorAgent.ts` implementation

**Alternatives considered**:
- Firecrawl MCP: Adds external dependency, may hit rate limits
- Direct API access: Requires OAuth setup per platform, complex

### Decision 3: Streaming with Tool Visibility
**What**: Stream agent responses showing tool invocations (profile lookup, analysis, generation)

**Why**:
- Consistent with existing `SimulatorChatbot.tsx` pattern
- Users see progress during generation
- AI SDK v5 `toUIMessageStreamResponse()` handles this

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                 /api/social-icp                      │
│                   POST handler                       │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│           Social Profile ICP Agent                   │
│  (streamText with tools, prepareStep, stopWhen)     │
├─────────────────────────────────────────────────────┤
│ Tools:                                               │
│  - lookupProfile: web_search for profile info       │
│  - analyzeContent: extract themes & audience signals │
│  - generateICPs: create 3-6 distinct segments        │
│  - validateDistinctness: ensure segments differ      │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              Frontend (demo3/page.tsx)               │
│  - SocialProfileInput                               │
│  - ICPCard / ICPGrid                                │
│  - Streaming tool call visualization                │
└─────────────────────────────────────────────────────┘
```

## ICP Output Schema

```typescript
const ICPSegmentSchema = z.object({
  segmentName: z.string(),
  personaDescription: z.string().max(200),
  demographics: z.object({
    ageRange: z.string(),
    gender: z.string(),
    occupation: z.string().nullable(),
  }),
  psychographics: z.object({
    values: z.array(z.string()),
    aspirations: z.array(z.string()),
    painPoints: z.array(z.string()),
    lifestyle: z.string(),
  }),
  behaviors: z.object({
    followReason: z.string(),
    engagementStyle: z.enum(['lurker', 'liker', 'commenter', 'sharer', 'superfan']),
    purchaseInfluence: z.enum(['high', 'medium', 'low']),
    contentPreferences: z.array(z.string()),
  }),
  brandAffinities: z.array(z.string()),
  estimatedSegmentSize: z.string(),
});
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Web search may return outdated info | Accept as limitation, note in UI |
| Private profiles can't be analyzed | Detect and show clear error message |
| Platform-specific nuances | Add platform detection, adjust prompts |
| Rate limits on web search | Add retry logic, queue requests |

## Migration Plan
N/A - new capability, no existing data to migrate.

## Open Questions
- Should we cache profile lookups? (Suggest: no, keep simple for MVP)
- Should we support batch profile analysis? (Suggest: future enhancement)
