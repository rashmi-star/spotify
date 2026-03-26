import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { message, songTitle, songMood } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      // Fallback mini-story
      return NextResponse.json({
        story: `Hey... ${message}... and you know what? You've got this!`,
        type: 'encouragement',
        usedFallback: true
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `Create a BRIEF, engaging mini-story or narrative (max 20 words) that incorporates this message naturally.

Message: "${message}"
Song: "${songTitle}"
Mood: ${songMood || 'calm'}

Make it:
- Conversational and engaging
- Like a friend sharing a quick story
- Natural pauses with "..."
- Max 20 words
- Feel like part of the song's journey

Example:
Message: "meeting at 3"
Story: "Oh hey... remember that meeting at 3? You've totally got this... go crush it!"

Create a mini-story incorporating: "${message}"`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const story = response.text().trim().replace(/^["']|["']$/g, '')

    return NextResponse.json({
      story,
      type: 'narrative',
      usedFallback: false
    })
  } catch (error) {
    console.error('Story Generation Error:', error)
    
    return NextResponse.json({
      story: `Hey... ${message}... you've got this!`,
      type: 'encouragement',
      usedFallback: true
    })
  }
}

