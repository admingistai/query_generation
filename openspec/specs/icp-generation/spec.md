# icp-generation Specification

## Purpose
TBD - created by archiving change add-query-generation-pipeline. Update Purpose after archive.
## Requirements
### Requirement: ICP Generation from URL
The system SHALL generate exactly 5 Ideal Customer Profiles (ICPs) from a given brand URL.

Each ICP MUST be 1-2 polished sentences describing:
- Needs
- Motivations
- Lifestyle or usage context
- Behavioral drivers or challenges

The system SHALL focus on psychographics and behaviors, NOT generic demographic labels.

The system SHALL NOT generate ICPs that:
- Use generic audience labels ("millennials," "men 18-24")
- Use cultural abstraction without behavioral grounding
- Are not specific to the brand's actual products and positioning

#### Scenario: Valid URL produces 5 ICPs
- **GIVEN** a valid brand URL (e.g., "https://vans.com")
- **WHEN** the ICP generator is invoked
- **THEN** the system returns exactly 5 ICPs
- **AND** each ICP is 1-2 sentences
- **AND** each ICP describes needs, motivations, and behavioral context

#### Scenario: ICPs avoid demographic labels
- **GIVEN** a valid brand URL
- **WHEN** the ICP generator is invoked
- **THEN** no ICP contains generic demographic labels like "millennials", "Gen Z", or age ranges
- **AND** each ICP focuses on psychographic and behavioral characteristics

### Requirement: ICP Output Schema
The system SHALL return ICPs as a structured array validated by Zod schema.

#### Scenario: Schema validation passes
- **GIVEN** a successful ICP generation
- **WHEN** the output is validated
- **THEN** the output conforms to `z.object({ icps: z.array(z.string()).length(5) })`

