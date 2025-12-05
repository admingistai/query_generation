## ADDED Requirements

### Requirement: Topic Generation from URL
The system SHALL generate exactly 5 search-intent topics from a given brand URL.

Each topic MUST be 2-4 words and reflect one of:
- Product-use intents (e.g., skateboarding, daily wear)
- Category-level searches (e.g., slip-on sneakers, canvas shoes)
- Style or identity-driven motives (e.g., retro streetwear footwear)
- Practical needs or problems (e.g., durable skate shoes)

The system SHALL NOT generate topics that:
- Use brand slogans
- Invent heritage, product lines, or internal initiatives
- Use vague cultural abstractions (e.g., "creative expression")
- Are not grounded in real product demand

#### Scenario: Valid URL produces 5 topics
- **GIVEN** a valid brand URL (e.g., "https://vans.com")
- **WHEN** the topic generator is invoked
- **THEN** the system returns exactly 5 topics
- **AND** each topic is 2-4 words
- **AND** each topic represents a realistic search intent

#### Scenario: Topics are unique
- **GIVEN** a valid brand URL
- **WHEN** the topic generator is invoked
- **THEN** all 5 returned topics are distinct from each other

### Requirement: Topic Output Schema
The system SHALL return topics as a structured array validated by Zod schema.

#### Scenario: Schema validation passes
- **GIVEN** a successful topic generation
- **WHEN** the output is validated
- **THEN** the output conforms to `z.object({ topics: z.array(z.string()).length(5) })`
