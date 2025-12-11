'use client'

import { 
  FaPlay, 
  FaPause, 
  FaStepForward, 
  FaStepBackward,
  FaVolumeUp,
  FaVolumeDown,
  FaRandom,
} from 'react-icons/fa'
import { BsRepeat } from 'react-icons/bs'
import { useMusicPlayer } from '@/contexts/MusicPlayerContext'
import styles from './PlayerBar.module.css'

const PlayerBar = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    setVolume,
    togglePlayPause,
    seekTo,
  } = useMusicPlayer()

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleProgressChange = (e) => {
    const percentage = e.target.value
    const newTime = (percentage / 100) * duration
    seekTo(newTime)
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={styles.playerBar}>
      <div className={styles.playerContent}>
        {/* Currently Playing */}
        <div className={styles.nowPlaying}>
          <div className={styles.trackCover}>
            {currentTrack?.isMixed && (
              <span className={styles.mixedIndicator}>🎤</span>
            )}
          </div>
          <div className={styles.trackInfo}>
            <div className={styles.trackName}>
              {currentTrack?.isMixed && <span className={styles.mixedTag}>MIXED</span>}
              {currentTrack?.title || 'No track selected'}
            </div>
            <div className={styles.trackArtist}>{currentTrack?.artist || 'Select a song to play'}</div>
          </div>
          <button className={styles.likeBtn}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.69 2A4.582 4.582 0 0 1 8 2.023 4.583 4.583 0 0 1 11.88.817h.002a4.618 4.618 0 0 1 3.782 3.65v.003a4.543 4.543 0 0 1-1.011 3.84L9.35 14.629a1.765 1.765 0 0 1-2.093.464 1.762 1.762 0 0 1-.605-.463L1.348 8.309A4.582 4.582 0 0 1 1.689 2zm3.158.252A3.082 3.082 0 0 0 2.49 7.337l.007.005L8 13.74l5.49-6.397.007-.005a3.081 3.081 0 0 0-.227-4.939 3.066 3.066 0 0 0-2.812-.227 3.064 3.064 0 0 0-.564.227l-.008.004a1.266 1.266 0 0 1-.163.021 1.275 1.275 0 0 1-.141-.01A3.064 3.064 0 0 0 4.85 2.252z"/>
            </svg>
          </button>
        </div>

        {/* Player Controls */}
        <div className={styles.playerControls}>
          <div className={styles.controlButtons}>
            <button className={`${styles.controlBtn} ${styles.shuffle}`}>
              <FaRandom />
            </button>
            <button className={styles.controlBtn}>
              <FaStepBackward />
            </button>
            <button 
              className={`${styles.controlBtn} ${styles.playPause}`}
              onClick={togglePlayPause}
              disabled={!currentTrack}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button className={styles.controlBtn}>
              <FaStepForward />
            </button>
            <button className={`${styles.controlBtn} ${styles.repeat}`}>
              <BsRepeat />
            </button>
          </div>
          
          <div className={styles.progressContainer}>
            <span className={styles.timeDisplay}>{formatTime(currentTime)}</span>
            <div className={styles.progressBarWrapper}>
              <input
                type="range"
                className={styles.progressBar}
                min="0"
                max="100"
                value={progressPercentage}
                onChange={handleProgressChange}
              />
            </div>
            <span className={styles.timeDisplay}>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Options */}
        <div className={styles.playerOptions}>
          <button className={styles.optionBtn}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M0 4.75C0 4.336.336 4 .75 4H3.5a.25.25 0 0 0 .2-.1l1.45-1.9A2.75 2.75 0 0 1 7.743 1h.514a2.75 2.75 0 0 1 2.593 1.9l1.45 1.9a.25.25 0 0 0 .2.1h2.75a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75H3.5a.25.25 0 0 1-.2-.1l-1.45-1.9A2.75 2.75 0 0 0 .743 11H.75a.75.75 0 0 1-.75-.75v-5.5zm1.5.75v4.5c0 .138.112.25.25.25h.743a1.25 1.25 0 0 1 1.18-.85l1.45-1.9a.25.25 0 0 1 .2-.1h7.5a.25.25 0 0 1 .2.1l1.45 1.9a1.25 1.25 0 0 1 1.18.85h.743a.25.25 0 0 0 .25-.25v-4.5H1.5z"/>
            </svg>
          </button>
          <div className={styles.volumeControl}>
            <button className={styles.volumeBtn}>
              {volume > 0 ? <FaVolumeUp /> : <FaVolumeDown />}
            </button>
            <div className={styles.volumeSliderWrapper}>
              <input
                type="range"
                className={styles.volumeSlider}
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
              />
            </div>
          </div>
          <button className={styles.optionBtn}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"/>
              <path d="M8 3.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z"/>
              <path d="M5.5 6.5a.5.5 0 0 1 1 0v3a.5.5 0 0 1-1 0v-3zm5 0a.5.5 0 0 1 1 0v3a.5.5 0 0 1-1 0v-3z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlayerBar

