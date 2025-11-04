/**
 * Command execution tool for running shell commands locally
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { Tool, ToolResult } from './types'
import { requestPermission } from './permissions'

const execAsync = promisify(exec)

export const executeCommandTool: Tool = {
  name: 'execute_command',
  description: 'Execute a shell command in the current directory',
  parameters: [
    {
      name: 'command',
      type: 'string',
      description: 'The shell command to execute',
      required: true,
    },
    {
      name: 'purpose',
      type: 'string',
      description: 'Explanation of what the command does',
      required: false,
    },
  ],
  execute: async (params): Promise<ToolResult> => {
    const { command, purpose } = params

    try {
      const permission = await requestPermission({
        action: 'execute',
        command,
        details: purpose,
      })

      if (!permission.approved) {
        return {
          success: false,
          error: permission.reason || 'Permission denied',
        }
      }

      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        env: process.env,
      })

      return {
        success: true,
        output: stdout || stderr,
        data: { stdout, stderr },
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Command execution failed',
        output: error.stdout || error.stderr,
      }
    }
  },
}

export const commandTools = [executeCommandTool]
