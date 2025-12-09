# Chatbot Web Search Capability

## ADDED Requirements

### Requirement: Web Search Tool Integration
The chat API SHALL support web search capabilities when the `webSearch` flag is enabled in the request body, using the AI SDK v5 Responses API.

#### Scenario: Web search enabled
- **WHEN** a chat request is sent with `webSearch: true` in the body
- **THEN** the chat API SHALL use `openai.responses(model)` wrapper instead of `openai(model)`
- **AND** the chat API SHALL include `openai.tools.webSearchPreview({})` in the `streamText` call
- **AND** the model SHALL be able to browse the internet to answer questions about current events

#### Scenario: Web search disabled
- **WHEN** a chat request is sent with `webSearch: false` or omitted
- **THEN** the chat API SHALL use `openai(model)` without the responses wrapper
- **AND** the chat API SHALL NOT include any tools
- **AND** the model SHALL respond using only its training data

### Requirement: Web Search Toggle UI
The PhoneChatbot UI SHALL provide a toggle button to enable/disable web search functionality.

#### Scenario: Toggle state reflected in API calls
- **WHEN** the user clicks the web search toggle button
- **THEN** the toggle state SHALL be included in subsequent API requests via the `body` property of the chat transport
