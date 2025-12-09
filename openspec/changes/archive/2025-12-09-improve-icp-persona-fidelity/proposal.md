# Improve ICP Persona Fidelity in Conversation Simulator

## Problem Statement

The conversation simulator at `/demo` doesn't stay in character with the ICP persona when making decisions. The system:

1. **Ignores ICP constraints** - A backpacker ICP gets suggested "The Embassy hotel with elegant buffet dinners" even though that contradicts the persona's budget and travel style
2. **Makes lazy choices** - The LLM picks the "easiest answer" without considering what the ICP would actually want
3. **No persona-aware filtering** - Options from web search aren't evaluated against the ICP's values, budget, and preferences
4. **No decision validation** - The system doesn't verify that final choices align with the persona

## Root Cause Analysis

The current implementation mentions the ICP persona in the system prompt, but:
- There's no structured extraction of ICP constraints (budget, preferences, deal-breakers)
- The `extractEntities` tool only extracts facts from responses, not persona fit
- No scoring mechanism to evaluate options against ICP criteria
- No validation step before making final recommendations

## Proposed Solution

Add a **Persona Reasoning System** that:

1. **Parses ICP constraints at start** - Extract budget, preferences, deal-breakers, values
2. **Evaluates options through persona lens** - Score each option against ICP fit
3. **Validates decisions before activation** - Ensure final choice makes sense for persona
4. **Surfaces reasoning in UI** - Show why options were selected/rejected

## Changes Required

### New Tool: `evaluatePersonaFit`
Scores options from responses against extracted ICP constraints

### New Tool: `extractPersonaConstraints`
Runs once at start to parse ICP into structured constraints

### Enhanced System Prompt
Explicit instructions to think through the persona's perspective before each decision

### Updated Execution Flow
Add persona evaluation steps after each response

## Files Affected

| File | Change Type |
|------|-------------|
| `src/lib/agents/userSimulatorAgent.ts` | Major - Add persona constraint types, update system prompt |
| `src/app/api/simulate/route.ts` | Major - Add new tools, evaluation logic |
| `src/components/SimulatorChatbot.tsx` | Minor - Display persona reasoning |

## Success Criteria

- [ ] Backpacker ICP never suggests luxury hotels
- [ ] Budget-conscious personas filter out premium options
- [ ] Persona reasoning is visible in simulation output
- [ ] Decision validation catches misaligned choices
