# Design: Article Context Support

## Design Decisions (Confirmed)

1. **Auto-discovery**: YES - Articles found in `expandUrls` (press/interviews) will be auto-processed
2. **Max articles**: 3 total (user-provided + auto-discovered combined)
3. **Preview step**: YES - Show research summary, user must accept/deny before ICP generation

## Architecture

### System Flow Diagram (Two-Phase with User Approval)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INPUT                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Profile URLs: [instagram.com/creator, tiktok.com/@creator]                 │
│  Article URLs: [forbes.com/interview]  (optional, user-provided)            │
│  Config: { researchDepth: "standard" }                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ════════════════════════════════
                         PHASE 1: RESEARCH
                    ════════════════════════════════
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PARALLEL PROCESSING                                │
├────────────────────────────────┬────────────────────────────────────────────┤
│      PROFILE BRANCH            │           ARTICLE BRANCH                   │
│                                │                                             │
│  ┌─────────────────────┐      │    ┌──────────────────────────┐            │
│  │    expandUrls       │──────┼───▶│  AUTO-DISCOVER ARTICLES  │            │
│  │  - Bio link scrape  │      │    │  - Press mentions        │            │
│  │  - Platform search  │      │    │  - Interview links       │            │
│  │  - Collaborators    │      │    │  - Podcast appearances   │            │
│  │  ─────────────────  │      │    └────────────┬─────────────┘            │
│  │  + interviews found │      │                 │                          │
│  │  + press mentions   │      │                 ▼                          │
│  └──────────┬──────────┘      │    ┌──────────────────────────┐            │
│             │                  │    │  extractArticleContext   │            │
│             ▼                  │    │  (for each article,      │            │
│  ┌─────────────────────┐      │    │   max 3 total)           │            │
│  │    deepResearch     │      │    │  - Fetch content         │            │
│  │  - Profile data     │      │    │  - Extract demographics  │            │
│  │  - Hashtags         │      │    │  - Find creator quotes   │            │
│  │  - Content themes   │      │    │  - Quality score         │            │
│  └──────────┬──────────┘      │    └────────────┬─────────────┘            │
│             │                  │                 │                          │
└─────────────┼──────────────────┼─────────────────┼──────────────────────────┘
              │                  │                 │
              └──────────────────┴─────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   RESEARCH SUMMARY     │
                    │   - Profile info       │
                    │   - Discovered URLs    │
                    │   - Article insights   │
                    │   - Evidence preview   │
                    └───────────┬────────────┘
                                │
                    ════════════════════════════════
                         USER APPROVAL GATE
                    ════════════════════════════════
                                │
                                ▼
              ┌─────────────────────────────────────┐
              │         PREVIEW SCREEN              │
              │                                     │
              │  "We found:"                        │
              │  • @creator on Instagram (150K)    │
              │  • @creator on TikTok (80K)        │
              │  • 2 articles with audience data   │
              │                                     │
              │  Key insights discovered:          │
              │  • "Millennial women 25-34"        │
              │  • "Sustainable fashion niche"     │
              │  • Brand: Nike, Lululemon          │
              │                                     │
              │  [✓ Generate ICPs]  [✗ Cancel]     │
              └───────────┬────────┬────────────────┘
                          │        │
                    Accept │        │ Deny
                          │        └───────────▶ Return to input
                          ▼
                    ════════════════════════════════
                         PHASE 2: GENERATION
                    ════════════════════════════════
                                │
                                ▼
              ┌─────────────────────────────────────┐
              │          GENERATION PIPELINE        │
              │                                     │
              │  classifyNiche → findComparable →  │
              │  generateICPs → validateICPs       │
              └─────────────────────────────────────┘
```

## Data Models

### New Schema: ArticleContext

```typescript
// Article source classification
export const ArticleSourceTypeSchema = z.enum([
  "interview",      // Q&A or interview format
  "press",          // News coverage, announcements
  "blog",           // Personal blog or guest posts
  "podcast",        // Podcast transcript
  "research",       // Industry research, reports
  "other"           // Unclassified
]);

// Single insight extracted from article
export const ArticleInsightSchema = z.object({
  insight: z.string(),
  confidence: ConfidenceLevelSchema,
  quote: z.string().nullable(),        // Direct quote if available
  insightType: z.enum([
    "demographic",      // Age, gender, location, occupation
    "psychographic",    // Values, interests, lifestyle
    "behavioral",       // How they engage, purchase patterns
    "brand_affinity",   // Brands mentioned
    "niche_signal"      // Industry/niche indicators
  ]),
});

// Full article context extraction
export const ArticleContextSchema = z.object({
  sourceUrl: z.string(),
  sourceTitle: z.string().nullable(),
  sourceType: ArticleSourceTypeSchema,
  publicationDate: z.string().nullable(),
  extractedInsights: z.object({
    demographics: z.array(ArticleInsightSchema),
    psychographics: z.array(ArticleInsightSchema),
    behaviorals: z.array(ArticleInsightSchema),
    brandMentions: z.array(z.string()),
    nicheSignals: z.array(z.string()),
    creatorQuotes: z.array(z.string()),   // Creator's own words
    geographySignals: z.array(z.string()),
  }),
  qualityScore: z.number().min(0).max(5), // How valuable is this source?
});

export type ArticleContext = z.infer<typeof ArticleContextSchema>;
```

### Extended Request Schema

```typescript
export const EvidenceBasedICPRequestSchema = z.object({
  // Existing
  urls: z.union([
    z.string().url(),
    z.array(z.string().url()).min(1).max(5),
  ]),
  hints: z.object({
    creatorName: z.string().optional(),
    knownNiche: z.string().optional(),
  }).optional(),
  config: z.object({
    researchDepth: z.enum(["quick", "standard", "deep"]).default("standard"),
    includeComparativeAnalysis: z.boolean().default(true),
  }).optional(),

  // NEW: Article context URLs
  articleUrls: z.array(z.string().url()).max(3).optional(),
});
```

### Extended Evidence Type

```typescript
export const EvidenceTypeSchema = z.enum([
  "hashtag",
  "content",
  "collaboration",
  "comment",
  "bio",
  "comparable_creator",
  "article",           // NEW: Evidence from article extraction
]);
```

## Tool Design: extractArticleContext

### Input/Output Contract

```typescript
extractArticleContext: tool({
  description: "Extract audience insights from articles, interviews, or press about the creator",
  parameters: z.object({
    articleUrl: z.string().url(),
    creatorName: z.string().optional(),
    creatorHandle: z.string().optional(),
  }),
  execute: async ({ articleUrl, creatorName, creatorHandle }) => {
    // Returns ArticleContext
  }
})
```

### Extraction Strategy

1. **Content Retrieval**
   - Primary: Direct fetch with readability parsing
   - Fallback: Web search for article summary
   - Handle paywalls gracefully (return partial data)

2. **LLM Extraction Prompt**
```
You are extracting audience insights from an article about a content creator.

Creator: {creatorName} (@{creatorHandle})
Article URL: {articleUrl}
Article Content: {content}

Extract the following if present:

1. DEMOGRAPHICS: Any explicit mentions of audience age, gender, location, occupation
   - Example: "Her followers are primarily women aged 25-34"
   - Include direct quotes when possible

2. PSYCHOGRAPHICS: Values, interests, lifestyle indicators
   - Example: "Her audience values sustainability and ethical fashion"

3. BEHAVIORAL: Engagement patterns, purchase behaviors
   - Example: "Her followers have a 3x higher purchase conversion rate"

4. BRAND MENTIONS: Any brands the creator works with or mentions
   - Example: "She recently partnered with Nike and Lululemon"

5. CREATOR QUOTES: Direct quotes from the creator about their audience
   - Example: '"My community is made up of busy moms who want quick recipes"'

6. NICHE SIGNALS: Industry, category, or genre indicators
   - Example: "Leading voice in the sustainable fashion space"

For each insight, rate confidence:
- high: Direct quote or explicit statement
- medium: Strong implication with context
- low: Inference or indirect mention

Return structured JSON matching the ArticleContextSchema.
```

3. **Quality Scoring**
   - 5: Multiple direct quotes, explicit demographics
   - 4: Some direct quotes, clear audience description
   - 3: Indirect audience mentions, brand partnerships
   - 2: Minimal audience info, mostly about creator
   - 1: No useful audience insights

## Evidence Weighting

### Evidence Score Matrix

| Evidence Type | Base Weight | With Quote | Notes |
|--------------|-------------|------------|-------|
| article (interview) | 4 | 5 | Creator's own words |
| article (research) | 4 | 5 | Third-party research |
| article (press) | 3 | 4 | News coverage |
| bio | 3 | - | Creator-written |
| content | 3 | - | Post analysis |
| hashtag | 2 | - | Community signals |
| comparable_creator | 2 | - | Template-based |
| collaboration | 2 | - | Partnership inference |
| comment | 1 | - | Engagement patterns |

### Confidence Boost Rules

- Article evidence with direct quote: +1 to segment confidence
- Multiple article sources agreeing: +1 to segment confidence
- Creator quote about audience: Automatically "high" confidence

## UI Components

### Article Input Section

```tsx
// New state
const [articleUrls, setArticleUrls] = useState<string[]>([]);
const [articleInput, setArticleInput] = useState("");

// Validation
const isValidArticleUrl = (url: string) => {
  // Not a social platform URL
  const socialPatterns = [
    /instagram\.com/i,
    /tiktok\.com/i,
    /twitter\.com|x\.com/i,
    /youtube\.com/i,
    /linkedin\.com/i,
  ];
  return !socialPatterns.some(p => p.test(url));
};
```

### Article Progress Display

```tsx
// New tool part type
interface ExtractArticleContextPart {
  type: "tool-extractArticleContext";
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  input?: { articleUrl: string };
  output?: {
    sourceTitle: string | null;
    sourceType: string;
    insightCount: number;
    qualityScore: number;
    highlights: string[]; // Top 3 insights for preview
  };
}

// Display component
{articleParts.map((part, idx) => (
  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
    <div className="flex items-center gap-2 text-xs text-amber-500 font-medium">
      <FileText className="w-3 h-3" />
      <span>Extracting article insights</span>
      {part.state !== "output-available" && <Loader2 className="w-3 h-3 animate-spin" />}
    </div>
    {part.state === "output-available" && part.output && (
      <div className="mt-2">
        <p className="text-sm font-medium">{part.output.sourceTitle || "Article"}</p>
        <p className="text-xs text-muted-foreground">{part.output.sourceType}</p>
        <div className="flex gap-2 mt-1">
          <Badge variant="secondary">{part.output.insightCount} insights</Badge>
          <Badge variant="secondary">Quality: {part.output.qualityScore}/5</Badge>
        </div>
        {/* Preview highlights */}
        <ul className="mt-2 text-xs text-muted-foreground">
          {part.output.highlights.map((h, i) => (
            <li key={i}>"{h}"</li>
          ))}
        </ul>
      </div>
    )}
  </div>
))}
```

## Error Handling

### Article Fetch Failures

| Error | User Message | Recovery |
|-------|-------------|----------|
| 404 Not Found | "Article not found" | Skip, continue without |
| Paywall | "Limited access - using summary" | Web search fallback |
| Timeout | "Article took too long to load" | Retry once, then skip |
| No content | "Could not extract content" | Skip, continue without |

### Graceful Degradation

```typescript
// If all articles fail, continue with profile-only flow
if (articleContexts.length === 0 && articleUrls.length > 0) {
  console.warn("All article extractions failed, continuing with profile data only");
}
```

## Performance Considerations

### Parallel Execution

```typescript
// Process articles in parallel with profile research
const [expandResult, ...articleResults] = await Promise.all([
  expandUrls(primaryUrl),
  ...articleUrls.map(url => extractArticleContext(url, creatorName))
]);
```

### Caching Strategy

- Cache article extractions by URL (1 hour TTL)
- Don't re-extract if same article used in recent request

### Token Budget

- Article extraction: ~2-3K tokens per article
- Max 3 articles = ~6-9K additional tokens
- Total budget increase: ~20-30%

## Testing Strategy

### Test Cases

1. **No articles provided** - Existing flow unchanged
2. **Valid article with quotes** - High-quality extraction
3. **Paywalled article** - Fallback to web search
4. **Non-article URL** - Reject social profile URLs
5. **Article with no audience info** - Low quality score, minimal evidence
6. **Multiple articles** - Merge insights correctly
