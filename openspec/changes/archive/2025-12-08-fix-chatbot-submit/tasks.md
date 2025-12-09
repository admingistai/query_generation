# Tasks: Fix Chatbot Submit Button

## Task List

### 1. Fix PhoneChatbot Component
- [x] Remove `inputValue` state
- [x] Remove `value` and `onChange` props from PromptInputTextarea
- [x] Update submit button disabled logic (always enabled or use ref)
- [x] Test form submission works

### 2. Fix API Route (AI SDK v5 Compatibility)
- [x] Change `toDataStreamResponse()` to `toUIMessageStreamResponse()`
- [ ] Confirm POST /api/chat requests succeed
- [ ] Verify streaming response displays
- [ ] Test message append and conversation flow

## Validation Criteria
- Typing in textarea works
- Clicking submit sends API request
- Response streams into conversation
- Input clears after submit
