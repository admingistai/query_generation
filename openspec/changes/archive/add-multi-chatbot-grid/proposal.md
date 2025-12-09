# Change: Add Multi-Chatbot Grid Demo Page

## Why
Users need a demo page that showcases multiple AI chat simulations running simultaneously in a grid layout. This provides a visual demonstration of the chatbot component's scalability and allows for parallel testing of different conversations.

## What Changes
- Create new reusable `PhoneChatbotGrid` React component
- Create new Next.js page at `/demo2` that uses the grid component
- Display 8 PhoneChatbot instances in a 4x2 grid
- Scale phones to fit all 8 on screen without scrolling
- Each chatbot operates independently with its own conversation state

## Impact
- Affected specs: multi-chatbot-demo (new capability)
- Affected code:
  - `src/components/PhoneChatbotGrid.tsx` (new component)
  - `src/app/demo2/page.tsx` (new page)
- No changes to existing components - purely additive

## Technical Notes
- **Grid Component**: `PhoneChatbotGrid` is a standalone React component that renders 8 phones in a 4x2 layout
- **No-Scroll Requirement**: All 8 phones must be visible on screen without vertical scrolling
  - Use `h-screen` to constrain to viewport height
  - Scale phones using CSS `transform: scale()` or container sizing to fit
  - Calculate appropriate scale factor based on viewport dimensions
- **Layout**: Fixed 4 columns x 2 rows grid
- **State Isolation**: Each PhoneChatbot instance has independent conversation state via React's component isolation
- **Styling**: Uses Tailwind CSS for grid layout and responsive scaling
