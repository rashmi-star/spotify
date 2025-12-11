import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

export async function POST(request) {
  let newsArticles, targetLanguage, languageCode
  
  try {
    const body = await request.json()
    newsArticles = body.newsArticles
    targetLanguage = body.targetLanguage || 'English'
    languageCode = body.languageCode || 'en'

    if (!newsArticles || !Array.isArray(newsArticles) || newsArticles.length === 0) {
      return NextResponse.json(
        { error: 'News articles are required' },
        { status: 400 }
      )
    }

    // Combine news articles into a summary
    const newsText = newsArticles.map((article, index) => 
      `${index + 1}. ${article.title}${article.description ? ` - ${article.description}` : ''}`
    ).join('\n\n')

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      // Fallback summary
      const fallbackSummary = `Here's what's happening: ${newsArticles[0]?.title || 'Latest news updates'}. Stay informed!`
      
      return NextResponse.json({
        summary: targetLanguage === 'Tamil' 
          ? `செய்திகள்: ${newsArticles[0]?.title || 'சமீபத்திய செய்திகள்'}. தகவலுடன் இருங்கள்!`
          : fallbackSummary,
        usedFallback: true,
        language: targetLanguage
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    // Try different model names - some APIs use different naming
    let model
    const modelNames = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
    
    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({ model: modelName })
        console.log(`✅ Using Gemini model: ${modelName}`)
        break
      } catch (e) {
        console.log(`⚠️ Model ${modelName} not available, trying next...`)
        continue
      }
    }
    
    if (!model) {
      // If all models fail, use fallback
      throw new Error('No Gemini models available')
    }

    const languageInstruction = targetLanguage !== 'English'
      ? `\n\nCRITICAL: Respond ONLY in ${targetLanguage} language (${languageCode}). Do NOT use English.`
      : ''

    const prompt = `You are a friendly AI assistant that creates warm, conversational summaries of news for ambient voice overlays in music.

Task: Summarize the following news articles into a brief, friendly 2-3 sentence summary that feels like a caring friend sharing updates. Make it:
- Warm and personable
- Brief but informative (2-3 sentences max)
- Natural and conversational
- Suitable for voice overlay in music
- Friendly and engaging

News Articles:
${newsText}
${languageInstruction}

Summary (respond ONLY with the summary in ${targetLanguage}):`

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const summary = response.text().trim()

      return NextResponse.json({
        summary,
        usedFallback: false,
        language: targetLanguage
      })
    } catch (generateError) {
      // If generateContent fails, use fallback
      console.error('generateContent failed:', generateError)
      throw generateError // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('News Summarization Error:', error)
    
    // Create a better fallback summary from news articles
    if (newsArticles && newsArticles.length > 0) {
      const titles = newsArticles.slice(0, 3).map(a => a.title).join(', ')
      const fallbackSummary = `Hey! Here's what's happening: ${titles}. Stay informed and have a great day!`
      
      return NextResponse.json({
        summary: targetLanguage === 'Tamil'
          ? `வணக்கம்! செய்திகள்: ${titles}. தகவலுடன் இருங்கள்!`
          : fallbackSummary,
        usedFallback: true,
        language: targetLanguage || 'English',
        note: 'Used fallback summary (Gemini API unavailable)'
      })
    }
    
    // Last resort fallback
    const fallbackSummary = `Here's what's happening: Latest news updates. Stay informed!`
    
    return NextResponse.json({
      summary: targetLanguage === 'Tamil'
        ? `செய்திகள்: சமீபத்திய செய்திகள். தகவலுடன் இருங்கள்!`
        : fallbackSummary,
      usedFallback: true,
      language: targetLanguage || 'English',
      note: 'Used fallback summary'
    })
  }
}

