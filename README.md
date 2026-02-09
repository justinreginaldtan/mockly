# Mockly

Mockly is an AI communication training platform with two modes: Job Interview Practice and Customer Service Training. The interview mode is the primary focus; the customer service mode is retained as an experimental track with useful tech (speech, TTS, adaptive difficulty).

## What it does
- Job interview simulations: persona-driven questions, voice playback, speech capture, and AI evaluation.
- Customer service training: scenario generation, live feedback, adaptive difficulty, and coaching tips.

## Tech stack
- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS + Radix UI
- Gemini + OpenAI (LLM adapter strategy)
- ElevenLabs for voice
- Web Speech API for speech recognition

## Repo structure
- `frontend/` - Next.js app (primary)
- `rust-backend/` - Rust migration target service (starter scaffold)
- `components/` - shared components (non-Next workspace)
- `hooks/` - shared hooks (non-Next workspace)

## Quick start
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Environment variables
Create `frontend/.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
AI_PRIMARY_PROVIDER=openai
OPENAI_MODEL=gpt-5-mini
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
# Optional
GEMINI_MODEL=gemini-1.5-pro-latest
```

## Key flows (interview mode)
- Setup: `/setup`
- Live interview: `/mock`
- Results: `/results`

## Docs
- Interview flow overview: `frontend/docs/interview-flow.md`
- Flagship roadmap: `docs/FLAGSHIP_INTENT_AND_PROGRESS.md`
- Migration blueprint: `docs/MOCKLY_RUST_BACKEND_MIGRATION.md`
- Supabase auth/RLS plan: `docs/SUPABASE_AUTH_AND_RLS.md`

## Persistent memory
- Current state: `memory/brief.md`
- Action queue: `memory/todo.md`
- Decision log: `memory/decisions.md`
- Progress log: `memory/log.md`

## Notes
- Without API keys, the app falls back to mock data.
- Interview mode is the primary focus moving forward.

## License
MIT
