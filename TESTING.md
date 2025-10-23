# Testing Guide for Mockly

This guide covers how to test the interview functionality locally and verify all implemented features work correctly.

---

## Prerequisites

Before testing, ensure you have:
- Node.js 18+ installed
- Chrome or Edge browser (for Web Speech API support)
- API keys (optional but recommended):
  - `GEMINI_API_KEY` or `GOOGLE_API_KEY` for AI features
  - `ELEVENLABS_API_KEY` for voice synthesis

---

## Quick Start: Manual Testing

### Step 1: Start the Development Server

```bash
cd /workspace/cmh3wvwsu00zwq2i3bgp6g72i/mockly/frontend

# Install dependencies (if not already done)
npm install

# Start the dev server
npm run dev
```

The application should be available at `http://localhost:3000`

---

### Step 2: Environment Variables (Optional)

Create a `.env.local` file in the `frontend` directory:

```bash
# For AI-generated questions (optional - falls back to mock data)
GEMINI_API_KEY=your_gemini_api_key_here

# For voice synthesis (optional - falls back to silent mode)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

**Note:** The app works without API keys but will use mock data and skip voice synthesis.

---

## Manual Testing Checklist

### Test 1: Happy Path (Voice Recording)

**Goal:** Complete full interview flow with voice recording

**Steps:**

1. **Navigate to Setup**
   - Open `http://localhost:3000`
   - Click "Start Interview" or navigate to `/setup`
   - ✅ **Verify:** Setup page loads with persona options

2. **Configure Interview**
   - Click any persona card (e.g., "Google Analyst")
   - Select 2-3 focus areas (Leadership, Adaptability, etc.)
   - Adjust technical weight slider (optional)
   - Select voice style (optional)
   - Select duration (Short or Standard)
   - ✅ **Verify:** All selections are highlighted/active

3. **Start Interview**
   - Click "Start mock interview" button
   - ✅ **Verify:** Page navigates to `/mock`
   - ✅ **Verify:** "Join interview" overlay appears (not blank page!)
   - **Check console:** Should see `[Telemetry] onStartInterview` when you click "Join interview"

4. **Join Interview**
   - Click "Join interview" button
   - ✅ **Verify:** Overlay disappears
   - ✅ **Verify:** AI interviewer appears (left panel)
   - ✅ **Verify:** Your camera feed appears (right panel) if permission granted
   - ✅ **Verify:** Question appears in bubble at top

5. **Answer First Question (Voice)**
   - Wait for greeting audio to finish (if API keys configured)
   - Click the "Unmute" button (mic icon) if muted
   - **Grant microphone permission** when browser prompts
   - Speak your answer (e.g., "This is my test answer about leadership")
   - ✅ **Verify:** Waveform animation appears while speaking
   - ✅ **Verify:** Your transcript appears in "Your response" section
   - ✅ **Verify:** Timer counts up
   - Stop speaking and wait 1-2 seconds
   - ✅ **Verify:** Recording auto-stops after silence
   - **Check console:** Should see `[Telemetry] onQuestionAnswered`

6. **Continue to Next Question**
   - ✅ **Verify:** "Continue" or "Ready for next question" button is now enabled
   - Click the button
   - ✅ **Verify:** Next question appears
   - Repeat answer process for 1-2 more questions

7. **Wrap Up Interview**
   - After answering a few questions, click "Wrap up interview" button
   - ✅ **Verify:** Page navigates to `/results`
   - **Check console:** Should see `[Telemetry] onFinishInterview`

8. **View Results**
   - Wait for evaluation to load
   - ✅ **Verify:** Overall score appears (e.g., "75/100")
   - ✅ **Verify:** JD Coverage breakdown visible
   - ✅ **Verify:** Strengths and weak areas listed
   - ✅ **Verify:** Evidence snippets with quotes from your answers
   - ✅ **Verify:** "Start New Interview" button visible
   - ✅ **Verify:** "Export Results" button visible

9. **Export Results**
   - Click "Export Results" button
   - ✅ **Verify:** JSON file downloads with name like `mockly-interview-1234567890.json`
   - Open the JSON file
   - ✅ **Verify:** Contains interview data, questions, answers, evaluation

10. **Restart Interview**
    - Click "Start New Interview" button
    - ✅ **Verify:** Navigates to `/setup`
    - ✅ **Verify:** Previous selections cleared
    - **Check DevTools > Application > Session Storage**
    - ✅ **Verify:** `mi:setup`, `mi:plan`, `mi:responses` keys cleared

---

### Test 2: Microphone Permission Denied (Text Fallback)

**Goal:** Verify text input works when mic is unavailable

**Steps:**

1. **Setup Interview** (same as Test 1, steps 1-3)

2. **Join Interview**
   - Click "Join interview"

3. **Deny Microphone Permission**
   - When browser asks for mic permission, click "Block" or "Deny"
   - **OR** Open DevTools > Settings > Site Settings and block microphone

4. **Verify Text Fallback Appears**
   - Try to unmute or wait for recording to start
   - ✅ **Verify:** Red error banner appears saying "Microphone unavailable"
   - ✅ **Verify:** Message says "You can type your answer below instead"
   - ✅ **Verify:** Textarea appears with placeholder "Type your answer here..."

5. **Type Answer**
   - Click in the textarea
   - Type: "This is my typed answer for testing purposes when microphone is unavailable."
   - ✅ **Verify:** Character count updates (should show "~80 characters")
   - ✅ **Verify:** "Submit Answer" button enabled (requires 10+ characters)

6. **Submit Text Answer**
   - Click "Submit Answer" button
   - ✅ **Verify:** Textarea clears
   - ✅ **Verify:** "Continue" button becomes enabled
   - **Check console:** Should see `[Telemetry] onQuestionAnswered` with `isVoice: false`

7. **Continue to Next Question**
   - Click "Continue" button
   - ✅ **Verify:** Next question appears
   - ✅ **Verify:** Textarea is empty (cleared for new question)
   - Type another answer and submit

8. **Complete Interview**
   - Answer 2-3 questions via text
   - Click "Wrap up interview"
   - Navigate to `/results`
   - ✅ **Verify:** Results page loads without errors
   - ✅ **Verify:** Evaluation includes your text answers
   - ✅ **Verify:** Evidence snippets show your typed responses

---

### Test 3: Skip Question Functionality

**Goal:** Verify users can skip questions explicitly

**Steps:**

1. **Start Interview** (same as Test 1, steps 1-4)

2. **Attempt to Continue Without Answering**
   - Click "Join interview"
   - First question appears
   - **Do NOT answer** (don't speak or type)
   - ✅ **Verify:** "Continue" button is **disabled** (grayed out, no pointer cursor)

3. **Skip Question**
   - ✅ **Verify:** "Skip Question" button appears below "Continue" button
   - Click "Skip Question" button
   - ✅ **Verify:** "Continue" button becomes **enabled**

4. **Continue After Skipping**
   - Click "Continue" button
   - ✅ **Verify:** Next question appears
   - **Check DevTools > Application > Session Storage > `mi:responses`**
   - ✅ **Verify:** Previous question has `transcript: "[Skipped]"` and `skipped: true`

5. **Complete Interview with Skips**
   - Answer some questions, skip others
   - Finish interview
   - ✅ **Verify:** Results page handles skipped questions gracefully

---

### Test 4: Network Retry Logic

**Goal:** Verify retry logic works on API failures

**Steps:**

1. **Test Setup Page Retry**
   - Open DevTools > Network tab
   - Navigate to `/setup`
   - Configure interview
   - **Before clicking "Start mock interview":**
     - In DevTools Network tab, enable "Throttling" > "Offline"
   - Click "Start mock interview"
   - ✅ **Verify:** Loading state shows
   - After 2-3 seconds, disable "Offline" mode
   - ✅ **Verify:** Request retries automatically
   - ✅ **Verify:** Interview plan loads successfully after retry

2. **Test Voice Request Retry**
   - Start an interview
   - Join interview room
   - In Network tab, throttle connection to "Slow 3G"
   - ✅ **Verify:** Question audio loads (may take longer)
   - ✅ **Verify:** No errors in console about failed requests
   - **Note:** Voice requests have 2 retry attempts

3. **Test Evaluation Retry**
   - Complete an interview with answers
   - Navigate to results
   - In Network tab, throttle to "Slow 3G"
   - ✅ **Verify:** "Analyzing your interview..." message shows
   - ✅ **Verify:** Evaluation eventually loads (may retry 2-3 times)
   - ✅ **Verify:** Results display correctly

---

### Test 5: Session Persistence

**Goal:** Verify interview state persists across page refreshes

**Steps:**

1. **Start Interview and Answer Questions**
   - Navigate to `/setup`
   - Start interview
   - Answer 1-2 questions

2. **Refresh Page**
   - Press F5 or Cmd+R to refresh
   - ✅ **Verify:** Mock page reloads
   - ✅ **Verify:** Your previous answers are still visible
   - ✅ **Verify:** Can continue from where you left off

3. **Check Session Storage**
   - Open DevTools > Application > Session Storage
   - ✅ **Verify:** `mi:setup`, `mi:plan`, `mi:responses` all present
   - Click on `mi:responses`
   - ✅ **Verify:** Your answers are stored with timestamps

4. **Complete Interview**
   - Finish interview and view results
   - ✅ **Verify:** All your answers (including pre-refresh) appear in evaluation

---

### Test 6: Edge Cases

**Test 6.1: Empty or Very Short Answers**
- Try to submit a voice answer with no speech (silence)
- ✅ **Verify:** No answer saved, "Continue" stays disabled
- Try to submit text with <10 characters
- ✅ **Verify:** "Submit Answer" button disabled

**Test 6.2: Browser Back Button**
- During interview, click browser back button
- ✅ **Verify:** Returns to setup page
- ✅ **Verify:** Session data still in storage
- Click forward button
- ✅ **Verify:** Interview state restored

**Test 6.3: Direct URL Access**
- Navigate directly to `/mock` without going through setup
- ✅ **Verify:** Shows error or uses demo questions (fallback plan)
- Navigate directly to `/results` without completing interview
- ✅ **Verify:** Shows "No interview data found" error message

**Test 6.4: Multiple Interviews**
- Complete one full interview
- Start a new interview immediately
- ✅ **Verify:** Previous interview data cleared
- ✅ **Verify:** New interview starts fresh

---

## Automated Testing (After Setup)

### Setup Automated Tests

**1. Install test dependencies:**

```bash
cd /workspace/cmh3wvwsu00zwq2i3bgp6g72i/mockly/frontend

# Install Playwright
npm install --save-dev @playwright/test --legacy-peer-deps

# Install Playwright browsers
npx playwright install chromium

# Install Vitest for unit tests
npm install --save-dev vitest @testing-library/react @testing-library/react-hooks --legacy-peer-deps
```

**2. Add test scripts to package.json:**

```json
{
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest"
  }
}
```

### Run E2E Tests

```bash
# Run all e2e tests
npm run test

# Run tests with UI (interactive)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug tests step-by-step
npm run test:debug

# Run specific test file
npx playwright test interview-happy-path

# Run tests in specific browser
npx playwright test --project=chromium
```

### Run Unit Tests

```bash
# Run unit tests once
npm run test:unit

# Run unit tests in watch mode
npm run test:unit:watch
```

---

## Debugging Tips

### Check Browser Console

Always have DevTools console open during testing:
- `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
- Look for:
  - ✅ `[Telemetry]` logs showing interview lifecycle
  - ❌ Red error messages
  - ⚠️ Yellow warnings

### Check Network Tab

Monitor API calls in DevTools Network tab:
- `/api/generate-interview` - Should return 200 with interview plan
- `/api/voice-question` - Should return 200 with audio data (or 200 with mocked flag)
- `/api/evaluate-interview` - Should return 200 with evaluation scores

### Check Session Storage

Verify data persistence in DevTools Application tab:
- `mi:setup` - Should contain persona config
- `mi:plan` - Should contain questions array
- `mi:responses` - Should contain answered questions with transcripts

### Common Issues

**Issue: Blank mock page**
- **Cause:** Fixed in this implementation (showIntro initialization)
- **Verify:** You should see "Join interview" button immediately

**Issue: "Continue" button won't enable**
- **Cause:** No answer recorded yet
- **Solution:** Either answer via voice/text or click "Skip Question"

**Issue: No audio playback**
- **Cause:** Missing ELEVENLABS_API_KEY
- **Solution:** Add API key to .env.local OR test without audio (questions still display as text)

**Issue: Microphone not working**
- **Cause:** Browser permissions or unsupported browser
- **Solution:**
  - Use Chrome or Edge
  - Grant mic permission when prompted
  - Or test text input fallback by denying permission

**Issue: Results page shows "No interview data found"**
- **Cause:** Session storage cleared or incorrect key
- **Solution:** Complete interview from setup page without refreshing/closing

---

## Test Coverage Summary

After completing all manual tests, you should have verified:

✅ **Core Flow:**
- Setup page loads and accepts configuration
- Mock page displays interview UI (not blank!)
- Questions display correctly
- Answers can be recorded via voice OR text
- Results page loads evaluation

✅ **Voice Recording:**
- Microphone permission request
- Recording starts/stops automatically
- Transcript captured correctly
- Duration tracked

✅ **Text Fallback:**
- Error banner appears on mic denial
- Textarea input works
- Character counter updates
- Minimum 10 characters enforced

✅ **Button Validation:**
- "Continue" disabled until answer provided
- "Skip Question" enables "Continue"
- All buttons have proper aria-disabled states

✅ **Network Retry:**
- Setup page retries interview generation (3×)
- Mock page retries voice requests (2×)
- Results page retries evaluation (3×)

✅ **Session Persistence:**
- Data survives page refresh
- SessionStorage keys correct (mi:responses)
- Export downloads complete data

✅ **Telemetry:**
- onStartInterview logs when joining
- onQuestionAnswered logs after each answer
- onFinishInterview logs before results

---

## Next Steps After Testing

1. **Report Issues:** Create a list of any bugs found during testing
2. **Performance:** Note any slow API calls or UI lag
3. **UX Improvements:** Document any confusing UI/UX elements
4. **Browser Testing:** Test in Chrome, Edge, Safari, Firefox
5. **Mobile Testing:** Test on mobile devices (responsive design)

---

## Questions?

If you encounter issues:
1. Check the browser console for error messages
2. Verify environment variables are set correctly
3. Check that dev server is running (`npm run dev`)
4. Review TODO.md for known limitations
5. Check Session Storage in DevTools for data issues

**Key Test Accounts Needed:** None - runs entirely in browser with session storage

**API Rate Limits:**
- Gemini API: Check your quota at https://aistudio.google.com/
- ElevenLabs API: Check your quota at https://elevenlabs.io/

---

Good luck testing! 🚀
