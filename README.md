# 🎵 Ambient Voice Overlay - Spotify UI

## Non-Interruptive AI Audio Experience

**Transform messages into emotion-friendly voice snippets that blend seamlessly with music**

---

## 🌟 The Problem

Everyone hates:
- ❌ Loud, disruptive Spotify ads
- ❌ Harsh notification sounds
- ❌ Audio interruptions that break your vibe
- ❌ Jarring transitions that kill the mood

## ✨ Our Solution

**Ambient Voice Overlay** is a next-generation audio experience that replaces loud, disruptive ads and notifications with **soft, intelligent, AI-generated voice snippets** that blend naturally into music — without interrupting the user's emotional flow.

---

## 🎯 How It Works

```
1. Type a Message → 2. AI Refines It → 3. Voice Generated → 4. Blended with Music
   (User Input)       (Gemini AI)        (ElevenLabs)      (Web Audio API)
```

### The Magic Stack

- **Gemini AI** → Rewrites and contextualizes messages for ambient delivery
- **ElevenLabs** → Generates natural, human-sounding voice
- **Web Audio API** → Intelligently mixes voice with music (ducking, timing, volume)
- **Next.js 14** → Beautiful Spotify-like UI

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root:

```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
NEWS_API_KEY=your_news_api_key_here (optional)
WEATHER_API_KEY=your_weather_api_key_here (optional)
```

**Get your FREE API keys:**
- ElevenLabs: https://elevenlabs.io/
- Gemini: https://makersuite.google.com/app/apikey

### 3. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🎮 Judge Demo Guide

### Try It Yourself! (30 seconds)

1. **Navigate to the Home page** - You'll see the purple "Ambient Voice Overlay" section
2. **Type your message** - Examples:
   - "Hey Sarah, don't forget your meeting at 3pm"
   - "This song is brought to you by Spotify Premium"
   - "Happy birthday! Hope you're having an amazing day"
3. **Choose a song** - Select between:
   - "Perfect" by Ed Sheeran
   - "Story of My Life" by One Direction
4. **Click "Refine with AI"** - Watch Gemini AI transform your message
5. **Click "Generate Voice"** - ElevenLabs creates natural speech
6. **Click "Mix Voice with Music"** - Web Audio API blends them seamlessly
7. **Hit Play** - Listen to the magic! 🎧

### What Makes It Special

- **Non-Intrusive**: Voice overlays at 3 seconds with lowered music volume
- **Natural Timing**: Fades music down during voice, back up after
- **Emotionally Aware**: Gemini AI ensures the tone matches the moment
- **Instant Demo**: Works with built-in songs - no uploads needed

---

## 💡 Use Cases

### 1. **Spotify-Style Ambient Ads**
Replace jarring ad breaks with gentle voice overlays:
> "This ad-free experience is brought to you by Premium"

### 2. **Smart Reminders**
Non-intrusive notifications during music:
> "Hey, your meeting starts in 10 minutes"

### 3. **Personalized Greetings**
Creator shoutouts and birthday messages:
> "Happy birthday Alex! Your friends made you this playlist"

### 4. **Podcast Intros**
Smooth transitions for playlists:
> "Next up: your favorite indie tracks"

### 5. **Mood-Aware Assistants**
Context-sensitive voice that respects the vibe

---

## 🏗️ Architecture

### Frontend (Next.js 14)
- **Spotify-like UI** with React components
- **Music Player Context** for global audio state
- **Web Audio API** for real-time mixing and ducking
- **CSS Modules** for beautiful, scoped styling

### Backend (Next.js API Routes)
- **/api/refine-message** - Gemini AI message refinement
- **/api/generate-voice** - ElevenLabs text-to-speech

### Audio Processing
- **Dynamic Volume Ducking** - Music volume lowers during voice
- **Timed Overlays** - Voice inserted at natural breakpoints
- **WAV Export** - Download your mixed audio

---

## 📂 Project Structure

```
├── app/
│   ├── api/
│   │   ├── refine-message/route.js   # Gemini AI integration
│   │   └── generate-voice/route.js   # ElevenLabs TTS
│   ├── layout.jsx                     # Root layout
│   └── page.jsx                       # Main page with player
├── components/
│   ├── AmbientVoiceOverlay.jsx       # Main feature component
│   ├── Sidebar.jsx                    # Spotify sidebar
│   ├── MainContent.jsx                # Content area
│   └── PlayerBar.jsx                  # Bottom player
├── contexts/
│   └── MusicPlayerContext.jsx         # Global music state
├── public/
│   └── music/                         # MP3 files
└── .env.local                         # API keys (create this)
```

---

## 🎨 Key Features

### ✅ Implemented

- ✨ **AI Message Refinement** (Gemini Pro)
- 🎤 **Natural Voice Generation** (ElevenLabs)
- 🎵 **Intelligent Audio Mixing** (Web Audio API)
- 🎨 **Beautiful Spotify UI** (Next.js + CSS Modules)
- 🎧 **Real-time Music Playback**
- 💾 **Download Mixed Audio** (WAV format)
- 🎯 **Judge-Interactive Demo**

### 🔮 Future Enhancements

- 📊 Auto-detect song gaps for perfect timing
- 🎼 Multi-voice support (different characters)
- 🌈 Emotion-based voice modulation
- 🔊 Advanced ducking based on music analysis
- 📱 Mobile app version
- 🎭 Voice style selection (professional, casual, excited)

---

## 🏆 Why This Wins

### 1. **Emotionally Relatable**
Everyone experiences audio interruptions. This solves a universal pain point.

### 2. **Technically Impressive**
Combines cutting-edge AI (Gemini + ElevenLabs) with sophisticated audio engineering.

### 3. **Visually Demo-Friendly**
Judges can try it instantly - type a message, hear the result in 30 seconds.

### 4. **Simple to Understand**
"Soft reminders inside music" - clear value proposition.

### 5. **Highly Original**
No one else is doing AI-powered ambient audio overlays like this.

### 6. **Real Product Potential**
- Streaming platforms (Spotify, Apple Music)
- Audio advertising
- Smart assistants
- Creator tools

---

## 🎯 One-Sentence Pitch

> **"We built a non-interruptive AI audio system that blends personalized voice messages and ads into music intelligently — so your vibe never gets broken again."**

---

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **Gemini AI** - Message refinement and contextualization
- **ElevenLabs** - Natural text-to-speech generation
- **Web Audio API** - Real-time audio processing and mixing
- **React Context** - Global state management
- **CSS Modules** - Scoped, beautiful styling

---

## 📊 API Keys

Get your FREE API keys:
- **ElevenLabs**: https://elevenlabs.io/
- **Gemini AI**: https://makersuite.google.com/app/apikey
- **News API** (optional): https://newsapi.org/
- **Weather API** (optional): https://openweathermap.org/api

---

## 🎵 Built-in Music

- **"Perfect"** by Ed Sheeran
- **"Story of My Life"** by One Direction

Both songs are included in `public/music/` for instant demo.

---

## 🐛 Troubleshooting

### "Failed to refine message"
- Add your Gemini API key to `.env.local`
- Get one free at https://makersuite.google.com/app/apikey

### "Failed to generate voice"
- ElevenLabs key should already work
- Check console for detailed error messages

### Audio not playing
- Ensure music files are in `public/music/`
- Check browser console for errors
- Try Chrome/Edge (best Web Audio API support)

---

## 📜 License

MIT - Feel free to use this for your hackathon demo!

---

## 🙏 Credits

Built with ❤️ for the hackathon by innovators who believe audio experiences should enhance, not interrupt, the human experience.

**Technologies**: Next.js • Gemini AI • ElevenLabs • Web Audio API

---

## 🎉 Ready to Demo?

```bash
npm run dev
```

Then open http://localhost:3000 and blow the judges' minds! 🚀
