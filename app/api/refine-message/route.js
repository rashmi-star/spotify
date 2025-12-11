import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

// Fallback refinement rules (works without Gemini for instant demo)
function fallbackRefinement(message, targetLanguage = 'English') {
  // Simple but friendly refinement
  let refined = message.trim()
  
  // If Tamil, provide basic translation
  if (targetLanguage === 'Tamil' || targetLanguage === 'tamil') {
    const translations = {
      'happy birthday': 'வணக்கம்! பிறந்தநாள் வாழ்த்துக்கள்! உங்களுக்கு மகிழ்ச்சியான நாள் இருக்க வாழ்த்துகிறேன்!',
      'meeting at 3': 'வணக்கம்! உங்களுக்கு மூன்று மணிக்கு சந்திப்பு உள்ளது. தவறவிடாதீர்கள்!',
      'drink water': 'வணக்கம் நண்பரே! தண்ணீர் குடிக்க நினைவூட்டல். நீரேற்றம் உங்களை நன்றாக வைத்திருக்கும்!',
      'meeting': 'வணக்கம்! உங்களுக்கு சந்திப்பு உள்ளது. தவறவிடாதீர்கள்!',
      'birthday': 'பிறந்தநாள் வாழ்த்துக்கள்! மகிழ்ச்சியான நாள்!',
      'reminder': 'நினைவூட்டல்: இதை நினைவில் கொள்ளுங்கள்!'
    }
    
    const lowerMessage = message.toLowerCase().trim()
    for (const [key, tamil] of Object.entries(translations)) {
      if (lowerMessage.includes(key)) {
        return tamil
      }
    }
    
    // Generic Tamil greeting if no match
    return `வணக்கம்! ${message} - இது ஒரு நினைவூட்டல்.`
  }
  
  // English fallback
  // Make it more conversational and friendly
  if (!refined.match(/^(hey|hi|hello)/i)) {
    refined = `Hey! ${refined.charAt(0).toUpperCase()}${refined.slice(1)}`
  }
  
  // Add friendly elaboration based on content
  if (refined.length < 30) {
    if (refined.toLowerCase().includes('meeting')) {
      refined += " Don't want you to miss it!"
    } else if (refined.toLowerCase().includes('birthday')) {
      refined += " Hope you're having an amazing day!"
    } else if (refined.toLowerCase().includes('reminder')) {
      refined += " Just looking out for you!"
    } else {
      refined += " Just wanted to let you know!"
    }
  }
  
  // Ensure it ends with proper punctuation
  if (!refined.match(/[.!?]$/)) {
    refined += '!'
  }
  
  return refined
}

export async function POST(request) {
  let message, context, targetLanguage, languageCode
  
  try {
    const body = await request.json()
    message = body.message
    context = body.context
    targetLanguage = body.targetLanguage || 'English'
    languageCode = body.languageCode || 'en'

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Check if Gemini API key is available
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      // Use fallback refinement (instant demo mode)
      console.log(`Using fallback refinement (no Gemini API key) for ${targetLanguage}`)
      const refinedMessage = fallbackRefinement(message, targetLanguage)
      
      return NextResponse.json({ 
        original: message,
        refined: refinedMessage,
        usedFallback: true,
        language: targetLanguage
      })
    }

    // Use Gemini AI for advanced refinement with language translation
    const genAI = new GoogleGenerativeAI(apiKey)
    // Use gemini-pro (most stable model)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    let prompt = ''
    
    console.log(`🔍 Translation Check: targetLanguage="${targetLanguage}", languageCode="${languageCode}"`)
    
    if (targetLanguage !== 'English' && targetLanguage !== 'english') {
      // TRANSLATION MODE - Ultra explicit instructions
      console.log(`🌍 TRANSLATION MODE ACTIVATED for ${targetLanguage}`)
      
      prompt = `You are a professional translator. Your ONLY job is to translate English to ${targetLanguage}.

CRITICAL RULES:
1. Respond ONLY in ${targetLanguage} script (${languageCode})
2. DO NOT use ANY English words
3. DO NOT include English translations
4. Make it natural and conversational in ${targetLanguage}
5. Add friendly elaboration (2-3 sentences)

TRANSLATION EXAMPLES FOR TAMIL:
English: "happy birthday"
Tamil: "வணக்கம்! பிறந்தநாள் வாழ்த்துக்கள்! உங்களுக்கு மகிழ்ச்சியான நாள் இருக்க வாழ்த்துகிறேன்!"

English: "meeting at 3"
Tamil: "வணக்கம்! உங்களுக்கு மூன்று மணிக்கு சந்திப்பு உள்ளது. தவறவிடாதீர்கள்!"

English: "drink water"
Tamil: "வணக்கம் நண்பரே! தண்ணீர் குடிக்க நினைவூட்டல். நீரேற்றம் உங்களை நன்றாக வைத்திருக்கும்!"

NOW TRANSLATE THIS TO ${targetLanguage.toUpperCase()}:
English message: "${message}"

Respond ONLY in ${targetLanguage} script, no English:`
    } else {
      // ENGLISH MODE - Original friendly refinement
      prompt = `You are a friendly AI assistant that creates warm, personable voice messages for ambient audio overlays in music.

Transform the following message into a natural, friendly, engaging voice snippet that feels like a caring friend speaking. Make it:
- Warm and personable (2-3 sentences is perfect)
- Elaborate with context if the original is brief
- Natural and conversational (use "hey", "you know", "just wanted to...")
- Emotionally aware and uplifting
- Add personality and friendliness
- Use contractions (you're, it's, don't) for natural flow

Examples:
- "meeting at 3" → "Hey! Just a friendly reminder - you've got that meeting coming up at 3pm. Don't want you to miss it!"
- "happy birthday" → "Hey there! Happy birthday! Hope you're having an absolutely amazing day filled with joy and awesome moments."
- "drink water" → "Hey friend, just a quick reminder to grab some water! Staying hydrated keeps you feeling great, you know."

Original message: "${message}"
${context ? `Context: ${context}` : ''}

Refined message (respond ONLY with the refined, friendly message):`
    }

    console.log(`📤 Sending prompt to Gemini (length: ${prompt.length} chars)`)
    console.log(`📝 Prompt preview: ${prompt.substring(0, 200)}...`)
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const refinedMessage = response.text().trim()
    
    console.log(`✅ Gemini Response: "${refinedMessage}"`)
    console.log(`🔍 Response language check: Contains Tamil script? ${/[\u0B80-\u0BFF]/.test(refinedMessage)}`)
    console.log(`🔍 Response language check: Contains English? ${/[a-zA-Z]/.test(refinedMessage)}`)

    return NextResponse.json({ 
      original: message,
      refined: refinedMessage,
      usedFallback: false,
      language: targetLanguage,
      debug: {
        targetLanguage,
        languageCode,
        responseLength: refinedMessage.length,
        containsTamil: /[\u0B80-\u0BFF]/.test(refinedMessage)
      }
    })
  } catch (error) {
    console.error('Gemini API Error:', error)
    
    // Fall back to simple refinement on error (message already extracted above)
    if (message) {
      console.log(`⚠️ Gemini API failed, using fallback translation for ${targetLanguage}`)
      const refinedMessage = fallbackRefinement(message, targetLanguage)
      
      return NextResponse.json({ 
        original: message,
        refined: refinedMessage,
        usedFallback: true,
        note: 'Used fallback due to API error',
        language: targetLanguage
      })
    }
    
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    )
  }
}

