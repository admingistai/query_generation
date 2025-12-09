# Change: Add Social Profile ICP Generator

## Why
Current ICP generation works from brand URLs to understand what a brand offers. This change adds the ability to generate ICPs from **social media profile URLs** (Instagram, TikTok, X/Twitter, YouTube, LinkedIn) to understand who follows a creator/influencer. This reverse-engineers audience segments based on a creator's content, enabling influencer marketing matching, content strategy insights, and audience overlap analysis.

## What Changes
- Add new `/demo3` page for Social Profile ICP Generator
- Create multi-agent system:
  - **Profile Scraper Agent**: Extracts structured data from social profile URLs
  - **Content Analyzer Agent**: Analyzes content patterns to infer audience characteristics
  - **ICP Generator Agent**: Synthesizes data into 3-6 distinct audience personas
  - **Orchestrator Agent**: Coordinates workflow and handles edge cases
- Add new API route `/api/social-icp/route.ts`
- Add new Zod schemas for social profile data and ICP output
- Add frontend components: `SocialProfileInput`, `ICPCard`, `ICPGrid`

## Impact
- Affected specs: Creates new `social-profile-icp` capability (does NOT modify existing `icp-generation`)
- Affected code:
  - `src/app/demo3/page.tsx` (new)
  - `src/app/api/social-icp/route.ts` (new)
  - `src/lib/agents/socialProfileIcpAgent.ts` (new)
  - `src/components/SocialProfileIcpGenerator.tsx` (new)
  - `src/components/ICPCard.tsx` (new)
  - `src/schemas/social-profile-icp.ts` (new)
