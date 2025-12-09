# Proposal: Fix Chatbot Submit Button Not Working

## Problem
When user types a message and clicks submit in the iPhone chatbot demo, nothing happens. No API call is made.

## Investigation Summary

### What Works
- Typing in textarea updates state (user sees "hey")
- Submit button becomes enabled when text is entered
- iPhone frame displays correctly

### What Doesn't Work
- Clicking submit button does nothing
- No POST /api/chat request in server logs
- No console errors when clicking

### Root Cause Analysis

The `PromptInput` component has a complex submission flow that conflicts with how we're using it:

1. **PromptInput's handleSubmit** reads text from `FormData.get("message")`
2. **But** we're passing `value={inputValue}` as a controlled prop
3. The textarea has `name="message"` set internally
4. **The issue**: PromptInput spreads `{...props}` on the form element (line 790), and we pass `onSubmit={handleSubmit}` to PromptInput
5. **This overwrites** PromptInput's internal `onSubmit={handleSubmit}` with OUR handleSubmit!

Looking at PromptInput (lines 786-791):
```tsx
<form
  className={cn("w-full", className)}
  onSubmit={handleSubmit}  // PromptInput's internal handler
  ref={formRef}
  {...props}  // <-- Our onSubmit is in here, OVERWRITING the line above!
>
```

When we do `<PromptInput onSubmit={handleSubmit}>`, our `onSubmit` goes into `props` and overwrites PromptInput's internal form onSubmit handler!

Our `handleSubmit` expects `{ text: string }` but the form's onSubmit receives a `FormEvent`.

## Fix Options

### Option A: Remove value/onChange props (Recommended)
Let PromptInput manage its own state. Don't pass controlled props.
- Simplest fix
- Works with how PromptInput was designed to be used

### Option B: Use simple form instead of PromptInput
Replace AI Elements PromptInput with a basic form using useChat's built-in handling.
- More control
- Loses AI Elements styling/features

### Option C: Use PromptInputProvider
Wrap with PromptInputProvider to properly integrate external state.
- Most complex
- Proper integration with AI Elements

## Recommended Fix (Option A)

Stop passing `value` and `onChange` to PromptInputTextarea. Let PromptInput manage text internally.

```tsx
// Before (broken)
<PromptInputTextarea
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  ...
/>

// After (fixed)
<PromptInputTextarea
  placeholder="Message..."
  className="..."
  disabled={isLoading}
/>
```

Also need to remove the `inputValue` state since PromptInput manages it internally.

For the disabled check on submit button, we can't easily know if input is empty without state. Options:
1. Always enable button (let form validation handle it)
2. Use a ref to check the textarea value
3. Accept minor UX trade-off

## Files to Modify
- `src/components/PhoneChatbot.tsx`
- `src/app/api/chat/route.ts`

---

## Additional Issue Found: API Route Error

### Problem
After fixing the frontend submit handling, the API returns 500 error:
```
Chat API error: TypeError: result.toDataStreamResponse is not a function
```

### Root Cause
AI SDK v5 renamed `toDataStreamResponse()` to `toUIMessageStreamResponse()`.

### Fix
```tsx
// Before (broken in v5)
return result.toDataStreamResponse();

// After (correct for v5)
return result.toUIMessageStreamResponse();
```
