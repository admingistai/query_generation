# Design: ICP Persona Fidelity System

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Simulation Start                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 0: extractPersonaConstraints(icpPersona)                  │
│  Parse ICP into structured constraints:                         │
│  - budgetLevel: "budget" | "mid-range" | "luxury"              │
│  - priceRange: { min, max }                                     │
│  - mustHaves: string[]                                          │
│  - dealBreakers: string[]                                       │
│  - values: string[]                                             │
│  - decisionStyle: "impulsive" | "research-heavy" | "balanced"  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Discovery Phase                                                │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ sendQuery → extractEntities → evaluatePersonaFit          ││
│  │                                     │                      ││
│  │                    ┌────────────────┴───────────────┐     ││
│  │                    │ Score each option:             │     ││
│  │                    │ - Budget fit (0-10)            │     ││
│  │                    │ - Values alignment (0-10)      │     ││
│  │                    │ - Deal-breaker check (pass/fail)│    ││
│  │                    │ - Must-have check (pass/fail)  │     ││
│  │                    │ = Overall fit score            │     ││
│  │                    └────────────────────────────────┘     ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Consideration Phase                                            │
│  - Compare only options that passed persona fit                │
│  - Reasoning includes "As a [persona], I would prefer X        │
│    because [persona-specific reason]"                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Pre-Activation Validation                                      │
│  validateDecision(chosenOption, personaConstraints)             │
│  - Verify budget alignment                                      │
│  - Check no deal-breakers present                              │
│  - Confirm values alignment                                     │
│  - If FAIL: re-evaluate alternatives                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Activation Phase                                               │
│  - Final decision with persona reasoning                        │
│  - "I chose X because as a backpacker, I value Y"              │
└─────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Structured Persona Constraints (not free-form)

**Why:** Free-form persona descriptions lead to inconsistent interpretation. Structured constraints enable deterministic evaluation.

```typescript
interface PersonaConstraints {
  // Budget
  budgetLevel: "ultra-budget" | "budget" | "mid-range" | "premium" | "luxury";
  priceRange?: { min?: number; max?: number; currency: string };
  priceSensitivity: "very-high" | "high" | "medium" | "low";

  // Preferences
  mustHaves: string[];      // e.g., ["wifi", "kitchen", "central location"]
  niceToHaves: string[];    // e.g., ["pool", "gym"]
  dealBreakers: string[];   // e.g., ["shared bathroom", "no AC"]

  // Values & Lifestyle
  values: string[];         // e.g., ["authenticity", "local experience", "adventure"]
  avoids: string[];         // e.g., ["touristy", "corporate", "chain restaurants"]

  // Decision Style
  decisionStyle: "impulsive" | "research-heavy" | "balanced";
  riskTolerance: "low" | "medium" | "high";

  // Context
  travelStyle?: string;     // e.g., "backpacker", "business", "family"
  experience?: string;      // e.g., "first-time", "experienced", "expert"
}
```

### 2. Persona Fit Scoring Algorithm

```typescript
interface OptionScore {
  option: string;
  budgetScore: number;       // 0-10, 0 = way over budget, 10 = perfect
  valuesScore: number;       // 0-10, alignment with persona values
  dealBreakerFail: boolean;  // true = automatic disqualification
  mustHavesMet: number;      // percentage of must-haves satisfied
  overallFit: number;        // weighted composite score
  reasoning: string;         // "This option scored low because..."
}

// Scoring weights
const WEIGHTS = {
  budget: 0.35,
  values: 0.25,
  mustHaves: 0.25,
  niceToHaves: 0.15,
};
```

### 3. Persona-Aware Query Generation

The system prompt will be enhanced to include:
- Explicit persona constraints in structured format
- "Think as this person" instructions before each query
- Examples of persona-appropriate vs inappropriate queries

```
Before generating a query, think:
1. What would [ICP] actually search for?
2. What language/terms would they use?
3. What options would they NOT consider?

Example for "budget backpacker":
✅ "cheap hostels in Bangkok with good reviews"
❌ "best luxury hotels in Bangkok"
```

### 4. Decision Validation Gate

Before entering activation phase, validate the emerging preference:

```typescript
interface ValidationResult {
  isValid: boolean;
  issues: string[];
  suggestion?: string;
}

// Example validation failure:
{
  isValid: false,
  issues: [
    "The Embassy Hotel ($400/night) exceeds budget constraint ($50/night)",
    "'Elegant buffet dinners' conflicts with value 'authentic local experience'"
  ],
  suggestion: "Consider re-evaluating: Lub D Hostel, NapPark Hostel"
}
```

## Updated Execution Flow

```
STEP 0:  extractPersonaConstraints(icpPersona) → PersonaConstraints
STEP 1:  sendQuery(discovery Q1)
STEP 2:  extractEntities(response)
STEP 3:  evaluatePersonaFit(entities, constraints) → scored options
STEP 4:  sendQuery(discovery Q2 - informed by fit scores)
STEP 5:  extractEntities + evaluatePersonaFit
STEP 6:  recordPhaseCompletion(discovery)
STEP 7:  sendQuery(consideration - compare HIGH-FIT options only)
STEP 8:  extractEntities + evaluatePersonaFit
STEP 9:  sendQuery(consideration Q2)
STEP 10: validateDecision(emergingChoice, constraints)
STEP 11: recordPhaseCompletion(consideration)
STEP 12: sendQuery(activation - with validated choice)
STEP 13: recordPhaseCompletion(activation)
```

## UI Enhancements

Display persona reasoning in simulation output:

```
┌─────────────────────────────────────────────────────┐
│ 📊 Persona Fit Analysis                            │
├─────────────────────────────────────────────────────┤
│ ✅ Lub D Hostel (Score: 8.5/10)                    │
│    Budget: ✓ $25/night fits $50 max               │
│    Values: ✓ "Social atmosphere" matches          │
│    Must-haves: ✓ WiFi, kitchen, lockers           │
│                                                     │
│ ❌ The Embassy Hotel (Score: 2.1/10)               │
│    Budget: ✗ $400/night exceeds $50 max           │
│    Values: ✗ "Elegant" conflicts with backpacker  │
│    Deal-breaker: ✗ "Formal dress code"            │
└─────────────────────────────────────────────────────┘
```

## Error Handling

- If no options pass persona fit → broaden search criteria
- If constraints conflict → surface to user, ask for clarification
- If validation fails → backtrack to consideration phase with reasoning
