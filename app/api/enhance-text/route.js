import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

// Convert text to SSML for better prosody
function addSSMLProsody(text, mood = 'calm') {
  // Add natural pauses and emphasis
  let ssmlText = text
  
  // Add pauses after greetings
  ssmlText = ssmlText.replace(/(Hey|Hi|Hello)[!]?/gi, '<break time="300ms"/>$1<break time="200ms"/>')
  
  // Add emphasis on important words (birthday, meeting, reminder, etc.)
  const emphasisWords = ['birthday', 'meeting', 'reminder', 'important', 'don\'t forget', 'remember']
  emphasisWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    ssmlText = ssmlText.replace(regex, `<emphasis level="moderate">${word}</emphasis>`)
  })
  
  // Add pauses after sentences (but not too long for ambient)
  ssmlText = ssmlText.replace(/[.!?]\s+/g, '<break time="400ms"/>')
  
  // Add slight pause before important phrases
  ssmlText = ssmlText.replace(/\b(don't|remember|important)\b/gi, '<break time="200ms"/>$1')
  
  // Wrap in SSML speak tag
  return `<speak>${ssmlText}</speak>`
}

// Optimize text length - keep it concise for ambient voice
function optimizeTextLength(text, maxLength = 120) {
  if (text.length <= maxLength) return text
  
  // Try to cut at natural breakpoints
  const sentences = text.split(/[.!?]+/)
  let optimized = ''
  
  for (const sentence of sentences) {
    if ((optimized + sentence).length <= maxLength) {
      optimized += sentence + '. '
    } else {
      break
    }
  }
  
  return optimized.trim() || text.substring(0, maxLength - 3) + '...'
}

export async function POST(request) {
  try {
    const { 
      text, 
      mood = 'calm',
      songContext,
      targetLanguage = 'English',
      languageCode = 'en'
    } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY

    // Enhanced prompt for hackathon - shorter, more natural, context-aware
    let enhancedText = text
    
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const languageInstruction = targetLanguage !== 'English'
          ? `\n\nCRITICAL: Respond ONLY in ${targetLanguage} language (${languageCode}). Keep it SHORT (max 15 words).`
          : ''

        const prompt = `You are creating a CONVERSATIONAL voice message for ambient audio overlay.

CONVERSATIONAL STYLE:
- Sound like a real friend chatting: "you know", "actually", "oh", "right?"
- Use casual language: "gonna", "wanna", "gotta"
- Natural reactions: "oh!", "hey!", "wait"
- MAXIMUM 15 words (shorter = more natural)
- Add pauses with "..." between thoughts
- Match the ${mood} mood of the song

Song context: ${songContext || 'Ambient music'}

CONVERSATIONAL EXAMPLES:
- "meeting at 3" → "Oh hey... you've got that meeting at 3, right? Don't wanna miss it!"
- "happy birthday" → "Hey! Happy birthday! Hope you're having an awesome day, you know?"
- "drink water" → "Oh yeah... quick reminder to grab some water. Staying hydrated, right?"

Original message: "${text}"
${languageInstruction}

Create a CONVERSATIONAL, natural response (max 15 words, add "..." for pauses):`

        const result = await model.generateContent(prompt)
        const response = await result.response
        enhancedText = response.text().trim()
        
        // Remove quotes if Gemini added them
        enhancedText = enhancedText.replace(/^["']|["']$/g, '')
      } catch (error) {
        console.log('Gemini enhancement failed, using original text')
      }
    }

    // Optimize length
    const optimizedText = optimizeTextLength(enhancedText, 120)
    
    // Add SSML prosody
    const ssmlText = addSSMLProsody(optimizedText, mood)

    return NextResponse.json({
      original: text,
      enhanced: optimizedText,
      ssml: ssmlText,
      wordCount: optimizedText.split(/\s+/).length,
      optimized: true
    })
  } catch (error) {
    console.error('Text Enhancement Error:', error)
    
    // Fallback: just add basic SSML
    const ssmlText = addSSMLProsody(text, mood)
    
    return NextResponse.json({
      original: text,
      enhanced: text,
      ssml: ssmlText,
      wordCount: text.split(/\s+/).length,
      optimized: false,
      error: error.message
    })
  }
}

