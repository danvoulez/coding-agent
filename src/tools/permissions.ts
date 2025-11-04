/**
 * Permission system for interactive user approval of file and command operations
 */

import readline from 'readline'
import { PermissionRequest, PermissionResponse } from './types'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Auto-approve mode toggle
let autoApproveEnabled = false

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

export function setAutoApprove(enabled: boolean): void {
  autoApproveEnabled = enabled
}

export function isAutoApproveEnabled(): boolean {
  return autoApproveEnabled
}

export async function requestPermission(request: PermissionRequest): Promise<PermissionResponse> {
  const { action, path, command, details } = request

  // Auto-approve if enabled
  if (autoApproveEnabled) {
    let logMessage = ''
    switch (action) {
      case 'read':
        logMessage = `📖 Auto-approved: Reading ${path}`
        break
      case 'write':
        logMessage = `✏️  Auto-approved: Writing to ${path}`
        break
      case 'delete':
        logMessage = `🗑️  Auto-approved: Deleting ${path}`
        break
      case 'execute':
        logMessage = `⚡ Auto-approved: Running ${command}`
        break
    }
    console.log(logMessage)
    return { approved: true }
  }

  let prompt = ''

  switch (action) {
    case 'read':
      prompt = `📖 AI wants to read file: ${path}\n`
      break
    case 'write':
      prompt = `✏️  AI wants to write to file: ${path}\n`
      if (details) prompt += `   Changes: ${details}\n`
      break
    case 'delete':
      prompt = `🗑️  AI wants to delete: ${path}\n`
      break
    case 'execute':
      prompt = `⚡ AI wants to run command: ${command}\n`
      if (details) prompt += `   Purpose: ${details}\n`
      break
  }

  prompt += 'Allow this action? (yes/no/always/never): '

  const answer = await question(prompt)
  const normalized = answer.toLowerCase().trim()

  if (normalized === 'yes' || normalized === 'y' || normalized === 'always') {
    return { approved: true }
  }

  return { approved: false, reason: 'User denied permission' }
}

export function closePermissionInterface(): void {
  rl.close()
}
