import { openai, type OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import { streamText, tool, convertToModelMessages, generateText, generateObject, stepCountIs } from "ai";
import { z } from "zod";
import {
  detectPlatform,
  extractHandle,
  SocialPlatform,
  EvidenceBasedICPSegmentSchema,
  NicheClassificationSchema,
  URLExpansionResultSchema,
  ExcludedSegmentSchema,
  ICPEvidenceSchema,
  EvidenceTypeSchema,
} from "@/schemas/social-profile-icp";

export const maxDuration = 180; // Longer timeout for multi-phase pipeline

// ============================================================================
// PHASE-SPECIFIC SCHEMAS FOR TOOL OUTPUTS
// ============================================================================

// Schema for enhanced profile data with evidence tracking
const EnhancedProfileDataSchema = z.object({
  handle: z.string(),
  platform: z.string(),
  bio: z.string().nullable(),
  followerCount: z.string().nullable(),
  contentThemes: z.array(z.string()),
  recentContentSummary: z.string().nullable(),
  brandMentions: z.array(z.string()),
  contentStyle: z.string().nullable(),
  // Evidence-specific fields
  hashtags: z.array(z.object({
    tag: z.string(),
    frequency: z.string(), // "high", "medium", "low"
    category: z.string(), // "niche", "location", "trending", "community"
  })),
  collaborators: z.array(z.object({
    handle: z.string(),
    platform: z.string().nullable(),
    relationship: z.string(), // "featured", "mentioned", "tagged"
  })),
  geographySignals: z.array(z.string()), // Location mentions, time zones, language
});

type EnhancedProfileData = z.infer<typeof EnhancedProfileDataSchema>;

// Schema for comparable creator analysis
const ComparableCreatorSchema = z.object({
  name: z.string(),
  handle: z.string(),
  platform: z.string(),
  followerCount: z.string(),
  similarity: z.string(), // Why they're similar
  knownAudiences: z.array(z.string()), // Their reported/observed audiences
  audienceEvidence: z.string(), // How we know about their audience
});

type ComparableCreator = z.infer<typeof ComparableCreatorSchema>;

// ============================================================================
// SYSTEM PROMPT FOR EVIDENCE-BASED ICP GENERATION
// ============================================================================

function createEvidenceBasedSystemPrompt(
  profileUrl: string,
  platform: SocialPlatform,
  handle: string,
  researchDepth: "quick" | "standard" | "deep"
): string {
  return `You are an evidence-based audience intelligence expert. You generate ICPs ONLY when supporting evidence exists.

**CRITICAL RULE**: Every ICP segment you generate MUST cite specific evidence. No speculation. No creative inference.

**YOUR TASK:**
Analyze @${handle} on ${platform} (${profileUrl}) and generate evidence-based ICP segments.

**RESEARCH DEPTH: ${researchDepth.toUpperCase()}**
${researchDepth === "quick" ? "- Skip comparative analysis, focus on direct profile data" : ""}
${researchDepth === "standard" ? "- Include comparative analysis with similar creators" : ""}
${researchDepth === "deep" ? "- Full URL expansion, multiple platforms, comprehensive comparative analysis" : ""}

**MANDATORY EXECUTION FLOW:**
Execute these steps in order. After each tool result, IMMEDIATELY call the next tool.

STEP 1: expandUrls - Discover all related URLs (other platforms, collaborators, website)
STEP 2: deepResearch - Research the primary profile with evidence extraction
STEP 3: classifyNiche - Determine the creator's niche and audience constraints
${researchDepth !== "quick" ? "STEP 4: findComparableCreators - Find similar creators as audience templates" : ""}
STEP ${researchDepth === "quick" ? "4" : "5"}: generateEvidenceBasedICPs - Generate ICPs with mandatory evidence citations
STEP ${researchDepth === "quick" ? "5" : "6"}: validateICPs - Validate each ICP against evidence and niche constraints

**EVIDENCE TYPES (use these exact values):**
- hashtag: Hashtag patterns in content
- content: Themes from posts/videos
- collaboration: Partner creators
- comment: Engagement patterns
- bio: Profile description
- comparable_creator: Similar creator's known audience

**CONFIDENCE SCORING:**
- Score 5: Direct evidence (creator mentioned this audience)
- Score 4: Strong indirect (engagement patterns clearly show this)
- Score 3: Moderate (content themes, hashtags suggest this)
- Score 2: Weak (comparable creators only)
- Score 1: Speculation (niche norms only)
- Score 0: No evidence → REJECT

**REJECTION RULES:**
- Reject segments with score < 3
- Reject segments that contradict niche constraints
- Reject segments in the "unlikelySegments" list from niche classification
- Reject segments with no geography evidence if they mention specific locations

**BEGIN NOW:** Call expandUrls to discover all related URLs for @${handle}.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Social ICP V2 API - Raw request body:", JSON.stringify(body, null, 2));

    // Support both single URL and multi-URL input
    const { messages, profileUrl, urls, hints, config, model = "gpt-4o" } = body;

    // Normalize URLs input
    const inputUrls: string[] = urls
      ? (Array.isArray(urls) ? urls : [urls])
      : profileUrl
        ? [profileUrl]
        : [];

    if (inputUrls.length === 0) {
      return Response.json(
        { error: "At least one profile URL is required" },
        { status: 400 }
      );
    }

    // Use first URL as primary
    const primaryUrl = inputUrls[0]!;
    const platform = detectPlatform(primaryUrl);
    if (!platform) {
      return Response.json(
        { error: "Unsupported platform. Supported: Instagram, TikTok, X/Twitter, YouTube, LinkedIn" },
        { status: 400 }
      );
    }

    const handle = extractHandle(primaryUrl, platform);
    if (!handle) {
      return Response.json(
        { error: "Could not extract handle from URL" },
        { status: 400 }
      );
    }

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const researchDepth = config?.researchDepth || "standard";

    console.log("Social ICP V2 API - Starting evidence-based generation:", {
      primaryUrl,
      platform,
      handle,
      model,
      researchDepth,
      additionalUrls: inputUrls.slice(1),
      hints,
    });

    // State for accumulating data across tools
    let urlExpansionResult: z.infer<typeof URLExpansionResultSchema> | null = null;
    let profileData: EnhancedProfileData | null = null;
    let nicheClassification: z.infer<typeof NicheClassificationSchema> | null = null;
    let comparableCreators: ComparableCreator[] = [];
    let excludedSegments: z.infer<typeof ExcludedSegmentSchema>[] = [];
    let sourcesAnalyzed = 0;

    const modelMessages = convertToModelMessages(messages);

    // ========================================================================
    // EVIDENCE-BASED TOOLS
    // ========================================================================

    const evidenceBasedTools = {
      // PHASE 1: URL EXPANSION
      expandUrls: tool({
        description: "Discover all related URLs for comprehensive research: other platforms, website, collaborators, similar creators.",
        inputSchema: z.object({
          primaryHandle: z.string().describe("The primary handle to research"),
          primaryPlatform: z.string().describe("The platform of the primary handle"),
          creatorName: z.string().optional().describe("Known creator name to help with cross-platform search"),
        }),
        execute: async ({ primaryHandle, primaryPlatform, creatorName }) => {
          console.log(`Tool: expandUrls - Handle: @${primaryHandle}, Platform: ${primaryPlatform}`);

          const searchQuery = creatorName
            ? `"${creatorName}" OR "@${primaryHandle}" social media profiles`
            : `"@${primaryHandle}" ${primaryPlatform} creator social media profiles`;

          const { text } = await generateText({
            model: openai("gpt-4o-mini"),
            system: `You are a social media investigator. Find ALL related URLs for this creator.

Search for:
1. Other social platforms (Instagram, TikTok, YouTube, X/Twitter, LinkedIn, Spotify, SoundCloud)
2. Personal website or Linktree
3. Podcast appearances or interviews
4. Collaborator profiles (people they frequently work with)
5. Similar creators in the same niche

Be thorough. Extract actual URLs when possible.`,
            prompt: `Find all related URLs and profiles for @${primaryHandle} on ${primaryPlatform}. ${creatorName ? `Creator name: ${creatorName}` : ""}`,
            tools: {
              web_search: openai.tools.webSearch({
                userLocation: { type: "approximate", country: "US" },
              }),
            },
            toolChoice: { type: "tool", toolName: "web_search" },
          });

          sourcesAnalyzed++;

          const { object } = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: URLExpansionResultSchema,
            prompt: `Extract URL expansion data from this research:

${text}

Primary URL: ${primaryUrl}
Primary Handle: @${primaryHandle}
Primary Platform: ${primaryPlatform}

For each discovered URL, note the source (e.g., "bio link", "web search", "linktree").
For collaborators, describe their relationship (e.g., "featured collaboration", "mentioned in bio").
For similar creators, explain the similarity (e.g., "same niche, similar follower count").`,
          });

          urlExpansionResult = object;

          return {
            ...object,
            message: `Found ${object.discoveredUrls.otherPlatforms.length} other platforms, ${object.discoveredUrls.collaborators.length} collaborators, ${object.discoveredUrls.similarCreators.length} similar creators`,
          };
        },
      }),

      // PHASE 2: DEEP RESEARCH WITH EVIDENCE EXTRACTION
      deepResearch: tool({
        description: "Research the profile with evidence extraction: hashtags, collaborators, geography signals.",
        inputSchema: z.object({
          handle: z.string().describe("The handle to research"),
          platform: z.string().describe("The platform"),
          additionalUrls: z.array(z.string()).optional().describe("Additional URLs to research"),
        }),
        execute: async ({ handle: h, platform: p, additionalUrls }) => {
          console.log(`Tool: deepResearch - Handle: @${h}, Platform: ${p}`);

          // Primary profile research
          const { text: profileText } = await generateText({
            model: openai("gpt-4o-mini"),
            system: `You are a social media researcher. Extract DETAILED information with evidence focus.

Focus on:
1. Bio/description - exact text
2. Follower count
3. Content themes with specific examples
4. HASHTAGS used frequently (list them all)
5. Collaborators mentioned or tagged
6. Brand mentions
7. Geography signals (location mentions, language, time zones)
8. Content style and posting frequency

Be SPECIFIC. Quote actual content when possible.`,
            prompt: `Research @${h} on ${p}. Extract detailed profile data with evidence.`,
            tools: {
              web_search: openai.tools.webSearch({
                userLocation: { type: "approximate", country: "US" },
              }),
            },
            toolChoice: { type: "tool", toolName: "web_search" },
          });

          sourcesAnalyzed++;

          // Research additional URLs if provided
          let additionalContext = "";
          if (additionalUrls && additionalUrls.length > 0) {
            for (const url of additionalUrls.slice(0, 3)) {
              try {
                const { text } = await generateText({
                  model: openai("gpt-4o-mini"),
                  prompt: `Research this URL for additional information about the creator: ${url}`,
                  tools: {
                    web_search: openai.tools.webSearch({
                      userLocation: { type: "approximate", country: "US" },
                    }),
                  },
                  toolChoice: { type: "tool", toolName: "web_search" },
                });
                additionalContext += `\n\nFrom ${url}:\n${text}`;
                sourcesAnalyzed++;
              } catch (error) {
                console.log(`Failed to research additional URL: ${url}`);
              }
            }
          }

          const { object } = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: EnhancedProfileDataSchema,
            prompt: `Extract enhanced profile data with evidence from this research:

PRIMARY PROFILE:
${profileText}

${additionalContext ? `ADDITIONAL SOURCES:${additionalContext}` : ""}

IMPORTANT:
- List ALL hashtags found with their frequency (high/medium/low) and category (niche/location/trending/community)
- List ALL collaborators mentioned with relationship type
- List ALL geography signals (locations mentioned, languages, time indicators)
- Be specific about content themes with examples`,
          });

          profileData = object;

          return {
            ...object,
            evidenceSummary: {
              hashtagCount: object.hashtags.length,
              collaboratorCount: object.collaborators.length,
              geographySignalCount: object.geographySignals.length,
              hasStrongLocationData: object.geographySignals.length > 0,
            },
          };
        },
      }),

      // PHASE 3: NICHE CLASSIFICATION WITH CONSTRAINTS
      classifyNiche: tool({
        description: "Classify the creator's niche and determine audience constraints including UNLIKELY segments.",
        inputSchema: z.object({
          profileSummary: z.string().describe("Summary of profile data to classify"),
          contentThemes: z.array(z.string()).describe("Main content themes"),
          hashtags: z.array(z.string()).describe("Hashtags used"),
        }),
        execute: async ({ profileSummary, contentThemes, hashtags }) => {
          console.log(`Tool: classifyNiche - Classifying niche from profile data`);

          const { object } = await generateObject({
            model: openai("gpt-4o"),
            schema: NicheClassificationSchema,
            prompt: `Classify this creator's niche and determine audience constraints.

PROFILE DATA:
${profileSummary}

CONTENT THEMES: ${contentThemes.join(", ")}
HASHTAGS: ${hashtags.join(", ")}

IMPORTANT - UNLIKELY SEGMENTS:
You MUST identify audiences that DO NOT make sense for this creator's niche.
For example:
- A music producer probably doesn't have "Retirees interested in gardening" as an audience
- A US-based fitness creator probably doesn't have "Berlin Creative Networkers" as an audience
- A gaming streamer probably doesn't have "Professional chefs" as an audience

Be SPECIFIC about geography. If the creator shows no connection to a location, audiences from that location are UNLIKELY.

The unlikelySegments field is CRITICAL for preventing hallucinated ICPs.`,
          });

          nicheClassification = object;

          return {
            ...object,
            message: `Classified as ${object.primaryNiche.industry} > ${object.primaryNiche.subNiche}. Identified ${object.audienceConstraints.unlikelySegments.length} unlikely segments.`,
          };
        },
      }),

      // PHASE 4: COMPARATIVE ANALYSIS (skip in quick mode)
      findComparableCreators: tool({
        description: "Find similar creators and research their known audiences as templates for ICP generation.",
        inputSchema: z.object({
          niche: z.string().describe("The creator's niche"),
          subNiche: z.string().describe("The creator's sub-niche"),
          followerCount: z.string().describe("Approximate follower count"),
          similarCreatorsFromExpansion: z.array(z.string()).optional().describe("Similar creators already found"),
        }),
        execute: async ({ niche, subNiche, followerCount, similarCreatorsFromExpansion }) => {
          console.log(`Tool: findComparableCreators - Finding similar ${niche}/${subNiche} creators`);

          // Use creators from URL expansion if available
          const knownSimilar = similarCreatorsFromExpansion || [];

          const { text } = await generateText({
            model: openai("gpt-4o-mini"),
            system: `You are a social media analyst. Find creators similar to the target who have KNOWN, DOCUMENTED audiences.

Focus on:
1. Same niche and sub-niche
2. Similar follower count (within 2-3x)
3. Creators who have discussed their audience demographics in interviews, press, or analytics tools
4. Creators with audience data available from third-party sources`,
            prompt: `Find 3-5 creators similar to a ${niche}/${subNiche} creator with ${followerCount} followers.
${knownSimilar.length > 0 ? `Already identified similar creators: ${knownSimilar.join(", ")}` : ""}

For each, find any available information about their audience demographics.`,
            tools: {
              web_search: openai.tools.webSearch({
                userLocation: { type: "approximate", country: "US" },
              }),
            },
            toolChoice: { type: "tool", toolName: "web_search" },
          });

          sourcesAnalyzed++;

          const { object } = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: z.object({
              comparableCreators: z.array(ComparableCreatorSchema),
            }),
            prompt: `Extract comparable creator data from this research:

${text}

For each creator:
- Name and handle
- Why they're similar
- Their KNOWN audiences (from interviews, analytics, press)
- How we know about their audience (the evidence source)

Only include audiences that have actual evidence, not speculation.`,
          });

          comparableCreators = object.comparableCreators;

          return {
            creators: object.comparableCreators,
            message: `Found ${object.comparableCreators.length} comparable creators with audience data`,
            audienceTemplates: object.comparableCreators.flatMap((c) => c.knownAudiences),
          };
        },
      }),

      // PHASE 5: EVIDENCE-BASED ICP GENERATION
      generateEvidenceBasedICPs: tool({
        description: "Generate ICPs with MANDATORY evidence citations. Each segment MUST cite specific evidence.",
        inputSchema: z.object({
          profileContext: z.string().describe("Full profile context"),
          nicheContext: z.string().describe("Niche classification context"),
          comparableAudiences: z.array(z.string()).optional().describe("Audience templates from comparable creators"),
          unlikelySegments: z.array(z.string()).describe("Segments to AVOID generating"),
        }),
        execute: async ({ profileContext, nicheContext, comparableAudiences, unlikelySegments }) => {
          console.log(`Tool: generateEvidenceBasedICPs - Generating with evidence requirements`);

          const { object } = await generateObject({
            model: openai("gpt-4o"),
            schema: z.object({
              icpSegments: z.array(EvidenceBasedICPSegmentSchema).min(2).max(6),
            }),
            prompt: `Generate evidence-based ICP segments for this creator.

PROFILE CONTEXT:
${profileContext}

NICHE CLASSIFICATION:
${nicheContext}

${comparableAudiences && comparableAudiences.length > 0 ? `
AUDIENCE TEMPLATES FROM SIMILAR CREATORS (use as starting points):
${comparableAudiences.join("\n")}
` : ""}

FORBIDDEN SEGMENTS (DO NOT GENERATE THESE):
${unlikelySegments.join("\n")}

**CRITICAL REQUIREMENTS:**

1. EVERY segment MUST include evidence with:
   - primarySources: Array of evidence with type (hashtag/content/collaboration/comment/bio/comparable_creator), detail, and source
   - confidenceLevel: high/medium/low
   - confidenceReason: Explain WHY you're confident
   - score: 0-5 based on evidence strength

2. Evidence scoring:
   - 5: Direct statement from creator about their audience
   - 4: Clear engagement patterns showing this audience
   - 3: Content themes/hashtags strongly suggest this
   - 2: Only comparable creator evidence
   - 1: Speculation based on niche norms
   - 0: No evidence

3. DO NOT generate segments:
   - That mention locations the creator has no connection to
   - That are in the FORBIDDEN SEGMENTS list
   - That have score < 3

4. Be SPECIFIC:
   - "Aspiring music producers who use Ableton" not "Music enthusiasts"
   - "LA-based fitness influencer followers" not "Health-conscious millennials"

5. Segment sizes must roughly total 100%`,
          });

          return {
            icpSegments: object.icpSegments,
            segmentCount: object.icpSegments.length,
            averageConfidenceScore: object.icpSegments.reduce((sum, s) => sum + (s.evidence.score || 0), 0) / object.icpSegments.length,
          };
        },
      }),

      // PHASE 6: VALIDATION
      validateICPs: tool({
        description: "Validate ICPs against evidence and niche constraints. Reject low-confidence or contradictory segments.",
        inputSchema: z.object({
          icpSegments: z.string().describe("JSON string of ICP segments to validate"),
          nicheConstraints: z.string().describe("JSON string of niche constraints"),
          unlikelySegments: z.array(z.string()).describe("Segments that should not exist"),
        }),
        execute: async ({ icpSegments, nicheConstraints, unlikelySegments }) => {
          console.log(`Tool: validateICPs - Validating segments against evidence`);

          const segments = JSON.parse(icpSegments);
          const constraints = JSON.parse(nicheConstraints);

          const validatedSegments: z.infer<typeof EvidenceBasedICPSegmentSchema>[] = [];
          const rejected: z.infer<typeof ExcludedSegmentSchema>[] = [];

          for (const segment of segments) {
            const score = segment.evidence?.score || 0;

            // Check evidence score
            if (score < 3) {
              rejected.push({
                segmentName: segment.segmentName,
                rejectionReason: `Evidence score too low (${score}/5). Minimum required: 3.`,
                score,
              });
              continue;
            }

            // Check against unlikely segments
            const matchesUnlikely = unlikelySegments.some((unlikely) =>
              segment.segmentName.toLowerCase().includes(unlikely.toLowerCase()) ||
              segment.personaDescription.toLowerCase().includes(unlikely.toLowerCase())
            );

            if (matchesUnlikely) {
              rejected.push({
                segmentName: segment.segmentName,
                rejectionReason: `Matches unlikely segment pattern. This audience doesn't fit the creator's niche.`,
                score,
              });
              continue;
            }

            // Check geography constraints
            const segmentText = `${segment.segmentName} ${segment.personaDescription} ${segment.demographics?.geography || ""}`;
            const likelyGeo = constraints.audienceConstraints?.likelyGeography || [];
            const hasSpecificLocation = /berlin|london|paris|tokyo|sydney|mumbai/i.test(segmentText);

            if (hasSpecificLocation && likelyGeo.length > 0) {
              const locationMatch = likelyGeo.some((geo: string) =>
                segmentText.toLowerCase().includes(geo.toLowerCase())
              );
              if (!locationMatch) {
                rejected.push({
                  segmentName: segment.segmentName,
                  rejectionReason: `Location mismatch. Creator's likely geography: ${likelyGeo.join(", ")}. No evidence for this location.`,
                  score,
                });
                continue;
              }
            }

            // Passed all checks
            validatedSegments.push(segment);
          }

          excludedSegments = rejected;

          return {
            validSegments: validatedSegments,
            validCount: validatedSegments.length,
            excludedSegments: rejected,
            excludedCount: rejected.length,
            message: `Validated ${validatedSegments.length} segments, rejected ${rejected.length} for insufficient evidence or constraint violations`,
          };
        },
      }),
    };

    const result = streamText({
      model: openai(model),
      system: createEvidenceBasedSystemPrompt(primaryUrl, platform, handle, researchDepth),
      messages: modelMessages,
      tools: evidenceBasedTools,
      stopWhen: [
        stepCountIs(15),
        // Stop when validateICPs has been called
        ({ steps }) => {
          return steps.some((step) =>
            step.toolResults?.some((r) => r.toolName === "validateICPs")
          );
        },
      ],
      prepareStep: ({ steps }) => {
        const hasValidated = steps.some((step) =>
          step.toolResults?.some((r) => r.toolName === "validateICPs")
        );
        return {
          toolChoice: hasValidated ? undefined : ("required" as const),
        };
      },
      providerOptions: {
        openai: {
          parallelToolCalls: false,
        } satisfies OpenAIResponsesProviderOptions,
      },
      onStepFinish: async ({ toolResults }) => {
        if (toolResults) {
          for (const toolResult of toolResults) {
            console.log(`Step finished - Tool: ${toolResult.toolName}`);
          }
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Social ICP V2 API error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
