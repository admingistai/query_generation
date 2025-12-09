# Tasks: Add User Simulator Agent

## 1. Core Agent Implementation
- [x] 1.1 Create `src/lib/agents/userSimulatorAgent.ts` with AI SDK v5 `streamText` + tools
- [x] 1.2 Implement `stopWhen: stepCountIs(15)` safety limit
- [x] 1.3 Implement `sendQuery` tool with Zod schema
- [x] 1.4 Implement `recordPhaseCompletion` tool with Zod schema
- [x] 1.5 Create dynamic system prompt with ICP persona injection
- [x] 1.6 Configure `onStepFinish` for phase tracking

## 2. API Route
- [x] 2.1 Create `src/app/api/simulate/route.ts` POST endpoint
- [x] 2.2 Accept ICP persona and initial query in request body
- [x] 2.3 Initialize UserSimulatorAgent with configuration
- [x] 2.4 Stream agent responses with `toUIMessageStreamResponse()`
- [x] 2.5 Handle errors and timeout gracefully (maxDuration: 120)

## 3. Frontend Components
- [x] 3.1 Create `src/components/SimulationPanel.tsx` configuration panel
  - [x] 3.1.1 ICP persona text area input
  - [x] 3.1.2 Initial query input field
  - [x] 3.1.3 Start Simulation button
  - [x] 3.1.4 Reset button
  - [x] 3.1.5 Journey phase indicators (Discovery, Consideration, Activation)
- [x] 3.2 Create `src/components/SimulatorChatbot.tsx` agent-powered chatbot
  - [x] 3.2.1 Integrate with `/api/simulate` endpoint
  - [x] 3.2.2 Display conversation messages with tool invocation UI
  - [x] 3.2.3 Show loading state during agent processing
  - [x] 3.2.4 Update phase indicators from tool results
- [x] 3.3 Create `src/components/PhaseIndicator.tsx` for journey progress display

## 4. Demo Page Transformation
- [x] 4.1 Redesign `src/app/demo/page.tsx` with split-panel layout
- [x] 4.2 Left panel: SimulationPanel component (40% width)
- [x] 4.3 Right panel: IPhoneFrame with SimulatorChatbot (60% width)
- [x] 4.4 Responsive design for different viewport sizes

## 5. State Management
- [x] 5.1 Implement simulation state (idle, running, completed, error)
- [x] 5.2 Track current journey phase
- [x] 5.3 Store conversation history via useChat
- [x] 5.4 Handle phase transitions from agent tool calls

## 6. Testing
- [ ] 6.1 Unit tests for UserSimulatorAgent tools
- [ ] 6.2 Integration tests for `/api/simulate` endpoint
- [ ] 6.3 Component tests for SimulationPanel
- [ ] 6.4 E2E test for complete simulation flow

## 7. Verification
- [x] 7.1 Verify page loads at http://localhost:3000/demo
- [x] 7.2 Verify split-panel layout renders correctly
- [ ] 7.3 Verify simulation starts with ICP and query inputs
- [ ] 7.4 Verify agent progresses through all 3 phases
- [ ] 7.5 Verify phase indicators update correctly
- [ ] 7.6 Verify simulation stops when journey completes
