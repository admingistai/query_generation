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

// ============================================================================
// EVIDENCE-BASED ICP SCHEMAS
// ============================================================================

// Evidence source types for ICP generation
export const EvidenceTypeSchema = z.enum([
  "hashtag",
  "content",
  "collaboration",
  "comment",
  "bio",
  "comparable_creator",
  "article", // NEW: Evidence from articles, interviews, press
]);

export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;

// Individual evidence source
export const EvidenceSourceSchema = z.object({
  type: EvidenceTypeSchema,
  detail: z.string(),
  source: z.string(),
});

export type EvidenceSource = z.infer<typeof EvidenceSourceSchema>;

// Confidence level for ICP segments
export const ConfidenceLevelSchema = z.enum(["high", "medium", "low"]);

export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

// Evidence section for ICP segments
export const ICPEvidenceSchema = z.object({
  primarySources: z.array(EvidenceSourceSchema),
  confidenceLevel: ConfidenceLevelSchema,
  confidenceReason: z.string(),
  score: z.number().min(0).max(5).nullable(), // 0-5 scoring for validation
});

export type ICPEvidence = z.infer<typeof ICPEvidenceSchema>;

// Niche classification schema
export const NicheClassificationSchema = z.object({
  primaryNiche: z.object({
    industry: z.string(),
    subNiche: z.string(),
    specificGenre: z.string().nullable(),
  }),
  nicheEvidence: z.array(z.object({
    signal: z.string(),
    source: z.string(),
    confidence: ConfidenceLevelSchema,
  })),
  audienceConstraints: z.object({
    likelyAgeRange: z.string(),
    likelyGenderSplit: z.string(),
    likelyGeography: z.array(z.string()),
    likelyInterests: z.array(z.string()),
    unlikelySegments: z.array(z.string()), // Critical for filtering hallucinations
  }),
});

export type NicheClassification = z.infer<typeof NicheClassificationSchema>;

// URL expansion result schema
export const URLExpansionResultSchema = z.object({
  primaryUrl: z.string(),
  discoveredUrls: z.object({
    otherPlatforms: z.array(z.object({
      platform: z.string(),
      url: z.string(),
      source: z.string(), // "bio link", "linktree", "web search"
    })),
    website: z.string().nullable(),
    linktree: z.string().nullable(),
    podcastAppearances: z.array(z.string()),
    interviews: z.array(z.string()),
    collaborators: z.array(z.object({
      name: z.string(),
      url: z.string().nullable(),
      relationship: z.string(),
    })),
    similarCreators: z.array(z.object({
      name: z.string(),
      url: z.string(),
      similarity: z.string(),
    })),
  }),
});

export type URLExpansionResult = z.infer<typeof URLExpansionResultSchema>;

// Excluded segment (for transparency)
export const ExcludedSegmentSchema = z.object({
  segmentName: z.string(),
  rejectionReason: z.string(),
  score: z.number().nullable(),
});

export type ExcludedSegment = z.infer<typeof ExcludedSegmentSchema>;

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

// Individual ICP segment (base schema without evidence)
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

// Evidence-based ICP segment (extended with evidence tracking)
export const EvidenceBasedICPSegmentSchema = z.object({
  segmentName: z.string(),
  personaDescription: z.string(),
  // Evidence section - required for validation
  evidence: ICPEvidenceSchema,
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

export type EvidenceBasedICPSegment = z.infer<typeof EvidenceBasedICPSegmentSchema>;

// Full ICP generation result (legacy, without evidence)
export const SocialProfileICPResultSchema = z.object({
  profileAnalyzed: z.string(),
  platform: SocialPlatformSchema,
  totalFollowers: z.string(),
  icpSegments: z.array(ICPSegmentSchema).min(3).max(6),
});

export type SocialProfileICPResult = z.infer<typeof SocialProfileICPResultSchema>;

// Evidence-based ICP generation result (with full pipeline output)
export const EvidenceBasedICPResultSchema = z.object({
  profileAnalyzed: z.string(),
  platform: SocialPlatformSchema,
  totalFollowers: z.string(),
  // Research pipeline outputs
  urlExpansion: URLExpansionResultSchema.nullable(),
  nicheClassification: NicheClassificationSchema,
  // Evidence-based ICPs (validated, with sources)
  icpSegments: z.array(EvidenceBasedICPSegmentSchema).min(2).max(6),
  // Transparency: show what was filtered out
  excludedSegments: z.array(ExcludedSegmentSchema),
  // Research metadata
  researchMetadata: z.object({
    researchDepth: z.enum(["quick", "standard", "deep"]),
    sourcesAnalyzed: z.number(),
    comparableCreatorsUsed: z.number(),
    generatedAt: z.string(),
  }),
});

export type EvidenceBasedICPResult = z.infer<typeof EvidenceBasedICPResultSchema>;

// ============================================================================
// ARTICLE CONTEXT SCHEMAS
// ============================================================================

// Article source classification
export const ArticleSourceTypeSchema = z.enum([
  "interview",      // Q&A or interview format
  "press",          // News coverage, announcements
  "blog",           // Personal blog or guest posts
  "podcast",        // Podcast transcript
  "research",       // Industry research, reports
  "other"           // Unclassified
]);

export type ArticleSourceType = z.infer<typeof ArticleSourceTypeSchema>;

// Insight type for categorization
export const ArticleInsightTypeSchema = z.enum([
  "demographic",      // Age, gender, location, occupation
  "psychographic",    // Values, interests, lifestyle
  "behavioral",       // How they engage, purchase patterns
  "brand_affinity",   // Brands mentioned
  "niche_signal"      // Industry/niche indicators
]);

export type ArticleInsightType = z.infer<typeof ArticleInsightTypeSchema>;

// Single insight extracted from article
export const ArticleInsightSchema = z.object({
  insight: z.string(),
  confidence: ConfidenceLevelSchema,
  quote: z.string().nullable(),        // Direct quote if available
  insightType: ArticleInsightTypeSchema,
});

export type ArticleInsight = z.infer<typeof ArticleInsightSchema>;

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
    creatorQuotes: z.array(z.string()),   // Creator's own words about audience
    geographySignals: z.array(z.string()),
  }),
  qualityScore: z.number().min(0).max(5), // How valuable is this source?
});

export type ArticleContext = z.infer<typeof ArticleContextSchema>;

// Research summary for preview (before user approval)
export const ResearchSummarySchema = z.object({
  profilesFound: z.array(z.object({
    handle: z.string(),
    platform: SocialPlatformSchema,
    followerCount: z.string().nullable(),
  })),
  articlesProcessed: z.array(z.object({
    url: z.string(),
    title: z.string().nullable(),
    sourceType: ArticleSourceTypeSchema,
    qualityScore: z.number(),
    insightCount: z.number(),
  })),
  keyInsights: z.array(z.string()), // Top insights for preview
  discoveredUrls: z.object({
    platforms: z.array(z.string()),
    articles: z.array(z.string()), // Auto-discovered articles
  }),
  evidenceSummary: z.object({
    totalSources: z.number(),
    highConfidenceCount: z.number(),
    hasCreatorQuotes: z.boolean(),
  }),
});

export type ResearchSummary = z.infer<typeof ResearchSummarySchema>;

// ============================================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================================

// API request schema for multi-URL input (with article support)
export const EvidenceBasedICPRequestSchema = z.object({
  urls: z.union([
    z.string().url(),
    z.array(z.string().url()).min(1).max(5),
  ]),
  articleUrls: z.array(z.string().url()).max(3).optional(), // NEW: Optional article URLs
  hints: z.object({
    creatorName: z.string().optional(),
    knownNiche: z.string().optional(),
  }).optional(),
  config: z.object({
    researchDepth: z.enum(["quick", "standard", "deep"]).default("standard"),
    includeComparativeAnalysis: z.boolean().default(true),
  }).optional(),
});

export type EvidenceBasedICPRequest = z.infer<typeof EvidenceBasedICPRequestSchema>;

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
