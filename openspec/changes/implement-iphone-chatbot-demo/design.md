# Design: iPhone Chatbot Demo

## Architecture Overview

```
/demo (page)
├── iPhone Frame Container (visual chrome)
│   ├── Notch/Dynamic Island
│   ├── PhoneChatbot Component
│   └── Home Indicator
└── Background (centered layout)
```

## Component Structure

### Demo Page (`src/app/demo/page.tsx`)
- Centers iPhone frame on page
- Dark/neutral background to highlight device
- Imports and renders `PhoneChatbot` within frame

### iPhone Frame Component (`src/components/IPhoneFrame.tsx`)
- Fixed dimensions: 375x812px (iPhone X/11/12/13/14)
- Visual elements:
  - Rounded corners (border-radius: 40px)
  - Device bezel (black border)
  - Notch or Dynamic Island indicator
  - Home indicator bar at bottom
- Children slot for chatbot content

### PhoneChatbot (existing)
- Already implemented with AI Elements
- Features: model selection, web search toggle, message streaming
- No modifications needed

## Styling Approach
- Tailwind CSS for all styling
- CSS variables for frame dimensions (easy future customization)
- Shadow/depth effects for realistic appearance

## iPhone Dimensions Reference
| Model | Width | Height | Scale |
|-------|-------|--------|-------|
| iPhone SE | 320px | 568px | 2x |
| iPhone X/11/12/13/14 | 375px | 812px | 3x |
| iPhone 14 Pro Max | 430px | 932px | 3x |

**Selected**: 375x812px (most common, good balance)

## Data Flow
```
User Input → PhoneChatbot → /api/chat → OpenAI → Stream Response → UI Update
```

## API Route Details
- Endpoint: `POST /api/chat`
- Payload: `{ messages, model, webSearch }`
- Response: Streaming data with `toDataStreamResponse()`
- Features: Reasoning and sources forwarding (when available)
