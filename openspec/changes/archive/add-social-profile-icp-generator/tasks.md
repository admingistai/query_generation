# Implementation Tasks

## 1. Schema & Types
- [ ] 1.1 Create `src/schemas/social-profile-icp.ts` with Zod schemas:
  - `SocialProfileSchema` (url, platform, bio, followerCount, etc.)
  - `ContentAnalysisSchema` (themes, tone, engagementTriggers, audienceSignals)
  - `ICPSegmentSchema` (segmentName, demographics, psychographics, behaviors, brandAffinities)
  - `SocialProfileICPResultSchema` (profileAnalyzed, totalFollowers, icpSegments array)
- [ ] 1.2 Create TypeScript types from schemas

## 2. Agent Implementation
- [ ] 2.1 Create `src/lib/agents/socialProfileIcpAgent.ts` with:
  - Profile data extraction using web search (via OpenAI web_search tool)
  - Content analysis for audience inference
  - ICP generation with structured output
- [ ] 2.2 Implement platform detection from URL (Instagram, TikTok, X, YouTube, LinkedIn)
- [ ] 2.3 Implement profile scraping via web search tool
- [ ] 2.4 Implement content analysis logic
- [ ] 2.5 Implement ICP generation with 3-6 distinct segments
- [ ] 2.6 Add segment distinctness validation

## 3. API Route
- [ ] 3.1 Create `src/app/api/social-icp/route.ts`
- [ ] 3.2 Implement POST handler with streaming support
- [ ] 3.3 Add input validation for social profile URLs
- [ ] 3.4 Add error handling for private profiles, rate limits

## 4. Frontend Components
- [ ] 4.1 Create `src/components/SocialProfileInput.tsx` (URL input with platform icon detection)
- [ ] 4.2 Create `src/components/ICPCard.tsx` (display single ICP segment)
- [ ] 4.3 Create `src/components/ICPGrid.tsx` (display multiple ICPs)
- [ ] 4.4 Create `src/components/SocialProfileIcpGenerator.tsx` (main page component)

## 5. Page Setup
- [ ] 5.1 Create `src/app/demo3/page.tsx`
- [ ] 5.2 Wire up components with API integration
- [ ] 5.3 Add loading states and error handling UI

## 6. Testing & Validation
- [ ] 6.1 Test with well-known public profiles (celebrities, brands)
- [ ] 6.2 Verify ICP distinctness across segments
- [ ] 6.3 Test error handling for private profiles
- [ ] 6.4 Verify build passes
