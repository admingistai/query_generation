"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { Loader2, Search, CheckCircle2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { PhaseStatus } from "./PhaseIndicator";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

interface SimulatorChatbotProps {
  icpPersona: string;
  initialQuery: string;
  isRunning: boolean;
  onPhaseChange: (phase: string, status: PhaseStatus) => void;
  onComplete: () => void;
}

// AI SDK v5 tool part types
interface SendQueryPart {
  type: "tool-sendQuery";
  toolCallId: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  input?: { query: string; phase: string };
  output?: {
    query: string;
    phase: string;
    response: string;
    timestamp: string;
    citations?: Array<{ url: string; title: string }>;
  };
}

interface RecordPhaseCompletionPart {
  type: "tool-recordPhaseCompletion";
  toolCallId: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  input?: { phase: string; insightsGathered: string[] };
  output?: { phase: string; completed: boolean; insightsGathered: string[]; nextPhase: string; allPhasesComplete: boolean };
}

export function SimulatorChatbot({
  icpPersona,
  initialQuery,
  isRunning,
  onPhaseChange,
  onComplete,
}: SimulatorChatbotProps) {
  // Create transport for the simulate endpoint
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/simulate",
        body: {
          icpPersona,
          initialQuery,
        },
      }),
    [icpPersona, initialQuery]
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
  });

  // AI SDK v5: use status instead of isLoading
  const isLoading = status === "streaming" || status === "submitted";

  // Track simulation completion
  const [simulationComplete, setSimulationComplete] = useState(false);

  // Ref to prevent duplicate "Start" messages (React StrictMode protection)
  const hasStartedRef = useRef(false);

  // Start simulation when isRunning becomes true
  useEffect(() => {
    if (isRunning && messages.length === 0 && icpPersona && initialQuery && !hasStartedRef.current) {
      // Mark as started to prevent duplicate sends
      hasStartedRef.current = true;

      // Set discovery as active
      onPhaseChange("discovery", "active");
      setSimulationComplete(false);

      // Start the simulation with a simple trigger
      sendMessage({
        text: "Start",
      });
    }

    // Reset ref when not running (for restart capability)
    if (!isRunning) {
      hasStartedRef.current = false;
    }
  }, [isRunning, icpPersona, initialQuery, messages.length, sendMessage, onPhaseChange]);

  // Parse messages to detect phase completions from tool calls
  useEffect(() => {
    if (messages.length === 0) return;

    // Check all assistant messages for tool parts
    for (const message of messages) {
      if (message.role !== "assistant") continue;

      const parts = message.parts || [];
      for (const part of parts) {
        // AI SDK v5: tool parts are named tool-{toolName}
        if (part.type === "tool-sendQuery") {
          const toolPart = part as SendQueryPart;
          if (toolPart.state === "output-available" && toolPart.output?.phase) {
            onPhaseChange(toolPart.output.phase, "active");
          }
        }

        if (part.type === "tool-recordPhaseCompletion") {
          const toolPart = part as RecordPhaseCompletionPart;
          if (toolPart.state === "output-available" && toolPart.output) {
            if (toolPart.output.phase) {
              onPhaseChange(toolPart.output.phase, "completed");
            }
            if (toolPart.output.allPhasesComplete) {
              setSimulationComplete(true);
              onComplete();
            }
          }
        }
      }
    }
  }, [messages, onPhaseChange, onComplete]);

  // Reset messages when not running
  const handleReset = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">AI Search Simulation</span>
        </div>
        {isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Simulating...</span>
          </div>
        )}
      </div>

      {/* Conversation */}
      <Conversation className="flex-1">
        <ConversationContent className="gap-4 p-3">
          {messages.length === 0 && !isRunning && (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground text-sm">
              <p>Configure an ICP and query to start the simulation</p>
            </div>
          )}
          {messages.length === 0 && isRunning && (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p>Starting simulation...</p>
              </div>
            </div>
          )}
          {messages.map((message) => {
            const isUser = message.role === "user";

            // Skip rendering user trigger messages
            if (isUser) {
              return null;
            }

            const isStreaming =
              isLoading &&
              message.id === messages[messages.length - 1]?.id &&
              !isUser;

            // Extract different parts - AI SDK v5 uses tool-{toolName} format
            const parts = message.parts || [];
            const textParts = parts.filter((p) => p.type === "text");
            const sendQueryParts = parts.filter((p) => p.type === "tool-sendQuery") as SendQueryPart[];
            const phaseCompletionParts = parts.filter((p) => p.type === "tool-recordPhaseCompletion") as RecordPhaseCompletionPart[];

            const textContent = textParts
              .map((p) => (p as { type: "text"; text: string }).text)
              .join("");

            return (
              <div key={message.id} className="space-y-2">
                {/* Render sendQuery tool invocations */}
                {sendQueryParts.map((part, idx) => (
                  <div
                    key={`sendQuery-${idx}`}
                    className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
                      <Search className="w-3 h-3" />
                      <span className="uppercase">
                        {part.input?.phase || part.output?.phase || "Query"} Phase Query
                      </span>
                      {part.state === "input-streaming" && (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      )}
                    </div>
                    <div className="text-sm text-foreground font-medium">
                      {part.input?.query || part.output?.query}
                    </div>
                    {part.state === "output-available" && part.output?.response && (
                      <div className="mt-2 pt-2 border-t border-blue-500/20 text-sm text-foreground">
                        <span className="text-xs text-neutral-500 block mb-1">
                          AI Response:
                        </span>
                        {part.output.response}

                        {/* Render citations if available */}
                        {part.output.citations && part.output.citations.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-blue-500/10">
                            <span className="text-xs text-neutral-500 block mb-2">
                              Sources ({part.output.citations.length}):
                            </span>
                            <div className="flex flex-col gap-1">
                              {part.output.citations.map((citation, i) => (
                                <a
                                  key={i}
                                  href={citation.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 truncate"
                                >
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{citation.title}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Render recordPhaseCompletion tool invocations */}
                {phaseCompletionParts.map((part, idx) => (
                  <div
                    key={`phaseComplete-${idx}`}
                    className="rounded-lg border border-green-500/20 bg-green-500/5 p-3"
                  >
                    <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="uppercase">
                        {part.input?.phase || part.output?.phase || "Phase"} Complete
                      </span>
                    </div>
                    {part.state === "output-available" && part.output?.nextPhase && part.output.nextPhase !== "complete" && (
                      <div className="mt-1 text-xs text-neutral-400">
                        Moving to {part.output.nextPhase} phase...
                      </div>
                    )}
                    {part.state === "output-available" && part.output?.nextPhase === "complete" && (
                      <div className="mt-1 text-xs text-green-400">
                        Journey complete!
                      </div>
                    )}
                  </div>
                ))}

                {/* Render text content if any */}
                {textContent && (
                  <Message from={message.role}>
                    <MessageContent>
                      <MessageResponse
                        className={cn(
                          "text-sm",
                          isUser && "bg-primary/10 rounded-lg p-2"
                        )}
                      >
                        {textContent}
                      </MessageResponse>
                    </MessageContent>
                  </Message>
                )}
              </div>
            );
          })}
        </ConversationContent>
        <ConversationScrollButton className="bottom-2 h-8 w-8" />
      </Conversation>

      {/* Status Footer */}
      <div className="border-t p-3 text-center text-xs text-muted-foreground">
        {isLoading
          ? "Agent is conducting research..."
          : simulationComplete
          ? "Simulation complete"
          : messages.length > 0
          ? "Simulation in progress..."
          : "Ready to simulate"}
      </div>
    </div>
  );
}
