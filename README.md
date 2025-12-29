# Mockly

Mockly is an AI communication training platform with two modes: Job Interview Practice and Customer Service Training. The interview mode is the primary focus; the customer service mode is retained as an experimental track with useful tech (speech, TTS, adaptive difficulty).

## What it does
- Job interview simulations: persona-driven questions, voice playback, speech capture, and AI evaluation.
- Customer service training: scenario generation, live feedback, adaptive difficulty, and coaching tips.

## Tech stack
- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS + Radix UI
- Gemini for generation/evaluation
- ElevenLabs for voice
- Web Speech API for speech recognition

## Repo structure
- `frontend/` - Next.js app (primary)
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

## Notes
- Without API keys, the app falls back to mock data.
- Interview mode is the primary focus moving forward.

## License
MIT
