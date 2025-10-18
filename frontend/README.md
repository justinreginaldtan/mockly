# JD-Grounded Mock Interviewer

An AI-powered mock interview application that helps candidates practice for job interviews with personalized questions based on their resume and target job description.

## Features

- **Resume & JD Analysis**: Upload your resume and job description for personalized interview questions
- **Customizable Setup**: Adjust technical vs. behavioral question mix, focus areas, and duration
- **Realistic Interview Experience**: Simulated live interview with voice interaction and visual feedback
- **Detailed Results Dashboard**: Comprehensive analysis of your performance with actionable feedback

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Typography**: Inter font family

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Copy `.env.local.example` to `.env.local` and set:

- `GEMINI_API_KEY` – Google AI Studio key for Gemini requests
- `ELEVENLABS_API_KEY` – ElevenLabs Speech Synthesis key

Restart the dev server after adding or updating environment values.

## Project Structure

\`\`\`
app/
├── page.tsx              # Upload screen
├── setup/                # Interview configuration
├── mock/                 # Live interview simulation
├── results/              # Results dashboard
└── api/                  # API route placeholders
    ├── generate-interview/
    ├── voice-question/
    └── evaluate-answers/

components/
├── file-upload-card.tsx
├── interviewer-avatar.tsx
├── mic-button.tsx
├── progress-bar.tsx
├── success-animation.tsx
└── waveform.tsx

lib/
└── mock-data.ts          # Mock data for development
\`\`\`

## API Integration (TODO)

### 1. Gemini API - Question Generation
- **Endpoint**: `/api/generate-interview`
- **Purpose**: Generate personalized interview questions based on resume and JD
- **Setup**: Add `GEMINI_API_KEY` to environment variables

### 2. ElevenLabs API - Voice Synthesis
- **Endpoint**: `/api/voice-question`
- **Purpose**: Convert questions to natural-sounding speech
- **Setup**: Add `ELEVENLABS_API_KEY` to environment variables

### 3. Gemini API - Answer Evaluation
- **Endpoint**: `/api/evaluate-answers`
- **Purpose**: Analyze responses and provide detailed feedback
- **Setup**: Uses same `GEMINI_API_KEY` as question generation

## Current Status

✅ Complete UI/UX flow with all 4 screens
✅ Smooth animations and transitions
✅ Interactive components and state management
✅ Mock data for realistic demo experience
⏳ API integration placeholders ready for connection

## Next Steps

1. Connect Gemini API for question generation and evaluation
2. Integrate ElevenLabs for text-to-speech functionality
3. Add speech-to-text for user response capture
4. Implement data persistence (database)
5. Add user authentication
6. Deploy to production

## Design Philosophy

The app follows an Apple-clean aesthetic with:
- Dark navy background (#0f1419)
- Soft blue-purple accents for primary actions
- Generous white space and clear hierarchy
- Smooth transitions and micro-interactions
- Professional, trustworthy appearance

## License

MIT
