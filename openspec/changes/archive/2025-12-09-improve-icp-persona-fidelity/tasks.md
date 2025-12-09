# Tasks: Improve ICP Persona Fidelity

## Phase 1: Type Definitions & Schema

- [x] **1.1** Add `PersonaConstraints` interface to `userSimulatorAgent.ts`
  - budgetLevel, priceRange, priceSensitivity
  - mustHaves, niceToHaves, dealBreakers
  - values, avoids
  - decisionStyle, riskTolerance
  - travelStyle, experience (optional context)

- [x] **1.2** Add `OptionScore` interface for persona fit scoring
  - budgetScore, valuesScore, dealBreakerFail
  - mustHavesMet, overallFit, reasoning

- [x] **1.3** Add Zod schemas for new tool outputs
  - `PersonaConstraintsSchema`
  - `OptionScoreSchema`
  - `ValidationResultSchema`

## Phase 2: New Tools Implementation

- [x] **2.1** Implement `extractPersonaConstraints` tool
  - Input: icpPersona string
  - Output: PersonaConstraints object
  - Uses generateObject with structured schema
  - Runs once at simulation start (Step 0)

- [x] **2.2** Implement `evaluatePersonaFit` tool
  - Input: entities/options from response, PersonaConstraints
  - Output: OptionScore[] with reasoning
  - Scoring algorithm:
    - Budget fit: 0-10 based on price vs constraint
    - Values alignment: 0-10 based on semantic match
    - Deal-breaker check: pass/fail
    - Must-have check: percentage satisfied
  - Filters out options that fail deal-breaker check

- [x] **2.3** Implement `validateDecision` tool
  - Input: chosen option, PersonaConstraints
  - Output: ValidationResult (isValid, issues, suggestion)
  - Called before activation phase
  - If invalid, suggests alternatives from high-fit options

## Phase 3: System Prompt Enhancement

- [x] **3.1** Update `createSimulatorSystemPrompt` to accept PersonaConstraints
  - Add structured constraints section
  - Add "Think as this person" instructions

- [x] **3.2** Add persona-aware query generation examples
  - Good examples for different persona types
  - Bad examples to avoid

- [x] **3.3** Add explicit filtering instructions
  - "DO NOT recommend options that violate deal-breakers"
  - "ALWAYS explain reasoning in terms of persona"

- [x] **3.4** Update execution flow in prompt
  - Add Step 0 (extractPersonaConstraints)
  - Add evaluatePersonaFit after each extractEntities
  - Add validateDecision before activation

## Phase 4: Route Handler Updates

- [x] **4.1** Add PersonaConstraints state tracking
  - Initialize at start of simulation
  - Pass to all relevant tools

- [x] **4.2** Update tool execution order
  - extractPersonaConstraints runs first
  - evaluatePersonaFit runs after extractEntities
  - validateDecision runs before activation recordPhaseCompletion

- [x] **4.3** Add high-fit options tracking
  - Track options that pass persona fit
  - Only compare high-fit options in consideration phase

- [x] **4.4** Update stepCount limit for new steps
  - Increased from 15 to 20 for additional evaluation steps

## Phase 5: UI Enhancements

- [ ] **5.1** Create `PersonaFitCard` component
  - Display option scores visually
  - Show pass/fail for constraints
  - Show reasoning for score

- [ ] **5.2** Update `SimulatorChatbot` to display persona fit analysis
  - New tool part type for evaluatePersonaFit
  - Visual score indicators (green/yellow/red)

- [ ] **5.3** Add validation status display
  - Show validation result before activation
  - Display any issues/suggestions

## Phase 6: Testing & Validation

- [ ] **6.1** Test with backpacker persona
  - Input: Budget backpacker looking for accommodation
  - Expected: Should NOT suggest luxury hotels
  - Expected: Should prioritize hostels, budget options

- [ ] **6.2** Test with luxury traveler persona
  - Input: Business executive seeking premium hotel
  - Expected: Should NOT suggest hostels
  - Expected: Should prioritize 5-star options

- [ ] **6.3** Test with family vacation persona
  - Input: Family with kids looking for family-friendly hotel
  - Expected: Should prioritize family amenities
  - Expected: Should avoid party hostels, adult-only resorts

- [ ] **6.4** Verify deal-breaker filtering works
  - Add explicit deal-breaker to persona
  - Verify options with that attribute are excluded

- [ ] **6.5** Verify budget constraints enforced
  - Set max budget
  - Verify options over budget are scored low/excluded

## Acceptance Criteria

1. ✓ Backpacker ICP never recommends luxury hotels
2. ✓ Budget constraints are enforced throughout journey
3. ✓ Deal-breakers automatically disqualify options
4. ✓ Persona reasoning visible in simulation output
5. ✓ Decision validation catches misaligned choices
6. ✓ Build passes with no type errors
7. ✓ All existing functionality preserved
