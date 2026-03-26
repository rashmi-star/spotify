import { NextResponse } from 'next/server'

export async function POST(request) {
  let userMessage, context, targetLanguage, languageCode, conversationHistory

  try {
    const body = await request.json()
    userMessage = body.message
    context = body.context || ''
    targetLanguage = body.targetLanguage || 'English'
    languageCode = body.languageCode || 'en'
    conversationHistory = body.conversationHistory || []

    if (!userMessage) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Ollama API endpoint
    const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434'

    // Build conversation context
    const conversationContext = conversationHistory.length > 0
      ? conversationHistory.slice(-4).map(msg => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n')
      : ''

    let prompt = ''

    if (targetLanguage !== 'English' && targetLanguage !== 'english') {
      // TRANSLATION MODE
      prompt = `You are a friendly AI assistant. The user just said: "${userMessage}"

${conversationContext ? `Previous conversation:\n${conversationContext}\n` : ''}

Respond naturally and conversationally in ${targetLanguage} (${languageCode}). Make your response:
- Warm and friendly
- Brief (2-3 sentences max, under 30 words)
- Natural and conversational
- Appropriate for voice overlay in music
- ONLY in ${targetLanguage} script

${context ? `Context: ${context}` : ''}

Respond ONLY in ${targetLanguage}:`
    } else {
      // ENGLISH MODE - Conversational response
      prompt = `You are a friendly AI assistant. The user just said: "${userMessage}"

${conversationContext ? `Previous conversation:\n${conversationContext}\n` : ''}

CRITICAL: Keep your response SHORT - maximum 2 sentences, under 25 words total. Be concise and natural.

Respond naturally and conversationally:
- Warm and friendly (like a caring friend)
- VERY BRIEF (1-2 sentences max, under 25 words)
- Natural and conversational
- Appropriate for voice overlay in music
- Use contractions (you're, it's, don't) for natural flow
- Add natural pauses with "..." if needed
- If user expresses emotion (sad, happy, stressed, etc.), respond empathetically and appropriately
- DO NOT explain what you're doing, just respond directly

${context ? `Context: ${context}` : ''}

Examples:
User: "motivate me"
You: "Hey! You've got this! Keep pushing forward... stay focused, and remember - every step forward is progress. You're doing amazing!"

User: "I'm feeling sad"
You: "Hey... I'm here for you. Sometimes music can help lift our spirits. Let's find something that makes you feel better, okay?"

User: "happy birthday"
You: "Happy birthday! Hope you're having an amazing day filled with joy and celebration!"

User: "meeting at 3"
You: "Oh hey... just a quick reminder... your meeting's at 3 today, right? Don't want you to miss it!"

User: "I'm feeling sad just give me a"
You: "Hey... I hear you. Let's find some uplifting music to help lift your spirits. You're not alone, and things will get better."

Now respond to: "${userMessage}"
Respond ONLY with your conversational response:`
    }

    console.log(`💬 Using Ollama (gemma:2b) for: "${userMessage}"`)

    // Use Ollama API directly (REST call)
    // Using gemma:2b (smaller model, works with limited RAM)
    const ollamaResponse = await fetch(`${ollamaHost}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma:2b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 100, // Limit response length
        }
      })
    })

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.statusText}`)
    }

    const ollamaData = await ollamaResponse.json()
    const aiResponse = ollamaData.response?.trim() || ''

    console.log(`✅ Ollama Response: "${aiResponse}"`)

    return NextResponse.json({
      userMessage: userMessage,
      response: aiResponse,
      usedFallback: false,
      language: targetLanguage,
      model: 'gemma:2b'
    })
  } catch (error) {
    console.error('Ollama API Error:', error)

    // Fallback response
    const fallbackResponses = {
      'motivate me': 'Hey! You\'ve got this! Keep pushing forward, stay focused, and remember - every step forward is progress. You\'re doing amazing!',
      'happy birthday': 'Happy birthday! Hope you\'re having an amazing day filled with joy and celebration!',
      'meeting': 'Don\'t forget about your meeting! Make sure you\'re prepared and ready to go.',
      'reminder': 'Just a friendly reminder - stay on track and keep moving forward!',
      'i\'m feeling sad': 'Hey... I\'m here for you. Sometimes music can help lift our spirits. Let\'s find something that makes you feel better, okay?',
      'feeling sad': 'Hey... I hear you. Let\'s find some uplifting music to help lift your spirits. You\'re not alone, and things will get better.',
      'i\'m sad': 'I\'m sorry you\'re feeling down. Music has a way of healing... let\'s find something that brings you comfort and peace.'
    }

    const lowerMessage = userMessage?.toLowerCase() || ''
    let response = fallbackResponses[lowerMessage]
    
    // Check for partial matches
    if (!response) {
      for (const [key, value] of Object.entries(fallbackResponses)) {
        if (lowerMessage.includes(key)) {
          response = value
          break
        }
      }
    }
    
    if (!response) {
      response = `Got it! ${userMessage || 'your message'}. Here's a friendly response for you!`
    }

    if (targetLanguage === 'Tamil') {
      response = 'வணக்கம்! உங்கள் செய்தியைப் பெற்றேன். நீங்கள் சிறப்பாகச் செய்கிறீர்கள்!'
    }

    return NextResponse.json({
      userMessage: userMessage,
      response: response,
      usedFallback: true,
      note: error.message,
      language: targetLanguage || 'English'
    })
  }
}
