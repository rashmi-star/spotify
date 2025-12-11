'use client'

import { useState } from 'react'
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext'
import Sidebar from '@/components/Sidebar'
import MainContent from '@/components/MainContent'
import PlayerBar from '@/components/PlayerBar'
import styles from './page.module.css'

export default function Home() {
  const [currentView, setCurrentView] = useState('home')
  const [mixedTracks, setMixedTracks] = useState([])

  return (
    <MusicPlayerProvider>
      <div className={styles.app}>
        <div className={styles.appContainer}>
          <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
          <MainContent 
            currentView={currentView} 
            mixedTracks={mixedTracks}
            setMixedTracks={setMixedTracks}
          />
        </div>
        <PlayerBar />
      </div>
    </MusicPlayerProvider>
  )
}

