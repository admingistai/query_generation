# Proposal: Add Article Context Support for ICP Generation

## Problem Statement

Currently, the Social ICP Generator only accepts social profile URLs. However, valuable audience insights often exist in:
- Interview articles about the creator
- Press coverage and features
- Industry reports mentioning the creator
- Blog posts discussing their audience
- Podcast transcripts

These sources can provide **high-quality evidence** that social profiles lack:
- Direct demographic data ("her audience is primarily 25-34 year old women")
- Brand partnership history
- Revenue/business model insights
- Explicit audience descriptions from the creator themselves

## Architectural Analysis

### Current Pipeline Flow
```
Profile URLs → expandUrls → deepResearch → classifyNiche → findComparableCreators → generateICPs → validateICPs
```

### Key Integration Points

**Option A: Parallel Processing (Recommended)**
```
Profile URLs ─┬─→ expandUrls → deepResearch ─┬─→ classifyNiche → ...
              │                               │
Article URLs ─┴─→ extractArticleContext ──────┘
```

- Article processing runs in parallel with URL expansion
- Results merge at the niche classification stage
- Article insights become additional evidence sources
- **Non-breaking**: Existing flow unchanged when no articles provided

**Option B: Sequential Processing**
```
Profile URLs → expandUrls → deepResearch → extractArticleContext → classifyNiche → ...
```
- Articles processed after profile research
- Slower, but simpler dependency chain

**Option C: Pre-processing**
```
Article URLs → extractArticleContext ─┬─→ expandUrls → ...
                                      │
Profile URLs ────────────────────────┘
```
- Article insights inform URL expansion
- Could help discover additional platforms mentioned in articles

## Recommended Approach: Option A (Parallel Processing)

### Why This Approach?

1. **Non-breaking**: Zero changes to existing flow when articles aren't provided
2. **Parallel execution**: Faster overall processing
3. **Clean separation**: Article processing is isolated in its own tool
4. **Composable evidence**: Article insights become another evidence source type

### Evidence Type Extension

Current evidence types:
```typescript
"hashtag" | "content" | "collaboration" | "comment" | "bio" | "comparable_creator"
```

New evidence type:
```typescript
"article" // Insights extracted from press/interviews/articles
```

Article evidence carries **high weight** because it's often:
- First-party information from creator interviews
- Third-party research with cited sources
- Explicit demographic data rather than inference

### Schema Changes

```typescript
// New: Article context extraction result
export const ArticleContextSchema = z.object({
  sourceUrl: z.string(),
  sourceTitle: z.string().nullable(),
  sourceType: z.enum(["interview", "press", "blog", "podcast", "research", "other"]),
  extractedInsights: z.object({
    audienceDemographics: z.array(z.object({
      insight: z.string(),
      confidence: ConfidenceLevelSchema,
      quote: z.string().nullable(), // Direct quote if available
    })),
    brandMentions: z.array(z.string()),
    nicheSignals: z.array(z.string()),
    creatorQuotes: z.array(z.string()), // Creator's own words about audience
    geographySignals: z.array(z.string()),
  }),
});

// Extend request schema
export const EvidenceBasedICPRequestSchema = z.object({
  urls: z.union([...]), // Existing
  articleUrls: z.array(z.string().url()).max(3).optional(), // NEW
  hints: z.object({...}).optional(), // Existing
  config: z.object({...}).optional(), // Existing
});
```

### New Tool: `extractArticleContext`

```typescript
extractArticleContext: tool({
  parameters: z.object({
    articleUrl: z.string(),
    creatorName: z.string().optional(),
  }),
  execute: async ({ articleUrl, creatorName }) => {
    // 1. Fetch article content via web search or direct fetch
    // 2. Extract audience-relevant insights using LLM
    // 3. Return structured ArticleContext
  }
})
```

### UI Changes

Add "Context Articles" section below profile URLs:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔗 Profile URLs                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ instagram.com/creator ✕ │ tiktok.com/@creator ✕        │ │
│ └─────────────────────────────────────────────────────────┘ │
│ [Enter URL...                                    ] [+ Add]  │
├─────────────────────────────────────────────────────────────┤
│ 📄 Context Articles (optional)                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ forbes.com/interview-creator ✕                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│ [Paste article/interview URL...                  ] [+ Add]  │
│ ℹ️ Add interviews, press coverage, or articles about this    │
│    creator for richer audience insights                      │
└─────────────────────────────────────────────────────────────┘
```

### Evidence Display

Article evidence shows differently:
```
📄 ARTICLE: "Her audience is primarily millennial women interested in sustainable fashion"
   Source: Forbes Interview (forbes.com/...)
   Type: Direct quote from creator
```

## Trade-offs

### Pros
- High-quality evidence from authoritative sources
- Non-breaking change to existing pipeline
- Parallel processing keeps speed reasonable
- Direct quotes > inference from hashtags

### Cons
- Article fetching can be slow/unreliable
- Paywall content won't be accessible
- Requires additional LLM calls for extraction
- More complex UI (two input sections)

### Mitigations
- Use web search as fallback for paywalled content
- Cache article extractions
- Limit to 3 articles max to control costs
- Clear UI separation to avoid confusion

## Success Criteria

1. Article URLs processed without breaking profile URL flow
2. Article insights appear as evidence sources in generated ICPs
3. ICPs with article evidence have higher confidence scores
4. UI clearly separates profile URLs from article URLs
5. Build passes with no type errors

## Alternative Considered: Auto-Discovery

Could automatically search for articles about the creator during `expandUrls`. Rejected because:
- Adds latency to every request
- May find irrelevant articles
- User knows which articles are authoritative
- Explicit input gives user control

## Questions for Review

1. Should articles auto-discovered in `expandUrls` (press/interviews) be processed automatically?
2. Maximum article limit: 3 or 5?
3. Should we show a preview of extracted insights before running full ICP generation?
