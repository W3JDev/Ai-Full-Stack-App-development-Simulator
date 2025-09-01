export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  emotion?: 'happy' | 'concerned' | 'thinking' | 'excited' | 'neutral'
}

export interface ConversationContext {
  messages: Message[]
  currentTopic: string
  userLevel: 'beginner' | 'intermediate' | 'advanced'
  learningGoals: string[]
  currentProject?: string
}

export interface AvatarState {
  emotion: 'happy' | 'concerned' | 'thinking' | 'excited' | 'neutral'
  isListening: boolean
  isSpeaking: boolean
  isTyping: boolean
}

export interface VoiceSettings {
  enabled: boolean
  language: string
  pitch: number
  rate: number
  voice?: SpeechSynthesisVoice
}

export interface WhiteboardItem {
  id: string
  type: 'code' | 'diagram' | 'image' | 'text' | 'chart'
  content: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  metadata?: Record<string, unknown>
}

export interface CodeAssistResponse {
  explanation: string
  codeExample?: string
  suggestions: string[]
  relatedConcepts: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface LessonModule {
  id: string
  title: string
  description: string
  duration: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  topics: string[]
  prerequisites: string[]
  learningObjectives: string[]
}