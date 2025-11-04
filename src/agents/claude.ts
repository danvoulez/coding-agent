/**
 * Claude agent with tool calling - integrates both local and LogLine tools
 */

import Anthropic from '@anthropic-ai/sdk'
import { Tool, ToolResult } from '../tools/types'
import { allTools as localTools } from '../tools'
import { createLogLineTools } from '../tools/logline'
import { LogLineClient } from '../config/logline'

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string | any[]
}

export interface ClaudeAgentConfig {
  apiKey: string
  model?: string
  logLineClient?: LogLineClient
}

/**
 * Convert our Tool format to Anthropic's tool schema
 */
function toolToAnthropicSchema(tool: Tool): Anthropic.Tool {
  const properties: Record<string, any> = {}
  const required: string[] = []

  for (const param of tool.parameters) {
    properties[param.name] = {
      type: param.type === 'array' ? 'array' : param.type === 'object' ? 'object' : 'string',
      description: param.description,
    }

    if (param.required) {
      required.push(param.name)
    }
  }

  return {
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: 'object',
      properties,
      required,
    },
  }
}

/**
 * Claude agent that can use both local and LogLine tools
 */
export class ClaudeAgent {
  private client: Anthropic
  private model: string
  private tools: Map<string, Tool>
  private conversationHistory: ClaudeMessage[] = []

  constructor(config: ClaudeAgentConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey })
    this.model = config.model || 'claude-sonnet-4-5-20250929'

    // Combine local tools and LogLine tools
    this.tools = new Map()

    for (const tool of localTools) {
      this.tools.set(tool.name, tool)
    }

    if (config.logLineClient) {
      const logLineTools = createLogLineTools(config.logLineClient)
      for (const tool of logLineTools) {
        this.tools.set(tool.name, tool)
      }
    }
  }

  /**
   * Send a message and handle tool calls
   */
  async sendMessage(userMessage: string, onStream?: (text: string) => void): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    })

    let assistantResponse = ''
    let continueLoop = true

    while (continueLoop) {
      // Call Claude with tools
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: this.conversationHistory,
        tools: Array.from(this.tools.values()).map(toolToAnthropicSchema),
      })

      // Build assistant message content
      const assistantContent: any[] = []
      let textContent = ''

      for (const block of response.content) {
        if (block.type === 'text') {
          textContent += block.text
          if (onStream) {
            onStream(block.text)
          }
          assistantContent.push(block)
        } else if (block.type === 'tool_use') {
          assistantContent.push(block)

          // Execute the tool
          const tool = this.tools.get(block.name)
          if (!tool) {
            console.error(`Unknown tool: ${block.name}`)
            continue
          }

          console.log(`\n🔧 Calling tool: ${block.name}`)
          console.log(`   Input:`, JSON.stringify(block.input, null, 2))

          const result: ToolResult = await tool.execute(block.input as Record<string, any>)

          console.log(`   Result:`, result.success ? '✓ Success' : '✗ Failed')
          if (result.output) {
            console.log(`   Output: ${result.output.substring(0, 200)}${result.output.length > 200 ? '...' : ''}`)
          }

          // Add tool result to conversation
          this.conversationHistory.push({
            role: 'assistant',
            content: assistantContent,
          })

          this.conversationHistory.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: block.id,
                content: result.success
                  ? result.output || JSON.stringify(result.data)
                  : `Error: ${result.error}`,
              },
            ] as any,
          })

          // Continue the loop to let Claude process tool results
          continueLoop = true
          break
        }
      }

      // If no tool calls, we're done
      if (response.stop_reason === 'end_turn') {
        this.conversationHistory.push({
          role: 'assistant',
          content: textContent,
        })
        assistantResponse = textContent
        continueLoop = false
      } else if (response.stop_reason !== 'tool_use') {
        continueLoop = false
      }
    }

    return assistantResponse
  }

  /**
   * Get conversation history
   */
  getHistory(): ClaudeMessage[] {
    return this.conversationHistory
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = []
  }

  /**
   * Add a system message to set context
   */
  addSystemContext(context: string): void {
    // Anthropic doesn't support system role in messages array
    // Instead, prepend as a user message with clear framing
    this.conversationHistory.unshift({
      role: 'user',
      content: `SYSTEM CONTEXT: ${context}`,
    })
  }
}
