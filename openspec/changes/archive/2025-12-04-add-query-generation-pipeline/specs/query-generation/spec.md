## ADDED Requirements

### Requirement: Journey Stage Query Generation
The system SHALL generate exactly 3 queries for a given (ICP, Topic) pairing, one for each customer journey stage: Discovery, Consideration, and Activation.

#### Scenario: Discovery query characteristics
- **GIVEN** an ICP and Topic pairing
- **WHEN** the query generator is invoked
- **THEN** the Discovery query is informational and open-ended
- **AND** the query is not brand-specific
- **AND** the query is framed around the ICP's situation or need
- **AND** the query reflects early-stage problem exploration

#### Scenario: Consideration query characteristics
- **GIVEN** an ICP and Topic pairing
- **WHEN** the query generator is invoked
- **THEN** the Consideration query is comparative and evaluative
- **AND** the query is category-level (not brand-specific)
- **AND** the query reflects ICP-specific needs and feature comparison

#### Scenario: Activation query characteristics
- **GIVEN** an ICP and Topic pairing
- **WHEN** the query generator is invoked
- **THEN** the Activation query is action-oriented and shopping-focused
- **AND** the query may include the brand if natural
- **AND** the query is immediately convertible (seeking availability, prices, retailers)

### Requirement: Query Output Schema
The system SHALL return queries as a structured object with three string fields validated by Zod schema.

#### Scenario: Schema validation passes
- **GIVEN** a successful query generation
- **WHEN** the output is validated
- **THEN** the output conforms to:
```typescript
z.object({
  discovery: z.string(),
  consideration: z.string(),
  activation: z.string()
})
```

### Requirement: Query Realism
Each generated query MUST be realistic, natural, and searchable as a real user would type into ChatGPT, Claude, Perplexity, or Gemini.

#### Scenario: Queries are natural language
- **GIVEN** an ICP and Topic pairing
- **WHEN** the query generator is invoked
- **THEN** each query reads as natural language a real person would use
- **AND** each query is appropriate for AI search interfaces
