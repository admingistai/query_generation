# Spec: Chatbot Submit Fix

## MODIFIED Requirements

### Requirement: Form Submission
The chatbot form SHALL properly submit messages when the submit button is clicked.

#### Scenario: User submits a message
- **Given** the user has typed text in the message input
- **When** the user clicks the submit button
- **Then** the message is sent to the /api/chat endpoint
- **And** the user's message appears in the conversation
- **And** a streaming response from the AI is displayed
- **And** the input field is cleared after successful submission

### Requirement: State Management
The PhoneChatbot component SHALL NOT override PromptInput's internal form handling.

#### Scenario: PromptInput manages its own state
- **Given** the PhoneChatbot uses PromptInput component
- **When** rendering the PromptInputTextarea
- **Then** no external `value` or `onChange` props are passed
- **And** PromptInput manages text state internally via FormData
