# Change: Add Web Search Tool to PhoneChatbot

## Why
The PhoneChatbot has a web search toggle button in the UI, but clicking it does nothing - the backend ignores the `webSearch` flag entirely. Users expect that enabling web search will allow the chatbot to look up current information from the internet.

## What Changes
- Modify `/api/chat` route to read `webSearch` flag from request body
- Use `openai.responses()` model wrapper when web search is enabled (required for web search tool)
- Add `openai.tools.webSearchPreview({})` tool when web search is enabled
- PhoneChatbot can now browse the internet for current information when toggle is enabled

## Impact
- Affected specs: chatbot-websearch (new capability)
- Affected code: `src/app/api/chat/route.ts`

## Technical Notes (validated via Context7 - AI SDK v5.0.0)

### Correct API Usage
```typescript
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// When webSearch is enabled, use responses model + webSearchPreview tool
const result = streamText({
  model: openai.responses(model),  // Required for web search
  messages: modelMessages,
  tools: {
    web_search_preview: openai.tools.webSearchPreview({}),
  },
});
```

### Key Requirements
1. **Model wrapper**: Must use `openai.responses('gpt-4o')` not `openai('gpt-4o')` for web search
2. **Tool name**: `webSearchPreview` (not `webSearch` - that's deprecated)
3. **Tool key**: Should be `web_search_preview` in the tools object
4. **Optional config**: Can add `searchContextSize: 'high'` for better results

### Frontend Integration
- Frontend already sends `webSearch` boolean in request body via `DefaultChatTransport`
- No frontend changes required - toggle already exists

### Note on Existing Code
The `analyze-brand` route uses the older `openai.tools.webSearch({})` API. This proposal uses the newer, documented `webSearchPreview` API per AI SDK v5 documentation.
