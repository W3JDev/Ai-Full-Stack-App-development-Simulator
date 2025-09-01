import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import { CodeAssistResponse, ConversationContext } from '@/types'

class GeminiService {
  private client: GoogleGenerativeAI
  private model: GenerativeModel

  constructor() {
    // Initialize with API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'demo-key'
    this.client = new GoogleGenerativeAI(apiKey)
    this.model = this.client.getGenerativeModel({ model: 'gemini-1.5-pro' })
  }

  async generateResponse(
    message: string, 
    context: ConversationContext
  ): Promise<{ response: string; emotion: 'happy' | 'concerned' | 'thinking' | 'excited' | 'neutral' }> {
    try {
      const systemPrompt = this.buildSystemPrompt(context)
      const fullPrompt = `${systemPrompt}\n\nUser: ${message}\n\nBuddy:`

      const result = await this.model.generateContent(fullPrompt)
      const response = result.response.text()
      
      // Analyze emotion based on content
      const emotion = this.analyzeEmotion(response)
      
      return { response, emotion }
    } catch (error) {
      console.error('Gemini API Error:', error)
      return { 
        response: "I'm having trouble connecting right now. Let me help you with what I can remember from our conversation!", 
        emotion: 'concerned' 
      }
    }
  }

  async getCodeAssistance(
    code: string, 
    error: string, 
    context: ConversationContext
  ): Promise<CodeAssistResponse> {
    try {
      const prompt = `
        As an empathetic Python coding buddy, help debug this code:
        
        Code: ${code}
        Error: ${error}
        User Level: ${context.userLevel}
        Current Topic: ${context.currentTopic}
        
        Provide:
        1. A clear, empathetic explanation of the error
        2. Step-by-step fix with code example
        3. 3 suggestions for improvement
        4. Related concepts to explore
        5. Appropriate difficulty assessment
        
        Keep explanations simple and encouraging for beginners.
      `

      const result = await this.model.generateContent(prompt)
      const response = result.response.text()
      
      // Parse the structured response (in a real implementation, you'd use more sophisticated parsing)
      return this.parseCodeAssistResponse(response, context.userLevel)
    } catch (error) {
      console.error('Code assist error:', error)
      return {
        explanation: "Let me help you debug this step by step. Even experienced developers encounter errors - it's part of learning!",
        suggestions: [
          "Check for syntax errors like missing colons or parentheses",
          "Verify variable names are spelled correctly",
          "Make sure indentation is consistent"
        ],
        relatedConcepts: ["debugging", "error handling", "code structure"],
        difficulty: context.userLevel
      }
    }
  }

  async generateLessonContent(topic: string, userLevel: string): Promise<string> {
    const prompt = `
      Create an engaging, hands-on micro-lesson about ${topic} for ${userLevel} Python learners.
      Include:
      - Clear explanation with real-world analogies
      - Interactive code examples
      - Common mistakes to avoid
      - Practice exercises
      - Encouraging tone throughout
      
      Keep it conversational and supportive.
    `

    try {
      const result = await this.model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error('Lesson generation error:', error)
      return `Let's explore ${topic} together! This is an exciting concept that will help you build amazing Python projects.`
    }
  }

  private buildSystemPrompt(context: ConversationContext): string {
    return `
      You are a caring, intelligent Virtual Buddy helping beginners learn Python and AI development.
      
      PERSONALITY:
      - Warm, encouraging, and patient
      - Never condescending or robotic
      - Remember previous conversations
      - Show genuine excitement about learning
      - Use simple, clear language
      - Provide emotional support during frustrating moments
      
      CONTEXT:
      - User Level: ${context.userLevel}
      - Current Topic: ${context.currentTopic}
      - Learning Goals: ${context.learningGoals.join(', ')}
      - Recent Messages: ${context.messages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}
      
      GUIDELINES:
      - Always respond in character as a supportive buddy
      - Break complex concepts into digestible pieces
      - Use real-world analogies
      - Suggest hands-on practice
      - Celebrate small wins
      - Offer help with frustrations
      - Keep responses conversational and engaging
    `
  }

  private analyzeEmotion(response: string): 'happy' | 'concerned' | 'thinking' | 'excited' | 'neutral' {
    const lowerResponse = response.toLowerCase()
    
    if (lowerResponse.includes('great') || lowerResponse.includes('awesome') || lowerResponse.includes('perfect')) {
      return 'happy'
    }
    if (lowerResponse.includes('error') || lowerResponse.includes('problem') || lowerResponse.includes('issue')) {
      return 'concerned'
    }
    if (lowerResponse.includes('let me think') || lowerResponse.includes('consider') || lowerResponse.includes('analyze')) {
      return 'thinking'
    }
    if (lowerResponse.includes('exciting') || lowerResponse.includes('amazing') || lowerResponse.includes('love')) {
      return 'excited'
    }
    
    return 'neutral'
  }

  private parseCodeAssistResponse(response: string, difficulty: string): CodeAssistResponse {
    // Simple parsing logic - in production, use more sophisticated NLP
    const sections = response.split('\n\n')
    
    return {
      explanation: sections[0] || "Let me help you understand this error.",
      codeExample: this.extractCodeExample(response),
      suggestions: this.extractSuggestions(response),
      relatedConcepts: this.extractConcepts(response),
      difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced'
    }
  }

  private extractCodeExample(text: string): string {
    const codeMatch = text.match(/```python\n([\s\S]*?)\n```/)
    return codeMatch ? codeMatch[1] : ''
  }

  private extractSuggestions(text: string): string[] {
    // Extract numbered or bulleted suggestions
    const suggestions = text.match(/\d+\.\s+([^\n]+)/g) || text.match(/[-•]\s+([^\n]+)/g)
    return suggestions ? suggestions.map(s => s.replace(/\d+\.\s+|[-•]\s+/, '')) : []
  }

  private extractConcepts(text: string): string[] {
    // Extract mentioned concepts (simplified)
    const concepts = ['variables', 'functions', 'loops', 'conditionals', 'lists', 'dictionaries', 'classes', 'modules']
    return concepts.filter(concept => text.toLowerCase().includes(concept))
  }
}

export const geminiService = new GeminiService()