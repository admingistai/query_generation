"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useCallback, useMemo } from "react";
import { GlobeIcon, CopyIcon, RefreshCwIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from "@/components/ai-elements/sources";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputSelect,
  PromptInputSelectTrigger,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectValue,
} from "@/components/ai-elements/prompt-input";

const MODELS = [
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini" },
];

export function PhoneChatbot() {
  const [model, setModel] = useState("gpt-4o");
  const [webSearch, setWebSearch] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Memoize transport to recreate when model or webSearch changes
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          model,
          webSearch,
        },
      }),
    [model, webSearch]
  );

  const { messages, sendMessage, regenerate, status } = useChat({
    // AI SDK v5: use transport instead of api
    transport,
  });

  // AI SDK v5: use status instead of isLoading
  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = useCallback(
    async (message: { text: string }) => {
      if (!message.text.trim()) return;
      // AI SDK v5 uses sendMessage with { text: '...' } format
      await sendMessage({ text: message.text });
    },
    [sendMessage]
  );

  const handleCopy = useCallback(async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleRetry = useCallback(() => {
    // AI SDK v5 uses regenerate instead of reload
    regenerate();
  }, [regenerate]);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <PromptInputSelect value={model} onValueChange={setModel}>
          <PromptInputSelectTrigger className="h-8 w-auto gap-1 px-2 text-xs">
            <PromptInputSelectValue />
          </PromptInputSelectTrigger>
          <PromptInputSelectContent>
            {MODELS.map((m) => (
              <PromptInputSelectItem key={m.id} value={m.id} className="text-xs">
                {m.name}
              </PromptInputSelectItem>
            ))}
          </PromptInputSelectContent>
        </PromptInputSelect>

        <PromptInputButton
          className={cn(
            "h-8 w-8",
            webSearch && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => setWebSearch(!webSearch)}
          title={webSearch ? "Disable web search" : "Enable web search"}
        >
          <GlobeIcon className="size-4" />
        </PromptInputButton>
      </div>

      {/* Conversation */}
      <Conversation className="flex-1">
        <ConversationContent className="gap-4 p-3">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground text-sm">
              <p>Send a message to start chatting</p>
            </div>
          )}
          {messages.map((message) => {
            const isUser = message.role === "user";
            const isStreaming = isLoading && message.id === messages[messages.length - 1]?.id && !isUser;

            // Extract reasoning and sources from message parts (AI SDK v5 structure)
            const reasoningPart = message.parts?.find((p) => p.type === "reasoning");
            const sourceParts = message.parts?.filter((p) => p.type === "source-url") || [];
            const textContent = message.parts
              ?.filter((p) => p.type === "text")
              .map((p) => (p as { type: "text"; text: string }).text)
              .join("") || "";

            return (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {/* Reasoning - v5 uses part.text instead of part.reasoning */}
                  {reasoningPart && "text" in reasoningPart && (
                    <Reasoning isStreaming={isStreaming}>
                      <ReasoningTrigger className="text-xs" />
                      <ReasoningContent className="text-xs">
                        {(reasoningPart as { type: "reasoning"; text: string }).text}
                      </ReasoningContent>
                    </Reasoning>
                  )}

                  {/* Main content */}
                  <MessageResponse className="text-sm [&_p]:text-sm [&_li]:text-sm">
                    {textContent}
                  </MessageResponse>

                  {/* Sources */}
                  {sourceParts.length > 0 && (
                    <Sources className="mt-2">
                      <SourcesTrigger count={sourceParts.length} className="text-xs" />
                      <SourcesContent className="text-xs">
                        {sourceParts.map((source, idx) => {
                          if ("source" in source && source.source) {
                            const s = source.source as { url?: string; title?: string };
                            return (
                              <Source
                                key={idx}
                                href={s.url}
                                title={s.title || s.url}
                                className="text-xs"
                              />
                            );
                          }
                          return null;
                        })}
                      </SourcesContent>
                    </Sources>
                  )}
                </MessageContent>

                {/* Actions for assistant messages */}
                {!isUser && !isStreaming && (
                  <MessageActions className="mt-1">
                    <MessageAction
                      tooltip="Copy"
                      onClick={() => handleCopy(textContent, message.id)}
                      className="h-6 w-6"
                    >
                      {copiedId === message.id ? (
                        <CheckIcon className="size-3" />
                      ) : (
                        <CopyIcon className="size-3" />
                      )}
                    </MessageAction>
                    <MessageAction
                      tooltip="Retry"
                      onClick={handleRetry}
                      className="h-6 w-6"
                    >
                      <RefreshCwIcon className="size-3" />
                    </MessageAction>
                  </MessageActions>
                )}
              </Message>
            );
          })}
        </ConversationContent>
        <ConversationScrollButton className="bottom-2 h-8 w-8" />
      </Conversation>

      {/* Input */}
      <div className="border-t p-2">
        <PromptInput
          onSubmit={handleSubmit}
          className="rounded-lg border bg-muted/50"
        >
          <PromptInputTextarea
            placeholder="Message..."
            className="min-h-10 resize-none border-0 bg-transparent p-2 text-sm focus-visible:ring-0"
            disabled={isLoading}
          />
          <PromptInputFooter className="p-2 pt-0">
            <PromptInputTools />
            <PromptInputSubmit
              status={isLoading ? "streaming" : undefined}
              disabled={isLoading}
              className="h-8 w-8"
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
