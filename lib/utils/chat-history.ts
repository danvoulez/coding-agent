/**
 * Chat History Management
 * Currently uses localStorage, will migrate to LogLine ledger
 */

export interface ChatHistoryItem {
  id: string
  title: string
  preview: string
  timestamp: Date
  messageCount: number
}

const STORAGE_KEY = 'logline-chat-history'

export function getChatHistory(): ChatHistoryItem[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    return parsed.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }))
  } catch (error) {
    console.error('Error loading chat history:', error)
    return []
  }
}

export function saveChatToHistory(chat: ChatHistoryItem): void {
  if (typeof window === 'undefined') return

  try {
    const history = getChatHistory()

    // Remove existing chat with same ID if it exists
    const filtered = history.filter((item) => item.id !== chat.id)

    // Add new chat at the beginning
    const updated = [chat, ...filtered].slice(0, 50) // Keep last 50 chats

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Error saving chat to history:', error)
  }
}

export function updateChatInHistory(id: string, updates: Partial<ChatHistoryItem>): void {
  if (typeof window === 'undefined') return

  try {
    const history = getChatHistory()
    const updated = history.map((item) => (item.id === id ? { ...item, ...updates } : item))

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Error updating chat in history:', error)
  }
}

export function deleteChatFromHistory(id: string): void {
  if (typeof window === 'undefined') return

  try {
    const history = getChatHistory()
    const filtered = history.filter((item) => item.id !== id)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error deleting chat from history:', error)
  }
}

export function clearChatHistory(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing chat history:', error)
  }
}

export function generateChatTitle(prompt: string): string {
  // Generate a short title from the prompt
  const maxLength = 40
  if (prompt.length <= maxLength) return prompt
  return prompt.slice(0, maxLength) + '...'
}

export function generateChatPreview(prompt: string): string {
  // Generate a preview from the prompt
  const maxLength = 80
  if (prompt.length <= maxLength) return prompt
  return prompt.slice(0, maxLength) + '...'
}
