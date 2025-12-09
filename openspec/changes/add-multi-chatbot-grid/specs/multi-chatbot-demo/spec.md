# Multi-Chatbot Demo Capability

## ADDED Requirements

### Requirement: PhoneChatbotGrid Component
The application SHALL provide a reusable `PhoneChatbotGrid` React component that displays multiple PhoneChatbot instances in a grid layout.

#### Scenario: Grid component renders 8 chatbots
- **WHEN** the PhoneChatbotGrid component is rendered
- **THEN** it SHALL display 8 PhoneChatbot instances within IPhoneFrame wrappers
- **AND** the chatbots SHALL be arranged in a 4-column by 2-row grid

#### Scenario: All phones visible without scrolling
- **WHEN** the PhoneChatbotGrid component is displayed on a standard desktop viewport
- **THEN** all 8 phone instances SHALL be visible on screen
- **AND** no vertical scrolling SHALL be required to view all phones
- **AND** the phones SHALL be scaled appropriately to fit within the viewport height

### Requirement: Multi-Chatbot Demo Page
The application SHALL provide a demo page at `/demo2` that showcases the PhoneChatbotGrid component.

#### Scenario: Demo page displays grid component
- **WHEN** a user navigates to `/demo2`
- **THEN** the page SHALL render the PhoneChatbotGrid component
- **AND** all 8 chatbot instances SHALL be visible without scrolling

### Requirement: Independent Chatbot State
Each PhoneChatbot instance in the grid SHALL maintain independent conversation state.

#### Scenario: Independent conversations
- **WHEN** a user sends a message in one chatbot instance
- **THEN** only that chatbot SHALL display the message and response
- **AND** other chatbot instances SHALL NOT be affected
