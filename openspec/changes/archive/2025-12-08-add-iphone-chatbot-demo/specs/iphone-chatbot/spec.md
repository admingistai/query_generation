# Spec: iPhone Chatbot Demo

## Overview
A fully functional AI chatbot rendered inside an iPhone mockup component, featuring streaming responses, reasoning visualization, web search with sources, and model selection.

## ADDED Requirements

### Requirement: iPhone Interactive Content Support
The iPhone component must support rendering interactive React children within the phone screen area.

#### Scenario: Render interactive children
- **Given** an iPhone component with children content
- **When** the component renders
- **Then** children appear within the phone screen boundaries
- **And** children receive pointer events (clickable/interactive)
- **And** backward compatibility with `src`/`videoSrc` props is maintained

### Requirement: Chat API Streaming Endpoint
A streaming chat API endpoint must handle conversation messages and return AI responses.

#### Scenario: Basic chat request
- **Given** a POST request to `/api/chat` with messages array
- **When** the request is processed
- **Then** a streaming response is returned
- **And** the response uses the specified model (default: gpt-4o)

#### Scenario: Web search enabled
- **Given** a POST request with `webSearch: true`
- **When** the request is processed
- **Then** the response includes source citations
- **And** sources contain URLs and titles

#### Scenario: Reasoning output
- **Given** a POST request to `/api/chat`
- **When** the AI generates a response
- **Then** reasoning steps are included in the stream
- **And** reasoning can be displayed progressively

### Requirement: Chatbot Conversation Display
The chatbot must display a scrollable conversation with user and assistant messages.

#### Scenario: Message rendering
- **Given** a conversation with multiple messages
- **When** the chatbot displays
- **Then** user messages appear right-aligned
- **And** assistant messages appear left-aligned
- **And** messages show in chronological order

#### Scenario: Auto-scroll behavior
- **Given** a new message is added
- **When** user is at bottom of conversation
- **Then** view scrolls to show new message
- **And** scroll button appears when not at bottom

### Requirement: Reasoning Visualization
The chatbot must display AI reasoning during response generation.

#### Scenario: Streaming reasoning display
- **Given** an AI response is streaming
- **When** reasoning content is received
- **Then** reasoning section expands automatically
- **And** reasoning text appears progressively
- **And** section collapses when streaming completes

### Requirement: Source Citations
The chatbot must display source citations when web search is enabled.

#### Scenario: Sources from web search
- **Given** web search is enabled
- **When** assistant responds with sources
- **Then** sources display below the message
- **And** each source shows title and URL
- **And** sources are clickable links

### Requirement: Model Selection
Users must be able to select which AI model to use.

#### Scenario: Switch models
- **Given** the model selector dropdown
- **When** user selects a different model
- **Then** subsequent messages use the selected model
- **And** model name is sent to API

### Requirement: Web Search Toggle
Users must be able to enable/disable web search mode.

#### Scenario: Toggle web search
- **Given** the web search toggle button
- **When** user enables web search
- **Then** subsequent requests include `webSearch: true`
- **And** toggle shows active state
- **When** user disables web search
- **Then** subsequent requests include `webSearch: false`

### Requirement: Message Actions
Users must be able to interact with messages via action buttons.

#### Scenario: Copy message
- **Given** an assistant message with actions
- **When** user clicks copy button
- **Then** message content is copied to clipboard
- **And** visual feedback confirms copy

#### Scenario: Retry message
- **Given** an assistant message with actions
- **When** user clicks retry button
- **Then** the message is regenerated
- **And** new response replaces previous

### Requirement: Prompt Input
Users must be able to compose and submit messages.

#### Scenario: Submit message
- **Given** text in the prompt input
- **When** user clicks submit or presses Enter
- **Then** message is sent to API
- **And** input is cleared
- **And** input is disabled during streaming

#### Scenario: Empty submission prevented
- **Given** empty prompt input
- **When** user attempts to submit
- **Then** submission is blocked
- **And** no API request is made

### Requirement: iPhone Viewport Fit
The chatbot UI must fit within the iPhone screen dimensions (~390x844px).

#### Scenario: Compact styling
- **Given** the chatbot renders inside iPhone
- **When** viewed at iPhone dimensions
- **Then** all UI elements are visible without horizontal scroll
- **And** text is readable (min 12px font)
- **And** touch targets are accessible (min 44px)

## MODIFIED Requirements

None.

## REMOVED Requirements

None.
