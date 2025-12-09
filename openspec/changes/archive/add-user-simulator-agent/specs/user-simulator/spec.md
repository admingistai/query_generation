# User Simulator Capability

## ADDED Requirements

### Requirement: Simulation Demo Page Layout
The application SHALL provide a split-panel simulation page at `/demo` that allows users to configure and run ICP persona simulations.

#### Scenario: Split-panel layout renders correctly
- **WHEN** a user navigates to `/demo`
- **THEN** the page SHALL display a left configuration panel (approximately 40% width)
- **AND** the page SHALL display a right simulation panel (approximately 60% width) with an IPhoneFrame
- **AND** both panels SHALL be visible without horizontal scrolling on desktop viewports

#### Scenario: Configuration panel displays input fields
- **WHEN** the configuration panel is rendered
- **THEN** it SHALL display a text area for ICP persona description
- **AND** it SHALL display an input field for the initial query
- **AND** it SHALL display a "Start Simulation" button
- **AND** it SHALL display journey phase indicators (Discovery, Consideration, Activation)

### Requirement: ICP Persona Configuration
The application SHALL allow users to define an ICP persona that the User Simulator Agent will adopt during the simulation.

#### Scenario: User enters ICP persona
- **WHEN** a user enters an ICP description in the text area
- **THEN** the system SHALL store the persona description for use in the simulation
- **AND** the simulation agent SHALL adopt this persona when started

#### Scenario: User enters initial query
- **WHEN** a user enters an initial query in the input field
- **THEN** the system SHALL use this query as the first Discovery phase query
- **AND** the chatbot SHALL display this query as the first user message

### Requirement: User Simulator Agent
The application SHALL provide an AI agent that simulates a user persona conducting research through a multi-phase customer journey.

#### Scenario: Agent initialization with persona
- **WHEN** the simulation is started
- **THEN** the User Simulator Agent SHALL be initialized with the provided ICP persona in its system prompt
- **AND** the agent SHALL maintain persona consistency throughout the conversation

#### Scenario: Agent progresses through Discovery phase
- **WHEN** the simulation begins
- **THEN** the agent SHALL generate informational, problem-focused queries
- **AND** the queries SHALL NOT mention specific brands initially
- **AND** the agent SHALL record phase completion when sufficient information is gathered

#### Scenario: Agent progresses through Consideration phase
- **WHEN** the Discovery phase is complete
- **THEN** the agent SHALL generate comparative, evaluative queries
- **AND** the queries SHALL focus on category-level comparisons and features
- **AND** the agent SHALL record phase completion when options are evaluated

#### Scenario: Agent progresses through Activation phase
- **WHEN** the Consideration phase is complete
- **THEN** the agent SHALL generate action-oriented, purchase-focused queries
- **AND** the queries MAY include specific brand or product names
- **AND** the agent SHALL record phase completion when purchase intent is expressed

### Requirement: Journey Phase Tracking
The application SHALL visually track and display the current journey phase during simulation.

#### Scenario: Phase indicators update during simulation
- **WHEN** a simulation is in progress
- **THEN** the current phase indicator SHALL be visually highlighted
- **AND** completed phases SHALL be marked as complete
- **AND** pending phases SHALL be visually distinguished from active/complete phases

#### Scenario: Simulation completes all phases
- **WHEN** the agent records completion of all three phases (Discovery, Consideration, Activation)
- **THEN** the simulation SHALL stop automatically
- **AND** all three phase indicators SHALL show as complete
- **AND** the user SHALL be able to start a new simulation

### Requirement: Simulation API Endpoint
The application SHALL provide an API endpoint for running User Simulator Agent sessions.

#### Scenario: POST /api/simulate with valid configuration
- **WHEN** a POST request is made to `/api/simulate` with ICP persona and initial query
- **THEN** the API SHALL initialize a User Simulator Agent with the provided persona
- **AND** the API SHALL stream agent responses back to the client
- **AND** the response SHALL include phase metadata for each turn

#### Scenario: Simulation handles API errors gracefully
- **WHEN** an error occurs during simulation (API timeout, model error)
- **THEN** the system SHALL display an appropriate error message
- **AND** the user SHALL be able to restart the simulation

### Requirement: Agent Tool Definitions
The User Simulator Agent SHALL use AI SDK v5 tools for structured query generation and phase tracking.

#### Scenario: sendQuery tool sends query to chat API
- **WHEN** the agent invokes the sendQuery tool
- **THEN** the tool SHALL forward the query to the chat completion API
- **AND** the tool SHALL return the AI response to the agent
- **AND** the query and response SHALL be displayed in the chatbot UI

#### Scenario: recordPhaseCompletion tool tracks journey progress
- **WHEN** the agent invokes the recordPhaseCompletion tool
- **THEN** the tool SHALL record the phase as complete
- **AND** the phase indicator in the UI SHALL update accordingly
- **AND** the agent stopWhen condition SHALL check for journey completion

### Requirement: Simulation Controls
The application SHALL provide controls to start, stop, and reset simulations.

#### Scenario: Start simulation
- **WHEN** the user clicks "Start Simulation" with valid ICP and query inputs
- **THEN** the simulation SHALL begin
- **AND** the Start button SHALL be disabled during simulation
- **AND** the chatbot SHALL display the initial query

#### Scenario: Reset simulation
- **WHEN** the user clicks "Reset" after a simulation
- **THEN** the conversation history SHALL be cleared
- **AND** all phase indicators SHALL reset to pending state
- **AND** the user SHALL be able to enter new configuration

### Requirement: Agent Stop Conditions
The User Simulator Agent SHALL stop execution under defined conditions.

#### Scenario: Agent stops when journey completes
- **WHEN** all three phases (Discovery, Consideration, Activation) are recorded as complete
- **THEN** the agent SHALL stop generating new queries
- **AND** the simulation SHALL end gracefully

#### Scenario: Agent stops at step limit
- **WHEN** the agent reaches 15 steps without completing the journey
- **THEN** the agent SHALL stop execution
- **AND** the user SHALL be notified that the step limit was reached
- **AND** partial phase completion SHALL be preserved
