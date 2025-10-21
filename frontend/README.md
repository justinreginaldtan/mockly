# Mockly – AI Communication Training Platform

An AI-powered training platform featuring two realistic simulation modes: **Job Interview Practice** and **Customer Service Training**. Both powered by Google Gemini for intelligent evaluation and ElevenLabs for natural voice synthesis.

## Features

### Job Interview Simulator
- **Persona-Based Interviews**: Practice with AI interviewers from Google, Amazon, Meta, Cisco, and more
- **Personalized Questions**: Gemini generates questions based on your resume and target job description
- **Customizable Setup**: Adjust technical vs. behavioral mix, focus areas, voice style, and duration
- **Live Interview Experience**: Real-time speech recognition with camera/audio controls
- **Multiple Visual Themes**: Zoom-style, Google Meet-style, or Minimal interface
- **Detailed Results**: Comprehensive performance analysis with JD coverage breakdown, strengths, weak areas, and evidence snippets
- **Voice Recap**: ElevenLabs-powered audio summary of your performance
- **PDF Reports**: Downloadable interview results

### Customer Service Training Simulator
- **Adaptive Difficulty**: AI scenarios automatically adjust to your skill level (easy/medium/hard/nightmare)
- **Real-Time Evaluation**: Instant feedback on empathy, clarity, and resolution scores
- **Coaching Feedback**: Detailed tips and ideal response examples after each scenario
- **Speech Recognition**: Natural conversation practice with auto-stop detection
- **Dev Mode**: Testing tools with perfect scores toggle (activate with 'd'+'b' hotkey)
- **Realistic Voice**: ElevenLabs TTS for authentic customer voices

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **AI**: Google Gemini (question generation & evaluation)
- **Voice**: ElevenLabs (text-to-speech)
- **Speech Recognition**: Web Speech API
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **Typography**: Inter font family

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` with API keys:
```env
# Required for AI features
GEMINI_API_KEY=your_gemini_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Optional
GEMINI_MODEL=gemini-1.5-pro-latest
```

**Get API Keys:**
- Gemini: https://makersuite.google.com/app/apikey
- ElevenLabs: https://elevenlabs.io/

**Note:** The app gracefully falls back to mock data if API keys are not provided, so you can explore the UI without keys.

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

### Two Training Modes

**1. Job Interview Practice**
- Entry: Landing page → `/setup`
- Flow: Configure persona → `/mock` (live interview) → `/results` (evaluation)
- Use Case: Prepare for job interviews with AI interviewer
- AI Models: Gemini (questions + evaluation), ElevenLabs (interviewer voice)

**2. Customer Service Training**
- Entry: Landing page → `/sim`
- Flow: Single-page scenario generator with adaptive difficulty
- Use Case: Train customer service representatives with realistic scenarios
- AI Models: Gemini (scenarios + evaluation), ElevenLabs (customer voice)

### Directory Structure

```
app/
├── page.tsx                 # Landing page with mode selection
├── setup/                   # Interview configuration (925 lines)
├── mock/                    # Live interview simulation (1703 lines)
├── sim/                     # Customer service training (1152 lines)
├── results/                 # Results dashboard (448 lines)
├── api/                     # Backend API routes
│   ├── generate-interview/  # ✅ Gemini interview question generation
│   ├── voice-question/      # ✅ ElevenLabs TTS for interviews
│   ├── evaluate-interview/  # ✅ Full interview evaluation (NEW)
│   ├── evaluate-answer/     # ✅ Single CS response evaluation
│   ├── generate-scenario/   # ✅ Gemini CS scenario generation
│   └── voice-say/          # ✅ ElevenLabs TTS with retry logic
└── _components/
    ├── landing-hero.tsx     # Dual-mode landing page
    ├── nav-header.tsx       # Navigation between modes
    └── home-page.tsx        # CS training setup flow

components/
├── interviewer-avatar.tsx
├── CoachCard.tsx
├── mic-button.tsx
├── waveform.tsx
├── progress-bar.tsx
├── success-animation.tsx
└── interview/
    ├── control-bar.tsx
    └── insights-drawer.tsx

lib/
├── gemini.ts               # Gemini API integration
├── voices.ts               # Voice configuration
├── mock-data.ts            # Fallback mock data
└── cache-keys.ts           # Session storage keys

hooks/
├── use-speech-recorder.ts  # Web Speech API wrapper
└── use-toast.tsx
```

## Current Status

### ✅ Fully Implemented Features

**Job Interview Simulator** (`/setup` → `/mock` → `/results`)
- ✅ Complete Gemini AI integration for personalized interview questions
- ✅ ElevenLabs text-to-speech with multiple interviewer personas
- ✅ Web Speech API for candidate speech recognition
- ✅ Persona selection with 4+ interview types (Google Analyst, Amazon PM, Meta SWE, Cisco SOC)
- ✅ Camera integration with multiple visual themes (Zoom, Meet, Minimal)
- ✅ Real-time question progression with insights drawer
- ✅ Session storage caching for interview plans and responses
- ✅ Fullscreen mode, theme switcher, live status indicators
- ✅ Results page with real interview evaluation from Gemini
- ✅ Voice recap feature with ElevenLabs audio summary
- ✅ PDF download for interview reports

**Customer Service Training Simulator** (`/sim`)
- ✅ Gemini-generated customer service scenarios
- ✅ Adaptive difficulty based on performance (easy/medium/hard/nightmare)
- ✅ Real-time evaluation with empathy, clarity, and resolution scores
- ✅ ElevenLabs TTS for customer voice
- ✅ Speech recognition for trainee responses with auto-stop
- ✅ Dev mode with perfect scores toggle for testing
- ✅ Detailed coaching feedback with improvement tips

**Navigation & UX**
- ✅ Landing page with clear navigation to both training modes
- ✅ Navigation header on all pages (except /mock full-screen mode)
- ✅ Mode switcher buttons on pre-join overlays
- ✅ Unified design language across both apps

**API Routes** (8 routes)
- ✅ `/api/generate-interview` - Gemini interview question generation
- ✅ `/api/voice-question` - ElevenLabs TTS for interview questions
- ✅ `/api/evaluate-interview` - Full interview evaluation with Gemini
- ✅ `/api/evaluate-answer` - Gemini evaluation for CS responses
- ✅ `/api/generate-scenario` - Gemini CS scenario generation
- ✅ `/api/voice-say` - ElevenLabs TTS with retry logic

### 🚧 Recently Completed (This Update)
- ✅ Results page now shows real interview evaluation (was using mock data)
- ✅ Voice recap feature generates actual audio summaries
- ✅ PDF download creates printable interview reports
- ✅ Landing page with navigation between job interview and CS training modes
- ✅ Cross-app navigation with mode switcher buttons
- ✅ Duplicate API route removed (evaluate-answers)
- ✅ TypeScript type errors fixed

## Next Steps

1. **User Authentication** - Add sign-up/login with session persistence
2. **Database Integration** - Store interview history and progress over time
3. **Analytics Dashboard** - Track improvement metrics across multiple sessions
4. **Deployment** - Deploy to production (Vercel recommended for Next.js)
5. **Advanced Features** - Video recording, peer comparison, custom personas

## API Integration

All API routes are fully implemented with graceful fallbacks to mock data when API keys are not configured.

### Gemini Integration
- **Model**: gemini-1.5-pro-latest (configurable via `GEMINI_MODEL` env var)
- **Features**: Question generation, scenario creation, performance evaluation
- **Fallback**: Returns mock data if API key missing or on error

### ElevenLabs Integration
- **Features**: Natural voice synthesis for interviewer/customer personas
- **Configuration**: Multiple voice styles and personas
- **Retry Logic**: 3 attempts with exponential backoff
- **Fallback**: Graceful error handling with user feedback

### Web Speech API
- **Browser Support**: Chrome, Edge, Safari (with limitations on iOS)
- **Features**: Continuous recognition, interim results, auto-stop on silence
- **Fallback**: Clear messaging if not supported in browser

## Environment Variables

Create `.env.local` in the frontend directory:

```env
# Required for AI features
GEMINI_API_KEY=your_gemini_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Optional
GEMINI_MODEL=gemini-1.5-pro-latest
```

**Note:** The app gracefully falls back to mock data if API keys are not provided, so you can explore the UI without keys.

## Browser Compatibility

**Required Features:**
- Web Speech API (Chrome, Edge, Safari - limited on iOS)
- MediaDevices.getUserMedia (camera/mic access)
- Audio API for playback
- sessionStorage
- Fetch API

**Recommended:**
- Desktop Chrome or Edge for full feature support
- Microphone and camera permissions

## Design Philosophy

The app follows a warm, approachable aesthetic with:
- Soft peach gradient backgrounds (#FFF8F5 to #FDFCFB)
- Coral accent color (#FF7A70) for primary actions
- Generous white space and clear hierarchy
- Smooth Framer Motion animations
- Professional yet friendly appearance
- Responsive design for mobile and desktop

## License

MIT
