# Tasks: Improve Social ICP Evidence Pipeline

## Phase 1: Schema & Types Foundation

- [ ] **1.1** Add `EvidenceSource` schema to `social-profile-icp.ts`
  - type: hashtag | content | collaboration | comment | bio | comparable_creator
  - detail, source fields

- [ ] **1.2** Add `ConfidenceLevel` enum (high | medium | low)

- [ ] **1.3** Extend `ICPSegmentSchema` with evidence section
  - primarySources array
  - confidenceLevel
  - confidenceReason

- [ ] **1.4** Add `NicheClassificationSchema`
  - primaryNiche (industry, subNiche, specificGenre)
  - nicheEvidence array
  - audienceConstraints (including unlikelySegments)

- [ ] **1.5** Add `URLExpansionResultSchema`
  - otherPlatforms, website, linktree
  - podcastAppearances, interviews
  - collaborators, similarCreators

## Phase 2: URL Expansion Tool

- [ ] **2.1** Create `expandUrls` tool in route handler
  - Scrape primary profile for bio links
  - Web search for other platforms
  - Search for press/interviews
  - Search for collaborations

- [ ] **2.2** Add helper functions for URL discovery
  - `searchOtherPlatforms(handle, platform)`
  - `searchPressAndInterviews(creatorName)`
  - `findSimilarCreators(niche, followerRange)`

- [ ] **2.3** Update API to accept multi-URL input
  - Support single URL or array of URLs
  - Add optional hints (creatorName, knownNiche)
  - Add config (researchDepth)

## Phase 3: Deep Research Improvements

- [ ] **3.1** Enhance `lookupProfile` to process multiple URLs
  - Aggregate data from all discovered URLs
  - Track source for each data point

- [ ] **3.2** Add hashtag extraction and categorization
  - Extract all hashtags from content
  - Categorize: location, genre, community, trending

- [ ] **3.3** Add collaboration network analysis
  - Extract @mentions and tagged accounts
  - Identify collaboration patterns

## Phase 4: Niche Classification Tool

- [ ] **4.1** Create `classifyNiche` tool
  - Input: aggregated research data
  - Output: niche classification with evidence

- [ ] **4.2** Implement audience constraint inference
  - Likely age range, geography, interests
  - **CRITICAL**: unlikelySegments list

- [ ] **4.3** Add niche evidence tracking
  - Log each signal with source and confidence

## Phase 5: Comparative Analysis Tool

- [ ] **5.1** Create `findComparableCreators` tool
  - Search for creators in same niche
  - Filter by similar follower count (within 2-3x)

- [ ] **5.2** Create `analyzeComparableAudiences` tool
  - Research what audiences similar creators have
  - Extract audience templates

- [ ] **5.3** Integrate comparable data into ICP generation
  - Use templates as starting points
  - Cite comparable creators as evidence source

## Phase 6: Evidence-Based ICP Generation

- [ ] **6.1** Update `generateICPs` tool prompt
  - Require evidence citation for each segment
  - Constrain to niche classification
  - Reference comparable creator templates

- [ ] **6.2** Add evidence scoring logic
  - 5 points: direct evidence
  - 4 points: strong indirect
  - 3 points: moderate (hashtags, content)
  - 2 points: weak (comparable only)
  - 1 point: speculation
  - 0 points: no evidence → reject

- [ ] **6.3** Implement segment rejection rules
  - Reject if score < 3
  - Reject if contradicts niche constraints
  - Reject if in "unlikelySegments" list

## Phase 7: Validation Agent

- [ ] **7.1** Create `validateICP` tool
  - Check niche alignment
  - Verify evidence quality
  - Check distinctness from other segments

- [ ] **7.2** Implement validation checks
  - Does segment make sense for this niche?
  - Is evidence sufficient?
  - Is it specific enough to be actionable?

- [ ] **7.3** Add "excluded segments" output
  - Track segments that failed validation
  - Include rejection reason

## Phase 8: UI Updates

- [x] **8.1** Add multi-URL input to `SocialProfileIcpGenerator`
  - Allow pasting multiple URLs
  - Show discovered URLs during expansion

- [x] **8.2** Create confidence badge component
  - High (green ✓✓), Medium (yellow ✓), Low (orange ?)
  - Tooltip with confidence reason

- [x] **8.3** Update `ICPCard` to show evidence
  - Collapsible evidence section
  - List sources with type icons

- [x] **8.4** Add excluded segments display
  - Collapsible "Filtered Out" section
  - Show reason for each exclusion

## Phase 9: Testing & Validation

- [ ] **9.1** Test with sparse data creator (10k followers)
  - Verify no hallucinated segments
  - Verify proper rejection of unsupported ICPs

- [ ] **9.2** Test with well-known creator (100k+ followers)
  - Verify rich evidence collection
  - Verify high confidence scores

- [ ] **9.3** Test "Berlin Creative Networkers" scenario
  - US-based music creator
  - Should NOT produce Berlin segment
  - Should cite evidence for actual segments

- [ ] **9.4** Performance testing
  - Measure time for quick/standard/deep modes
  - Ensure < 60s for quick mode

## Acceptance Criteria

1. No ICPs generated without supporting evidence
2. Each ICP shows confidence level (high/medium/low)
3. Evidence sources visible in UI
4. "unlikelySegments" filter prevents hallucinations
5. Multi-URL input expands research surface
6. Excluded segments shown with rejection reason
7. Build passes with no type errors
