# Design: Evidence-Based ICP Generation Pipeline

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 1: URL EXPANSION                               │
│  Input: Primary URL → Output: All related URLs (platforms, collabs, peers)   │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 2: DEEP RESEARCH                               │
│  Scrape ALL URLs → Extract content, themes, engagement, collaborations       │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PHASE 3: NICHE CLASSIFICATION                           │
│  Determine primary industry → Constrain all future generation to this niche  │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PHASE 4: COMPARATIVE ANALYSIS                           │
│  Find similar creators → What audiences do THEY have? Use as templates       │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   PHASE 5: EVIDENCE-BASED ICP GENERATION                     │
│  Generate ICPs grounded in specific evidence → Each must cite sources        │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PHASE 6: VALIDATION & SCORING                          │
│  Critic agent reviews → Filter nonsensical → Score confidence                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Evidence-First Philosophy

**Problem:** Current approach fills gaps with creative inference
**Solution:** Every ICP must have supporting evidence

Evidence Hierarchy (strongest to weakest):
1. Direct statement from creator about their audience
2. Engagement patterns (comments, shares, saves)
3. Content themes consistently posted
4. Hashtag usage patterns
5. Collaboration partners' audiences
6. Comparable creators' known audiences
7. Demographic inference from platform norms

ICPs without evidence (score < 3) are automatically filtered.

### 2. Multi-URL Research Surface

**Problem:** Single URL = single weak signal
**Solution:** Discover and research ALL related URLs

URL Categories to Discover:
- Other social platforms (cross-reference)
- Website, Linktree, press kit
- Podcast appearances, interviews, features
- Collaborator profiles (for audience overlap)
- Similar creators (for comparative templates)

This expands research surface by 5-10x.

### 3. Niche Constraints

**Problem:** ICPs generated without industry context are meaningless
**Solution:** Classify niche FIRST, then constrain generation

Example: A music creator's audience is fundamentally different from a fitness creator. The niche determines what audiences are even POSSIBLE.

Output includes:
- Primary niche + sub-niche + specific genre
- Likely age range, geography, interests
- **Unlikely segments** (what audiences DON'T make sense)

"Berlin Creative Networkers" would fail the unlikely segments check for a US-based creator.

### 4. Comparative Analysis Templates

**Problem:** Generating ICPs from scratch leads to hallucination
**Solution:** Use similar creators' known audiences as templates

Logic: If Similar Creator B (same niche, same size) has audiences ["Aspiring DJs", "Festival goers"], then Target Creator A likely has similar audiences.

This is grounded inference, not speculation.

### 5. Confidence Scoring

**Problem:** Users can't distinguish reliable vs speculative ICPs
**Solution:** Show confidence level for each segment

Scoring:
- 5 points: Direct evidence (creator mentioned this audience)
- 4 points: Strong indirect evidence (engagement patterns)
- 3 points: Moderate evidence (content themes, hashtags)
- 2 points: Weak evidence (comparable creators only)
- 1 point: Speculation (niche norms only)
- 0 points: No evidence → REJECT

Display: High (green), Medium (yellow), Low (orange)

## Schema Changes

### Evidence-Based ICP Schema

```typescript
const evidenceBasedICPSchema = z.object({
  segmentName: z.string(),
  personaDescription: z.string(),

  // NEW: Evidence section
  evidence: z.object({
    primarySources: z.array(z.object({
      type: z.enum(['hashtag', 'content', 'collaboration', 'comment', 'bio', 'comparable_creator']),
      detail: z.string(),
      source: z.string(),
    })),
    confidenceLevel: z.enum(['high', 'medium', 'low']),
    confidenceReason: z.string(),
  }),

  demographics: z.object({
    ageRange: z.string(),
    gender: z.string(),
    geography: z.string().nullable(),
    occupation: z.string().nullable(),
  }),

  psychographics: z.object({
    values: z.array(z.string()),
    aspirations: z.array(z.string()),
    painPoints: z.array(z.string()),
  }),

  behaviors: z.object({
    followReason: z.string(),
    engagementStyle: z.string(),
    purchaseInfluence: z.string(),
  }),

  brandAffinities: z.array(z.string()),
  estimatedSegmentSize: z.string(),
});
```

### Niche Classification Schema

```typescript
const nicheClassificationSchema = z.object({
  primaryNiche: z.object({
    industry: z.string(),
    subNiche: z.string(),
    specificGenre: z.string().nullable(),
  }),
  nicheEvidence: z.array(z.object({
    signal: z.string(),
    source: z.string(),
    confidence: z.enum(['high', 'medium', 'low']),
  })),
  audienceConstraints: z.object({
    likelyAgeRange: z.string(),
    likelyGenderSplit: z.string(),
    likelyGeography: z.array(z.string()),
    likelyInterests: z.array(z.string()),
    unlikelySegments: z.array(z.string()), // Critical for filtering
  }),
});
```

## API Changes

### Multi-URL Input Support

```typescript
const requestSchema = z.object({
  urls: z.union([
    z.string().url(),
    z.array(z.string().url()).min(1).max(5),
  ]),
  hints: z.object({
    creatorName: z.string().optional(),
    knownNiche: z.string().optional(),
  }).optional(),
  config: z.object({
    researchDepth: z.enum(['quick', 'standard', 'deep']).default('standard'),
    includeComparativeAnalysis: z.boolean().default(true),
  }).optional(),
});
```

## Tool Implementation

### Phase 1: URL Expansion Tool

```typescript
const expandUrls = tool({
  description: 'Find all related URLs for comprehensive research',
  inputSchema: z.object({
    primaryUrl: z.string(),
    creatorName: z.string().optional(),
  }),
  execute: async ({ primaryUrl, creatorName }) => {
    // 1. Scrape primary profile for links (bio, linktree)
    // 2. Web search for other platforms
    // 3. Search for press/interviews
    // 4. Search for collaborations
    // 5. Find similar creators
    return consolidatedUrls;
  },
});
```

### Phase 3: Niche Classification Tool

```typescript
const classifyNiche = tool({
  description: 'Determine creator niche and audience constraints',
  inputSchema: z.object({
    researchData: z.any(),
  }),
  execute: async ({ researchData }) => {
    // Analyze content themes, hashtags, collaborations
    // Return niche + constraints including "unlikelySegments"
    return nicheClassification;
  },
});
```

### Phase 6: Validation Tool

```typescript
const validateICP = tool({
  description: 'Validate ICP against evidence and constraints',
  inputSchema: z.object({
    icp: z.any(),
    nicheConstraints: z.any(),
  }),
  execute: async ({ icp, nicheConstraints }) => {
    // Check: niche alignment, evidence quality, plausibility
    // Score: 0-5 based on evidence strength
    // Reject if score < 3 or contradicts constraints
    return { isValid, score, issues };
  },
});
```

## UI Changes

### Confidence Display

```
┌─────────────────────────────────────────────────────┐
│ 🎯 Aspiring DJ/Producer                    ✓✓ HIGH  │
├─────────────────────────────────────────────────────┤
│ Evidence:                                           │
│ • Hashtags: #djlife, #producerlife (47 uses)        │
│ • Content: 60% production tutorials                 │
│ • Comments: "How did you make that sound?"          │
│ • Comparable: Similar DJ A reports 40% producers    │
└─────────────────────────────────────────────────────┘
```

### Excluded Segments Transparency

Show users WHY segments were filtered:
```
Excluded: "Berlin Creative Networkers"
Reason: No evidence for Berlin connection. Creator is US-based.
```

## Performance Considerations

- More API calls due to multi-phase pipeline
- Mitigate with: parallel URL research, caching, progressive disclosure
- Research depth config allows quick/standard/deep modes
- "quick" mode skips comparative analysis for speed

## Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| Current (single URL, single LLM call) | Fast, cheap | Hallucinated segments |
| Proposed (multi-phase pipeline) | Evidence-based, accurate | More API calls, slower |

Recommendation: Default to "standard" depth, offer "quick" for testing.
