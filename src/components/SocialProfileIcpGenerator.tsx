"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { Loader2, Search, Users, Sparkles, Instagram, Youtube, Linkedin, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { detectPlatform, SocialPlatform } from "@/schemas/social-profile-icp";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";

// Platform icons
const PlatformIcon = ({ platform }: { platform: SocialPlatform | null }) => {
  switch (platform) {
    case "instagram":
      return <Instagram className="w-5 h-5 text-pink-500" />;
    case "youtube":
      return <Youtube className="w-5 h-5 text-red-500" />;
    case "linkedin":
      return <Linkedin className="w-5 h-5 text-blue-600" />;
    case "twitter":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      );
    default:
      return <Users className="w-5 h-5 text-neutral-400" />;
  }
};

// Tool part types for AI SDK v5
interface LookupProfilePart {
  type: "tool-lookupProfile";
  toolCallId: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  input?: { handle: string; platform: string };
  output?: {
    handle: string;
    platform: string;
    bio: string | null;
    followerCount: string | null;
    contentThemes: string[];
    sourceCount: number;
  };
}

interface AnalyzeAudiencePart {
  type: "tool-analyzeAudience";
  toolCallId: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  input?: { profileSummary: string };
  output?: {
    contentTone: string;
    primaryAppeal: string;
    audienceSignals: {
      likelyDemographics: string;
      interestClusters: string[];
      motivationsToFollow: string[];
    };
    segmentOpportunities: string[];
  };
}

interface GenerateICPsPart {
  type: "tool-generateICPs";
  toolCallId: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  input?: { analysisContext: string };
  output?: {
    profileAnalyzed: string;
    platform: string;
    totalFollowers: string;
    icpSegments: Array<{
      segmentName: string;
      personaDescription: string;
      demographics: {
        ageRange: string;
        gender: string;
        occupation: string | null;
      };
      psychographics: {
        values: string[];
        aspirations: string[];
        painPoints: string[];
        lifestyle: string;
      };
      behaviors: {
        followReason: string;
        engagementStyle: string;
        purchaseInfluence: string;
        contentPreferences: string[];
      };
      brandAffinities: string[];
      estimatedSegmentSize: string;
    }>;
  };
}

// ICP segment type (extracted from GenerateICPsPart output)
type ICPSegmentData = NonNullable<GenerateICPsPart["output"]>["icpSegments"][number];

// ICP Card Component
function ICPCard({ segment, index }: { segment: ICPSegmentData; index: number }) {
  const engagementColors: Record<string, string> = {
    lurker: "bg-neutral-100 text-neutral-700",
    liker: "bg-blue-100 text-blue-700",
    commenter: "bg-green-100 text-green-700",
    sharer: "bg-purple-100 text-purple-700",
    superfan: "bg-pink-100 text-pink-700",
  };

  const influenceColors: Record<string, string> = {
    high: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-neutral-100 text-neutral-700",
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{segment.segmentName}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {segment.estimatedSegmentSize}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{segment.personaDescription}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Demographics */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">Demographics</h4>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">{segment.demographics.ageRange}</Badge>
            <Badge variant="outline" className="text-xs">{segment.demographics.gender}</Badge>
            {segment.demographics.occupation && (
              <Badge variant="outline" className="text-xs">{segment.demographics.occupation}</Badge>
            )}
          </div>
        </div>

        {/* Follow Reason */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">Why They Follow</h4>
          <p className="text-sm">{segment.behaviors.followReason}</p>
        </div>

        {/* Engagement & Influence */}
        <div className="flex gap-2">
          <Badge className={cn("text-xs", engagementColors[segment.behaviors.engagementStyle] || "bg-neutral-100")}>
            {segment.behaviors.engagementStyle}
          </Badge>
          <Badge className={cn("text-xs", influenceColors[segment.behaviors.purchaseInfluence] || "bg-neutral-100")}>
            {segment.behaviors.purchaseInfluence} purchase influence
          </Badge>
        </div>

        {/* Psychographics */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">Values & Aspirations</h4>
          <div className="flex flex-wrap gap-1">
            {segment.psychographics.values.slice(0, 3).map((v, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>
            ))}
          </div>
        </div>

        {/* Brand Affinities */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">Brand Affinities</h4>
          <p className="text-sm text-muted-foreground">{segment.brandAffinities.join(", ")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function SocialProfileIcpGenerator() {
  const [profileUrl, setProfileUrl] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const hasStartedRef = useRef(false);

  const detectedPlatform = useMemo(() => detectPlatform(profileUrl), [profileUrl]);

  // Create transport for the social-icp endpoint - use submittedUrl to avoid recreating on every keystroke
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/social-icp",
        body: {
          profileUrl: submittedUrl,
        },
      }),
    [submittedUrl]
  );

  // Use a unique chat ID that changes when submittedUrl changes to force re-initialization
  const chatId = useMemo(() => `social-icp-${submittedUrl || 'new'}`, [submittedUrl]);

  const { messages, sendMessage, status, setMessages } = useChat({
    id: chatId,
    transport,
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Start generation when button is clicked
  const handleGenerate = useCallback(() => {
    if (!profileUrl || !detectedPlatform || isLoading) return;

    hasStartedRef.current = true;
    setIsGenerating(true);
    // Set the submitted URL - this triggers transport recreation with the correct URL
    setSubmittedUrl(profileUrl);
  }, [profileUrl, detectedPlatform, isLoading]);

  // Send message after submittedUrl is set and transport is ready
  useEffect(() => {
    if (submittedUrl && isGenerating && hasStartedRef.current && messages.length === 0) {
      // Small delay to ensure transport is recreated
      const timer = setTimeout(() => {
        sendMessage({
          text: "Start",
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [submittedUrl, isGenerating, messages.length, sendMessage]);

  // Reset when URL changes (but only if user is editing after a generation)
  useEffect(() => {
    if (submittedUrl && profileUrl !== submittedUrl) {
      setSubmittedUrl("");
      setMessages([]);
      setIsGenerating(false);
      hasStartedRef.current = false;
    }
  }, [profileUrl, submittedUrl, setMessages]);

  // Track completion
  useEffect(() => {
    if (!isLoading && messages.length > 0 && isGenerating) {
      // Check if we have generateICPs output
      const hasICPs = messages.some((m) =>
        m.parts?.some(
          (p) => p.type === "tool-generateICPs" && (p as GenerateICPsPart).state === "output-available"
        )
      );
      if (hasICPs) {
        setIsGenerating(false);
      }
    }
  }, [isLoading, messages, isGenerating]);

  // Extract ICP results from messages
  const icpResults = useMemo(() => {
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      const parts = message.parts || [];
      for (const part of parts) {
        if (part.type === "tool-generateICPs") {
          const toolPart = part as GenerateICPsPart;
          if (toolPart.state === "output-available" && toolPart.output) {
            return toolPart.output;
          }
        }
      }
    }
    return null;
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-semibold">Social Profile ICP Generator</h1>
        </div>

        {/* URL Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <PlatformIcon platform={detectedPlatform} />
            </div>
            <Input
              type="url"
              placeholder="Enter social profile URL (Instagram, TikTok, X, YouTube, LinkedIn)"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!profileUrl || !detectedPlatform || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate ICPs
              </>
            )}
          </Button>
        </div>

        {profileUrl && !detectedPlatform && (
          <p className="text-sm text-destructive mt-2">
            Unsupported platform. Please enter a URL from Instagram, TikTok, X/Twitter, YouTube, or LinkedIn.
          </p>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {/* Empty State */}
        {messages.length === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Users className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Generate Audience ICPs from Social Profiles</p>
            <p className="text-sm mt-1">
              Enter a creator&apos;s profile URL to analyze their audience and generate 3-6 distinct customer segments.
            </p>
          </div>
        )}

        {/* Generation Progress */}
        {(isLoading || (isGenerating && !icpResults)) && (
          <Conversation className="max-w-3xl mx-auto">
            <ConversationContent className="gap-4">
              {messages.map((message) => {
                if (message.role !== "assistant") return null;
                const parts = message.parts || [];

                const lookupParts = parts.filter((p) => p.type === "tool-lookupProfile") as LookupProfilePart[];
                const analyzeParts = parts.filter((p) => p.type === "tool-analyzeAudience") as AnalyzeAudiencePart[];
                const generateParts = parts.filter((p) => p.type === "tool-generateICPs") as GenerateICPsPart[];

                return (
                  <div key={message.id} className="space-y-3">
                    {/* Profile Lookup */}
                    {lookupParts.map((part, idx) => (
                      <div key={`lookup-${idx}`} className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                        <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
                          <Search className="w-3 h-3" />
                          <span>Looking up profile</span>
                          {part.state !== "output-available" && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                        </div>
                        {part.state === "output-available" && part.output && (
                          <div className="mt-2 text-sm">
                            <p>@{part.output.handle} on {part.output.platform}</p>
                            {part.output.followerCount && (
                              <p className="text-muted-foreground">{part.output.followerCount} followers</p>
                            )}
                            {part.output.contentThemes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {part.output.contentThemes.map((theme, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{theme}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Audience Analysis */}
                    {analyzeParts.map((part, idx) => (
                      <div key={`analyze-${idx}`} className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                        <div className="flex items-center gap-2 text-xs text-purple-400 font-medium">
                          <Sparkles className="w-3 h-3" />
                          <span>Analyzing audience</span>
                          {part.state !== "output-available" && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                        </div>
                        {part.state === "output-available" && part.output && (
                          <div className="mt-2 text-sm space-y-1">
                            <p><span className="text-muted-foreground">Tone:</span> {part.output.contentTone}</p>
                            <p><span className="text-muted-foreground">Primary appeal:</span> {part.output.primaryAppeal}</p>
                            <p><span className="text-muted-foreground">Segment opportunities:</span> {part.output.segmentOpportunities.length} identified</p>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* ICP Generation */}
                    {generateParts.map((part, idx) => (
                      <div key={`generate-${idx}`} className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                        <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
                          <Users className="w-3 h-3" />
                          <span>Generating ICPs</span>
                          {part.state !== "output-available" && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                        </div>
                        {part.state === "output-available" && part.output && (
                          <p className="mt-2 text-sm text-green-400">
                            Generated {part.output.icpSegments.length} audience segments
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </ConversationContent>
          </Conversation>
        )}

        {/* ICP Results */}
        {icpResults && !isLoading && (
          <div className="max-w-6xl mx-auto">
            {/* Summary Header */}
            <div className="mb-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <PlatformIcon platform={icpResults.platform as SocialPlatform} />
                <h2 className="text-xl font-semibold">{icpResults.profileAnalyzed}</h2>
              </div>
              <p className="text-muted-foreground">
                {icpResults.totalFollowers} followers • {icpResults.icpSegments.length} audience segments identified
              </p>
            </div>

            {/* ICP Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {icpResults.icpSegments.map((segment, index) => (
                <ICPCard key={index} segment={segment} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
