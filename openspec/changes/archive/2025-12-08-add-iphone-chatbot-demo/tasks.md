# Tasks: Add iPhone Chatbot Demo

## Task List

### Phase 1: Dependencies & Setup

- [ ] **T1**: Install AI SDK Elements via CLI (`npx ai-elements@latest`)
  - Select: conversation, message, reasoning, sources, prompt-input
  - Verify components added to `@/components/ai-elements/`
  - **Validation**: Components exist and import without errors

- [ ] **T2**: Add Perplexity provider for web search (optional)
  - Install `@ai-sdk/openai` perplexity provider or use OpenRouter
  - Add `PERPLEXITY_API_KEY` to `.env.sample`
  - **Validation**: Provider initializes without error (or graceful skip)

### Phase 2: iPhone Component Extension

- [ ] **T3**: Extend iPhone component to accept `children` prop
  - Add `children?: ReactNode` to `IphoneProps`
  - Render children in screen area with `pointer-events-auto`
  - Maintain backward compatibility with `src`/`videoSrc`
  - **Validation**: Can render interactive button inside iPhone

### Phase 3: Chat API

- [ ] **T4**: Create `/api/chat/route.ts` streaming endpoint
  - Accept `messages`, `model`, `webSearch` in POST body
  - Use `streamText()` with `sendReasoning: true`
  - Return streaming response
  - **Validation**: cURL test returns streamed text

- [ ] **T5**: Add web search mode to chat API
  - Switch to Perplexity model when `webSearch: true`
  - Include `sendSources: true` for citations
  - Graceful fallback if Perplexity unavailable
  - **Validation**: Web search returns sources in response

### Phase 4: Chatbot UI Component

- [ ] **T6**: Create `PhoneChatbot` component shell
  - Layout: header, conversation area, input area
  - Use `useChat` hook from `@ai-sdk/react`
  - Wire to `/api/chat` endpoint
  - **Validation**: Can send message and receive response

- [ ] **T7**: Integrate AI Elements Conversation component
  - Wrap messages in `Conversation` / `ConversationContent`
  - Add `ConversationScrollButton` for auto-scroll
  - **Validation**: Messages display and auto-scroll works

- [ ] **T8**: Integrate AI Elements Message component
  - Render each message with `Message` / `MessageContent`
  - Add `MessageActions` for copy/retry
  - **Validation**: Can copy message, retry regenerates

- [ ] **T9**: Integrate Reasoning component
  - Display reasoning during streaming
  - Auto-expand while streaming, collapse after
  - **Validation**: Reasoning shows during stream

- [ ] **T10**: Integrate Sources component
  - Display citations when web search enabled
  - Link to source URLs
  - **Validation**: Sources appear with web search responses

- [ ] **T11**: Add header controls
  - Model selector dropdown (GPT-4o, GPT-4o-mini)
  - Web search toggle button
  - **Validation**: Switching model changes API behavior

- [ ] **T12**: Integrate PromptInput component
  - Text input with submit button
  - Disable during streaming
  - **Validation**: Can type and submit messages

### Phase 5: Integration & Polish

- [ ] **T13**: Integrate PhoneChatbot into iPhone on demo page
  - Pass `PhoneChatbot` as children to `Iphone`
  - Ensure proper sizing and scrolling
  - **Validation**: Full chatbot works inside iPhone frame

- [ ] **T14**: Apply compact styling for iPhone viewport
  - Reduce padding/margins for narrow screen
  - Adjust font sizes for readability
  - Ensure touch targets remain accessible
  - **Validation**: UI looks good at 390px width

- [ ] **T15**: Test end-to-end flow
  - Send message → receive streaming response
  - Toggle web search → receive sources
  - Switch models → verify different behavior
  - Copy message → clipboard works
  - **Validation**: All features work in iPhone mockup

## Dependencies

```
T1 ─┬─► T6 ─► T7 ─► T8 ─► T9 ─► T10 ─► T13
    │                                    │
T2 ─┴─► T4 ─► T5 ─────────────────────► T13
                                         │
T3 ─────────────────────────────────────► T13
                                         │
T11 ────────────────────────────────────► T13
T12 ────────────────────────────────────► T13
                                         │
                                         ▼
                                        T14 ─► T15
```

## Parallelizable Work

- **T1, T2, T3** can run in parallel (no dependencies)
- **T4** depends on T1/T2
- **T6-T12** are sequential (building on each other)
- **T14** depends on T13
- **T15** is final validation
