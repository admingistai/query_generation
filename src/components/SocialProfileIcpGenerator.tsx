"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import {
  Loader2, Search, Users, Sparkles, Instagram, Youtube, Linkedin, ExternalLink,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, HelpCircle, Filter, Globe, Hash, MessageSquare, UserCheck,
  Plus, X, Link2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { detectPlatform, SocialPlatform } from "@/schemas/social-profile-icp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Conversation,
  ConversationContent,
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

// Evidence type icons
const EvidenceTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "hashtag":
      return <Hash className="w-3 h-3" />;
    case "content":
      return <MessageSquare className="w-3 h-3" />;
    case "collaboration":
      return <UserCheck className="w-3 h-3" />;
    case "comment":
      return <MessageSquare className="w-3 h-3" />;
    case "bio":
      return <Users className="w-3 h-3" />;
    case "comparable_creator":
      return <Users className="w-3 h-3" />;
    default:
      return <HelpCircle className="w-3 h-3" />;
  }
};

// Confidence badge component
function ConfidenceBadge({ level, score }: { level: string; score?: number | null }) {
  const configs: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    high: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-700 dark:text-green-400",
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: "HIGH"
    },
    medium: {
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      text: "text-yellow-700 dark:text-yellow-400",
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: "MEDIUM"
    },
    low: {
      bg: "bg-orange-100 dark:bg-orange-900/30",
      text: "text-orange-700 dark:text-orange-400",
      icon: <HelpCircle className="w-3 h-3" />,
      label: "LOW"
    },
  };

  const config = configs[level] ?? configs.low!;

  return (
    <Badge
      className={cn(
        "text-xs flex items-center gap-1",
        config?.bg,
        config?.text
      )}
      variant="secondary"
    >
      {config?.icon}
      {config?.label}
      {score !== null && score !== undefined && <span>({score}/5)</span>}
    </Badge>
  );
}

// Evidence section component
function EvidenceSection({ evidence }: { evidence: EvidenceData }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between p-2 h-auto">
          <span className="text-xs font-medium text-muted-foreground">
            Evidence ({evidence.primarySources.length} sources)
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 px-2 pb-2">
        <p className="text-xs text-muted-foreground italic">
          {evidence.confidenceReason}
        </p>
        <div className="space-y-1">
          {evidence.primarySources.map((source, i) => (
            <div key={i} className="flex items-start gap-2 text-xs bg-muted/50 rounded p-2">
              <EvidenceTypeIcon type={source.type} />
              <div>
                <Badge variant="outline" className="text-[10px] mb-1">{source.type}</Badge>
                <p className="text-muted-foreground">{source.detail}</p>
                {source.source && (
                  <p className="text-[10px] text-muted-foreground/70 truncate">{source.source}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Evidence types for v2 ICP
interface EvidenceSource {
  type: string;
  detail: string;
  source: string;
}

interface EvidenceData {
  primarySources: EvidenceSource[];
  confidenceLevel: string;
  confidenceReason: string;
  score: number | null;
}

// V2 ICP segment with evidence
interface EvidenceBasedICPSegment {
  segmentName: string;
  personaDescription: string;
  evidence: EvidenceData;
  demographics: {
    ageRange: string;
    gender: string;
    geography?: string | null;
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
}

// Excluded segment
interface ExcludedSegment {
  segmentName: string;
  rejectionReason: string;
  score: number | null;
}

// Tool part types for V2 API
interface ExpandUrlsPart {
  type: "tool-expandUrls";
  toolCallId: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  input?: { primaryHandle: string; primaryPlatform: string };
  output?: {
    message: string;
    discoveredUrls?: {
      otherPlatforms: Array<{ platform: string; url: string }>;
      collaborators: Array<{ name: string }>;
      similarCreators: Array<{ name: string }>;
    };
  };
}

interface DeepResearchPart {
  type: "tool-deepResearch";
  toolCallId: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  input?: { handle: string; platform: string };
  output?: {
    handle: string;
    platform: string;
    followerCount: string | null;
    hashtags: Array<{ tag: string; frequency: string }>;
    collaborators: Array<{ handle: string }>;
    evidenceSummary?: {
      hashtagCount: number;
      collaboratorCount: number;
      geographySignalCount: number;
    };
  };
}

interface ClassifyNichePart {
  type: "tool-classifyNiche";
  toolCallId: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  output?: {
    message: string;
    primaryNiche?: {
      industry: string;
      subNiche: string;
    };
    audienceConstraints?: {
      unlikelySegments: string[];
    };
  };
}

interface FindComparableCreatorsPart {
  type: "tool-findComparableCreators";
  toolCallId: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  output?: {
    message: string;
    creators?: Array<{ name: string; knownAudiences: string[] }>;
  };
}

interface GenerateEvidenceBasedICPsPart {
  type: "tool-generateEvidenceBasedICPs";
  toolCallId: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  output?: {
    segmentCount: number;
    averageConfidenceScore: number;
    icpSegments: EvidenceBasedICPSegment[];
  };
}

interface ValidateICPsPart {
  type: "tool-validateICPs";
  toolCallId: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  output?: {
    message: string;
    validCount: number;
    excludedCount: number;
    validSegments: EvidenceBasedICPSegment[];
    excludedSegments: ExcludedSegment[];
  };
}

// Legacy tool types
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

// Legacy ICP segment type
type LegacyICPSegmentData = NonNullable<GenerateICPsPart["output"]>["icpSegments"][number];

// Evidence-based ICP Card Component
function EvidenceBasedICPCard({ segment }: { segment: EvidenceBasedICPSegment }) {
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
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{segment.segmentName}</CardTitle>
          <div className="flex flex-col items-end gap-1">
            <ConfidenceBadge
              level={segment.evidence.confidenceLevel}
              score={segment.evidence.score}
            />
            <Badge variant="secondary" className="text-xs">
              {segment.estimatedSegmentSize}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{segment.personaDescription}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Evidence Section */}
        <EvidenceSection evidence={segment.evidence} />

        {/* Demographics */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">Demographics</h4>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">{segment.demographics.ageRange}</Badge>
            <Badge variant="outline" className="text-xs">{segment.demographics.gender}</Badge>
            {segment.demographics.geography && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {segment.demographics.geography}
              </Badge>
            )}
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

// Legacy ICP Card Component (for v1 API)
function LegacyICPCard({ segment }: { segment: LegacyICPSegmentData }) {
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

// Excluded Segments Section
function ExcludedSegmentsSection({ segments }: { segments: ExcludedSegment[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (segments.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-8">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span>Filtered Out ({segments.length} segments)</span>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4">
        <div className="space-y-2">
          {segments.map((segment, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30"
            >
              <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">{segment.segmentName}</p>
                <p className="text-xs text-muted-foreground">{segment.rejectionReason}</p>
                {segment.score !== null && (
                  <Badge variant="outline" className="text-xs mt-1">
                    Evidence score: {segment.score}/5
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SocialProfileIcpGenerator() {
  // Multi-URL state
  const [profileUrls, setProfileUrls] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [submittedUrls, setSubmittedUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [researchDepth, setResearchDepth] = useState<"quick" | "standard" | "deep">("standard");
  const [useV2, setUseV2] = useState(true); // Use v2 by default
  const hasStartedRef = useRef(false);

  // Detect platform for current input
  const detectedPlatform = useMemo(() => detectPlatform(currentInput), [currentInput]);

  // Get platforms for all added URLs
  const addedUrlPlatforms = useMemo(() =>
    profileUrls.map(url => ({ url, platform: detectPlatform(url) })),
    [profileUrls]
  );

  // Add URL to the list
  const handleAddUrl = useCallback(() => {
    if (!currentInput || !detectedPlatform) return;
    if (profileUrls.length >= 5) return; // Max 5 URLs per spec
    if (profileUrls.includes(currentInput)) return; // No duplicates

    setProfileUrls(prev => [...prev, currentInput]);
    setCurrentInput("");
  }, [currentInput, detectedPlatform, profileUrls]);

  // Remove URL from list
  const handleRemoveUrl = useCallback((urlToRemove: string) => {
    setProfileUrls(prev => prev.filter(url => url !== urlToRemove));
  }, []);

  // Handle Enter key to add URL
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentInput && detectedPlatform) {
      e.preventDefault();
      handleAddUrl();
    }
  }, [currentInput, detectedPlatform, handleAddUrl]);

  // Primary URL for display and legacy support
  const primaryUrl = profileUrls[0] || "";
  const primaryPlatform = primaryUrl ? detectPlatform(primaryUrl) : null;

  // Create transport for the appropriate endpoint
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: useV2 ? "/api/social-icp-v2" : "/api/social-icp",
        body: {
          // V2 supports array of URLs, V1 uses single profileUrl
          ...(useV2
            ? { urls: submittedUrls, config: { researchDepth } }
            : { profileUrl: submittedUrls[0] || "" }
          ),
        },
      }),
    [submittedUrls, useV2, researchDepth]
  );

  const chatId = useMemo(() => `social-icp-${useV2 ? "v2-" : ""}${submittedUrls.join("-") || 'new'}`, [submittedUrls, useV2]);

  const { messages, sendMessage, status, setMessages } = useChat({
    id: chatId,
    transport,
  });

  const isLoading = status === "streaming" || status === "submitted";

  const handleGenerate = useCallback(() => {
    // Need at least one URL with valid platform
    if (profileUrls.length === 0 || !primaryPlatform || isLoading) return;

    hasStartedRef.current = true;
    setIsGenerating(true);
    setSubmittedUrls([...profileUrls]);
  }, [profileUrls, primaryPlatform, isLoading]);

  useEffect(() => {
    if (submittedUrls.length > 0 && isGenerating && hasStartedRef.current && messages.length === 0) {
      const timer = setTimeout(() => {
        sendMessage({
          text: "Start",
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [submittedUrls, isGenerating, messages.length, sendMessage]);

  // Reset when URLs change after submission
  useEffect(() => {
    if (submittedUrls.length > 0 && JSON.stringify(profileUrls) !== JSON.stringify(submittedUrls)) {
      setSubmittedUrls([]);
      setMessages([]);
      setIsGenerating(false);
      hasStartedRef.current = false;
    }
  }, [profileUrls, submittedUrls, setMessages]);

  useEffect(() => {
    if (!isLoading && messages.length > 0 && isGenerating) {
      const hasICPs = messages.some((m) =>
        m.parts?.some(
          (p) =>
            (p.type === "tool-validateICPs" && (p as unknown as ValidateICPsPart).state === "output-available") ||
            (p.type === "tool-generateICPs" && (p as unknown as GenerateICPsPart).state === "output-available")
        )
      );
      if (hasICPs) {
        setIsGenerating(false);
      }
    }
  }, [isLoading, messages, isGenerating]);

  // Extract V2 results (evidence-based)
  const v2Results = useMemo(() => {
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      const parts = message.parts || [];
      for (const part of parts) {
        if (part.type === "tool-validateICPs") {
          const toolPart = part as unknown as ValidateICPsPart;
          if (toolPart.state === "output-available" && toolPart.output) {
            return toolPart.output;
          }
        }
      }
    }
    return null;
  }, [messages]);

  // Extract legacy results
  const legacyResults = useMemo(() => {
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      const parts = message.parts || [];
      for (const part of parts) {
        if (part.type === "tool-generateICPs") {
          const toolPart = part as unknown as GenerateICPsPart;
          if (toolPart.state === "output-available" && toolPart.output) {
            return toolPart.output;
          }
        }
      }
    }
    return null;
  }, [messages]);

  // Extract profile info for header
  const profileInfo = useMemo(() => {
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      const parts = message.parts || [];
      for (const part of parts) {
        if (part.type === "tool-deepResearch") {
          const toolPart = part as unknown as DeepResearchPart;
          if (toolPart.state === "output-available" && toolPart.output) {
            return {
              handle: toolPart.output.handle,
              platform: toolPart.output.platform,
              followerCount: toolPart.output.followerCount,
            };
          }
        }
        if (part.type === "tool-lookupProfile") {
          const toolPart = part as unknown as LookupProfilePart;
          if (toolPart.state === "output-available" && toolPart.output) {
            return {
              handle: toolPart.output.handle,
              platform: toolPart.output.platform,
              followerCount: toolPart.output.followerCount,
            };
          }
        }
      }
    }
    return null;
  }, [messages]);

  const hasResults = v2Results || legacyResults;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold">Social Profile ICP Generator</h1>
            {useV2 && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                Evidence-Based
              </Badge>
            )}
          </div>
        </div>

        {/* Multi-URL Input */}
        <div className="space-y-3">
          {/* Added URLs display */}
          {profileUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {addedUrlPlatforms.map(({ url, platform }) => (
                <div
                  key={url}
                  className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5 text-sm"
                >
                  <PlatformIcon platform={platform} />
                  <span className="max-w-[200px] truncate">{url.replace(/^https?:\/\/(www\.)?/, "")}</span>
                  <button
                    onClick={() => handleRemoveUrl(url)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {profileUrls.length < 5 && useV2 && (
                <div className="text-xs text-muted-foreground self-center">
                  {5 - profileUrls.length} more URL{5 - profileUrls.length !== 1 ? "s" : ""} allowed
                </div>
              )}
            </div>
          )}

          {/* URL Input Row */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[300px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <PlatformIcon platform={detectedPlatform} />
              </div>
              <Input
                type="url"
                placeholder={profileUrls.length === 0
                  ? "Enter social profile URL (Instagram, TikTok, X, YouTube, LinkedIn)"
                  : "Add another URL for richer research (same creator)"
                }
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
                disabled={isLoading || (!useV2 && profileUrls.length >= 1)}
              />
            </div>

            {/* Add URL button (V2 only, when there's a valid URL to add) */}
            {useV2 && currentInput && detectedPlatform && profileUrls.length < 5 && (
              <Button
                variant="outline"
                onClick={handleAddUrl}
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            )}

            {useV2 && (
              <Select value={researchDepth} onValueChange={(v) => setResearchDepth(v as typeof researchDepth)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">Quick</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="deep">Deep</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Button
              onClick={() => {
                // If there's a valid URL in input, add it first then generate
                if (currentInput && detectedPlatform && profileUrls.length < 5) {
                  setProfileUrls(prev => [...prev, currentInput]);
                  setCurrentInput("");
                  // Generate will happen after state updates
                  setTimeout(() => handleGenerate(), 0);
                } else {
                  handleGenerate();
                }
              }}
              disabled={(profileUrls.length === 0 && (!currentInput || !detectedPlatform)) || isLoading}
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

          {currentInput && !detectedPlatform && (
            <p className="text-sm text-destructive">
              Unsupported platform. Please enter a URL from Instagram, TikTok, X/Twitter, YouTube, or LinkedIn.
            </p>
          )}

          {/* Multi-URL hint for V2 */}
          {useV2 && profileUrls.length === 0 && !currentInput && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Link2 className="w-3 h-3" />
              V2: Add up to 5 URLs (same creator, different platforms) for richer evidence
            </p>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {/* Empty State */}
        {messages.length === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Users className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Generate Evidence-Based Audience ICPs</p>
            <p className="text-sm mt-1 max-w-md">
              Enter a creator&apos;s profile URL to analyze their audience with our evidence-based pipeline.
              Each ICP segment includes confidence scores and source citations.
            </p>
            <div className="flex gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Evidence-based</span>
              </div>
              <div className="flex items-center gap-1">
                <Filter className="w-4 h-4 text-orange-500" />
                <span>Filters hallucinations</span>
              </div>
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4 text-blue-500" />
                <span>Multi-platform</span>
              </div>
            </div>
          </div>
        )}

        {/* Generation Progress */}
        {(isLoading || (isGenerating && !hasResults)) && (
          <Conversation className="max-w-3xl mx-auto">
            <ConversationContent className="gap-4">
              {messages.map((message) => {
                if (message.role !== "assistant") return null;
                const parts = message.parts || [];

                // V2 tool parts
                const expandParts = parts.filter((p) => p.type === "tool-expandUrls") as unknown as ExpandUrlsPart[];
                const researchParts = parts.filter((p) => p.type === "tool-deepResearch") as unknown as DeepResearchPart[];
                const nicheParts = parts.filter((p) => p.type === "tool-classifyNiche") as unknown as ClassifyNichePart[];
                const compareParts = parts.filter((p) => p.type === "tool-findComparableCreators") as unknown as FindComparableCreatorsPart[];
                const generateV2Parts = parts.filter((p) => p.type === "tool-generateEvidenceBasedICPs") as unknown as GenerateEvidenceBasedICPsPart[];
                const validateParts = parts.filter((p) => p.type === "tool-validateICPs") as unknown as ValidateICPsPart[];

                // Legacy tool parts
                const lookupParts = parts.filter((p) => p.type === "tool-lookupProfile") as unknown as LookupProfilePart[];
                const analyzeParts = parts.filter((p) => p.type === "tool-analyzeAudience") as unknown as AnalyzeAudiencePart[];
                const generateParts = parts.filter((p) => p.type === "tool-generateICPs") as unknown as GenerateICPsPart[];

                return (
                  <div key={message.id} className="space-y-3">
                    {/* V2: URL Expansion */}
                    {expandParts.map((part, idx) => (
                      <div key={`expand-${idx}`} className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                        <div className="flex items-center gap-2 text-xs text-cyan-500 font-medium">
                          <Globe className="w-3 h-3" />
                          <span>Expanding URLs</span>
                          {part.state !== "output-available" && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                        </div>
                        {part.state === "output-available" && part.output && (
                          <div className="mt-2 space-y-2">
                            <p className="text-sm text-cyan-500">{part.output.message}</p>
                            {/* Show discovered URLs */}
                            {part.output.discoveredUrls && (
                              <div className="space-y-2 mt-3">
                                {/* Other platforms */}
                                {part.output.discoveredUrls.otherPlatforms && part.output.discoveredUrls.otherPlatforms.length > 0 && (
                                  <div>
                                    <p className="text-xs text-cyan-400 font-medium mb-1">Discovered Platforms:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {part.output.discoveredUrls.otherPlatforms.map((p, i) => (
                                        <a
                                          key={i}
                                          href={p.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1.5 bg-cyan-500/10 rounded-full px-2.5 py-1 text-xs text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                                        >
                                          <PlatformIcon platform={detectPlatform(p.url)} />
                                          <span>{p.platform}</span>
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {/* Collaborators */}
                                {part.output.discoveredUrls.collaborators && part.output.discoveredUrls.collaborators.length > 0 && (
                                  <div>
                                    <p className="text-xs text-cyan-400 font-medium mb-1">Collaborators Found:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {part.output.discoveredUrls.collaborators.slice(0, 5).map((c, i) => (
                                        <Badge key={i} variant="outline" className="text-xs text-cyan-400 border-cyan-500/30">
                                          @{c.name}
                                        </Badge>
                                      ))}
                                      {part.output.discoveredUrls.collaborators.length > 5 && (
                                        <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-500/30">
                                          +{part.output.discoveredUrls.collaborators.length - 5} more
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {/* Similar creators */}
                                {part.output.discoveredUrls.similarCreators && part.output.discoveredUrls.similarCreators.length > 0 && (
                                  <div>
                                    <p className="text-xs text-cyan-400 font-medium mb-1">Similar Creators:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {part.output.discoveredUrls.similarCreators.slice(0, 5).map((c, i) => (
                                        <Badge key={i} variant="outline" className="text-xs text-cyan-400 border-cyan-500/30">
                                          {c.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* V2: Deep Research */}
                    {researchParts.map((part, idx) => (
                      <div key={`research-${idx}`} className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                        <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
                          <Search className="w-3 h-3" />
                          <span>Deep research with evidence extraction</span>
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
                            {part.output.evidenceSummary && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {part.output.evidenceSummary.hashtagCount} hashtags
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {part.output.evidenceSummary.collaboratorCount} collaborators
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {part.output.evidenceSummary.geographySignalCount} geo signals
                                </Badge>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* V2: Niche Classification */}
                    {nicheParts.map((part, idx) => (
                      <div key={`niche-${idx}`} className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                        <div className="flex items-center gap-2 text-xs text-purple-400 font-medium">
                          <Sparkles className="w-3 h-3" />
                          <span>Classifying niche & constraints</span>
                          {part.state !== "output-available" && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                        </div>
                        {part.state === "output-available" && part.output && (
                          <p className="mt-2 text-sm text-purple-400">{part.output.message}</p>
                        )}
                      </div>
                    ))}

                    {/* V2: Comparable Creators */}
                    {compareParts.map((part, idx) => (
                      <div key={`compare-${idx}`} className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3">
                        <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
                          <Users className="w-3 h-3" />
                          <span>Finding comparable creators</span>
                          {part.state !== "output-available" && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                        </div>
                        {part.state === "output-available" && part.output && (
                          <p className="mt-2 text-sm text-indigo-400">{part.output.message}</p>
                        )}
                      </div>
                    ))}

                    {/* V2: Evidence-Based Generation */}
                    {generateV2Parts.map((part, idx) => (
                      <div key={`generatev2-${idx}`} className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                        <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
                          <Users className="w-3 h-3" />
                          <span>Generating evidence-based ICPs</span>
                          {part.state !== "output-available" && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                        </div>
                        {part.state === "output-available" && part.output && (
                          <p className="mt-2 text-sm text-green-400">
                            Generated {part.output.segmentCount} segments (avg score: {part.output.averageConfidenceScore.toFixed(1)}/5)
                          </p>
                        )}
                      </div>
                    ))}

                    {/* V2: Validation */}
                    {validateParts.map((part, idx) => (
                      <div key={`validate-${idx}`} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                        <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                          <Filter className="w-3 h-3" />
                          <span>Validating against evidence</span>
                          {part.state !== "output-available" && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                        </div>
                        {part.state === "output-available" && part.output && (
                          <p className="mt-2 text-sm text-amber-400">{part.output.message}</p>
                        )}
                      </div>
                    ))}

                    {/* Legacy: Profile Lookup */}
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
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Legacy: Audience Analysis */}
                    {analyzeParts.map((part, idx) => (
                      <div key={`analyze-${idx}`} className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                        <div className="flex items-center gap-2 text-xs text-purple-400 font-medium">
                          <Sparkles className="w-3 h-3" />
                          <span>Analyzing audience</span>
                          {part.state !== "output-available" && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Legacy: ICP Generation */}
                    {generateParts.map((part, idx) => (
                      <div key={`generate-${idx}`} className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                        <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
                          <Users className="w-3 h-3" />
                          <span>Generating ICPs</span>
                          {part.state !== "output-available" && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </ConversationContent>
          </Conversation>
        )}

        {/* V2 Results */}
        {v2Results && !isLoading && (
          <div className="max-w-6xl mx-auto">
            {/* Summary Header */}
            <div className="mb-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {profileInfo && <PlatformIcon platform={profileInfo.platform as SocialPlatform} />}
                <h2 className="text-xl font-semibold">
                  {profileInfo ? `@${profileInfo.handle}` : "Profile Analysis"}
                </h2>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  Evidence-Based
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {profileInfo?.followerCount ? `${profileInfo.followerCount} followers • ` : ""}
                {v2Results.validCount} validated segments
                {v2Results.excludedCount > 0 && ` • ${v2Results.excludedCount} filtered out`}
              </p>
            </div>

            {/* ICP Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {v2Results.validSegments.map((segment, index) => (
                <EvidenceBasedICPCard key={index} segment={segment} />
              ))}
            </div>

            {/* Excluded Segments */}
            <ExcludedSegmentsSection segments={v2Results.excludedSegments} />
          </div>
        )}

        {/* Legacy Results */}
        {legacyResults && !v2Results && !isLoading && (
          <div className="max-w-6xl mx-auto">
            {/* Summary Header */}
            <div className="mb-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <PlatformIcon platform={legacyResults.platform as SocialPlatform} />
                <h2 className="text-xl font-semibold">{legacyResults.profileAnalyzed}</h2>
              </div>
              <p className="text-muted-foreground">
                {legacyResults.totalFollowers} followers • {legacyResults.icpSegments.length} audience segments identified
              </p>
            </div>

            {/* ICP Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {legacyResults.icpSegments.map((segment, index) => (
                <LegacyICPCard key={index} segment={segment} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
