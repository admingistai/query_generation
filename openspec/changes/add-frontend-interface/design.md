# Design: Frontend Interface

## Context
The backend pipeline is complete and functional via CLI. We need a web interface to:
1. Edit and experiment with system prompts in real-time
2. Run the pipeline on one or more URLs
3. See streaming results as they generate
4. Export results for use

**Stakeholders**: Developers iterating on prompts, marketing teams testing queries

## Goals / Non-Goals

**Goals:**
- Single-page interface for prompt editing and pipeline execution
- Real-time streaming of generation results using AI SDK
- Editable system prompts for all 3 generators (topic, ICP, query)
- Support single URL or list of URLs
- Clean, polished UI using **shadcn/ui** components

**Non-Goals:**
- User authentication (local development tool)
- Persistent storage of prompts or results (use localStorage if needed)
- Multi-user collaboration
- Production deployment considerations

## Decisions

### Decision 1: Next.js App Router with Bun
**Rationale**:
- Next.js App Router is the modern standard for React applications
- Bun works as Next.js runtime (faster than Node)
- API routes handle streaming responses server-side
- React Server Components for initial page load

```bash
bunx create-next-app@latest . --typescript --tailwind --app --src-dir
```

### Decision 2: Use `streamObject` for Structured Streaming
**Rationale**: Unlike chat interfaces that use `useChat`, we need structured output (arrays, objects). The AI SDK's `streamObject` with `partialObjectStream` provides:
- Real-time updates as structured data generates
- Type-safe partial objects during streaming
- Works with our existing Zod schemas

**Pattern:**
```typescript
// API Route (server)
const result = streamObject({
  model: openai('gpt-4o'),
  schema: TopicsSchema,
  system: customSystemPrompt,  // User-editable
  prompt: `Based on this brand analysis:\n${brandAnalysis}`,
});
return result.toTextStreamResponse();

// Client Component
const { object, isLoading } = useObject({
  api: '/api/generate-topics',
  schema: TopicsSchema,
});
```

### Decision 3: Modify Generators to Accept Custom Prompts
**Rationale**: Current generators use hardcoded system prompts. We need to:
1. Keep default prompts as fallbacks
2. Accept optional custom prompts as parameters
3. Pass custom prompts from frontend to API routes

```typescript
// Before
export async function generateTopics(brandAnalysis: string): Promise<string[]>

// After
export async function generateTopics(
  brandAnalysis: string,
  customSystemPrompt?: string
): Promise<string[]>
```

### Decision 4: shadcn/ui Component Library
**Rationale**: shadcn/ui provides accessible, customizable components that we can copy into our project:
- Built on Radix UI primitives (accessible by default)
- Tailwind CSS styling (consistent with our stack)
- Copy/paste model (own the code, easy to customize)
- Components we'll use: ResizablePanelGroup, Tabs, Collapsible, Card, Button, Textarea, Progress, Badge, Table

**Installation:**
```bash
npx shadcn@latest init
npx shadcn@latest add button card tabs collapsible textarea progress badge table resizable
```

### Decision 5: Resizable Two-Panel Layout
**Rationale**: Use shadcn's `ResizablePanelGroup` for a flexible layout:
- Left panel: Prompt editors (collapsible sections for Topic/ICP/Query)
- Right panel: URL input + Results display
- Resizable handle allows users to adjust panel sizes

### Decision 6: Streaming Architecture
**Rationale**: The pipeline has multiple stages. We'll stream each stage separately:

```
[URL Input] → [Run]
     │
     ▼
[Stage 1: Brand Analysis] ──streaming──► [Analysis Preview]
     │
     ▼
[Stage 2: Topics] ──streaming──► [Topics List]
     │
     ▼
[Stage 3: ICPs] ──streaming──► [ICPs List]
     │
     ▼
[Stage 4: Queries] ──streaming──► [Pairings Table]
```

Each stage shows a loading indicator, then streams results as they arrive.

## Architecture

```
app/
├── page.tsx                    # Main single-page interface
├── components/
│   ├── ui/                     # shadcn/ui components (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── tabs.tsx
│   │   ├── collapsible.tsx
│   │   ├── textarea.tsx
│   │   ├── progress.tsx
│   │   ├── badge.tsx
│   │   ├── table.tsx
│   │   └── resizable.tsx
│   ├── PromptEditor.tsx        # Collapsible + Textarea + Reset Button
│   ├── UrlInput.tsx            # Card + Input + Button (add/remove URLs)
│   ├── ResultsPanel.tsx        # Card with streaming results
│   ├── TopicsList.tsx          # Badge list for topics
│   ├── IcpsList.tsx            # Card list for ICPs
│   └── PairingsTable.tsx       # Table for (topic, icp) → queries
├── api/
│   ├── analyze-brand/
│   │   └── route.ts            # Web search + stream brand analysis
│   ├── generate-topics/
│   │   └── route.ts            # Stream topics with custom prompt
│   ├── generate-icps/
│   │   └── route.ts            # Stream ICPs with custom prompt
│   └── generate-queries/
│       └── route.ts            # Stream queries with custom prompt
├── lib/
│   ├── generators/             # Modified generators (accept custom prompts)
│   ├── schemas/                # Zod schemas (unchanged)
│   ├── prompts/                # Default prompts (unchanged, used as fallbacks)
│   └── utils.ts                # cn() utility for shadcn
└── globals.css                 # Tailwind + shadcn CSS variables
```

## shadcn/ui Component Mapping

| UI Element | shadcn Component | Usage |
|------------|------------------|-------|
| Two-panel layout | `ResizablePanelGroup` | Left (prompts) / Right (pipeline) |
| Prompt sections | `Collapsible` | Expand/collapse each prompt editor |
| Prompt text | `Textarea` | Editable multiline input |
| URL input area | `Card` | Container with header and content |
| Action buttons | `Button` | Run, Reset, Export, Add URL |
| Progress display | `Progress` | Show generation progress |
| Topics display | `Badge` | Compact topic pills |
| ICPs display | `Card` | Individual ICP cards |
| Query results | `Table` | (topic, icp) → queries table |
| Stage tabs | `Tabs` | Switch between stages (optional) |

## UI Layout (with shadcn components)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Query Generation Pipeline                                              │
├─────────────────────────────────┬───────────────────────────────────────┤
│  <ResizablePanelGroup>          │                                       │
│  ┌─────────────────────────────┐│┌─────────────────────────────────────┐│
│  │ <ResizablePanel> (30%)      │││ <ResizablePanel> (70%)              ││
│  │                             │││                                     ││
│  │ <Card>                      │││ <Card> URL Input                    ││
│  │   <CardHeader>Prompts       │││   <Input placeholder="https://..." ││
│  │   <CardContent>             │││   <Button>+ Add URL</Button>        ││
│  │                             │││   <Button>Run Pipeline ▶</Button>   ││
│  │   <Collapsible defaultOpen> │││ </Card>                             ││
│  │     Topic Prompt ▼          │││                                     ││
│  │     <Textarea rows={10} />  │││ <Card> Results                      ││
│  │     <Button>Reset</Button>  │││   <Progress value={progress} />     ││
│  │   </Collapsible>            │││                                     ││
│  │                             │││   <div> Topics                      ││
│  │   <Collapsible>             │││     {topics.map(t =>                ││
│  │     ICP Prompt ▶            │││       <Badge>{t}</Badge>            ││
│  │   </Collapsible>            │││     )}                              ││
│  │                             │││   </div>                            ││
│  │   <Collapsible>             │││                                     ││
│  │     Query Prompt ▶          │││   <div> ICPs                        ││
│  │   </Collapsible>            │││     {icps.map(i =>                  ││
│  │                             │││       <Card>{i}</Card>              ││
│  │   </CardContent>            │││     )}                              ││
│  │ </Card>                     │││   </div>                            ││
│  │                             │││                                     ││
│  └─────────────────────────────┘││   <Table> Pairings                  ││
│                                 ││     <TableHeader>                   ││
│  <ResizableHandle withHandle /> ││       Topic | ICP | Discovery |...  ││
│                                 ││     <TableBody>                     ││
│                                 ││       {pairings.map(...)}           ││
│                                 ││   </Table>                          ││
│                                 ││                                     ││
│                                 ││   <Button>Export JSON</Button>      ││
│                                 │└─────────────────────────────────────┘│
│  </ResizablePanelGroup>         │                                       │
└─────────────────────────────────┴───────────────────────────────────────┘
```

### Component Composition Example

```tsx
// PromptEditor.tsx - uses Collapsible, Textarea, Button
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

interface PromptEditorProps {
  title: string
  value: string
  defaultValue: string
  onChange: (value: string) => void
  defaultOpen?: boolean
}

export function PromptEditor({ title, value, defaultValue, onChange, defaultOpen }: PromptEditorProps) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between">
          {title}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 p-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={12}
          className="font-mono text-sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(defaultValue)}
          disabled={value === defaultValue}
        >
          Reset to Default
        </Button>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

## Data Flow

```typescript
// 1. User edits prompts and enters URL(s)
const [topicPrompt, setTopicPrompt] = useState(TOPIC_GENERATOR_SYSTEM_PROMPT);
const [icpPrompt, setIcpPrompt] = useState(ICP_GENERATOR_SYSTEM_PROMPT);
const [queryPrompt, setQueryPrompt] = useState(QUERY_GENERATOR_SYSTEM_PROMPT);
const [urls, setUrls] = useState<string[]>([]);

// 2. User clicks Run → sequential API calls with streaming
async function runPipeline() {
  for (const url of urls) {
    // Stage 1: Analyze brand
    const analysis = await fetchStream('/api/analyze-brand', { url });

    // Stage 2 & 3: Generate topics and ICPs (can parallelize)
    const [topics, icps] = await Promise.all([
      fetchStream('/api/generate-topics', { analysis, systemPrompt: topicPrompt }),
      fetchStream('/api/generate-icps', { analysis, systemPrompt: icpPrompt }),
    ]);

    // Stage 4: Generate queries for each pairing
    for (const topic of topics) {
      for (const icp of icps) {
        await fetchStream('/api/generate-queries', {
          topic, icp, systemPrompt: queryPrompt
        });
      }
    }
  }
}
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 25+ API calls per URL may be slow | Show progress indicator, allow cancellation |
| Custom prompts may break output format | Validate against Zod schema, show errors |
| Large result sets hard to display | Paginate or virtualize pairings table |
| State management complexity | Use React useState, avoid external state libs |

## Open Questions

1. **Persist prompts?** Should we save custom prompts to localStorage between sessions?
2. **Batch URLs?** Process URLs sequentially or in parallel?
3. **Export format?** JSON only, or also CSV for spreadsheet use?
