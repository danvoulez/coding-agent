/**
 * Configuration management for the CLI agent
 */

import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

const CONFIG_DIR = path.join(os.homedir(), '.coding-agent')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')
const HISTORY_FILE = path.join(CONFIG_DIR, 'history.json')

export interface AgentConfig {
  anthropicApiKey?: string
  openaiApiKey?: string
  geminiApiKey?: string
  cursorApiKey?: string
  defaultModel?: string
  workingDirectory?: string
  // LogLine API configuration
  logLineApiUrl?: string
  logLineWsUrl?: string
  logLineTenant?: string
  logLineToken?: string
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface ConversationHistory {
  sessionId: string
  messages: ConversationMessage[]
  createdAt: number
  updatedAt: number
}

/**
 * Ensure config directory exists
 */
async function ensureConfigDir(): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true })
  } catch (error) {
    console.error('Failed to create config directory:', error)
  }
}

/**
 * Load configuration from disk
 */
export async function loadConfig(): Promise<AgentConfig> {
  await ensureConfigDir()

  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // Config doesn't exist or is invalid, return empty config
    return {}
  }
}

/**
 * Save configuration to disk
 */
export async function saveConfig(config: AgentConfig): Promise<void> {
  await ensureConfigDir()

  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to save config:', error)
    throw error
  }
}

/**
 * Get API key (from config or environment)
 */
export async function getApiKey(provider: 'anthropic' | 'openai' | 'gemini' | 'cursor'): Promise<string | undefined> {
  const config = await loadConfig()

  const envVars = {
    anthropic: 'ANTHROPIC_API_KEY',
    openai: 'OPENAI_API_KEY',
    gemini: 'GEMINI_API_KEY',
    cursor: 'CURSOR_API_KEY',
  }

  const configKeys = {
    anthropic: config.anthropicApiKey,
    openai: config.openaiApiKey,
    gemini: config.geminiApiKey,
    cursor: config.cursorApiKey,
  }

  return configKeys[provider] || process.env[envVars[provider]]
}

/**
 * Get LogLine configuration (from config or environment)
 */
export async function getLogLineConfig(): Promise<{
  apiUrl?: string
  wsUrl?: string
  tenant?: string
  token?: string
}> {
  const config = await loadConfig()

  return {
    apiUrl: config.logLineApiUrl || process.env.LOGLINE_API_URL,
    wsUrl: config.logLineWsUrl || process.env.LOGLINE_WS_URL,
    tenant: config.logLineTenant || process.env.LOGLINE_TENANT,
    token: config.logLineToken || process.env.LOGLINE_TOKEN,
  }
}

/**
 * Load conversation history
 */
export async function loadHistory(): Promise<ConversationHistory[]> {
  await ensureConfigDir()

  try {
    const data = await fs.readFile(HISTORY_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

/**
 * Save conversation history
 */
export async function saveHistory(history: ConversationHistory[]): Promise<void> {
  await ensureConfigDir()

  try {
    await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to save history:', error)
  }
}

/**
 * Add message to current session
 */
export async function addMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
): Promise<void> {
  const history = await loadHistory()
  const session = history.find((h) => h.sessionId === sessionId)

  const message: ConversationMessage = {
    role,
    content,
    timestamp: Date.now(),
  }

  if (session) {
    session.messages.push(message)
    session.updatedAt = Date.now()
  } else {
    history.push({
      sessionId,
      messages: [message],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  }

  await saveHistory(history)
}

/**
 * Get messages for a session
 */
export async function getSessionMessages(sessionId: string): Promise<ConversationMessage[]> {
  const history = await loadHistory()
  const session = history.find((h) => h.sessionId === sessionId)
  return session?.messages || []
}
