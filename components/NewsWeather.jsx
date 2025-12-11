'use client'

import { useState, useEffect } from 'react'
import { FaNewspaper, FaCloudSun, FaSpinner } from 'react-icons/fa'
import styles from './NewsWeather.module.css'

const NewsWeather = () => {
  const [news, setNews] = useState([])
  const [weather, setWeather] = useState(null)
  const [loadingNews, setLoadingNews] = useState(true)
  const [loadingWeather, setLoadingWeather] = useState(true)
  const [city, setCity] = useState('New York')

  useEffect(() => {
    fetchNews()
    fetchWeather()
  }, [])

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news?limit=3')
      const data = await response.json()
      setNews(data.articles || [])
    } catch (error) {
      console.error('Failed to fetch news:', error)
    } finally {
      setLoadingNews(false)
    }
  }

  const fetchWeather = async (cityName = city) => {
    try {
      setLoadingWeather(true)
      const response = await fetch(`/api/weather?city=${cityName}`)
      const data = await response.json()
      setWeather(data)
    } catch (error) {
      console.error('Failed to fetch weather:', error)
    } finally {
      setLoadingWeather(false)
    }
  }

  const handleCityChange = (e) => {
    if (e.key === 'Enter') {
      fetchWeather(e.target.value)
    }
  }

  return (
    <div className={styles.newsWeatherContainer}>
      {/* Weather Widget */}
      <div className={styles.weatherCard}>
        <div className={styles.weatherHeader}>
          <FaCloudSun className={styles.weatherIcon} />
          <h3 className={styles.cardTitle}>Weather</h3>
        </div>
        {loadingWeather ? (
          <div className={styles.loading}>
            <FaSpinner className={styles.spinner} />
            <span>Loading...</span>
          </div>
        ) : weather ? (
          <div className={styles.weatherContent}>
            <div className={styles.weatherMain}>
              <div className={styles.weatherTemp}>
                <span className={styles.temperature}>{weather.temperature}°</span>
                <span className={styles.unit}>{weather.units === 'metric' ? 'C' : 'F'}</span>
              </div>
              <div className={styles.weatherEmoji}>{weather.icon}</div>
            </div>
            <div className={styles.weatherDetails}>
              <p className={styles.weatherDescription}>{weather.description}</p>
              <div className={styles.weatherExtra}>
                {weather.humidity && (
                  <span>Humidity: {weather.humidity}%</span>
                )}
                {weather.windSpeed && (
                  <span>Wind: {weather.windSpeed} km/h</span>
                )}
              </div>
            </div>
            <div className={styles.cityInput}>
              <input
                type="text"
                placeholder="Enter city name..."
                defaultValue={weather.city}
                onKeyPress={handleCityChange}
                className={styles.cityInputField}
              />
            </div>
          </div>
        ) : (
          <div className={styles.error}>Failed to load weather</div>
        )}
      </div>

      {/* News Widget */}
      <div className={styles.newsCard}>
        <div className={styles.newsHeader}>
          <FaNewspaper className={styles.newsIcon} />
          <h3 className={styles.cardTitle}>Latest News</h3>
        </div>
        {loadingNews ? (
          <div className={styles.loading}>
            <FaSpinner className={styles.spinner} />
            <span>Loading...</span>
          </div>
        ) : news.length > 0 ? (
          <div className={styles.newsList}>
            {news.map((article, index) => (
              <div key={index} className={styles.newsItem}>
                <h4 className={styles.newsTitle}>{article.title}</h4>
                <p className={styles.newsDescription}>
                  {article.description?.substring(0, 100)}...
                </p>
                {article.source && (
                  <span className={styles.newsSource}>{article.source.name}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.error}>No news available</div>
        )}
      </div>
    </div>
  )
}

export default NewsWeather

