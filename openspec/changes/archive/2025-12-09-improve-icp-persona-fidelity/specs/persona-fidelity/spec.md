## ADDED Requirements

### Requirement: Persona Constraint Extraction

The system SHALL extract structured constraints from ICP persona descriptions at simulation start.

The extracted constraints SHALL include:
- budgetLevel: "ultra-budget" | "budget" | "mid-range" | "premium" | "luxury"
- priceRange: optional min/max with currency
- priceSensitivity: "very-high" | "high" | "medium" | "low"
- mustHaves: array of required features
- niceToHaves: array of preferred features
- dealBreakers: array of disqualifying attributes
- values: array of persona values
- avoids: array of things the persona avoids
- decisionStyle: "impulsive" | "research-heavy" | "balanced"

#### Scenario: Budget backpacker constraint extraction
- **GIVEN** an ICP persona: "A 22-year-old backpacker traveling through Southeast Asia on a tight budget of $30-50/day, staying in hostels, prioritizing authentic local experiences over tourist traps"
- **WHEN** the extractPersonaConstraints tool is called
- **THEN** budgetLevel is "budget"
- **AND** priceRange.max is approximately 50 USD
- **AND** dealBreakers includes "luxury", "expensive", "tourist trap"
- **AND** values includes "authentic", "local experience", "budget-friendly"

#### Scenario: Luxury traveler constraint extraction
- **GIVEN** an ICP persona: "A 45-year-old business executive seeking premium accommodations with excellent service, willing to pay for quality and convenience"
- **WHEN** the extractPersonaConstraints tool is called
- **THEN** budgetLevel is "luxury" or "premium"
- **AND** values includes "quality", "convenience", "service"
- **AND** mustHaves includes professional amenities

### Requirement: Persona Fit Scoring

The system SHALL score options from search responses against persona constraints.

Each option SHALL receive:
- budgetScore (0-10): How well the price fits the persona's budget
- valuesScore (0-10): How well the option aligns with persona values
- dealBreakerFail (boolean): Whether any deal-breakers are present
- mustHavesMet (percentage): How many must-haves are satisfied
- overallFit (number): Weighted composite score
- reasoning (string): Explanation of the score

Options with dealBreakerFail=true SHALL be automatically filtered from consideration.

#### Scenario: Luxury hotel fails backpacker fit check
- **GIVEN** persona constraints with budgetLevel="budget" and priceRange.max=50
- **WHEN** evaluatePersonaFit is called with option "The Embassy Hotel - $400/night, elegant buffet dinners"
- **THEN** budgetScore is 0 or near 0
- **AND** dealBreakerFail is true
- **AND** overallFit is less than 3.0
- **AND** reasoning explains the budget conflict

#### Scenario: Budget hostel passes backpacker fit check
- **GIVEN** persona constraints with budgetLevel="budget" and values=["authentic", "social"]
- **WHEN** evaluatePersonaFit is called with option "Lub D Hostel - $20/night, social common area, walking distance to local markets"
- **THEN** budgetScore is 8 or higher
- **AND** valuesScore is 7 or higher
- **AND** dealBreakerFail is false
- **AND** overallFit is greater than 7.0

### Requirement: Decision Validation Gate

The system SHALL validate the emerging choice against persona constraints before entering activation phase.

The validation SHALL return:
- isValid (boolean): Whether the choice aligns with persona
- issues (array): List of misalignment issues
- suggestion (string): Alternative options if invalid

If validation fails, the system SHALL NOT proceed to activation with the misaligned choice.

#### Scenario: Validation rejects misaligned choice
- **GIVEN** persona constraints with dealBreakers=["formal dress code", "expensive"]
- **AND** the emerging preference is "The Embassy Hotel"
- **WHEN** validateDecision is called
- **THEN** isValid is false
- **AND** issues includes budget and values conflicts
- **AND** suggestion includes alternative high-fit options

#### Scenario: Validation approves aligned choice
- **GIVEN** persona constraints with values=["budget-friendly", "social"]
- **AND** the emerging preference is "NapPark Hostel"
- **WHEN** validateDecision is called
- **THEN** isValid is true
- **AND** issues is empty

### Requirement: Persona-Aware Query Generation

The system SHALL generate queries that reflect the persona's perspective, language, and constraints.

Discovery queries SHALL:
- Use vocabulary appropriate to the persona
- NOT include terms that conflict with persona constraints
- Reflect the persona's experience level and travel style

Consideration queries SHALL:
- Compare ONLY options that passed persona fit scoring
- NOT include options that were filtered out
- Focus on criteria relevant to the persona

#### Scenario: Backpacker queries use appropriate language
- **GIVEN** persona is a budget backpacker
- **WHEN** generating discovery queries
- **THEN** queries use terms like "cheap", "budget", "hostel", "backpacker-friendly"
- **AND** queries do NOT use terms like "luxury", "5-star", "premium", "exclusive"

#### Scenario: Consideration queries compare persona-appropriate options only
- **GIVEN** persona is a budget backpacker
- **AND** discovery revealed options including "Lub D Hostel", "NapPark Hostel", and "The Embassy Hotel"
- **AND** evaluatePersonaFit filtered out "The Embassy Hotel"
- **WHEN** generating consideration queries
- **THEN** queries compare only "Lub D Hostel" and "NapPark Hostel"
- **AND** queries do NOT mention "The Embassy Hotel"

### Requirement: Persona Reasoning Display

The system SHALL display persona-based reasoning in the simulation UI.

The UI SHALL show:
- Visual score indicators for each option
- Pass/fail status for budget constraints
- Pass/fail status for deal-breakers
- Explanation of why options were included or filtered out

#### Scenario: UI shows persona fit analysis
- **GIVEN** evaluatePersonaFit has scored multiple options
- **WHEN** the simulation UI renders
- **THEN** each option displays its overallFit score
- **AND** filtered options are marked as "Not a fit" with reason
- **AND** high-fit options are visually highlighted

## MODIFIED Requirements

### Requirement: Updated Execution Flow

The simulation execution flow SHALL include persona constraint extraction and fit evaluation steps.

The new flow SHALL be:
1. extractPersonaConstraints (new Step 0)
2. sendQuery (discovery Q1)
3. extractEntities
4. evaluatePersonaFit (new)
5. sendQuery (discovery Q2)
6. extractEntities
7. evaluatePersonaFit (new)
8. recordPhaseCompletion (discovery)
9. sendQuery (consideration - HIGH-FIT options only)
10. extractEntities
11. evaluatePersonaFit (new)
12. sendQuery (consideration Q2)
13. validateDecision (new)
14. recordPhaseCompletion (consideration)
15. sendQuery (activation)
16. recordPhaseCompletion (activation)

#### Scenario: Full execution with persona fidelity
- **GIVEN** an ICP persona "budget backpacker" and initial query "where to stay in Bangkok"
- **WHEN** the simulation runs
- **THEN** extractPersonaConstraints runs first
- **AND** evaluatePersonaFit runs after each extractEntities
- **AND** validateDecision runs before recordPhaseCompletion(consideration)
- **AND** activation query names a validated high-fit option
