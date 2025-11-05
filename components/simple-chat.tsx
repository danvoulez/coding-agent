'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowUp, Loader2, User, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface SimpleChatProps {
  conversationId: string
  initialPrompt?: string
}

export function SimpleChat({ conversationId, initialPrompt }: SimpleChatProps) {
  // Initialize messages with initial prompt if provided
  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialPrompt) {
      return [
        {
          role: 'user',
          content: initialPrompt,
          timestamp: new Date(),
        },
      ]
    }
    return []
  })
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Add AI response to initial prompt
  useEffect(() => {
    if (initialPrompt && messages.length === 1) {
      const timer = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: "Hello! I'm LogLine, your AI coding assistant. How can I help you today?",
            timestamp: new Date(),
          },
        ])
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [initialPrompt, messages.length])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [input])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // TODO: Send to LogLine API
    // For now, simulate response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I received your message: "' +
            userMessage.content +
            '". This is a placeholder response. LogLine integration coming soon!',
          timestamp: new Date(),
        },
      ])
      setIsLoading(false)
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">LogLine</h2>
                <p className="text-muted-foreground max-w-md">
                  Your AI coding assistant. Ask me anything about your code, or request changes to your project.
                </p>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={cn('flex gap-4 group', message.role === 'assistant' ? 'bg-muted/30 -mx-4 px-4 py-6' : 'py-2')}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white',
                  )}
                >
                  {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
              </div>

              {/* Message content */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {message.role === 'user' ? 'You' : 'LogLine'}
                  </span>
                  <span className="text-xs text-muted-foreground">{message.timestamp.toLocaleTimeString()}</span>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 bg-muted/30 -mx-4 px-4 py-6">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <span className="text-sm font-semibold text-foreground">LogLine</span>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative rounded-2xl border border-border/50 bg-background shadow-sm hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-primary/20">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Send a message..."
                disabled={isLoading}
                rows={1}
                className="w-full resize-none border-0 bg-transparent px-4 py-3 pr-12 max-h-32 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-full shadow-sm hover:shadow transition-all"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground">Enter</kbd> to send,{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground">Shift + Enter</kbd> for new line
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
