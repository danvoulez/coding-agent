'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageSquare, Trash2, Clock } from 'lucide-react'
import { getChatHistory, deleteChatFromHistory, type ChatHistoryItem } from '@/lib/utils/chat-history'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface ChatSidebarProps {
  currentChatId?: string
  onChatSelect?: (chatId: string) => void
}

export function ChatSidebar({ currentChatId, onChatSelect }: ChatSidebarProps) {
  const [chats, setChats] = useState<ChatHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadChats = () => {
    const history = getChatHistory()
    setChats(history)
    setIsLoading(false)
  }

  useEffect(() => {
    loadChats()

    // Refresh chat list when storage changes (from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'logline-chat-history') {
        loadChats()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteChatFromHistory(chatId)
    loadChats()

    // If deleting current chat, navigate to home
    if (chatId === currentChatId && onChatSelect) {
      window.location.href = '/'
    }
  }

  const handleChatClick = (chatId: string) => {
    if (onChatSelect) {
      onChatSelect(chatId)
    } else {
      window.location.href = `/?conversation=${chatId}`
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse h-[70px] rounded-lg">
            <CardContent className="px-3 py-2" />
          </Card>
        ))}
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">Nenhum chat ainda</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Inicie uma conversa para começar</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {chats.map((chat) => (
        <Card
          key={chat.id}
          className={cn(
            'cursor-pointer transition-all hover:bg-accent/50 rounded-lg group',
            currentChatId === chat.id && 'bg-accent border-primary/50',
          )}
          onClick={() => handleChatClick(chat.id)}
        >
          <CardContent className="px-3 py-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <h3 className="text-sm font-medium truncate">{chat.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{chat.preview}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(chat.timestamp, {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                  <span>•</span>
                  <span>{chat.messageCount} msgs</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDeleteChat(chat.id, e)}
                title="Deletar chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
