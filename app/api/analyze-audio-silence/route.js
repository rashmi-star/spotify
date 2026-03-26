import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { audioData, sampleRate, duration } = body

    if (!audioData || !Array.isArray(audioData)) {
      return NextResponse.json(
        { error: 'Audio data array is required' },
        { status: 400 }
      )
    }

    // Ollama API endpoint
    const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434'

    // Analyze audio characteristics
    const windowSize = Math.floor(sampleRate * 0.5) // 0.5 second windows
    const windows = []
    
    // Calculate RMS for each window
    for (let i = 0; i < audioData.length - windowSize; i += Math.floor(windowSize / 2)) {
      let sum = 0
      for (let j = 0; j < windowSize && i + j < audioData.length; j++) {
        sum += audioData[i + j] * audioData[i + j]
      }
      const rms = Math.sqrt(sum / windowSize)
      const time = i / sampleRate
      
      windows.push({
        time: time.toFixed(2),
        volume: rms.toFixed(4),
        intensity: rms > 0.15 ? 'high' : rms > 0.08 ? 'medium' : 'low'
      })
    }

    // Find quietest windows (bottom 20%)
    const sortedWindows = [...windows].sort((a, b) => parseFloat(a.volume) - parseFloat(b.volume))
    const quietestWindows = sortedWindows.slice(0, Math.floor(windows.length * 0.2))
    
    // Prepare data for AI analysis
    const analysisData = {
      totalWindows: windows.length,
      quietestWindows: quietestWindows.slice(0, 10), // Top 10 quietest
      averageVolume: (windows.reduce((sum, w) => sum + parseFloat(w.volume), 0) / windows.length).toFixed(4),
      duration: duration.toFixed(2),
      sampleRate: sampleRate
    }

    // Use Ollama to intelligently select the best placement
    const prompt = `You are an audio analysis expert. Analyze this audio data and recommend the BEST time to place a voice overlay.

Audio Analysis Data:
- Total duration: ${analysisData.duration} seconds
- Total windows analyzed: ${analysisData.totalWindows}
- Average volume: ${analysisData.averageVolume}
- Sample rate: ${analysisData.sampleRate} Hz

Top 10 Quietest Moments (candidates):
${analysisData.quietestWindows.map((w, i) => `${i + 1}. Time: ${w.time}s, Volume: ${w.volume}, Intensity: ${w.intensity}`).join('\n')}

CRITICAL REQUIREMENTS:
1. Choose a moment that is QUIET (low volume)
2. Avoid the very beginning (first 1 second) - too abrupt
3. Avoid the very end (last 2 seconds) - might cut off
4. Prefer moments between 2-12 seconds for natural placement
5. If multiple quiet moments exist, choose one that's NOT too close to vocals/instruments
6. Consider context: quieter moments are better for voice clarity

Respond ONLY with a JSON object in this exact format:
{
  "recommendedTime": 3.5,
  "confidence": 85,
  "reasoning": "Brief explanation of why this time was chosen"
}

Example response:
{
  "recommendedTime": 4.2,
  "confidence": 90,
  "reasoning": "This moment has the lowest volume (0.0234) and falls in the optimal 2-12 second range, avoiding vocals"
}`

    console.log(`🤖 Using Ollama to analyze audio silence for ${duration.toFixed(2)}s audio`)

    // Call Ollama API
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
          temperature: 0.3, // Lower temperature for more consistent analysis
          num_predict: 200
        }
      })
    })

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.statusText}`)
    }

    const ollamaData = await ollamaResponse.json()
    let aiResponse = ollamaData.response?.trim() || ''

    // Extract JSON from response (might have extra text)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    let analysisResult

    if (jsonMatch) {
      try {
        analysisResult = JSON.parse(jsonMatch[0])
      } catch (e) {
        console.warn('Failed to parse AI JSON, using fallback')
        // Fallback: use the quietest window
        const bestWindow = quietestWindows[0]
        analysisResult = {
          recommendedTime: parseFloat(bestWindow.time),
          confidence: 75,
          reasoning: 'AI parsing failed, using quietest detected moment'
        }
      }
    } else {
      // Fallback: use the quietest window
      const bestWindow = quietestWindows[0]
      analysisResult = {
        recommendedTime: parseFloat(bestWindow.time),
        confidence: 70,
        reasoning: 'AI response format invalid, using quietest detected moment'
      }
    }

    // Validate recommended time
    if (analysisResult.recommendedTime < 1 || analysisResult.recommendedTime > duration - 2) {
      // Use quietest window that's in valid range
      const validWindow = quietestWindows.find(w => {
        const time = parseFloat(w.time)
        return time >= 1 && time <= duration - 2
      }) || quietestWindows[0]
      
      analysisResult.recommendedTime = parseFloat(validWindow.time)
      analysisResult.confidence = Math.max(analysisResult.confidence - 10, 50)
      analysisResult.reasoning += ' (adjusted to valid range)'
    }

    console.log(`✅ AI Silence Analysis: Recommended time ${analysisResult.recommendedTime}s (confidence: ${analysisResult.confidence}%)`)
    console.log(`💭 Reasoning: ${analysisResult.reasoning}`)

    return NextResponse.json({
      recommendedTime: analysisResult.recommendedTime,
      confidence: analysisResult.confidence,
      reasoning: analysisResult.reasoning,
      quietestWindows: quietestWindows.slice(0, 5), // Return top 5 for reference
      averageVolume: analysisData.averageVolume,
      usedAI: true
    })

  } catch (error) {
    console.error('AI Audio Analysis Error:', error)

    // Fallback to basic RMS analysis
    // Note: Can't re-read body, so we'll use default values
    const defaultSampleRate = 44100
    const defaultDuration = 10
    
    // Return safe fallback
    return NextResponse.json({
      recommendedTime: 3,
      confidence: 50,
      reasoning: 'Fallback - AI analysis failed',
      usedAI: false
    })
  }
}

