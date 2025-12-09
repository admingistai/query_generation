# Proposal: Implement iPhone Chatbot Demo

## Summary
Create a chatbot demo page at `/demo` using AI SDK Elements components, displayed within an iPhone-sized frame for realistic mobile preview.

## Motivation
- Demonstrate AI SDK Elements chatbot capabilities in a visually appealing format
- Provide a realistic mobile preview for stakeholder demos
- Leverage existing AI Elements components already installed in the project

## Scope
- Wire up demo page to display `PhoneChatbot` component
- Add iPhone frame styling (375x812px - iPhone X/11/12/13/14 dimensions)
- Ensure chat API endpoint works correctly with streaming responses

## Out of Scope
- Additional chatbot features beyond current `PhoneChatbot` implementation
- Multiple device frame options
- Responsive frame sizing

## Dependencies
- AI SDK Elements (already installed at `src/components/ai-elements/`)
- `PhoneChatbot` component (already exists at `src/components/PhoneChatbot.tsx`)
- Chat API route (already exists at `src/app/api/chat/route.ts`)

## Risk Assessment
- **Low risk**: Minimal new code, primarily wiring existing components
- **API compatibility**: Web search tool syntax may need verification
