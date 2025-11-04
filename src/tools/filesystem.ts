/**
 * File system tools for local file operations
 */

import { promises as fs } from 'fs'
import path from 'path'
import { Tool, ToolResult } from './types'
import { requestPermission } from './permissions'

export const readFileTool: Tool = {
  name: 'read_file',
  description: 'Read the contents of a file',
  parameters: [
    {
      name: 'path',
      type: 'string',
      description: 'Path to the file to read',
      required: true,
    },
  ],
  execute: async (params): Promise<ToolResult> => {
    const { path: filePath } = params

    try {
      // Request permission
      const permission = await requestPermission({
        action: 'read',
        path: filePath,
      })

      if (!permission.approved) {
        return {
          success: false,
          error: permission.reason || 'Permission denied',
        }
      }

      const content = await fs.readFile(filePath, 'utf-8')
      return {
        success: true,
        output: content,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file',
      }
    }
  },
}

export const writeFileTool: Tool = {
  name: 'write_file',
  description: 'Write content to a file',
  parameters: [
    {
      name: 'path',
      type: 'string',
      description: 'Path to the file to write',
      required: true,
    },
    {
      name: 'content',
      type: 'string',
      description: 'Content to write to the file',
      required: true,
    },
  ],
  execute: async (params): Promise<ToolResult> => {
    const { path: filePath, content } = params

    try {
      // Request permission
      const permission = await requestPermission({
        action: 'write',
        path: filePath,
        details: `${content.length} characters`,
      })

      if (!permission.approved) {
        return {
          success: false,
          error: permission.reason || 'Permission denied',
        }
      }

      // Ensure directory exists
      const dir = path.dirname(filePath)
      await fs.mkdir(dir, { recursive: true })

      await fs.writeFile(filePath, content, 'utf-8')
      return {
        success: true,
        output: `Successfully wrote to ${filePath}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to write file',
      }
    }
  },
}

export const listDirectoryTool: Tool = {
  name: 'list_directory',
  description: 'List contents of a directory',
  parameters: [
    {
      name: 'path',
      type: 'string',
      description: 'Path to the directory',
      required: true,
    },
  ],
  execute: async (params): Promise<ToolResult> => {
    const { path: dirPath } = params

    try {
      const permission = await requestPermission({
        action: 'read',
        path: dirPath,
      })

      if (!permission.approved) {
        return {
          success: false,
          error: permission.reason || 'Permission denied',
        }
      }

      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      const formatted = entries
        .map((entry) => `${entry.isDirectory() ? '📁' : '📄'} ${entry.name}`)
        .join('\n')

      return {
        success: true,
        output: formatted,
        data: entries.map((e) => ({ name: e.name, isDirectory: e.isDirectory() })),
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list directory',
      }
    }
  },
}

export const fileSystemTools = [readFileTool, writeFileTool, listDirectoryTool]
