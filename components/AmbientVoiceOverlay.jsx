'use client'

import { useState, useRef, useEffect } from 'react'
import { FaMicrophone, FaPlay, FaStop, FaDownload, FaCloudSun, FaNewspaper } from 'react-icons/fa'
import { useMusicPlayer } from '@/contexts/MusicPlayerContext'
import styles from './AmbientVoiceOverlay.module.css'

const AmbientVoiceOverlay = ({ onTrackCreated }) => {
  const [message, setMessage] = useState('')
  const [refinedMessage, setRefinedMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [voiceAudio, setVoiceAudio] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [mixedAudioUrl, setMixedAudioUrl] = useState(null)
  const [step, setStep] = useState('input') // input, refining, generating, ready
  
  const { currentTrack } = useMusicPlayer()
  const audioContextRef = useRef(null)
  const voiceSourceRef = useRef(null)
  const musicSourceRef = useRef(null)

  const availableSongs = [
    { 
      id: 1, 
      title: 'Perfect', 
      artist: 'Ed Sheeran', 
      src: '/music/Edd_Sheeran_-_Perfect_(mp3.pm).mp3',
      language: 'English',
      cover: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      coverImage: '🎸'
    },
    { 
      id: 2, 
      title: 'Story of My Life', 
      artist: 'One Direction', 
      src: '/music/One_Direction_-_story_my_life_(mp3.pm).mp3',
      language: 'English',
      cover: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      coverImage: '🎤'
    },
    { 
      id: 3, 
      title: 'Tamil Song', 
      artist: 'Tamil Artist', 
      src: '/music/tamil.mp3',
      language: 'Tamil',
      languageCode: 'ta',
      cover: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      coverImage: '🎵'
    },
  ]

  const [selectedSong, setSelectedSong] = useState(availableSongs[0])

  const handleRefineMessage = async () => {
    if (!message.trim()) return

    setIsProcessing(true)
    setStep('refining')

    try {
      const targetLanguage = selectedSong.language || 'English'
      const languageCode = selectedSong.languageCode || 'en'
      
      console.log(`🌍 Detected song language: ${targetLanguage}`)
      
      const response = await fetch('/api/refine-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          context: `This will be overlaid on "${selectedSong.title}" by ${selectedSong.artist}`,
          targetLanguage: targetLanguage,
          languageCode: languageCode
        }),
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)

      console.log('📥 Refined message received:', data.refined)
      console.log('🔍 Debug info:', data.debug)
      
      if (data.debug && !data.debug.containsTamil && targetLanguage === 'Tamil') {
        console.warn('⚠️ WARNING: Expected Tamil but response appears to be in English!')
      }

      setRefinedMessage(data.refined)
      setStep('refined')
    } catch (error) {
      console.error('Error refining message:', error)
      alert('Failed to refine message. Check console for details.')
      setStep('input')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerateVoice = async () => {
    if (!refinedMessage) return

    setIsProcessing(true)
    setStep('generating')

    try {
      // First, analyze the selected song to match voice style
      let voiceSettings = {
        stability: 0.5,
        similarity_boost: 0.75
      }
      
      if (selectedSong && selectedSong.src) {
        try {
          const musicResponse = await fetch(selectedSong.src)
          const musicArrayBuffer = await musicResponse.arrayBuffer()
          const AudioContext = window.AudioContext || window.webkitAudioContext
          const audioContext = new AudioContext()
          const musicBuffer = await audioContext.decodeAudioData(musicArrayBuffer)
          
          // Analyze song mood
          const analysis = analyzeSongMood(musicBuffer)
          voiceSettings = analysis.voiceStyle
          
          console.log(`🎤 Adapting voice to "${analysis.mood}" song style`)
        } catch (e) {
          console.log('⚠️ Could not analyze song, using default voice settings')
        }
      }

      // Get language info for voice generation
      const languageCode = selectedSong.languageCode || 'en'
      const isMultilingual = languageCode !== 'en'
      
      // Verify text is in correct language
      const isTamilText = /[\u0B80-\u0BFF]/.test(refinedMessage)
      console.log(`🎤 Generating voice in ${selectedSong.language || 'English'} (code: ${languageCode})`)
      console.log(`🔍 Text language check: Contains Tamil script? ${isTamilText}`)
      console.log(`📝 Text to speak: "${refinedMessage.substring(0, 100)}..."`)
      
      if (isMultilingual && !isTamilText) {
        console.warn('⚠️ WARNING: Expected Tamil text but message appears to be in English!')
        console.warn('⚠️ ElevenLabs multilingual model will try to speak English with Tamil accent')
      }

      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: refinedMessage,
          voiceSettings: voiceSettings,
          languageCode: languageCode,
          isMultilingual: isMultilingual
        }),
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)

      // Convert base64 to blob
      const audioBlob = base64ToBlob(data.audio, data.mimeType)
      const audioUrl = URL.createObjectURL(audioBlob)
      setVoiceAudio(audioUrl)
      setStep('ready')
    } catch (error) {
      console.error('Error generating voice:', error)
      alert('Failed to generate voice. Check console for details.')
      setStep('refined')
    } finally {
      setIsProcessing(false)
    }
  }

  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  const analyzeSongMood = (audioBuffer) => {
    // Analyze audio characteristics to determine mood/tempo
    const channelData = audioBuffer.getChannelData(0)
    const sampleRate = audioBuffer.sampleRate
    
    // Sample first 10 seconds for analysis
    const analysisLength = Math.min(10 * sampleRate, channelData.length)
    
    // Calculate average energy (RMS)
    let totalEnergy = 0
    for (let i = 0; i < analysisLength; i++) {
      totalEnergy += channelData[i] * channelData[i]
    }
    const avgEnergy = Math.sqrt(totalEnergy / analysisLength)
    
    // Detect tempo changes (variation in amplitude)
    let variations = 0
    const windowSize = sampleRate * 0.1 // 100ms windows
    for (let i = 0; i < analysisLength - windowSize; i += windowSize) {
      let windowEnergy = 0
      for (let j = 0; j < windowSize; j++) {
        windowEnergy += channelData[i + j] * channelData[i + j]
      }
      windowEnergy = Math.sqrt(windowEnergy / windowSize)
      if (windowEnergy > avgEnergy * 1.2) variations++
    }
    
    const tempo = variations / 10 // Rough tempo indicator
    
    // Classify song mood
    let mood = 'calm'
    let voiceStyle = {
      stability: 0.6,
      similarity_boost: 0.85,
      style: 0.6,
      speed: 1.0,
      use_speaker_boost: true
    }
    
    if (avgEnergy > 0.15 && tempo > 8) {
      mood = 'energetic'
      voiceStyle = {
        stability: 0.5,
        similarity_boost: 0.85,
        style: 0.75,
        speed: 1.08,
        use_speaker_boost: true
      }
    } else if (avgEnergy < 0.08 && tempo < 5) {
      mood = 'slow'
      voiceStyle = {
        stability: 0.7,
        similarity_boost: 0.8,
        style: 0.5,
        speed: 0.95,
        use_speaker_boost: true
      }
    } else if (avgEnergy > 0.1 && tempo > 6) {
      mood = 'upbeat'
      voiceStyle = {
        stability: 0.55,
        similarity_boost: 0.85,
        style: 0.65,
        speed: 1.05,
        use_speaker_boost: true
      }
    }
    
    console.log(`🎼 Song Analysis: mood="${mood}", energy=${avgEnergy.toFixed(3)}, tempo=${tempo.toFixed(1)}`)
    
    return { mood, voiceStyle, avgEnergy, tempo }
  }

  const findSilentMoment = (audioBuffer, startTime = 1, endTime = 15) => {
    // Analyze audio to find quiet moments (basic silence detection)
    const channelData = audioBuffer.getChannelData(0) // Use first channel
    const sampleRate = audioBuffer.sampleRate
    const windowSize = sampleRate * 0.5 // Check 0.5 second windows
    
    let quietestTime = 3 // Default fallback
    let lowestVolume = Infinity
    
    const startSample = Math.floor(startTime * sampleRate)
    const endSample = Math.floor(Math.min(endTime, audioBuffer.duration) * sampleRate)
    
    // Scan through the audio in windows
    for (let i = startSample; i < endSample - windowSize; i += windowSize / 2) {
      let sum = 0
      
      // Calculate RMS (root mean square) for this window
      for (let j = 0; j < windowSize && i + j < channelData.length; j++) {
        sum += channelData[i + j] * channelData[i + j]
      }
      
      const rms = Math.sqrt(sum / windowSize)
      
      // Track the quietest moment
      if (rms < lowestVolume) {
        lowestVolume = rms
        quietestTime = i / sampleRate
      }
    }
    
    console.log(`🎵 Silence Detection: Found quietest moment at ${quietestTime.toFixed(2)}s (volume: ${lowestVolume.toFixed(4)})`)
    
    // Only use detected silence if it's significantly quieter
    if (lowestVolume < 0.1) {
      return quietestTime
    }
    
    // Fallback to 3 seconds if no clear quiet moment
    console.log('⚠️ No clear silence found, using default 3s')
    return 3
  }

  const handleMixAudio = async () => {
    if (!voiceAudio || !selectedSong) return

    setIsProcessing(true)

    try {
      // Initialize Web Audio API
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      // Load voice audio
      const voiceResponse = await fetch(voiceAudio)
      const voiceArrayBuffer = await voiceResponse.arrayBuffer()
      const voiceBuffer = await audioContext.decodeAudioData(voiceArrayBuffer)

      // Load music audio
      const musicResponse = await fetch(selectedSong.src)
      const musicArrayBuffer = await musicResponse.arrayBuffer()
      const musicBuffer = await audioContext.decodeAudioData(musicArrayBuffer)

      // 🎯 DETECT QUIET MOMENT IN MUSIC
      const voiceStartTime = findSilentMoment(musicBuffer, 1, 15)
      console.log(`✨ Placing voice at ${voiceStartTime.toFixed(2)}s (intelligent detection)`)


      // Create offline context for mixing
      const duration = Math.max(voiceStartTime + voiceBuffer.duration + 2, 30) // At least 30 seconds
      const offlineContext = new OfflineAudioContext(
        2,
        duration * audioContext.sampleRate,
        audioContext.sampleRate
      )

      // Create music source (lowered volume during voice)
      const musicSource = offlineContext.createBufferSource()
      musicSource.buffer = musicBuffer
      const musicGain = offlineContext.createGain()
      
      // Dynamic volume ducking based on voice timing
      // Less aggressive ducking since voice is now quieter
      musicGain.gain.setValueAtTime(0.5, 0) // Start at 50%
      musicGain.gain.setValueAtTime(0.5, voiceStartTime - 0.5) // Keep at 50% before voice
      musicGain.gain.linearRampToValueAtTime(0.35, voiceStartTime) // Duck to 35% when voice starts (less aggressive)
      musicGain.gain.setValueAtTime(0.35, voiceStartTime + voiceBuffer.duration) // Stay at 35% during voice
      musicGain.gain.linearRampToValueAtTime(0.6, voiceStartTime + voiceBuffer.duration + 1.5) // Fade back up over 1.5s
      
      musicSource.connect(musicGain)
      musicGain.connect(offlineContext.destination)

      // Create voice source (overlay at detected quiet moment)
      const voiceSource = offlineContext.createBufferSource()
      voiceSource.buffer = voiceBuffer
      const voiceGain = offlineContext.createGain()
      // Very low volume for truly ambient, non-intrusive voice
      voiceGain.gain.setValueAtTime(0.3, 0) // 30% volume - very soft, ambient
      voiceGain.gain.setValueAtTime(0.3, voiceBuffer.duration) // Keep consistent
      voiceSource.connect(voiceGain)
      voiceGain.connect(offlineContext.destination)

      // Start sources
      musicSource.start(0)
      voiceSource.start(voiceStartTime) // Start voice at detected quiet moment

      // Render mixed audio
      const renderedBuffer = await offlineContext.startRendering()

      // Convert to blob
      const wav = audioBufferToWav(renderedBuffer)
      const blob = new Blob([wav], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)

      setMixedAudioUrl(url)
      setIsPlaying(false)

      // Add mixed track to Spotify UI
      if (onTrackCreated) {
        const mixedTrack = {
          id: Date.now(),
          title: `${selectedSong.title} (Voice Mix)`,
          artist: `${selectedSong.artist} • AI Voice`,
          cover: selectedSong.cover || '#1db954',
          src: url,
          isMixed: true
        }
        onTrackCreated(mixedTrack)
        console.log('✅ Mixed track added to Spotify UI!')
      }
    } catch (error) {
      console.error('Error mixing audio:', error)
      alert('Failed to mix audio. Check console for details.')
    } finally {
      setIsProcessing(false)
    }
  }

  const audioBufferToWav = (buffer) => {
    const numOfChan = buffer.numberOfChannels
    const length = buffer.length * numOfChan * 2 + 44
    const bufferArray = new ArrayBuffer(length)
    const view = new DataView(bufferArray)
    const channels = []
    let offset = 0
    let pos = 0

    // Write WAV header
    setUint32(0x46464952) // "RIFF"
    setUint32(length - 8) // file length - 8
    setUint32(0x45564157) // "WAVE"
    setUint32(0x20746d66) // "fmt " chunk
    setUint32(16) // length = 16
    setUint16(1) // PCM (uncompressed)
    setUint16(numOfChan)
    setUint32(buffer.sampleRate)
    setUint32(buffer.sampleRate * 2 * numOfChan) // avg. bytes/sec
    setUint16(numOfChan * 2) // block-align
    setUint16(16) // 16-bit
    setUint32(0x61746164) // "data" - chunk
    setUint32(length - pos - 4) // chunk length

    // Write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++)
      channels.push(buffer.getChannelData(i))

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        const sample = Math.max(-1, Math.min(1, channels[i][offset]))
        view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
        pos += 2
      }
      offset++
    }

    return bufferArray

    function setUint16(data) {
      view.setUint16(pos, data, true)
      pos += 2
    }

    function setUint32(data) {
      view.setUint32(pos, data, true)
      pos += 4
    }
  }

  const handlePlayMixed = () => {
    if (mixedAudioUrl) {
      const audio = new Audio(mixedAudioUrl)
      audio.play()
      setIsPlaying(true)
      audio.onended = () => setIsPlaying(false)
    }
  }

  const handleDownload = () => {
    if (mixedAudioUrl) {
      const a = document.createElement('a')
      a.href = mixedAudioUrl
      a.download = `ambient-voice-${Date.now()}.wav`
      a.click()
    }
  }

  const handleReset = () => {
    setMessage('')
    setRefinedMessage('')
    setVoiceAudio(null)
    setMixedAudioUrl(null)
    setStep('input')
  }

  const handleAddWeather = async () => {
    if (!selectedSong) {
      alert('Please select a song first')
      return
    }

    setIsProcessing(true)
    setStep('refining')
    setMessage('') // Clear manual message

    try {
      // Fetch weather
      const weatherResponse = await fetch('/api/weather?city=New York')
      const weatherData = await weatherResponse.json()

      if (!weatherData || !weatherData.temperature) {
        throw new Error('Failed to fetch weather')
      }

      // Create weather message
      const weatherMessage = `Current weather: ${weatherData.temperature}°${weatherData.units === 'metric' ? 'C' : 'F'}, ${weatherData.description} in ${weatherData.city}. ${weatherData.humidity ? `Humidity is ${weatherData.humidity}%.` : ''} ${weatherData.windSpeed ? `Wind speed is ${weatherData.windSpeed} km/h.` : ''}`

      const targetLanguage = selectedSong.language || 'English'
      const languageCode = selectedSong.languageCode || 'en'

      // Refine with Gemini
      const refineResponse = await fetch('/api/refine-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: weatherMessage,
          context: `This is weather information that will be overlaid on "${selectedSong.title}" by ${selectedSong.artist}. Make it friendly and conversational.`,
          targetLanguage: targetLanguage,
          languageCode: languageCode
        }),
      })

      const refineData = await refineResponse.json()
      if (refineData.error) throw new Error(refineData.error)

      setRefinedMessage(refineData.refined)
      setStep('refined')
    } catch (error) {
      console.error('Error adding weather:', error)
      alert('Failed to add weather. Check console for details.')
      setStep('input')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddNews = async () => {
    if (!selectedSong) {
      alert('Please select a song first')
      return
    }

    setIsProcessing(true)
    setStep('refining')
    setMessage('') // Clear manual message

    try {
      // Fetch news
      const newsResponse = await fetch('/api/news?limit=3')
      const newsData = await newsResponse.json()

      if (!newsData || !newsData.articles || newsData.articles.length === 0) {
        throw new Error('Failed to fetch news')
      }

      const targetLanguage = selectedSong.language || 'English'
      const languageCode = selectedSong.languageCode || 'en'

      // Summarize news with Gemini
      const summarizeResponse = await fetch('/api/summarize-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsArticles: newsData.articles,
          targetLanguage: targetLanguage,
          languageCode: languageCode
        }),
      })

      const summarizeData = await summarizeResponse.json()
      // Only throw if there's no summary (error field is OK if we have a fallback summary)
      if (!summarizeData.summary) {
        throw new Error(summarizeData.error || 'Failed to summarize news')
      }

      // Refine the summary to make it more conversational
      const refineResponse = await fetch('/api/refine-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: summarizeData.summary,
          context: `This is a news summary that will be overlaid on "${selectedSong.title}" by ${selectedSong.artist}. Make it warm and friendly.`,
          targetLanguage: targetLanguage,
          languageCode: languageCode
        }),
      })

      const refineData = await refineResponse.json()
      if (refineData.error) throw new Error(refineData.error)

      setRefinedMessage(refineData.refined)
      setStep('refined')
    } catch (error) {
      console.error('Error adding news:', error)
      alert('Failed to add news. Check console for details.')
      setStep('input')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <FaMicrophone className={styles.icon} />
        <h2>Ambient Voice Overlay</h2>
        <p className={styles.subtitle}>
          Transform messages into emotion-friendly voice snippets
        </p>
      </div>

      <div className={styles.content}>
        {/* Step 1: Input Message */}
        <div className={styles.step}>
          <h3>1. Your Message</h3>
          <textarea
            className={styles.textarea}
            placeholder="Type your message, reminder, ad, or shoutout..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            disabled={step !== 'input'}
          />
          
          {/* Quick Add Buttons */}
          {step === 'input' && (
            <div className={styles.quickAddButtons}>
              <button
                className={styles.quickAddBtn}
                onClick={handleAddWeather}
                disabled={isProcessing}
                title="Add current weather to the song"
              >
                <FaCloudSun /> Add Weather
              </button>
              <button
                className={styles.quickAddBtn}
                onClick={handleAddNews}
                disabled={isProcessing}
                title="Add summarized news to the song"
              >
                <FaNewspaper /> Add News
              </button>
            </div>
          )}
        </div>

        {/* Song Selection */}
        <div className={styles.step}>
          <h3>2. Choose Song</h3>
          <div className={styles.songSelector}>
            {availableSongs.map((song) => (
              <div
                key={song.id}
                className={`${styles.songOption} ${
                  selectedSong.id === song.id ? styles.selected : ''
                }`}
                onClick={() => setSelectedSong(song)}
              >
                <div className={styles.songCover} style={{ background: song.cover }}>
                  {song.coverImage && (
                    <span className={styles.songCoverEmoji}>{song.coverImage}</span>
                  )}
                </div>
                <div className={styles.songInfo}>
                  <span className={styles.songTitle}>
                    {song.title}
                    {song.language && song.language !== 'English' && (
                      <span className={styles.languageBadge}>🌍 {song.language}</span>
                    )}
                  </span>
                  <span className={styles.songArtist}>{song.artist}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Refine with AI */}
        {step === 'input' && (
          <button
            className={styles.primaryBtn}
            onClick={handleRefineMessage}
            disabled={!message.trim() || isProcessing}
          >
            {isProcessing ? 'Refining with Gemini AI...' : 'Refine with AI'}
          </button>
        )}

        {step === 'refining' && (
          <div className={styles.processing}>
            <div className={styles.spinner}></div>
            <p>Gemini AI is refining your message...</p>
          </div>
        )}

        {refinedMessage && step !== 'input' && (
          <div className={styles.step}>
            <h3>Refined Message</h3>
            <div className={styles.refinedBox}>
              <p>{refinedMessage}</p>
            </div>
          </div>
        )}

        {/* Step 3: Generate Voice */}
        {step === 'refined' && (
          <button
            className={styles.primaryBtn}
            onClick={handleGenerateVoice}
            disabled={isProcessing}
          >
            {isProcessing ? 'Generating Voice...' : 'Generate Voice with ElevenLabs'}
          </button>
        )}

        {step === 'generating' && (
          <div className={styles.processing}>
            <div className={styles.spinner}></div>
            <p>ElevenLabs is creating your voice...</p>
          </div>
        )}

        {/* Step 4: Mix and Play */}
        {step === 'ready' && voiceAudio && (
          <>
            <div className={styles.actions}>
              <button
                className={styles.primaryBtn}
                onClick={handleMixAudio}
                disabled={isProcessing}
              >
                {isProcessing ? 'Mixing Audio...' : 'Mix Voice with Music'}
              </button>
            </div>

            {mixedAudioUrl && (
              <div className={styles.result}>
                <h3>✨ Your Ambient Voice Overlay is Ready!</h3>
                <p className={styles.resultNote}>
                  🎼 Voice adapted to match song mood • 🎵 Intelligently placed at quiet moment
                </p>
                <div className={styles.resultActions}>
                  <button
                    className={styles.playBtn}
                    onClick={handlePlayMixed}
                    disabled={isPlaying}
                  >
                    <FaPlay /> {isPlaying ? 'Playing...' : 'Play Result'}
                  </button>
                  <button className={styles.downloadBtn} onClick={handleDownload}>
                    <FaDownload /> Download
                  </button>
                  <button className={styles.resetBtn} onClick={handleReset}>
                    Create Another
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AmbientVoiceOverlay

