/**
 * Git operations using simple-git for local repository management
 */

import simpleGit, { SimpleGit } from 'simple-git'
import { Tool, ToolResult } from './types'
import { requestPermission } from './permissions'

let git: SimpleGit

/**
 * Initialize git instance with current working directory
 */
function getGit(): SimpleGit {
  if (!git) {
    git = simpleGit(process.cwd())
  }
  return git
}

export const gitStatusTool: Tool = {
  name: 'git_status',
  description: 'Get the current git status (modified, staged, untracked files)',
  parameters: [],
  execute: async (): Promise<ToolResult> => {
    try {
      const status = await getGit().status()

      const output = `
Branch: ${status.current}
Modified: ${status.modified.length} files
Staged: ${status.staged.length} files
Untracked: ${status.not_added.length} files
      `.trim()

      return {
        success: true,
        output,
        data: status,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get git status',
      }
    }
  },
}

export const gitDiffTool: Tool = {
  name: 'git_diff',
  description: 'Show diff of unstaged changes',
  parameters: [],
  execute: async (): Promise<ToolResult> => {
    try {
      const diff = await getGit().diff()

      return {
        success: true,
        output: diff || 'No unstaged changes',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get git diff',
      }
    }
  },
}

export const gitCommitTool: Tool = {
  name: 'git_commit',
  description: 'Stage all changes and create a commit',
  parameters: [
    {
      name: 'message',
      type: 'string',
      description: 'Commit message',
      required: true,
    },
  ],
  execute: async (params): Promise<ToolResult> => {
    const { message } = params

    try {
      const permission = await requestPermission({
        action: 'execute',
        command: `git add . && git commit -m "${message}"`,
        details: 'Stage and commit all changes',
      })

      if (!permission.approved) {
        return {
          success: false,
          error: permission.reason || 'Permission denied',
        }
      }

      await getGit().add('.')
      const result = await getGit().commit(message)

      return {
        success: true,
        output: `Committed: ${result.commit} - ${result.summary.changes} changes`,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to commit',
      }
    }
  },
}

export const gitCreateBranchTool: Tool = {
  name: 'git_create_branch',
  description: 'Create and checkout a new git branch',
  parameters: [
    {
      name: 'branchName',
      type: 'string',
      description: 'Name of the new branch',
      required: true,
    },
  ],
  execute: async (params): Promise<ToolResult> => {
    const { branchName } = params

    try {
      const permission = await requestPermission({
        action: 'execute',
        command: `git checkout -b ${branchName}`,
        details: 'Create and switch to new branch',
      })

      if (!permission.approved) {
        return {
          success: false,
          error: permission.reason || 'Permission denied',
        }
      }

      await getGit().checkoutLocalBranch(branchName)

      return {
        success: true,
        output: `Created and switched to branch: ${branchName}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create branch',
      }
    }
  },
}

export const gitPushTool: Tool = {
  name: 'git_push',
  description: 'Push commits to remote repository',
  parameters: [
    {
      name: 'remote',
      type: 'string',
      description: 'Remote name (defaults to origin)',
      required: false,
    },
    {
      name: 'branch',
      type: 'string',
      description: 'Branch name (defaults to current branch)',
      required: false,
    },
  ],
  execute: async (params): Promise<ToolResult> => {
    const { remote = 'origin', branch } = params

    try {
      const status = await getGit().status()
      const branchName = branch || status.current

      const permission = await requestPermission({
        action: 'execute',
        command: `git push ${remote} ${branchName}`,
        details: 'Push commits to remote repository',
      })

      if (!permission.approved) {
        return {
          success: false,
          error: permission.reason || 'Permission denied',
        }
      }

      await getGit().push(remote, branchName)

      return {
        success: true,
        output: `Pushed to ${remote}/${branchName}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to push',
      }
    }
  },
}

export const gitTools = [gitStatusTool, gitDiffTool, gitCommitTool, gitCreateBranchTool, gitPushTool]
