import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'general'
    const country = searchParams.get('country') || 'us'
    const limit = parseInt(searchParams.get('limit') || '5')

    // Using NewsAPI.org (free tier: 100 requests/day)
    // Alternative: NewsData.io, GNews API
    const apiKey = process.env.NEWS_API_KEY || 'demo'
    
    // If no API key, return demo data
    if (!apiKey || apiKey === 'demo' || apiKey === 'your_news_api_key_here') {
      console.log('📰 Using demo news data (no API key)')
      return NextResponse.json({
        articles: [
          {
            title: 'Tech Innovation Reaches New Heights',
            description: 'Latest developments in AI and technology are transforming industries worldwide.',
            url: '#',
            publishedAt: new Date().toISOString(),
            source: { name: 'Tech News' }
          },
          {
            title: 'Global Markets Show Positive Trends',
            description: 'Financial markets continue to show resilience amid economic challenges.',
            url: '#',
            publishedAt: new Date().toISOString(),
            source: { name: 'Finance Daily' }
          },
          {
            title: 'Climate Action Gains Momentum',
            description: 'Countries worldwide are stepping up efforts to combat climate change.',
            url: '#',
            publishedAt: new Date().toISOString(),
            source: { name: 'Eco News' }
          }
        ],
        usedDemo: true
      })
    }

    // Real API call to NewsAPI.org
    const url = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&pageSize=${limit}&apiKey=${apiKey}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Spotify-Music-App'
      }
    })

    if (!response.ok) {
      throw new Error(`News API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      articles: data.articles || [],
      totalResults: data.totalResults || 0,
      usedDemo: false
    })
  } catch (error) {
    console.error('News API Error:', error)
    
    // Return demo data on error
    return NextResponse.json({
      articles: [
        {
          title: 'Breaking: Latest Updates',
          description: 'Stay informed with the latest news and updates.',
          url: '#',
          publishedAt: new Date().toISOString(),
          source: { name: 'News Feed' }
        }
      ],
      usedDemo: true,
      error: error.message
    })
  }
}

