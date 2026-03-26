'use client'

import { useState, useRef, useEffect } from 'react'
import { FaMicrophone, FaPlay, FaStop, FaDownload, FaCloudSun, FaNewspaper, FaTrophy, FaFire } from 'react-icons/fa'
import { useMusicPlayer } from '@/contexts/MusicPlayerContext'
import InteractiveDemo from './InteractiveDemo'
import LiveStats from './LiveStats'
import VoiceVisualizer from './VoiceVisualizer'
import styles from './AmbientVoiceOverlay.module.css'

const AmbientVoiceOverlay = ({ onTrackCreated }) => {
  const [message, setMessage] = useState('')
  const [refinedMessage, setRefinedMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [voiceAudio, setVoiceAudio] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [mixedAudioUrl, setMixedAudioUrl] = useState(null)
  const [step, setStep] = useState('input') // input, refining, generating, ready
  const [conversationHistory, setConversationHistory] = useState([]) // Track conversation
  const [creativeMode, setCreativeMode] = useState('conversational') // conversational, story, emotion
  const [detectedEmotion, setDetectedEmotion] = useState(null)
  const [voicePersonality, setVoicePersonality] = useState(null)
  const [stats, setStats] = useState({ messages: 0, mixes: 0, avgPlacement: 3.2 })
  const [achievements, setAchievements] = useState([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  
  const { currentTrack } = useMusicPlayer()
  const audioContextRef = useRef(null)
  const voiceSourceRef = useRef(null)
  const musicSourceRef = useRef(null)

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'

        recognition.onstart = () => {
          setIsListening(true)
          console.log('🎤 Speech recognition started')
        }

        recognition.onresult = async (event) => {
          const transcript = event.results[0][0].transcript
          console.log('🎤 Speech recognized:', transcript)
          setMessage(transcript)
          setIsListening(false)
          
          // Get conversational response from Gemini
          await handleConversationalResponse(transcript)
        }

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          if (event.error === 'no-speech') {
            alert('No speech detected. Please try again.')
          }
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = recognition
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Error starting speech recognition:', error)
        alert('Speech recognition not available. Please use text input.')
      }
    } else {
      alert('Speech recognition not supported in this browser. Please use Chrome or Edge.')
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

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

  // NEW: Get conversational response from Gemini (for voice input)
  const handleConversationalResponse = async (userInput) => {
    if (!userInput.trim()) return

    setIsProcessing(true)
    setStep('refining')

    try {
      const targetLanguage = selectedSong.language || 'English'
      const languageCode = selectedSong.languageCode || 'en'
      
      console.log(`💬 Getting conversational response for: "${userInput}"`)
      console.log(`🌍 Detected song language: ${targetLanguage}`)
      
      // Get Gemini's conversational response
      const response = await fetch('/api/conversational-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userInput,
          context: `This will be overlaid on "${selectedSong.title}" by ${selectedSong.artist}`,
          targetLanguage: targetLanguage,
          languageCode: languageCode,
          conversationHistory: conversationHistory.slice(-4) // Last 4 messages for context
        }),
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)

      console.log('👤 User said:', data.userMessage)
      console.log('🤖 Gemini responded:', data.response)
      
      // Update conversation history
      setConversationHistory(prev => [...prev, 
        { role: 'user', content: data.userMessage },
        { role: 'assistant', content: data.response }
      ].slice(-6))
      
      // Use Gemini's response for voice generation (not user's input)
      setRefinedMessage(data.response)
      setStep('refined')
      
      // Update stats
      setStats(prev => ({ ...prev, messages: prev.messages + 1 }))
      
      // Check for achievements
      checkAchievements()
      
      // Auto-generate voice after getting response (use Gemini's response)
      setTimeout(() => {
        handleGenerateVoice(data.response)
      }, 800)
    } catch (error) {
      console.error('Error getting conversational response:', error)
      alert('Failed to get response. Check console for details.')
      setStep('input')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRefineMessage = async (inputMessage = null) => {
    const messageToRefine = inputMessage || message
    if (!messageToRefine.trim()) return

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
          message: messageToRefine,
          context: `This will be overlaid on "${selectedSong.title}" by ${selectedSong.artist}`,
          targetLanguage: targetLanguage,
          languageCode: languageCode,
          conversationHistory: conversationHistory.slice(-3) // Last 3 messages for context
        }),
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)

      console.log('📥 Refined message received:', data.refined)
      console.log('🔍 Debug info:', data.debug)
      console.log('💬 Conversational:', data.conversational ? 'Yes' : 'No')
      
      if (data.debug && !data.debug.containsTamil && targetLanguage === 'Tamil') {
        console.warn('⚠️ WARNING: Expected Tamil but response appears to be in English!')
      }

      // Update conversation history
      setConversationHistory(prev => [...prev, messageToRefine, data.refined].slice(-6)) // Keep last 6 items
      
      // Update message state if it was passed as parameter
      if (inputMessage) {
        setMessage(messageToRefine)
      }
      
      setRefinedMessage(data.refined)
      setStep('refined')
      
      // Update stats
      setStats(prev => ({ ...prev, messages: prev.messages + 1 }))
      
      // Check for achievements
      checkAchievements()
    } catch (error) {
      console.error('Error refining message:', error)
      alert('Failed to refine message. Check console for details.')
      setStep('input')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerateVoice = async (textToSpeak = null) => {
    const text = textToSpeak || refinedMessage
    if (!text) return

    setIsProcessing(true)
    setStep('generating')

    try {
      // First, analyze the selected song to match voice style
      let voiceSettings = {
        stability: 0.5,
        similarity_boost: 0.75
      }
      let songAnalysis = { mood: 'calm' }
      
      if (selectedSong && selectedSong.src) {
        try {
          const musicResponse = await fetch(selectedSong.src)
          const musicArrayBuffer = await musicResponse.arrayBuffer()
          const AudioContext = window.AudioContext || window.webkitAudioContext
          const audioContext = new AudioContext()
          const musicBuffer = await audioContext.decodeAudioData(musicArrayBuffer)
          
          // Analyze song mood
          songAnalysis = analyzeSongMood(musicBuffer)
          voiceSettings = songAnalysis.voiceStyle
          
          console.log(`🎤 Adapting voice to "${songAnalysis.mood}" song style`)
        } catch (e) {
          console.log('⚠️ Could not analyze song, using default voice settings')
        }
      }

      // Get language info for voice generation
      const languageCode = selectedSong.languageCode || 'en'
      const isMultilingual = languageCode !== 'en'
      
      // Verify text is in correct language
      const isTamilText = /[\u0B80-\u0BFF]/.test(text)
      console.log(`🎤 Generating voice in ${selectedSong.language || 'English'} (code: ${languageCode})`)
      console.log(`🔍 Text language check: Contains Tamil script? ${isTamilText}`)
      console.log(`📝 Text to speak: "${text.substring(0, 100)}..."`)
      
      if (isMultilingual && !isTamilText) {
        console.warn('⚠️ WARNING: Expected Tamil text but message appears to be in English!')
        console.warn('⚠️ ElevenLabs multilingual model will try to speak English with Tamil accent')
      }

      // 🎨 CREATIVE MODE: Detect emotion and select personality
      let emotionData = null
      let personalityData = null
      
      try {
        // Detect emotion from message
        const emotionResponse = await fetch('/api/emotion-detector', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            songMood: songAnalysis.mood
          }),
        })
        
        emotionData = await emotionResponse.json()
        setDetectedEmotion(emotionData)
        console.log(`🎭 Detected emotion: ${emotionData.emotion} (intensity: ${emotionData.intensity})`)
        
        // Select voice personality based on emotion
        const personalityResponse = await fetch('/api/voice-personality', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emotion: emotionData.emotion,
            songMood: songAnalysis.mood,
            message: text
          }),
        })
        
        personalityData = await personalityResponse.json()
        setVoicePersonality(personalityData)
        console.log(`🎨 Voice personality: ${personalityData.personality} - ${personalityData.description}`)
        
        // Update voice settings with personality
        voiceSettings = { ...voiceSettings, ...personalityData.voiceSettings }
      } catch (e) {
        console.log('⚠️ Creative features skipped')
      }

      // 🎨 CREATIVE MODE: Story generator (optional)
      let finalText = text
      
      if (creativeMode === 'story') {
        try {
          const storyResponse = await fetch('/api/story-generator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text,
              songTitle: selectedSong.title,
              songMood: songAnalysis.mood
            }),
          })
          
          const storyData = await storyResponse.json()
          if (storyData.story) {
            finalText = storyData.story
            console.log(`📖 Story mode: ${storyData.story}`)
          }
        } catch (e) {
          console.log('⚠️ Story generation skipped')
        }
      }
      
      // Enhance text with SSML and optimization
      try {
        const enhanceResponse = await fetch('/api/enhance-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: finalText,
            mood: songAnalysis.mood || 'calm',
            songContext: `"${selectedSong.title}" by ${selectedSong.artist}`,
            targetLanguage: selectedSong.language || 'English',
            languageCode: languageCode
          }),
        })
        
        const enhanceData = await enhanceResponse.json()
        if (enhanceData.enhanced) {
          finalText = enhanceData.ssml || enhanceData.enhanced
          console.log(`✨ Enhanced text: ${enhanceData.wordCount} words (optimized: ${enhanceData.optimized})`)
          console.log(`🎯 SSML enabled: ${enhanceData.ssml ? 'Yes' : 'No'}`)
        }
      } catch (e) {
        console.log('⚠️ Enhancement skipped, using original text')
      }

      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: finalText,
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

  const findSilentMoment = async (audioBuffer, startTime = 1, endTime = 15) => {
    // 🤖 AI-POWERED SILENCE DETECTION
    // Uses Ollama to intelligently analyze audio and find the best placement
    
    try {
      const channelData = audioBuffer.getChannelData(0) // Use first channel
      const sampleRate = audioBuffer.sampleRate
      
      // Extract audio data for analysis (limit to first 30 seconds for performance)
      const maxSamples = Math.min(30 * sampleRate, channelData.length)
      const audioData = Array.from(channelData.slice(0, maxSamples))
      
      console.log(`🤖 Using AI to analyze ${audioBuffer.duration.toFixed(2)}s of audio...`)
      
      // Call AI-powered silence detection API
      const response = await fetch('/api/analyze-audio-silence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: audioData,
          sampleRate: sampleRate,
          duration: Math.min(audioBuffer.duration, 30)
        })
      })
      
      const data = await response.json()
      
      if (data.recommendedTime && data.usedAI) {
        console.log(`✅ AI Silence Detection: Recommended ${data.recommendedTime.toFixed(2)}s`)
        console.log(`💭 AI Reasoning: ${data.reasoning}`)
        console.log(`📊 Confidence: ${data.confidence}%`)
        
        // Ensure recommended time is within valid range
        const validTime = Math.max(startTime, Math.min(endTime, data.recommendedTime))
        return validTime
      } else {
        // Fallback to basic RMS if AI fails
        console.warn('⚠️ AI analysis failed, using RMS fallback')
        return findSilentMomentFallback(audioBuffer, startTime, endTime)
      }
    } catch (error) {
      console.error('❌ AI silence detection error:', error)
      console.log('⚠️ Falling back to basic RMS analysis')
      return findSilentMomentFallback(audioBuffer, startTime, endTime)
    }
  }

  const findSilentMomentFallback = (audioBuffer, startTime = 1, endTime = 15) => {
    // Fallback: Basic RMS analysis (original method)
    const channelData = audioBuffer.getChannelData(0)
    const sampleRate = audioBuffer.sampleRate
    const windowSize = sampleRate * 0.5
    
    let quietestTime = 3
    let lowestVolume = Infinity
    
    const startSample = Math.floor(startTime * sampleRate)
    const endSample = Math.floor(Math.min(endTime, audioBuffer.duration) * sampleRate)
    
    for (let i = startSample; i < endSample - windowSize; i += windowSize / 2) {
      let sum = 0
      for (let j = 0; j < windowSize && i + j < channelData.length; j++) {
        sum += channelData[i + j] * channelData[i + j]
      }
      const rms = Math.sqrt(sum / windowSize)
      if (rms < lowestVolume) {
        lowestVolume = rms
        quietestTime = i / sampleRate
      }
    }
    
    console.log(`📊 RMS Fallback: Found quietest moment at ${quietestTime.toFixed(2)}s`)
    return quietestTime
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

      // 🎯 AI-POWERED SILENCE DETECTION
      const voiceStartTime = await findSilentMoment(musicBuffer, 1, 15)
      console.log(`✨ Placing voice at ${voiceStartTime.toFixed(2)}s (AI-powered intelligent detection)`)
      
      // Update stats with actual placement time
      setStats(prev => ({ ...prev, avgPlacement: voiceStartTime }))

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
        
        // Update stats
        setStats(prev => ({ ...prev, mixes: prev.mixes + 1 }))
        
        // Celebration animation
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 3000)
        
        // Check for achievements
        checkAchievements()
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
    setConversationHistory([]) // Clear conversation history
    setDetectedEmotion(null)
    setVoicePersonality(null)
  }

  const handleQuickAction = (quickMessage) => {
    setMessage(quickMessage)
    // Auto-trigger refinement with the quick message directly
    setTimeout(() => {
      handleRefineMessage(quickMessage)
    }, 300)
  }

  const checkAchievements = () => {
    const newAchievements = []
    
    if (stats.mixes === 1 && !achievements.includes('first-mix')) {
      newAchievements.push({ id: 'first-mix', text: '🎉 First Mix Created!', icon: '🎵' })
    }
    if (stats.mixes === 5 && !achievements.includes('mix-master')) {
      newAchievements.push({ id: 'mix-master', text: '🔥 Mix Master!', icon: '🏆' })
    }
    if (conversationHistory.length >= 5 && !achievements.includes('conversationalist')) {
      newAchievements.push({ id: 'conversationalist', text: '💬 Conversationalist!', icon: '💬' })
    }
    if (detectedEmotion && !achievements.includes('emotion-detector')) {
      newAchievements.push({ id: 'emotion-detector', text: '🎭 Emotion Detected!', icon: '🎭' })
    }
    
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements.map(a => a.id)])
      // Show achievement notification
      newAchievements.forEach(achievement => {
        setTimeout(() => {
          alert(achievement.text)
        }, 1000)
      })
    }
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
        {/* 🎯 Interactive Demo Section */}
        <InteractiveDemo onQuickAction={handleQuickAction} />
        
        {/* 📊 Live Stats */}
        <LiveStats 
          totalMessages={stats.messages}
          totalMixes={stats.mixes}
          avgPlacementTime={stats.avgPlacement}
        />
        
        {/* 🎉 Celebration Animation */}
        {showCelebration && (
          <div className={styles.celebration}>
            <FaFire className={styles.fireIcon} />
            <span>🎉 Mix Created Successfully!</span>
          </div>
        )}
        
        {/* Step 1: Input Message */}
        <div className={styles.step}>
          <h3>1. Your Message <span style={{fontSize: '14px', color: '#1db954', fontWeight: 'normal'}}>💬 Conversational Mode</span></h3>
          <div className={styles.inputContainer}>
            <textarea
              className={styles.textarea}
              placeholder="Type your message (e.g., 'meeting at 3', 'happy birthday', 'drink water')... The AI will make it conversational! Or click the microphone to speak!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              disabled={step !== 'input' || isListening}
            />
            <button
              className={`${styles.voiceInputBtn} ${isListening ? styles.listening : ''}`}
              onClick={isListening ? stopListening : startListening}
              disabled={step !== 'input' || isProcessing}
              title={isListening ? 'Stop listening' : 'Click to speak your message'}
            >
              <FaMicrophone />
              {isListening && <span className={styles.pulse}></span>}
            </button>
          </div>
          {isListening && (
            <div className={styles.listeningIndicator}>
              🎤 Listening... Speak now!
            </div>
          )}
          {conversationHistory.length > 0 && (
            <div style={{marginTop: '10px', fontSize: '12px', color: '#b3b3b3', fontStyle: 'italic'}}>
              💬 Conversation context: {conversationHistory.length} previous messages
            </div>
          )}
          
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

        {/* Step 2: Get Conversational Response from AI */}
        {step === 'input' && (
          <button
            className={styles.primaryBtn}
            onClick={() => handleConversationalResponse(message)}
            disabled={!message.trim() || isProcessing}
          >
            {isProcessing ? 'Getting response from Gemini AI...' : 'Get AI Response'}
          </button>
        )}

        {step === 'refining' && (
          <div className={styles.processing}>
            <div className={styles.spinner}></div>
            <p>Gemini AI is generating a conversational response...</p>
          </div>
        )}

        {refinedMessage && step !== 'input' && (
          <div className={styles.step}>
            <h3>AI Response</h3>
            <div className={styles.refinedBox}>
              <p>{refinedMessage}</p>
            </div>
            
            {/* 🎨 Creative Features Display */}
            {(detectedEmotion || voicePersonality) && (
              <div style={{
                marginTop: '15px',
                padding: '12px',
                background: 'rgba(29, 185, 84, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(29, 185, 84, 0.3)'
              }}>
                <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#1db954'}}>🎨 Creative Features</h4>
                {detectedEmotion && (
                  <div style={{marginBottom: '8px', fontSize: '12px'}}>
                    <span style={{color: '#b3b3b3'}}>🎭 Emotion:</span>{' '}
                    <span style={{color: '#fff', fontWeight: '600'}}>{detectedEmotion.emotion}</span>
                    {' '}({Math.round(detectedEmotion.intensity * 100)}% intensity)
                  </div>
                )}
                {voicePersonality && (
                  <div style={{fontSize: '12px'}}>
                    <span style={{color: '#b3b3b3'}}>🎨 Voice:</span>{' '}
                    <span style={{color: '#fff', fontWeight: '600'}}>{voicePersonality.description}</span>
                    {voicePersonality.creativeNote && (
                      <span style={{color: '#1db954', marginLeft: '8px'}}>{voicePersonality.creativeNote}</span>
                    )}
                  </div>
                )}
                {creativeMode === 'story' && (
                  <div style={{marginTop: '8px', fontSize: '12px', color: '#1db954', fontStyle: 'italic'}}>
                    📖 Story mode: AI turned your message into a narrative!
                  </div>
                )}
              </div>
            )}
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
                
                {/* Visual Waveform */}
                <VoiceVisualizer 
                  audioUrl={voiceAudio}
                  musicUrl={selectedSong.src}
                  voiceStartTime={3}
                  isPlaying={isPlaying}
                />
                
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

