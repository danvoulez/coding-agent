/**
 * LogLine-powered tools that Claude can call
 * These bridge the local coding agent to the LogLine API
 */

import { Tool, ToolResult } from './types'
import { LogLineClient, BOOT_FUNCTIONS } from '../config/logline'

/**
 * Create LogLine tools with a configured client
 */
export function createLogLineTools(client: LogLineClient): Tool[] {
  return [logLinePromptFetchTool(client), logLineMemoryStoreTool(client), logLineMemorySearchTool(client)]
}

/**
 * Fetch a versioned prompt from LogLine ledger
 */
function logLinePromptFetchTool(client: LogLineClient): Tool {
  return {
    name: 'logline_prompt_fetch',
    description:
      'Fetch a versioned, governed prompt from the LogLine system. Use this to get consistent, centrally-managed prompts instead of hardcoding them.',
    parameters: [
      {
        name: 'prompt_id',
        type: 'string',
        description: 'UUID of the prompt block to fetch',
        required: true,
      },
      {
        name: 'vars',
        type: 'object',
        description: 'Variables to interpolate into the prompt template (e.g., user_name, org_name, context)',
        required: false,
      },
    ],
    execute: async (params): Promise<ToolResult> => {
      const { prompt_id, vars = {} } = params

      try {
        const response = await client.boot(BOOT_FUNCTIONS.PROMPT_FETCH, {
          prompt_id,
          vars,
        })

        // Extract the compiled prompt text from response
        const promptText = response.output?.text || response.data?.content || response.output || ''

        return {
          success: true,
          output: promptText,
          data: response,
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch prompt from LogLine',
        }
      }
    },
  }
}

/**
 * Store a memory in LogLine's governed memory system
 */
function logLineMemoryStoreTool(client: LogLineClient): Tool {
  return {
    name: 'logline_memory_store',
    description:
      'Store information in the LogLine memory system. Memories are persisted as spans with governance, consent tracking, and optional embeddings for semantic search.',
    parameters: [
      {
        name: 'content',
        type: 'string',
        description: 'The content to store in memory',
        required: true,
      },
      {
        name: 'tags',
        type: 'array',
        description: 'Tags for categorizing this memory (e.g., ["conversation", "code-review"])',
        required: false,
      },
      {
        name: 'memory_type',
        type: 'string',
        description: 'Type of memory: session (temporary), local (user-specific), or permanent (long-term)',
        required: false,
      },
      {
        name: 'sensitivity',
        type: 'string',
        description: 'Sensitivity level: internal, secret, pii, or public',
        required: false,
      },
    ],
    execute: async (params): Promise<ToolResult> => {
      const { content, tags = [], memory_type = 'session', sensitivity = 'internal' } = params

      try {
        const response = await client.boot(BOOT_FUNCTIONS.MEMORY_STORE, {
          action: 'store',
          content,
          tags: Array.isArray(tags) ? tags : [tags],
          memory_type,
          sensitivity,
        })

        const memoryId = response.data?.id || response.output?.id || 'unknown'

        return {
          success: true,
          output: `Memory stored successfully with ID: ${memoryId}`,
          data: response,
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to store memory in LogLine',
        }
      }
    },
  }
}

/**
 * Search memories in LogLine system
 */
function logLineMemorySearchTool(client: LogLineClient): Tool {
  return {
    name: 'logline_memory_search',
    description:
      'Search the LogLine memory system for relevant information. Uses semantic search with embeddings and respects tenant isolation and consent policies.',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Search query to find relevant memories',
        required: true,
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Maximum number of results to return (default: 5)',
        required: false,
      },
    ],
    execute: async (params): Promise<ToolResult> => {
      const { query, limit = 5 } = params

      try {
        const response = await client.boot(BOOT_FUNCTIONS.MEMORY_STORE, {
          action: 'search',
          query,
          limit,
        })

        const results = response.data?.results || response.output?.results || []

        // Format results for readability
        const formatted = results
          .map(
            (r: any, i: number) =>
              `${i + 1}. [${r.tags?.join(', ') || 'no tags'}] ${r.content?.substring(0, 100)}${r.content?.length > 100 ? '...' : ''}`,
          )
          .join('\n')

        return {
          success: true,
          output: formatted || 'No memories found',
          data: results,
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to search memories in LogLine',
        }
      }
    },
  }
}

export const logLineToolNames = ['logline_prompt_fetch', 'logline_memory_store', 'logline_memory_search'] as const
