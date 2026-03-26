import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { message, songMood } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      // Fallback emotion detection
      const emotions = {
        'happy': message.toLowerCase().includes('birthday') || message.toLowerCase().includes('happy'),
        'urgent': message.toLowerCase().includes('meeting') || message.toLowerCase().includes('reminder'),
        'calm': message.toLowerCase().includes('water') || message.toLowerCase().includes('relax')
      }
      
      const detectedEmotion = Object.keys(emotions).find(e => emotions[e]) || 'neutral'
      
      return NextResponse.json({
        emotion: detectedEmotion,
        intensity: 0.7,
        voiceStyle: getVoiceStyleForEmotion(detectedEmotion, songMood),
        usedFallback: true
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `Analyze the emotional tone of this message and suggest voice characteristics.

Message: "${message}"
Song mood: ${songMood || 'neutral'}

Detect:
1. Primary emotion (happy, excited, calm, urgent, friendly, warm, playful, serious)
2. Intensity (0.0 to 1.0)
3. Voice characteristics that match

Respond in JSON format:
{
  "emotion": "happy",
  "intensity": 0.8,
  "voiceStyle": {
    "tone": "warm and cheerful",
    "speed": "slightly faster",
    "pitch": "slightly higher"
  }
}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()
    
    // Try to parse JSON from response
    let emotionData
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        emotionData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found')
      }
    } catch (e) {
      // Fallback
      emotionData = {
        emotion: 'friendly',
        intensity: 0.7,
        voiceStyle: getVoiceStyleForEmotion('friendly', songMood)
      }
    }

    return NextResponse.json({
      ...emotionData,
      usedFallback: false
    })
  } catch (error) {
    console.error('Emotion Detection Error:', error)
    
    return NextResponse.json({
      emotion: 'friendly',
      intensity: 0.7,
      voiceStyle: getVoiceStyleForEmotion('friendly', 'calm'),
      usedFallback: true
    })
  }
}

function getVoiceStyleForEmotion(emotion, songMood) {
  const styles = {
    happy: { stability: 0.5, style: 0.8, speed: 1.1, tone: 'cheerful' },
    excited: { stability: 0.4, style: 0.9, speed: 1.15, tone: 'energetic' },
    calm: { stability: 0.7, style: 0.4, speed: 0.9, tone: 'peaceful' },
    urgent: { stability: 0.6, style: 0.7, speed: 1.05, tone: 'alert' },
    friendly: { stability: 0.6, style: 0.6, speed: 1.0, tone: 'warm' },
    playful: { stability: 0.5, style: 0.85, speed: 1.1, tone: 'fun' },
    serious: { stability: 0.7, style: 0.5, speed: 0.95, tone: 'professional' },
    neutral: { stability: 0.6, style: 0.6, speed: 1.0, tone: 'natural' }
  }
  
  return styles[emotion] || styles.neutral
}

