import { z } from "zod";

// Supported social media platforms
export const SocialPlatformSchema = z.enum([
  "instagram",
  "tiktok",
  "twitter",
  "youtube",
  "linkedin",
]);

export type SocialPlatform = z.infer<typeof SocialPlatformSchema>;

// Profile data extracted from web search
export const SocialProfileDataSchema = z.object({
  handle: z.string(),
  platform: SocialPlatformSchema,
  bio: z.string().nullable(),
  followerCount: z.string().nullable(),
  contentThemes: z.array(z.string()),
  recentContentSummary: z.string().nullable(),
  brandMentions: z.array(z.string()),
  contentStyle: z.string().nullable(),
});

export type SocialProfileData = z.infer<typeof SocialProfileDataSchema>;

// Content analysis for audience inference
export const ContentAnalysisSchema = z.object({
  contentTone: z.enum(["aspirational", "educational", "entertaining", "controversial", "mixed"]),
  engagementTriggers: z.array(z.string()),
  audienceSignals: z.object({
    likelyAgeRange: z.string(),
    genderSkew: z.string(),
    interestClusters: z.array(z.string()),
    purchaseBehaviors: z.array(z.string()),
    mediaConsumption: z.array(z.string()),
  }),
});

export type ContentAnalysis = z.infer<typeof ContentAnalysisSchema>;

// Individual ICP segment
export const ICPSegmentSchema = z.object({
  segmentName: z.string(),
  personaDescription: z.string(),
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
    engagementStyle: z.enum(["lurker", "liker", "commenter", "sharer", "superfan"]),
    purchaseInfluence: z.enum(["high", "medium", "low"]),
    contentPreferences: z.array(z.string()),
  }),
  brandAffinities: z.array(z.string()),
  estimatedSegmentSize: z.string(),
});

export type ICPSegment = z.infer<typeof ICPSegmentSchema>;

// Full ICP generation result
export const SocialProfileICPResultSchema = z.object({
  profileAnalyzed: z.string(),
  platform: SocialPlatformSchema,
  totalFollowers: z.string(),
  icpSegments: z.array(ICPSegmentSchema).min(3).max(6),
});

export type SocialProfileICPResult = z.infer<typeof SocialProfileICPResultSchema>;

// Platform detection utilities
export const PLATFORM_PATTERNS: Record<SocialPlatform, RegExp[]> = {
  instagram: [/instagram\.com\/([^/?]+)/i, /instagr\.am\/([^/?]+)/i],
  tiktok: [/tiktok\.com\/@?([^/?]+)/i],
  twitter: [/twitter\.com\/([^/?]+)/i, /x\.com\/([^/?]+)/i],
  youtube: [/youtube\.com\/(channel\/|c\/|user\/|@)?([^/?]+)/i, /youtu\.be\/([^/?]+)/i],
  linkedin: [/linkedin\.com\/(in|company)\/([^/?]+)/i],
};

export function detectPlatform(url: string): SocialPlatform | null {
  for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(url)) {
        return platform as SocialPlatform;
      }
    }
  }
  return null;
}

export function extractHandle(url: string, platform: SocialPlatform): string | null {
  const patterns = PLATFORM_PATTERNS[platform];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      // Get the last captured group (handle)
      return match[match.length - 1] || null;
    }
  }
  return null;
}
