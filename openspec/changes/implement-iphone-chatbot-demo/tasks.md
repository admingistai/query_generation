# Tasks: Implement iPhone Chatbot Demo

## Task List

### 1. Create iPhone Frame Component
- [ ] Create `src/components/IPhoneFrame.tsx`
- [ ] Add device chrome (bezel, rounded corners)
- [ ] Add notch/dynamic island visual
- [ ] Add home indicator bar
- [ ] Accept children prop for content

### 2. Update Demo Page
- [ ] Update `src/app/demo/page.tsx`
- [ ] Import `IPhoneFrame` and `PhoneChatbot`
- [ ] Center frame on page with dark background
- [ ] Add page metadata/title

### 3. Verify API Route
- [ ] Test `/api/chat` endpoint works
- [ ] Verify streaming responses function correctly
- [ ] Check error handling for invalid requests

### 4. Manual Testing
- [ ] Navigate to http://localhost:3000/demo
- [ ] Verify iPhone frame displays correctly
- [ ] Send test message and confirm response
- [ ] Test model switching (GPT-4o / GPT-4o Mini)
- [ ] Test web search toggle (if functional)

## Dependencies
- Task 2 depends on Task 1
- Task 4 depends on Tasks 1, 2, 3

## Validation Criteria
- Demo page loads without errors
- iPhone frame has correct dimensions (375x812px)
- Chat messages send and receive correctly
- Streaming responses display in real-time
