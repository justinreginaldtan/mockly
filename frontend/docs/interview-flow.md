# Interview Mode Flow (Mockly)

This doc explains how the job interview mode works end-to-end so you can trace data and debug confidently.

## Overview
- Entry: `/setup` (persona + focus + voice + duration)
- Live interview: `/mock` (questions + speech capture)
- Results: `/results` (evaluation + recap)

## Data Flow (Happy Path)
1) `/setup` builds an `InterviewSetupPayload` and POSTs to `/api/generate-interview`.
2) `/api/generate-interview` calls `generateInterviewPlan` in `lib/gemini.ts`.
3) The plan is cached in `sessionStorage` under `mi:plan`, then the app routes to `/mock`.
4) `/mock` loads the cached plan and runs the interview UI.
5) When the interview ends, `/mock` saves responses to `sessionStorage` as `mockly_interview_responses`.
6) `/results` reads those responses and POSTs to `/api/evaluate-interview` for scoring and insights.

## Storage Keys
- `mi:setup` (setup payload)
- `mi:plan` (interview plan)
- `mockly_interview_responses` (final answers)

## Key Files
- Setup UI: `frontend/app/setup/page.tsx`
- Mock interview UI: `frontend/app/mock/page.tsx`
- Results UI: `frontend/app/results/page.tsx`
- Plan generation: `frontend/app/api/generate-interview/route.ts`
- Evaluation: `frontend/app/api/evaluate-interview/route.ts`
- Gemini prompts: `frontend/lib/gemini.ts`

## Notes
- Resume/JD summaries are currently plain strings; no retrieval is used yet.
- When API keys are missing, Gemini/ElevenLabs routes fall back to mock behavior.
