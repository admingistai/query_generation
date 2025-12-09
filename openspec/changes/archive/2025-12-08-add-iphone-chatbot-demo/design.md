# Design: iPhone Chatbot Demo

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  /demo page                                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │  iPhone Component (extended with children prop)   │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  PhoneChatbot (new component)               │  │  │
│  │  │  ├── Header (model selector, web toggle)    │  │  │
│  │  │  ├── Conversation (AI Elements)             │  │  │
│  │  │  │   ├── Message (with Reasoning, Sources)  │  │  │
│  │  │  │   └── MessageActions (copy, retry)       │  │  │
│  │  │  └── PromptInput (AI Elements)              │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
          │
          ▼ POST /api/chat
┌─────────────────────────────────────────────────────────┐
│  Chat API Route                                         │
│  ├── Model selection (gpt-4o / gpt-4o-mini)            │
│  ├── Web search mode (switches to perplexity/sonar)    │
│  ├── streamText() with reasoning + sources             │
│  └── Returns streaming response                         │
└─────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. iPhone Component Extension

**Decision**: Add `children` prop to iPhone component for interactive content.

**Rationale**: The current component only supports static `src` (image) or `videoSrc` (video). For interactive chatbot content, we need to render React children within the phone screen area.

**Implementation**:
```tsx
// Extended IphoneProps
interface IphoneProps extends HTMLAttributes<HTMLDivElement> {
  src?: string
  videoSrc?: string
  children?: ReactNode  // NEW: interactive content
}

// Render children in screen area (same positioning as image/video)
{children && (
  <div className="absolute z-10 overflow-hidden pointer-events-auto" style={{...screenStyles}}>
    {children}
  </div>
)}
```

### 2. AI Elements Integration

**Decision**: Use AI Elements components for chat UI, styled to fit iPhone viewport.

**Components to install**:
- `conversation` - message list with auto-scroll
- `message` - individual message display
- `reasoning` - streaming reasoning visualization
- `sources` - citation display
- `prompt-input` - text input with actions

**Styling approach**: Override default styles with compact variants suitable for ~390px width viewport.

### 3. Chat API Route

**Decision**: Create `/api/chat/route.ts` following AI SDK patterns.

**Features**:
- Accept `messages`, `model`, `webSearch` in request body
- Use `streamText()` from AI SDK
- Enable `sendReasoning: true` and `sendSources: true` for extended output
- Switch to Perplexity for web search (if API key available) or use OpenAI

**Request shape**:
```typescript
{
  messages: Message[]
  model: "gpt-4o" | "gpt-4o-mini"
  webSearch: boolean
}
```

### 4. State Management

**Decision**: Use `useChat` hook from `@ai-sdk/react` for chat state.

**Rationale**: Already installed, handles streaming, message history, and error states.

### 5. Web Search Fallback

**Decision**: If `PERPLEXITY_API_KEY` not available, disable web search toggle.

**Rationale**: Web search requires Perplexity's sonar model. Graceful degradation keeps demo functional without it.

## Component Structure

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # NEW: Chat streaming endpoint
│   └── demo/
│       └── page.tsx              # MODIFIED: iPhone + chatbot
├── components/
│   ├── ai-elements/              # NEW: Installed by ai-elements CLI
│   │   ├── conversation.tsx
│   │   ├── message.tsx
│   │   ├── reasoning.tsx
│   │   ├── sources.tsx
│   │   └── prompt-input.tsx
│   ├── ui/
│   │   └── iphone.tsx            # MODIFIED: Add children prop
│   └── PhoneChatbot.tsx          # NEW: Chatbot UI for iPhone
```

## Styling Considerations

- **Compact message bubbles**: Reduce padding for narrow viewport
- **Smaller fonts**: 14px base for messages, 12px for metadata
- **Touch-friendly inputs**: Maintain 44px min touch targets
- **Safe area insets**: Account for iPhone notch area in header
