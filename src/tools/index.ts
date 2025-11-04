/**
 * Export all tools for the coding agent
 */

export * from './types'
export * from './permissions'
export * from './filesystem'
export * from './command'
export * from './git'
export * from './logline'
export * from './web'

import { fileSystemTools } from './filesystem'
import { commandTools } from './command'
import { gitTools } from './git'
import { webTools } from './web'
import { Tool } from './types'

/**
 * All local tools (LogLine tools are created dynamically with client)
 */
export const allTools: Tool[] = [...fileSystemTools, ...commandTools, ...gitTools, ...webTools]

/**
 * Get tool by name
 */
export function getTool(name: string): Tool | undefined {
  return allTools.find((tool) => tool.name === name)
}

/**
 * Get tool descriptions for AI prompting
 */
export function getToolDescriptions(): string {
  return allTools
    .map((tool) => {
      const params = tool.parameters
        .map((p) => `${p.name}: ${p.type}${p.required ? '' : '?'} - ${p.description}`)
        .join('\n  ')

      return `### ${tool.name}\n${tool.description}\n\nParameters:\n  ${params || 'None'}`
    })
    .join('\n\n')
}
