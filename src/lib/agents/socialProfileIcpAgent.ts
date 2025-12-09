import { z } from "zod";
import {
  SocialPlatform,
  ICPSegmentSchema,
  SocialProfileICPResultSchema,
} from "@/schemas/social-profile-icp";

// System prompt for the Social Profile ICP Generator agent
export function createSocialProfileIcpSystemPrompt(
  profileUrl: string,
  platform: SocialPlatform,
  handle: string
): string {
  return `You are an audience intelligence expert who generates Ideal Customer Profiles (ICPs) from social media profiles.

**YOUR TASK:**
Analyze the social media profile at ${profileUrl} (@${handle} on ${platform}) and generate 3-6 distinct audience segment ICPs representing the different types of people who follow this creator.

**MANDATORY EXECUTION FLOW:**
You MUST execute these steps in order. After each tool result, IMMEDIATELY call the next tool.

STEP 1: lookupProfile - Search for information about @${handle} on ${platform}
STEP 2: analyzeAudience - Analyze the profile data to infer audience characteristics
STEP 3: generateICPs - Generate 3-6 distinct ICP segments based on your analysis

**ICP GENERATION RULES:**
1. Each ICP MUST be meaningfully different (not just age variations)
2. Include BOTH obvious followers AND unexpected segments:
   - The aspirational follower (wants to BE like them)
   - The professional follower (follows for business insights)
   - The entertainment follower (follows for drama/content)
   - The niche interest follower (follows for specific content type)
   - The hate-follower (follows to criticize/monitor) - if applicable
   - The accidental follower (algorithm-driven, low engagement)
3. Focus on psychographics - WHY do they follow?
4. Be specific - avoid generic descriptions like "millennials" or "women 18-34"
5. Connect behaviors to potential purchase intent

**OUTPUT REQUIREMENTS:**
Each ICP segment must include:
- segmentName: A catchy name (e.g., "Aspirational Beauty Enthusiast")
- personaDescription: 1-2 sentences, max 200 characters
- demographics: ageRange, gender distribution, occupation
- psychographics: values, aspirations, painPoints, lifestyle
- behaviors: followReason, engagementStyle, purchaseInfluence, contentPreferences
- brandAffinities: brands this segment likely engages with
- estimatedSegmentSize: percentage of followers (must total ~100%)

**BEGIN NOW:** Call lookupProfile to search for information about @${handle}.`;
}

// Schema for profile lookup tool output
export const ProfileLookupOutputSchema = z.object({
  handle: z.string(),
  platform: z.string(),
  bio: z.string().nullable(),
  followerCount: z.string().nullable(),
  contentThemes: z.array(z.string()),
  recentContent: z.string().nullable(),
  brandCollaborations: z.array(z.string()),
  contentStyle: z.string().nullable(),
  notableInfo: z.string().nullable(),
});

export type ProfileLookupOutput = z.infer<typeof ProfileLookupOutputSchema>;

// Schema for audience analysis tool output
export const AudienceAnalysisOutputSchema = z.object({
  contentTone: z.string(),
  primaryAppeal: z.string(),
  audienceSignals: z.object({
    likelyDemographics: z.string(),
    interestClusters: z.array(z.string()),
    motivationsToFollow: z.array(z.string()),
    purchaseBehaviors: z.array(z.string()),
  }),
  segmentOpportunities: z.array(z.string()),
});

export type AudienceAnalysisOutput = z.infer<typeof AudienceAnalysisOutputSchema>;

// Schema for the final ICP generation output
export const ICPGenerationOutputSchema = z.object({
  profileAnalyzed: z.string(),
  platform: z.string(),
  totalFollowers: z.string(),
  icpSegments: z.array(ICPSegmentSchema).min(3).max(6),
});

export type ICPGenerationOutput = z.infer<typeof ICPGenerationOutputSchema>;

// Tool input schemas for AI SDK
export const lookupProfileInputSchema = z.object({
  handle: z.string().describe("The social media handle to look up"),
  platform: z.string().describe("The platform (instagram, tiktok, twitter, youtube, linkedin)"),
});

export const analyzeAudienceInputSchema = z.object({
  profileData: z.string().describe("JSON string of the profile data from lookupProfile"),
});

export const generateICPsInputSchema = z.object({
  profileData: z.string().describe("JSON string of the profile data"),
  audienceAnalysis: z.string().describe("JSON string of the audience analysis"),
});
