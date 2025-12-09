# Change: Add User Simulator Agent Demo Page

## Why
Transform the `/demo` page into an interactive simulation platform where users can test AI-powered customer journey simulations. Currently, the demo page only shows a single chatbot. We need a way to simulate realistic user personas conducting multi-turn conversations through Discovery, Consideration, and Activation phases to understand how brands appear in AI search experiences.

## What Changes
- Transform `/demo` page from single chatbot view to split-panel simulation interface
- **Left panel**: Configuration inputs for ICP persona and initial query
- **Right panel**: iPhone-framed chatbot that acts as the specified ICP persona
- New User Simulator Agent using AI SDK v5 (`Experimental_Agent`, `stopWhen`, `prepareStep`, tools)
- Agent progresses through 3 journey phases: Discovery → Consideration → Activation
- API route `/api/simulate` to handle agent-based conversation simulation
- Conversation state tracking with phase indicators

## Impact
- Affected specs: New `user-simulator` capability
- Affected code:
  - `src/app/demo/page.tsx` - Complete redesign to split-panel layout
  - `src/components/SimulationPanel.tsx` - New configuration panel component
  - `src/components/SimulatorChatbot.tsx` - New agent-powered chatbot component
  - `src/app/api/simulate/route.ts` - New API route for simulation
  - `src/lib/agents/userSimulatorAgent.ts` - Agent implementation
