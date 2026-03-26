import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { 
      text, 
      voiceId = 'EXAVITQu4vr4xnSDxMaL', 
      voiceSettings,
      languageCode = 'en',
      isMultilingual = false
    } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      )
    }

    // Use provided voice settings or friendly defaults
    const finalVoiceSettings = voiceSettings || {
      stability: 0.6,
      similarity_boost: 0.85,
      style: 0.6,
      use_speaker_boost: true
    }

    // Choose model based on language - multilingual model for non-English
    const modelId = isMultilingual ? 'eleven_multilingual_v2' : 'eleven_turbo_v2_5'
    
    // For multilingual, use a voice that supports Tamil better
    // Default voice EXAVITQu4vr4xnSDxMaL supports multilingual
    // For Tamil, we might need to use a different voice or let the model auto-detect
    const finalVoiceId = isMultilingual ? voiceId : voiceId
    
    // Check if text contains Tamil script
    const containsTamil = /[\u0B80-\u0BFF]/.test(text)
    const containsEnglish = /[a-zA-Z]/.test(text)
    
    console.log(`🎤 Generating voice with model: ${modelId}, language: ${languageCode}`)
    console.log(`📝 Text preview: ${text.substring(0, 100)}...`)
    console.log(`🔍 Text analysis: Tamil script=${containsTamil}, English=${containsEnglish}`)
    console.log('🎤 Voice settings:', finalVoiceSettings)
    
    if (isMultilingual && !containsTamil && containsEnglish) {
      console.warn('⚠️ WARNING: Multilingual model requested but text is in English!')
      console.warn('⚠️ The voice may not sound correct for Tamil songs.')
    }

    // Check if text contains SSML tags
    const hasSSML = text.includes('<speak>') || text.includes('<break') || text.includes('<emphasis')
    
    // Build request body - multilingual model auto-detects language from text
    const requestBody = {
      text: text,
      model_id: modelId,
      voice_settings: finalVoiceSettings
    }
    
    // Enable SSML if detected
    if (hasSSML) {
      requestBody.enable_logging = false // Disable logging for better performance
      console.log('✨ SSML detected - enhanced prosody enabled')
    }
    
    // Explicitly set language_code for multilingual model (safer than auto-detect)
    if (isMultilingual && languageCode) {
      requestBody.language_code = languageCode
      console.log(`🌍 Explicitly setting language_code: ${languageCode} for multilingual model`)
    } else if (isMultilingual) {
      console.log(`🌍 Using multilingual model - will auto-detect from Tamil script`)
    }

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ElevenLabs API error: ${error}`)
    }

    // Get audio data
    const audioBuffer = await response.arrayBuffer()
    
    // Convert to base64 for easy transmission
    const base64Audio = Buffer.from(audioBuffer).toString('base64')

    return NextResponse.json({ 
      audio: base64Audio,
      mimeType: 'audio/mpeg'
    })
  } catch (error) {
    console.error('ElevenLabs API Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate voice', details: error.message },
      { status: 500 }
    )
  }
}

