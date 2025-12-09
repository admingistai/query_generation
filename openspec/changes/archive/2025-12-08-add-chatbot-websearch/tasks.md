# Tasks: Add Web Search Tool to PhoneChatbot

## 1. Implementation
- [x] 1.1 Extract `webSearch` boolean from request body in `/api/chat` route
- [x] 1.2 Add conditional `tools` configuration with `openai.tools.webSearchPreview({})` when enabled
- [x] 1.3 Use `openai.responses(model)` wrapper when web search is enabled (per AI SDK v5 docs)

## 2. Testing
- [x] 2.1 Add integration test for chat with web search enabled
- [x] 2.2 Add integration test for chat with web search disabled
- [x] 2.3 Verify all 8 tests pass (6 existing + 2 new)

## 3. Verification
- [ ] 3.1 Test chatbot can answer questions about current events when web search is on (manual)
- [ ] 3.2 Verify chatbot works normally when web search is off (manual)
