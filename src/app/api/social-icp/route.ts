import { openai, type OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import { streamText, tool, convertToModelMessages, generateText, generateObject, stepCountIs } from "ai";
import { z } from "zod";
import {
  detectPlatform,
  extractHandle,
  SocialPlatform,
  ICPSegmentSchema,
} from "@/schemas/social-profile-icp";
import {
  createSocialProfileIcpSystemPrompt,
  ProfileLookupOutputSchema,
  AudienceAnalysisOutputSchema,
} from "@/lib/agents/socialProfileIcpAgent";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Social ICP API - Raw request body:", JSON.stringify(body, null, 2));

    const { messages, profileUrl, model = "gpt-4o" } = body;

    if (!profileUrl || typeof profileUrl !== "string") {
      return Response.json(
        { error: "Profile URL is required" },
        { status: 400 }
      );
    }

    // Detect platform and extract handle
    const platform = detectPlatform(profileUrl);
    if (!platform) {
      return Response.json(
        { error: "Unsupported platform. Supported: Instagram, TikTok, X/Twitter, YouTube, LinkedIn" },
        { status: 400 }
      );
    }

    const handle = extractHandle(profileUrl, platform);
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

    console.log("Social ICP API - Starting generation:", {
      profileUrl,
      platform,
      handle,
      model,
    });

    // State for accumulating data across tools
    let profileData: z.infer<typeof ProfileLookupOutputSchema> | null = null;
    let audienceAnalysis: z.infer<typeof AudienceAnalysisOutputSchema> | null = null;

    // Convert messages from UI format to model format
    const modelMessages = convertToModelMessages(messages);

    // Define tools for the agent
    const socialIcpTools = {
      lookupProfile: tool({
        description: "Look up information about a social media profile using web search. Call this first to gather profile data.",
        inputSchema: z.object({
          handle: z.string().describe("The social media handle to look up"),
          platform: z.string().describe("The platform (instagram, tiktok, twitter, youtube, linkedin)"),
        }),
        execute: async ({ handle: h, platform: p }) => {
          console.log(`Tool: lookupProfile - Handle: @${h}, Platform: ${p}`);

          // Use web search to find profile information
          const { text, sources } = await generateText({
            model: openai("gpt-4o-mini"),
            system: `You are a social media researcher. Search for and compile information about the given social media profile.
Focus on:
- Bio/description
- Approximate follower count
- Content themes and topics
- Recent notable content
- Brand collaborations or mentions
- Content style (video, photos, stories, etc.)

Be specific and factual. If information isn't available, say so.`,
            prompt: `Research the ${p} profile @${h}. What do we know about this creator, their content, and their audience?`,
            tools: {
              web_search: openai.tools.webSearch({
                userLocation: { type: "approximate", country: "US" },
              }),
            },
            toolChoice: { type: "tool", toolName: "web_search" },
          });

          // Parse the research into structured data
          const { object } = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: ProfileLookupOutputSchema,
            prompt: `Extract structured profile data from this research about @${h} on ${p}:

${text}

If any field is unknown, use null or empty array as appropriate.`,
          });

          profileData = object;

          return {
            ...object,
            sourceCount: sources.length,
          };
        },
      }),

      analyzeAudience: tool({
        description: "Analyze profile data to infer audience characteristics. Call this after lookupProfile.",
        inputSchema: z.object({
          profileSummary: z.string().describe("Summary of the profile data to analyze"),
        }),
        execute: async ({ profileSummary }) => {
          console.log(`Tool: analyzeAudience - Analyzing profile data`);

          const { object } = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: AudienceAnalysisOutputSchema,
            prompt: `Analyze this social media profile to infer audience characteristics:

${profileSummary}

Consider:
1. What type of content does this creator make?
2. What tone/style characterizes their content?
3. What motivations would drive someone to follow them?
4. What demographics likely engage with this content?
5. What purchase behaviors correlate with this audience?
6. What are 4-6 distinct audience segments that likely follow this creator?

Be specific and avoid generic labels like "millennials" or "women 18-34".`,
          });

          audienceAnalysis = object;

          return object;
        },
      }),

      generateICPs: tool({
        description: "Generate 3-6 distinct ICP segments based on profile and audience analysis. Call this last.",
        inputSchema: z.object({
          analysisContext: z.string().describe("Context from profile lookup and audience analysis"),
        }),
        execute: async ({ analysisContext }) => {
          console.log(`Tool: generateICPs - Generating ICP segments`);

          const { object } = await generateObject({
            model: openai("gpt-4o"),
            schema: z.object({
              icpSegments: z.array(ICPSegmentSchema).min(3).max(6),
            }),
            prompt: `Generate 3-6 DISTINCT Ideal Customer Profile (ICP) segments for the followers of this social media creator.

Context:
${analysisContext}

REQUIREMENTS:
1. Each segment MUST be meaningfully different (not just age variations)
2. Include BOTH obvious and unexpected follower types
3. Focus on psychographics - WHY do they follow?
4. Be specific - no generic demographic labels
5. Segment sizes should roughly total 100%

Consider these follower archetypes:
- Aspirational followers (want to be like them)
- Professional/business followers (follow for industry insights)
- Entertainment followers (follow for drama/content)
- Niche interest followers (follow for specific content type)
- Critics/hate-followers (follow to monitor/criticize)
- Passive/algorithmic followers (low engagement)

For each segment provide:
- segmentName: Catchy, descriptive name
- personaDescription: 1-2 sentences explaining who they are
- demographics: ageRange, gender distribution, typical occupation
- psychographics: values, aspirations, painPoints, lifestyle
- behaviors: followReason, engagementStyle (lurker/liker/commenter/sharer/superfan), purchaseInfluence (high/medium/low), contentPreferences
- brandAffinities: 3-5 brands this segment likely engages with
- estimatedSegmentSize: percentage like "~25%"`,
          });

          return {
            profileAnalyzed: `@${handle}`,
            platform,
            totalFollowers: profileData?.followerCount || "Unknown",
            icpSegments: object.icpSegments,
          };
        },
      }),
    };

    const result = streamText({
      model: openai(model),
      system: createSocialProfileIcpSystemPrompt(profileUrl, platform, handle),
      messages: modelMessages,
      tools: socialIcpTools,
      stopWhen: [
        stepCountIs(10),
        // Stop when generateICPs has been called
        ({ steps }) => {
          return steps.some((step) =>
            step.toolResults?.some((r) => r.toolName === "generateICPs")
          );
        },
      ],
      prepareStep: ({ steps }) => {
        const hasGeneratedICPs = steps.some((step) =>
          step.toolResults?.some((r) => r.toolName === "generateICPs")
        );
        return {
          toolChoice: hasGeneratedICPs ? undefined : ("required" as const),
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
    console.error("Social ICP API error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
