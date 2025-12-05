# Change: Add Frontend Interface

## Why
The CLI-based pipeline works but lacks the ability to experiment with and tweak system prompts in real-time. A web interface enables rapid iteration on prompts, visual feedback during generation, and a better developer experience for testing different prompt configurations.

## What Changes
- **REPLACE** CLI entry point with Next.js App Router application
- **NEW** Frontend interface with editable system prompts for Topic, ICP, and Query generators
- **NEW** URL input (single or list) with run controls
- **NEW** Real-time streaming output using AI SDK's `streamObject`
- **NEW** Results display showing topics, ICPs, and (topic, icp) → query pairings
- **MODIFY** Generator functions to accept custom system prompts as parameters

## Impact
- Affected specs: `frontend-interface` (new), `topic-generation`, `icp-generation`, `query-generation` (modified to accept custom prompts)
- Affected code: Convert project to Next.js, modify `src/generators/` to accept prompt parameters
- Dependencies: Add `next`, `react`, `react-dom`, `@ai-sdk/react`, `tailwindcss`
