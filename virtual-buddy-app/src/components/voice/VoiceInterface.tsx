import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { VoiceSettings } from '@/types'
import { cn } from '@/lib/utils'

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onerror: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onresult: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
}

interface VoiceInterfaceProps {
  onTranscript: (text: string) => void
  onListeningChange: (isListening: boolean) => void
  onSpeakingChange: (isSpeaking: boolean) => void
  settings: VoiceSettings
  className?: string
}

export function VoiceInterface({
  onTranscript,
  onListeningChange,
  onSpeakingChange,
  settings,
  className = ""
}: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const speechSynthesis = window.speechSynthesis

    if (SpeechRecognition && speechSynthesis) {
      setIsSupported(true)
      
      // Initialize speech recognition
      const recognition = new SpeechRecognition() as SpeechRecognitionInstance
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = settings.language || 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        onListeningChange(true)
      }

      recognition.onend = () => {
        setIsListening(false)
        onListeningChange(false)
      }

      recognition.onresult = (event) => {
        const speechEvent = event as unknown as { resultIndex: number; results: { length: number; [index: number]: { isFinal: boolean; [index: number]: { transcript: string } } } }
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = speechEvent.resultIndex; i < speechEvent.results.length; i++) {
          const result = speechEvent.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
          } else {
            interimTranscript += result[0].transcript
          }
        }

        setTranscript(finalTranscript + interimTranscript)

        if (finalTranscript) {
          onTranscript(finalTranscript)
          setTranscript('')
        }
      }

      recognition.onerror = (event) => {
        const errorEvent = event as unknown as { error: string }
        console.error('Speech recognition error:', errorEvent.error)
        setIsListening(false)
        onListeningChange(false)
      }

      recognitionRef.current = recognition
      synthRef.current = speechSynthesis
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [settings.language, onListeningChange, onTranscript])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Error starting speech recognition:', error)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const speak = (text: string) => {
    if (!synthRef.current || !settings.enabled) return

    // Cancel any ongoing speech
    synthRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = settings.language || 'en-US'
    utterance.pitch = settings.pitch || 1
    utterance.rate = settings.rate || 1
    
    if (settings.voice) {
      utterance.voice = settings.voice
    }

    utterance.onstart = () => {
      setIsSpeaking(true)
      onSpeakingChange(true)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      onSpeakingChange(false)
    }

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error)
      setIsSpeaking(false)
      onSpeakingChange(false)
    }

    synthRef.current.speak(utterance)
  }

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
      onSpeakingChange(false)
    }
  }

  // Expose speak function to parent component
  useEffect(() => {
    // This is a way to expose the speak function to parent components
    // In a real implementation, you might use a ref or context
    const win = window as { buddySpeak?: (text: string) => void; buddyStopSpeaking?: () => void }
    win.buddySpeak = speak
    win.buddyStopSpeaking = stopSpeaking
  }, [speak, stopSpeaking])

  if (!isSupported) {
    return (
      <div className={cn("flex items-center justify-center p-4 bg-yellow-100 rounded-lg", className)}>
        <p className="text-yellow-800">
          Voice features are not supported in this browser. Please use Chrome, Firefox, or Safari.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center space-x-4 p-4", className)}>
      {/* Microphone button */}
      <button
        onClick={isListening ? stopListening : startListening}
        className={cn(
          "relative p-4 rounded-full transition-all duration-300 transform hover:scale-110",
          isListening
            ? "bg-red-500 text-white shadow-lg animate-pulse"
            : "bg-blue-500 text-white hover:bg-blue-600 shadow-md"
        )}
        disabled={isSpeaking}
      >
        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
        
        {/* Visual indicator for listening */}
        {isListening && (
          <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping" />
        )}
      </button>

      {/* Speaker button */}
      <button
        onClick={isSpeaking ? stopSpeaking : () => speak("Hello! I'm your Virtual Buddy.")}
        className={cn(
          "p-4 rounded-full transition-all duration-300 transform hover:scale-110",
          isSpeaking
            ? "bg-green-500 text-white shadow-lg animate-pulse"
            : "bg-gray-500 text-white hover:bg-gray-600 shadow-md"
        )}
        disabled={isListening}
      >
        {isSpeaking ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>

      {/* Transcript display */}
      {transcript && (
        <div className="flex-1 p-3 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-700 text-sm">
            {transcript}
          </p>
        </div>
      )}

      {/* Status indicators */}
      <div className="flex flex-col space-y-1">
        <div className={cn(
          "h-2 w-2 rounded-full transition-colors duration-300",
          isListening ? "bg-red-400 animate-pulse" : "bg-gray-300"
        )} />
        <div className={cn(
          "h-2 w-2 rounded-full transition-colors duration-300",
          isSpeaking ? "bg-green-400 animate-pulse" : "bg-gray-300"
        )} />
      </div>
    </div>
  )
}

// Hook for easier integration
export function useVoiceInterface() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const speak = (text: string) => {
    const win = window as { buddySpeak?: (text: string) => void }
    if (win.buddySpeak) {
      win.buddySpeak(text)
    }
  }

  const stopSpeaking = () => {
    const win = window as { buddyStopSpeaking?: () => void }
    if (win.buddyStopSpeaking) {
      win.buddyStopSpeaking()
    }
  }

  return {
    isListening,
    isSpeaking,
    speak,
    stopSpeaking,
    setIsListening,
    setIsSpeaking
  }
}