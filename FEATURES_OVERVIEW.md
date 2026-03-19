# Kindinai - Project Overview & Features

## What Is Kindinai?

Kindinai is a personalized AI-generated Arabic bedtime story platform for children aged 3-10. Parents fill in their child's details, pay $3, and receive a fully illustrated, narrated, interactive storybook — all in Arabic.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend | Django 5.2 + Django REST Framework |
| Database | SQLite3 |
| Payments | Stripe |
| Story Generation | Anthropic Claude (claude-sonnet-4-20250514) |
| Illustrations | Google Gemini 2.5 Flash (Image Generation) |
| Narration (TTS) | Google Gemini TTS ("Achernar" voice) |
| Video Animation | Google Gemini Veo 3.0 (feature-flagged) |

---

## User Flow

1. **Landing Page** — Parent sees value proposition, clicks "ابدأ الآن"
2. **Story Form** — Fills in child name, age, gender, favorite animal, character trait (brave/kind/smart/curious/strong), story theme (adventure/magic/animals/space/ocean), and optional photo
3. **Payment** — Stripe checkout ($3 USD), skippable in dev mode
4. **AI Generation Pipeline** — Backend generates:
   - Story text via Claude (Arabic, ~600 words, age-appropriate)
   - Character description (from photo via Claude Vision, or imagined)
   - Scene descriptions extracted from each paragraph
   - One illustration per paragraph via Gemini Image
   - Cover illustration randomly selected
5. **Interactive Story Viewer** — 3D flip book with illustrated pages
6. **Audio Narration** — TTS narration with play/pause and progress bar
7. **Video Animation** — Optional animated video clips with narration overlay (feature-flagged)
8. **Actions** — Copy text, print book, listen, watch video

---

## Features Built

### 1. Personalized Story Generation
- Claude generates a unique Arabic bedtime story based on child's name, age, gender, favorite animal, personality trait, and chosen theme
- Stories are ~600 words, split into paragraphs, with a title and moral lesson
- If a child photo is uploaded, Claude Vision analyzes it to create a character description matching the child's appearance

### 2. AI-Generated Illustrations
- Each story paragraph gets its own illustration via Google Gemini Image Generation
- Character consistency is maintained by passing the same character description to every illustration prompt
- One illustration is randomly selected as the book cover

### 3. Interactive 3D Flip Book
- Custom CSS-based 3D page-flip animation (`transform: rotateY()`)
- Cover page with child's name
- Illustrated pages with story text
- End page with the story's moral lesson
- Full RTL (right-to-left) layout for Arabic

### 4. Arabic Audio Narration
- Google Gemini TTS generates narration using the "Achernar" voice (soft, bedtime-appropriate)
- Custom AudioPlayer component with play/pause and progress tracking
- Audio generated on-demand after story creation

### 5. Animated Video Clips (Feature-Flagged)
- Google Gemini Veo 3.0 generates animated video clips for story scenes
- Video player with narration text overlay
- Controlled via `ENABLE_VIDEO_GENERATION` environment variable

### 6. Stripe Payment Integration
- Stripe Payment Element for secure checkout
- Webhook support for payment confirmation
- Dev mode: payments can be skipped with `SKIP_STRIPE=True`

### 7. Loading Experience
- Animated loading screen shown during story generation
- Frontend polls backend every 2 seconds for generation status updates

### 8. Print Support
- Custom print-friendly CSS styles for the story book

---

## Backend API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/create-payment-intent/` | POST | Create Stripe payment intent & store order |
| `/api/generate-story/` | POST | Generate story text & auto-trigger illustrations |
| `/api/story/<uuid>/` | GET | Retrieve full story data |
| `/api/generate-audio/` | POST | Generate TTS narration |
| `/api/generate-illustrations/` | POST | Manually trigger illustration generation |
| `/api/generate-video/` | POST | Generate animated video clips |
| `/api/feature-flags/` | GET | Get feature flags |
| `/api/webhook/stripe/` | POST | Stripe payment webhook |

---

## Database Models

### StoryOrder
- UUID primary key
- Child details: name, age (3-10), gender, favorite animal, wish (trait), theme
- Optional child photo
- Stripe payment intent ID
- Generated content: story title, moral, full text, audio file
- Status tracking: order status, audio status, illustrations status, video status
- Cover illustration (FK to StoryIllustration)

### StoryIllustration
- Linked to StoryOrder
- Scene index & paragraph index
- Scene description (used for generation prompt)
- Generated image file

### StoryVideoClip
- Linked to StoryOrder
- Paragraph index & scene description
- Generated video file

---

## Design System

### Color Palette
| Name | Hex | Usage |
|------|-----|-------|
| Cream | `#FFF5F8` | Background |
| Cream Dark | `#F0E4ED` | Secondary background |
| Sky | `#5BADE5` | Primary blue |
| Navy | `#2D2654` | Dark text |
| Bubblegum | `#F4A7BB` | Pink accent |
| Lavender | `#9B8BBF` | Muted purple |
| Mint | `#7EC8B8` | Mint green |
| Sunshine | `#FFD93D` | Yellow accent |

### Typography
- **Cairo** — Primary Arabic sans-serif font
- **Amiri** — Serif Arabic font for story text

---

## Project Structure

```
Kindinai/
├── backend/
│   ├── kindinai/           # Django project settings
│   ├── stories/
│   │   ├── models.py       # StoryOrder, StoryIllustration, StoryVideoClip
│   │   ├── views.py        # All API views
│   │   ├── serializers.py  # DRF serializers
│   │   ├── claude_client.py    # Claude story generation
│   │   ├── tts_client.py       # Gemini TTS narration
│   │   ├── image_client.py     # Gemini image generation
│   │   ├── video_client.py     # Veo video generation
│   │   └── urls.py         # API routing
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── CreatePage.jsx
│   │   │   └── StoryPage.jsx
│   │   ├── components/
│   │   │   ├── StoryForm.jsx
│   │   │   ├── PaymentForm.jsx
│   │   │   ├── AudioPlayer.jsx
│   │   │   ├── LoadingAnimation.jsx
│   │   │   ├── StoryIllustrations.jsx
│   │   │   └── StoryVideoGenerator.jsx
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── index.css
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## Cost Structure (Per Story)

| Component | Cost | Notes |
|-----------|------|-------|
| Claude story generation | ~$0.01 | Sonnet model, ~600 words |
| Gemini illustrations (5-7 images) | ~$0.05 | One per paragraph |
| Gemini TTS narration | ~$0.01 | Short story audio |
| Veo video (optional) | ~$0.10-0.30 | If enabled |
| **Total per story** | **~$0.07-0.37** | Depending on video |

**Selling price: $3 USD** — healthy margins on text + illustrations.

---

## Proposed Feature: Character Chat

### Concept
After reading their story, the child can **chat with the story's character** (the lion, rabbit, dragon, etc.). The character stays in-character, remembers the story, speaks Arabic, and is age-appropriate.

### How It Works
- Claude Haiku as the chat model (fast, cheap, good for kids' dialogue)
- System prompt injects: story text + character personality + child's age
- Voice in/out: Gemini TTS for character voice + browser Web Speech API for child's voice
- Safety: strict system prompt, content filtering, session time limits

### Estimated Cost Per Chat Session
| Component | Cost |
|-----------|------|
| Claude Haiku per message | ~$0.002 |
| TTS per response | ~$0.005 |
| **Per session (~20 messages)** | **~$0.15** |

### Monetization Options
- **Subscription:** $5/month for unlimited chat (3 free messages per story)
- **Credits:** Buy 50 messages for $2
- **Bundled tiers:** Basic ($2, no chat) / Plus ($5, 10 messages) / Premium ($10, unlimited 24hr)

### Safety Requirements
- 15-minute max session (it's bedtime)
- Character never breaks role
- No personal info collection — deflects if child shares address/school
- Parent dashboard with chat transcripts
- Approved topics only — story world, imagination, kindness, learning

### Implementation Plan
1. Text chat first (cheapest, easiest)
2. Add voice output with TTS
3. Voice input via browser Web Speech API (free)

---

## Environment Variables

### Backend
```
DJANGO_SECRET_KEY=
DEBUG=True
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
FRONTEND_URL=http://localhost:5173
SKIP_STRIPE=True
ENABLE_VIDEO_GENERATION=False
GOOGLE_APPLICATION_CREDENTIALS=
GOOGLE_GEMINI_API_KEY=
```

### Frontend
```
VITE_API_URL=
VITE_STRIPE_PUBLISHABLE_KEY=
```

---

## Current Status

- MVP is fully functional with story generation, illustrations, audio, and payment
- Video generation is implemented but feature-flagged (off by default)
- Character chat is proposed but not yet built
- Running on SQLite (suitable for MVP, would need PostgreSQL for production scale)
- Local file storage (would need cloud storage like S3 for production)
