'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './VoiceVisualizer.module.css'

const VoiceVisualizer = ({ audioUrl, musicUrl, voiceStartTime = 3, isPlaying = false }) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const [waveformData, setWaveformData] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    if (!audioUrl || !musicUrl) return

    // Analyze audio to create waveform
    const analyzeAudio = async () => {
      try {
        const response = await fetch(musicUrl)
        const arrayBuffer = await response.arrayBuffer()
        const audioContext = new AudioContext()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        
        const channelData = audioBuffer.getChannelData(0)
        const samples = 200 // Number of bars
        const blockSize = Math.floor(channelData.length / samples)
        const waveform = []

        for (let i = 0; i < samples; i++) {
          let sum = 0
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[i * blockSize + j])
          }
          waveform.push(sum / blockSize)
        }

        setWaveformData(waveform)
      } catch (error) {
        console.error('Error analyzing audio:', error)
      }
    }

    analyzeAudio()
  }, [musicUrl])

  useEffect(() => {
    if (!canvasRef.current || !waveformData) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      
      // Draw waveform
      const barWidth = width / waveformData.length
      const maxHeight = height * 0.8

      waveformData.forEach((value, index) => {
        const barHeight = value * maxHeight * 100
        const x = index * barWidth
        const y = height / 2 - barHeight / 2

        // Color based on position (voice area = different color)
        const isVoiceArea = index >= (voiceStartTime / 30) * waveformData.length && 
                           index <= ((voiceStartTime + 3) / 30) * waveformData.length
        
        ctx.fillStyle = isVoiceArea ? '#1db954' : 'rgba(255, 255, 255, 0.3)'
        ctx.fillRect(x, y, barWidth - 1, barHeight)
      })

      // Draw voice placement indicator
      const voiceStartX = (voiceStartTime / 30) * width
      ctx.strokeStyle = '#1db954'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(voiceStartX, 0)
      ctx.lineTo(voiceStartX, height)
      ctx.stroke()
      ctx.setLineDash([])
      
      // Draw voice area highlight
      const voiceDuration = 3 // Assume 3 seconds for voice
      const voiceEndX = ((voiceStartTime + voiceDuration) / 30) * width
      ctx.fillStyle = 'rgba(29, 185, 84, 0.2)'
      ctx.fillRect(voiceStartX, 0, voiceEndX - voiceStartX, height)
      
      // Label
      ctx.fillStyle = '#1db954'
      ctx.font = '12px Arial'
      ctx.fillText('Voice Overlay', voiceStartX + 5, 15)

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [waveformData, voiceStartTime, isPlaying])

  return (
    <div className={styles.visualizer}>
      <canvas ref={canvasRef} width={800} height={150} className={styles.canvas} />
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.colorBox} style={{background: 'rgba(255,255,255,0.3)'}}></div>
          <span>Music</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.colorBox} style={{background: '#1db954'}}></div>
          <span>Voice Overlay</span>
        </div>
      </div>
    </div>
  )
}

export default VoiceVisualizer

