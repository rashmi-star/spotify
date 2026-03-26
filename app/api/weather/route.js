import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city') || 'New York'
    const units = searchParams.get('units') || 'metric' // metric (Celsius) or imperial (Fahrenheit)

    // Using OpenWeatherMap (free tier: 60 calls/minute, 1M calls/month)
    // Alternative: WeatherAPI.com, Open-Meteo (completely free, no API key)
    const apiKey = process.env.WEATHER_API_KEY || 'demo'
    
    // If no API key, use Open-Meteo (completely free, no key needed)
    if (!apiKey || apiKey === 'demo' || apiKey === 'your_weather_api_key_here') {
      console.log('🌤️ Using Open-Meteo (free, no API key needed)')
      
      try {
        // Get coordinates for city (using a simple geocoding approach)
        // For demo, we'll use a default location
        const lat = 40.7128 // Default: New York
        const lon = -74.0060
        
        // Open-Meteo API (completely free, no API key)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m&timezone=auto`
        
        const weatherResponse = await fetch(weatherUrl)
        const weatherData = await weatherResponse.json()
        
        if (weatherData.current) {
          return NextResponse.json({
            city: city,
            temperature: Math.round(weatherData.current.temperature_2m),
            description: getWeatherDescription(weatherData.current.weather_code),
            humidity: null,
            windSpeed: Math.round(weatherData.current.wind_speed_10m),
            icon: getWeatherIcon(weatherData.current.weather_code),
            units: units,
            usedOpenMeteo: true
          })
        }
      } catch (e) {
        console.log('Open-Meteo failed, using demo data')
      }
      
      // Fallback demo data
      return NextResponse.json({
        city: city,
        temperature: 22,
        description: 'Partly Cloudy',
        humidity: 65,
        windSpeed: 12,
        icon: '⛅',
        units: units,
        usedDemo: true
      })
    }

    // Real API call to OpenWeatherMap
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${units}&appid=${apiKey}`
    
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      city: data.name,
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind?.speed || 0),
      icon: getWeatherIconFromCode(data.weather[0].icon),
      units: units,
      usedDemo: false
    })
  } catch (error) {
    console.error('Weather API Error:', error)
    
    // Return demo data on error
    return NextResponse.json({
      city: 'Unknown',
      temperature: 20,
      description: 'Clear Sky',
      humidity: 60,
      windSpeed: 10,
      icon: '☀️',
      units: 'metric',
      usedDemo: true,
      error: error.message
    })
  }
}

// Helper functions
function getWeatherDescription(code) {
  const codes = {
    0: 'Clear Sky',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing Rime Fog',
    51: 'Light Drizzle',
    53: 'Moderate Drizzle',
    55: 'Dense Drizzle',
    61: 'Slight Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
    71: 'Slight Snow',
    73: 'Moderate Snow',
    75: 'Heavy Snow',
    80: 'Slight Rain Showers',
    81: 'Moderate Rain Showers',
    82: 'Violent Rain Showers',
    95: 'Thunderstorm'
  }
  return codes[code] || 'Unknown'
}

function getWeatherIcon(code) {
  if (code === 0) return '☀️'
  if (code <= 2) return '⛅'
  if (code <= 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 55) return '🌦️'
  if (code <= 65) return '🌧️'
  if (code <= 75) return '❄️'
  if (code <= 82) return '🌧️'
  if (code === 95) return '⛈️'
  return '🌤️'
}

function getWeatherIconFromCode(icon) {
  const iconMap = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️'
  }
  return iconMap[icon] || '🌤️'
}




