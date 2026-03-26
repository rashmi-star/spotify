import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { 
      message,
      conversationHistory = [],
      songContext,
      targetLanguage = 'English',
      languageCode = 'en'
    } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      // Fallback conversational response
      const conversational = `Hey... ${message.toLowerCase()}... you know?`
      return NextResponse.json({
        refined: conversational,
        usedFallback: true
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    // Build conversation context
    let conversationContext = ''
    if (conversationHistory.length > 0) {
      conversationContext = '\n\nPrevious conversation:\n'
      conversationHistory.slice(-3).forEach((msg, idx) => {
        conversationContext += `${idx + 1}. ${msg}\n`
      })
      conversationContext += '\nNow respond naturally, as if continuing the conversation.'
    }

    const languageInstruction = targetLanguage !== 'English'
      ? `\n\nCRITICAL: Respond ONLY in ${targetLanguage} language (${languageCode}).`
      : ''

    const prompt = `You are a friendly, conversational AI creating natural voice messages for ambient audio overlays.

CONVERSATIONAL STYLE REQUIREMENTS:
- Sound like a real friend chatting during music
- Use conversational fillers: "you know", "actually", "by the way", "oh"
- Reference previous messages naturally if context exists
- Use casual language: "gonna", "wanna", "gotta"
- Add natural reactions: "oh!", "hey!", "wait"
- Keep it SHORT (max 15 words) - like a quick chat
- Use pauses naturally: add "..." between thoughts

CONVERSATION EXAMPLES:
User: "meeting at 3"
AI: "Oh hey... you've got that meeting at 3, right? Don't wanna miss it!"

User: "happy birthday"  
AI: "Hey! Happy birthday! Hope you're having an awesome day, you know?"

User: "drink water"
AI: "Oh yeah... quick reminder to grab some water. Staying hydrated, right?"

${conversationContext}

Current message: "${message}"
${songContext ? `Playing: ${songContext}` : ''}
${languageInstruction}

Create a CONVERSATIONAL, natural response (max 15 words, add "..." for pauses):`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const refinedMessage = response.text().trim().replace(/^["']|["']$/g, '')

    return NextResponse.json({
      original: message,
      refined: refinedMessage,
      conversational: true,
      usedFallback: false
    })
  } catch (error) {
    console.error('Conversational Refinement Error:', error)
    
    // Fallback conversational
    const conversational = `Hey... ${message.toLowerCase()}... you know?`
    
    return NextResponse.json({
      original: message,
      refined: conversational,
      conversational: true,
      usedFallback: true
    })
  }
}




