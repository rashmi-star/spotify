'use client'

import { useState, useEffect } from 'react'
import { FaMicrophone, FaMusic, FaChartLine, FaClock } from 'react-icons/fa'
import styles from './LiveStats.module.css'

const LiveStats = ({ totalMessages = 0, totalMixes = 0, avgPlacementTime = 0 }) => {
  const [animatedTotal, setAnimatedTotal] = useState(0)
  const [animatedMixes, setAnimatedMixes] = useState(0)

  useEffect(() => {
    // Animate numbers
    const animate = (target, setter) => {
      const duration = 1000
      const steps = 30
      const increment = target / steps
      let current = 0
      
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          setter(target)
          clearInterval(timer)
        } else {
          setter(Math.floor(current))
        }
      }, duration / steps)
    }

    animate(totalMessages, setAnimatedTotal)
    animate(totalMixes, setAnimatedMixes)
  }, [totalMessages, totalMixes])

  return (
    <div className={styles.stats}>
      <div className={styles.statCard}>
        <FaMicrophone className={styles.icon} />
        <div className={styles.value}>{animatedTotal}</div>
        <div className={styles.label}>Voice Messages</div>
      </div>
      
      <div className={styles.statCard}>
        <FaMusic className={styles.icon} />
        <div className={styles.value}>{animatedMixes}</div>
        <div className={styles.label}>Mixes Created</div>
      </div>
      
      <div className={styles.statCard}>
        <FaChartLine className={styles.icon} />
        <div className={styles.value}>{avgPlacementTime.toFixed(1)}s</div>
        <div className={styles.label}>Avg Placement</div>
      </div>
      
      <div className={styles.statCard}>
        <FaClock className={styles.icon} />
        <div className={styles.value}>30%</div>
        <div className={styles.label}>Voice Volume</div>
      </div>
    </div>
  )
}

export default LiveStats




