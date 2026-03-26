import { NextResponse } from 'next/server'

// Different voice personalities for creative variety
const VOICE_PERSONALITIES = {
  friendly: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - warm and friendly
    settings: { stability: 0.6, similarity_boost: 0.85, style: 0.6 },
    description: 'Warm and caring friend'
  },
  energetic: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    settings: { stability: 0.5, similarity_boost: 0.85, style: 0.75, speed: 1.1 },
    description: 'Energetic and upbeat'
  },
  calm: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    settings: { stability: 0.7, similarity_boost: 0.8, style: 0.4, speed: 0.9 },
    description: 'Peaceful and soothing'
  },
  playful: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    settings: { stability: 0.5, similarity_boost: 0.85, style: 0.85, speed: 1.1 },
    description: 'Fun and playful'
  },
  professional: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    settings: { stability: 0.7, similarity_boost: 0.9, style: 0.5, speed: 1.0 },
    description: 'Clear and professional'
  }
}

export async function POST(request) {
  try {
    const { emotion, songMood, message } = await request.json()

    // Determine personality based on emotion and song mood
    let personality = 'friendly' // default
    
    if (emotion === 'excited' || emotion === 'happy') {
      personality = songMood === 'energetic' ? 'energetic' : 'playful'
    } else if (emotion === 'calm' || songMood === 'slow') {
      personality = 'calm'
    } else if (emotion === 'urgent' || emotion === 'serious') {
      personality = 'professional'
    }

    const personalityConfig = VOICE_PERSONALITIES[personality] || VOICE_PERSONALITIES.friendly

    return NextResponse.json({
      personality,
      voiceId: personalityConfig.voiceId,
      voiceSettings: personalityConfig.settings,
      description: personalityConfig.description,
      creativeNote: getCreativeNote(personality, emotion, songMood)
    })
  } catch (error) {
    console.error('Personality Selection Error:', error)
    
    return NextResponse.json({
      personality: 'friendly',
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      voiceSettings: VOICE_PERSONALITIES.friendly.settings,
      description: 'Warm and caring friend'
    })
  }
}

function getCreativeNote(personality, emotion, songMood) {
  const notes = {
    energetic: "🎉 High energy voice to match the vibe!",
    playful: "🎈 Fun and lighthearted - perfect for good times!",
    calm: "🌊 Soothing voice for peaceful moments",
    professional: "💼 Clear and focused - gets the message across",
    friendly: "💚 Warm and caring - like a good friend"
  }
  
  return notes[personality] || notes.friendly
}




