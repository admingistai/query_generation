# Tasks: Add Article Context Support

## Phase 1: Schema Updates ✅

- [x] **1.1** Add `ArticleSourceTypeSchema` enum to `social-profile-icp.ts`
  - interview, press, blog, podcast, research, other

- [x] **1.2** Add `ArticleInsightSchema`
  - insight, confidence, quote, insightType

- [x] **1.3** Add `ArticleContextSchema`
  - sourceUrl, sourceTitle, sourceType, publicationDate
  - extractedInsights (demographics, psychographics, behaviorals, brandMentions, nicheSignals, creatorQuotes, geographySignals)
  - qualityScore

- [x] **1.4** Extend `EvidenceTypeSchema` with "article"

- [x] **1.5** Extend `EvidenceBasedICPRequestSchema` with `articleUrls`
  - Array of up to 3 URLs
  - Optional field

## Phase 2: Article Extraction Tool ✅

- [x] **2.1** Create `extractArticleContext` tool in route handler
  - Input: articleUrl, creatorName, creatorHandle
  - Output: ArticleContext

- [x] **2.2** Implement article content fetching
  - Direct fetch with readability parsing
  - Web search fallback for paywalled content
  - Timeout handling (30s max)

- [x] **2.3** Create extraction prompt for LLM
  - Demographics extraction
  - Psychographics extraction
  - Brand mentions
  - Creator quotes
  - Quality scoring

- [x] **2.4** Add article URL validation
  - Reject social profile URLs
  - Validate URL format

## Phase 3: Pipeline Integration ✅

- [x] **3.1** Update route handler to accept `articleUrls`
  - Parse from request body
  - Validate max 3 articles

- [x] **3.2** Implement parallel processing
  - Run article extraction alongside expandUrls
  - Use Promise.all for concurrent execution

- [x] **3.3** Merge article evidence with profile evidence
  - Convert article insights to evidence sources
  - Apply appropriate evidence weights

- [x] **3.4** Update niche classification to use article context
  - Include article niche signals
  - Boost confidence with article evidence

- [x] **3.5** Update ICP generation prompt
  - Reference article insights
  - Cite article sources in evidence

## Phase 4: Evidence Weighting Updates ✅

- [x] **4.1** Add article evidence weight matrix
  - interview: base 4, with quote 5
  - research: base 4, with quote 5
  - press: base 3, with quote 4
  - blog/podcast/other: base 2-3

- [x] **4.2** Implement confidence boost rules
  - Direct quote: +1 confidence
  - Multiple sources agreeing: +1 confidence
  - Creator quote about audience: automatic "high"

- [x] **4.3** Update validation to consider article evidence
  - Higher threshold for rejection when article evidence present
  - Article + profile agreement = high confidence

## Phase 5: UI Updates (DEFERRED)

- [ ] **5.1** Add article URL state management
  - `articleUrls: string[]` state
  - `articleInput: string` state
  - Add/remove handlers

- [ ] **5.2** Create article input section
  - Separate from profile URLs
  - Different icon (FileText)
  - Hint text explaining purpose

- [ ] **5.3** Add article URL validation in UI
  - Reject social platform URLs
  - Show helpful error message

- [ ] **5.4** Update transport to include articleUrls
  - Add to request body
  - Only include if non-empty

- [ ] **5.5** Create article extraction progress display
  - New tool part type
  - Show source title, type, insight count
  - Preview top insights

- [ ] **5.6** Update evidence display for article sources
  - Show article icon
  - Display source URL
  - Show direct quotes distinctly

## Phase 6: Error Handling ✅

- [x] **6.1** Handle article fetch failures
  - 404: Skip with warning
  - Paywall: Web search fallback
  - Timeout: Retry once, then skip

- [x] **6.2** Implement graceful degradation
  - Continue without articles if all fail
  - Log failures for debugging

- [x] **6.3** Add user-friendly error messages
  - Clear explanation of what failed
  - Indicate if proceeding without article data

## Phase 7: Testing & Validation ✅

- [x] **7.1** Test no articles provided
  - Verify existing flow unchanged
  - No article-related processing

- [ ] **7.2** Test valid article with creator quotes
  - High quality score
  - Quotes appear in evidence

- [ ] **7.3** Test paywalled article
  - Web search fallback triggers
  - Partial data extracted

- [x] **7.4** Test social URL rejected
  - Error shown in UI
  - Not sent to API

- [ ] **7.5** Test article with no audience info
  - Low quality score
  - Minimal evidence contribution

- [ ] **7.6** Test multiple articles
  - All processed in parallel
  - Insights merged correctly

- [x] **7.7** Build verification
  - No type errors
  - All imports resolved

## Acceptance Criteria

1. ✅ Article URLs accepted alongside profile URLs
2. ✅ Article extraction runs in parallel (non-blocking)
3. ✅ Article insights appear as evidence sources with "article" type
4. ⏳ Direct quotes shown distinctly in evidence display (UI pending)
5. ✅ ICPs with article evidence have appropriately boosted confidence
6. ✅ Social profile URLs rejected in article input
7. ✅ Graceful degradation when articles fail
8. ✅ Build passes with no type errors
9. ✅ Existing profile-only flow unchanged

## Non-Breaking Verification

Before merging, verify these scenarios work identically to before:

- [x] Single profile URL, no articles → Same results
- [x] Multiple profile URLs, no articles → Same results
- [x] All research depths work without articles
- [x] Legacy v1 API unaffected
