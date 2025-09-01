'use client'

import { useState, useEffect } from 'react'
import { VirtualAvatar } from '@/components/avatar/VirtualAvatar'
import { VoiceInterface } from '@/components/voice/VoiceInterface'
import { DynamicWhiteboard } from '@/components/whiteboard/DynamicWhiteboard'
import { geminiService } from '@/lib/gemini'
import { 
  AvatarState, 
  VoiceSettings, 
  WhiteboardItem, 
  Message, 
  ConversationContext 
} from '@/types'
import { generateId } from '@/lib/utils'
import { motion } from 'framer-motion'
import { MessageCircle, Settings, BookOpen, Brain } from 'lucide-react'

export function VirtualBuddyApp() {
  // Avatar state
  const [avatarState, setAvatarState] = useState<AvatarState>({
    emotion: 'neutral',
    isListening: false,
    isSpeaking: false,
    isTyping: false
  })

  // Voice settings
  const [voiceSettings] = useState<VoiceSettings>({
    enabled: true,
    language: 'en-US',
    pitch: 1,
    rate: 1
  })

  // Whiteboard items
  const [whiteboardItems, setWhiteboardItems] = useState<WhiteboardItem[]>([])

  // Conversation state
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    messages: [],
    currentTopic: 'Getting Started with Python',
    userLevel: 'beginner',
    learningGoals: ['Learn Python basics', 'Build AI projects', 'Understand coding concepts']
  })

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [currentInput, setCurrentInput] = useState('')

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: generateId(),
      content: "Hi there! I'm your Virtual Buddy, and I'm so excited to help you learn Python and AI development! What would you like to explore today?",
      role: 'assistant',
      timestamp: new Date(),
      emotion: 'excited'
    }
    setMessages([welcomeMessage])
    setConversationContext(prev => ({ ...prev, messages: [welcomeMessage] }))

    // Auto-speak welcome message
    setTimeout(() => {
      const buddySpeak = (window as { buddySpeak?: (text: string) => void }).buddySpeak
      if (buddySpeak) {
        buddySpeak(welcomeMessage.content)
      }
    }, 1000)

    // Add initial whiteboard content
    const initialItems: WhiteboardItem[] = [
      {
        id: generateId(),
        type: 'text',
        content: '🎯 Today\'s Learning Goals:\n• Understand Python basics\n• Write your first program\n• Debug common errors\n• Build confidence!',
        position: { x: 20, y: 20 },
        size: { width: 280, height: 160 }
      }
    ]
    setWhiteboardItems(initialItems)
  }, [])

  const handleVoiceTranscript = async (transcript: string) => {
    if (!transcript.trim()) return

    const userMessage: Message = {
      id: generateId(),
      content: transcript,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setAvatarState(prev => ({ ...prev, isTyping: true, emotion: 'thinking' }))

    try {
      // Update conversation context
      const updatedContext = {
        ...conversationContext,
        messages: [...messages, userMessage]
      }

      // Get response from Gemini
      const { response, emotion } = await geminiService.generateResponse(transcript, updatedContext)

      const assistantMessage: Message = {
        id: generateId(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
        emotion
      }

      setMessages(prev => [...prev, assistantMessage])
      setConversationContext({
        ...updatedContext,
        messages: [...updatedContext.messages, assistantMessage]
      })

      setAvatarState(prev => ({ 
        ...prev, 
        isTyping: false, 
        emotion 
      }))

      // Auto-speak response
      const buddySpeak = (window as { buddySpeak?: (text: string) => void }).buddySpeak
      if (buddySpeak) {
        buddySpeak(response)
      }

      // Auto-add relevant content to whiteboard
      if (transcript.toLowerCase().includes('code') || transcript.toLowerCase().includes('example')) {
        const whiteboardAddCode = (window as { whiteboardAddCode?: (code: string) => void }).whiteboardAddCode
        whiteboardAddCode?.(`# Example related to: ${transcript}\nprint("Hello, ${transcript.split(' ')[0]}!")`)
      }

    } catch (error) {
      console.error('Error processing voice input:', error)
      setAvatarState(prev => ({ ...prev, isTyping: false, emotion: 'concerned' }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleTextInput = async (text: string) => {
    if (!text.trim()) return
    await handleVoiceTranscript(text)
    setCurrentInput('')
  }

  const handleListeningChange = (isListening: boolean) => {
    setAvatarState(prev => ({ ...prev, isListening }))
  }

  const handleSpeakingChange = (isSpeaking: boolean) => {
    setAvatarState(prev => ({ ...prev, isSpeaking }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white bg-opacity-80 backdrop-blur-sm shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Brain className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Virtual Buddy
                </h1>
                <p className="text-sm text-gray-600">Your AI Python Learning Companion</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-600">Level:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {conversationContext.userLevel}
                </span>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Settings size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          
          {/* Avatar Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1 bg-white bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl p-6"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center space-x-2 mb-4">
                <MessageCircle size={20} className="text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">Your Virtual Buddy</h2>
              </div>
              
              {/* Avatar Container */}
              <div className="flex-1 min-h-[300px] mb-4">
                <VirtualAvatar state={avatarState} />
              </div>
              
              {/* Current Status */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600 mb-1">Current Topic:</p>
                <p className="font-medium text-gray-800">{conversationContext.currentTopic}</p>
              </div>
              
              {/* Voice Interface */}
              <VoiceInterface
                onTranscript={handleVoiceTranscript}
                onListeningChange={handleListeningChange}
                onSpeakingChange={handleSpeakingChange}
                settings={voiceSettings}
              />
            </div>
          </motion.div>

          {/* Whiteboard Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center space-x-2 mb-4">
              <BookOpen size={20} className="text-green-600" />
              <h2 className="text-lg font-semibold text-gray-800">Dynamic Learning Whiteboard</h2>
            </div>
            
            <DynamicWhiteboard
              items={whiteboardItems}
              onItemsChange={setWhiteboardItems}
              className="h-full"
            />
          </motion.div>
        </div>

        {/* Conversation History */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-white bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl p-6"
        >
          <div className="flex items-center space-x-2 mb-4">
            <MessageCircle size={20} className="text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-800">Conversation History</h2>
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-100 ml-8'
                    : 'bg-gray-100 mr-8'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium text-gray-600">
                    {message.role === 'user' ? 'You' : 'Virtual Buddy'}
                  </span>
                  {message.emotion && (
                    <span className="text-xs text-gray-500">
                      {message.emotion === 'happy' && '😊'}
                      {message.emotion === 'concerned' && '🤔'}
                      {message.emotion === 'thinking' && '💭'}
                      {message.emotion === 'excited' && '🎉'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-800">{message.content}</p>
              </div>
            ))}
          </div>
          
          {/* Text Input */}
          <div className="mt-4 flex space-x-2">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTextInput(currentInput)}
              placeholder="Type your message here... or use voice input above"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={() => handleTextInput(currentInput)}
              disabled={!currentInput.trim() || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}