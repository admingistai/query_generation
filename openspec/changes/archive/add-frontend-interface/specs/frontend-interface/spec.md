## ADDED Requirements

### Requirement: Editable System Prompts
The system SHALL provide editable text areas for each of the three system prompts (Topic, ICP, Query).

Each prompt editor MUST:
- Display the default system prompt on initial load
- Allow the user to modify the prompt text
- Provide a "Reset to Default" option

#### Scenario: User edits topic prompt
- **GIVEN** the frontend interface is loaded
- **WHEN** the user modifies the topic generator prompt text
- **THEN** the modified prompt is used for subsequent topic generation calls
- **AND** the original default prompt remains available via reset

#### Scenario: User resets prompt to default
- **GIVEN** a user has modified a system prompt
- **WHEN** the user clicks "Reset to Default"
- **THEN** the prompt text reverts to the original default value

### Requirement: URL Input
The system SHALL accept one or more brand URLs as input.

#### Scenario: Single URL input
- **GIVEN** the frontend interface is loaded
- **WHEN** the user enters a single URL and clicks Run
- **THEN** the pipeline executes for that URL

#### Scenario: Multiple URL input
- **GIVEN** the frontend interface is loaded
- **WHEN** the user enters multiple URLs (one per line or via add button)
- **THEN** the pipeline executes for each URL sequentially

### Requirement: Streaming Results Display
The system SHALL display generation results in real-time as they stream from the API.

#### Scenario: Topics stream in real-time
- **GIVEN** the pipeline is running
- **WHEN** topics are being generated
- **THEN** each topic appears in the UI as soon as it is generated
- **AND** a progress indicator shows generation status

#### Scenario: Query pairings stream in real-time
- **GIVEN** topics and ICPs have been generated
- **WHEN** queries are being generated for each (topic, icp) pairing
- **THEN** each pairing's queries appear in the UI as they complete
- **AND** progress shows X/25 pairings completed

### Requirement: Pipeline Execution Control
The system SHALL provide controls to run and monitor the pipeline.

#### Scenario: Run pipeline
- **GIVEN** at least one URL is entered
- **WHEN** the user clicks the Run button
- **THEN** the pipeline executes with current prompts and URL(s)
- **AND** the Run button is disabled during execution

#### Scenario: Pipeline progress indication
- **GIVEN** the pipeline is running
- **WHEN** each stage completes
- **THEN** the UI shows which stage is active (Brand Analysis → Topics → ICPs → Queries)

### Requirement: Results Export
The system SHALL allow exporting results in JSON format.

#### Scenario: Export results as JSON
- **GIVEN** a pipeline run has completed
- **WHEN** the user clicks Export JSON
- **THEN** the complete results are downloaded as a JSON file
