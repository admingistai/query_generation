# Proposal: Add iPhone Chatbot Demo

## Change ID
`add-iphone-chatbot-demo`

## Summary
Install AI SDK Elements and create a fully functional chatbot simulation rendered inside the iPhone mockup component on the `/demo` page. The chatbot will replicate the features from the AI SDK Elements chatbot example including web search, reasoning display, sources, and model selection.

## Motivation
Demonstrate AI chatbot capabilities in an engaging iPhone mockup format, showcasing the integration of AI SDK Elements with the existing Magic UI iPhone component.

## Scope

### In Scope
- Install AI SDK Elements library (`npx ai-elements@latest`)
- Extend iPhone component to support interactive children content
- Create chat API route with streaming responses and web search
- Implement full chatbot UI inside iPhone frame:
  - Conversation with auto-scroll
  - Message display with actions (copy, retry)
  - Reasoning visualization during streaming
  - Sources/citations from web search
  - Model selector (GPT-4o, etc.)
  - Web search toggle
  - Prompt input with submit
- Wire up to OpenAI API (existing `OPENAI_API_KEY`)

### Out of Scope
- File attachment uploads (can be added later)
- Multiple model providers beyond OpenAI
- Persistent chat history/database storage
- Authentication/user sessions

## Dependencies
- AI SDK Elements (`ai-elements`)
- Existing: `ai`, `@ai-sdk/openai`, `@ai-sdk/react`
- Perplexity API key for web search (or OpenAI web search plugin)

## Risks
- **iPhone viewport constraints**: Chat UI must fit within ~390x844px screen area; may require compact styling
- **Web search provider**: Perplexity requires separate API key; fallback to OpenAI-only if unavailable

## Related Specs
- None (new capability, isolated to demo page)
