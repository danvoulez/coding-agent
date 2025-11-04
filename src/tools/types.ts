/**
 * Tool system types for local file operations and command execution
 */

export interface ToolParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  required?: boolean
}

export interface Tool {
  name: string
  description: string
  parameters: ToolParameter[]
  execute: (params: Record<string, any>) => Promise<ToolResult>
}

export interface ToolResult {
  success: boolean
  output?: string
  error?: string
  data?: any
}

export interface PermissionRequest {
  action: 'read' | 'write' | 'delete' | 'execute'
  path?: string
  command?: string
  details?: string
}

export interface PermissionResponse {
  approved: boolean
  reason?: string
}
