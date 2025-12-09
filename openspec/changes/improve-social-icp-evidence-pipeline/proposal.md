# Change: Improve Social ICP Evidence Pipeline

## Why

Current Social ICP generation produces "odd/off" segments like "Berlin Creative Networkers" for a US-based music creator because:
1. Single URL input provides sparse data signals
2. Web search returns limited info for smaller creators (10k followers)
3. The model fills gaps with creative inference ("hallucination")
4. No validation against actual evidence
5. The prompt encourages "unexpected segments" without grounding

**Real Example:** A 10k-follower music industry creator got "Berlin Creative Networkers" as an ICP despite having no Berlin connection, no German content, and being US-based. The model invented this segment from nothing.

## What Changes

Replace speculation-based ICP generation with a **multi-phase evidence-based research pipeline**:

1. **URL Expansion Phase**: Discover all related URLs (other platforms, collabs, press)
2. **Deep Research Phase**: Scrape all URLs for content, hashtags, engagement signals
3. **Niche Classification Phase**: Determine creator's industry to constrain generation
4. **Comparative Analysis Phase**: Research similar creators' known audiences as templates
5. **Evidence-Based Generation Phase**: Generate ICPs with mandatory source citations
6. **Validation Phase**: Critic agent filters nonsensical segments, scores confidence

Each ICP must answer: "What evidence supports this audience exists?"

## Impact

- Affected specs: Modifies `social-profile-icp` capability (new spec if doesn't exist)
- Affected code:
  - `src/app/api/social-icp/route.ts` (major refactor)
  - `src/lib/agents/socialProfileIcpAgent.ts` (major refactor)
  - `src/schemas/social-profile-icp.ts` (extend with evidence fields)
  - `src/components/SocialProfileIcpGenerator.tsx` (update UI for multi-URL, confidence)
  - New: `src/lib/agents/urlExpansionAgent.ts`
  - New: `src/lib/agents/nicheClassificationAgent.ts`
  - New: `src/lib/agents/comparativeAnalysisAgent.ts`
  - New: `src/lib/agents/icpValidationAgent.ts`
