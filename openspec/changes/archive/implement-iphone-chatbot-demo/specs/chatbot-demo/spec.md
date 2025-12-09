# Spec: Chatbot Demo

## ADDED Requirements

### Requirement: iPhone Frame Display
The demo page SHALL display a chatbot interface within an iPhone-sized frame.

#### Scenario: User visits demo page
- **Given** the user navigates to `/demo`
- **When** the page loads
- **Then** an iPhone-shaped frame (375x812px) is displayed centered on the page
- **And** the frame contains the chatbot interface
- **And** the frame has realistic device chrome (bezel, notch, home indicator)

### Requirement: Functional Chatbot
The chatbot within the frame SHALL support sending and receiving messages.

#### Scenario: User sends a message
- **Given** the user is on the demo page
- **When** the user types a message and submits
- **Then** the message appears in the conversation
- **And** a streaming response from the AI is displayed
- **And** the response renders with proper formatting

### Requirement: Model Selection
The chatbot SHALL allow switching between available models.

#### Scenario: User switches model
- **Given** the chatbot is displayed
- **When** the user selects a different model from the dropdown
- **Then** subsequent messages use the selected model

### Requirement: Visual Presentation
The demo page SHALL have appropriate styling for demonstration purposes.

#### Scenario: Page styling
- **Given** the demo page is loaded
- **Then** the background provides contrast to highlight the device frame
- **And** the iPhone frame has shadow/depth for realistic appearance
- **And** the layout is centered both vertically and horizontally
