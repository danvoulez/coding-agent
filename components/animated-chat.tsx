'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowUp, Loader2, User, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTask } from '@/lib/hooks/use-task'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AnimatedChatProps {
  taskId: string
  initialPrompt: string
}

export function AnimatedChat({ taskId, initialPrompt }: AnimatedChatProps) {
  const { task } = useTask(taskId)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'user',
      content: initialPrompt,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasAnimated, setHasAnimated] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Trigger animation after mount
  useEffect(() => {
    setTimeout(() => setHasAnimated(true), 100)
  }, [])

  // Simulate AI response (replace with real API later)
  useEffect(() => {
    if (task && task.logs && task.logs.length > 0) {
      // Extract messages from task logs
      const aiMessages = task.logs
        .filter((log) => log.message && log.message.trim())
        .map((log) => ({
          role: 'assistant' as const,
          content: log.message,
          timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
        }))

      if (aiMessages.length > messages.filter((m) => m.role === 'assistant').length) {
        setMessages((prev) => {
          const userMessages = prev.filter((m) => m.role === 'user')
          return [...userMessages, ...aiMessages]
        })
        setIsLoading(false)
      }
    }
  }, [task, messages])

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

    // TODO: Send to API
    try {
      const response = await fetch(`/api/tasks/${taskId}/continue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Messages area - full screen */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500',
                message.role === 'assistant' ? 'justify-start' : 'justify-end',
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
                    <Bot className="w-5 h-5" />
                  </div>
                </div>
              )}

              <div
                className={cn(
                  'max-w-[70%] rounded-2xl px-5 py-3 shadow-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 border border-border/50',
                )}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <span className="text-xs opacity-70 mt-2 block">{message.timestamp.toLocaleTimeString()}</span>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                    <User className="w-5 h-5" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 justify-start animate-in fade-in slide-in-from-bottom-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
                  <Bot className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-muted/50 border border-border/50 rounded-2xl px-5 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">LogLine está pensando...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area - animated to bottom */}
      <div
        className={cn(
          'border-t border-border/50 bg-background/95 backdrop-blur-lg transition-all duration-700 ease-out',
          hasAnimated ? 'translate-y-0 opacity-100' : '-translate-y-[200px] opacity-0',
        )}
      >
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative rounded-2xl border border-border/50 bg-background shadow-lg hover:shadow-xl transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enviar mensagem..."
                disabled={isLoading}
                rows={1}
                className="w-full resize-none border-0 bg-transparent px-5 py-4 pr-14 max-h-32 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 h-9 w-9 p-0 rounded-full shadow-md hover:shadow-lg transition-all"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2 opacity-70">
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground text-[10px]">Enter</kbd> enviar •{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground text-[10px]">Shift + Enter</kbd> nova linha
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
