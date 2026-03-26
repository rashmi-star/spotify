'use client'

import { useState } from 'react'
import { FaMagic, FaRocket, FaHeart, FaLightbulb } from 'react-icons/fa'
import styles from './InteractiveDemo.module.css'

const InteractiveDemo = ({ onQuickAction }) => {
  const [selectedAction, setSelectedAction] = useState(null)

  const quickActions = [
    {
      id: 'motivate',
      icon: <FaRocket />,
      label: 'Motivate Me',
      message: 'motivate me',
      color: '#ff6b6b',
      description: 'Get pumped up!'
    },
    {
      id: 'reminder',
      icon: <FaMagic />,
      label: 'Quick Reminder',
      message: 'meeting at 3pm',
      color: '#4ecdc4',
      description: 'Never forget again'
    },
    {
      id: 'birthday',
      icon: <FaHeart />,
      label: 'Birthday Wish',
      message: 'happy birthday',
      color: '#ffe66d',
      description: 'Spread joy!'
    },
    {
      id: 'inspire',
      icon: <FaLightbulb />,
      label: 'Daily Inspiration',
      message: 'inspire me',
      color: '#95e1d3',
      description: 'Get creative ideas'
    }
  ]

  const handleAction = (action) => {
    setSelectedAction(action.id)
    if (onQuickAction) {
      onQuickAction(action.message)
    }
    setTimeout(() => setSelectedAction(null), 2000)
  }

  return (
    <div className={styles.demo}>
      <h3 className={styles.title}>✨ Quick Actions</h3>
      <p className={styles.subtitle}>Try these instant demos!</p>
      
      <div className={styles.actionsGrid}>
        {quickActions.map((action) => (
          <button
            key={action.id}
            className={`${styles.actionCard} ${selectedAction === action.id ? styles.selected : ''}`}
            onClick={() => handleAction(action)}
            style={{ '--accent-color': action.color }}
          >
            <div className={styles.icon}>{action.icon}</div>
            <div className={styles.label}>{action.label}</div>
            <div className={styles.description}>{action.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default InteractiveDemo




