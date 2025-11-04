# Transformation Guide: Web App → Headless CLI Agent

## Overview

This guide explains how your **coding-agent web application** was transformed into a **headless CLI tool** with local execution and ChatGPT-style tool calling.

## Core Concept Change

### Before (Web Version)
```
User → Web UI → Next.js API → Vercel Sandbox → AI Agent → GitHub
                                     ↓
                              (Isolated cloud environment)
```

### After (CLI Version)
```
User → Terminal → CLI → AI Agent → Local Tools → File System / Git
                          ↓
                   (Local machine, user approval required)
```

## Key Architectural Changes

### 1. Execution Environment

**Web Version:**
- Runs in Vercel Sandboxes (isolated cloud containers)
- Automatic Git operations via GitHub API
- Sandboxes created and destroyed per task
- Remote repository cloning

**CLI Version:**
- Runs on user's local machine
- Direct file system access
- Persistent environment
- Works in current directory

### 2. Permission Model

**Web Version:**
```typescript
// Automatic - sandbox is isolated
await sandbox.commands.run('git commit -m "changes"')
```

**CLI Version:**
```typescript
// Interactive approval required
const permission = await requestPermission({
  action: 'execute',
  command: 'git commit',
  details: 'Commit changes'
})

if (permission.approved) {
  // Execute
}
```

### 3. Tool System

**Web Version** (Implicit):
- Tools were sandbox commands
- Agent directly executed in sandbox
- No explicit tool calling

**CLI Version** (Explicit):
```typescript
interface Tool {
  name: string
  description: string
  parameters: ToolParameter[]
  execute: (params) => Promise<ToolResult>
}

// Tools passed to AI
const tools = [readFileTool, writeFileTool, executeCommandTool, ...]
```

### 4. State Management

**Web Version:**
```
PostgreSQL Database
├── tasks (with userId, status, etc.)
├── connectors (MCP servers)
├── users (OAuth accounts)
└── accounts (linked auth providers)
```

**CLI Version:**
```
~/.coding-agent/
├── config.json (API keys, preferences)
└── history.json (conversation sessions)
```

### 5. Authentication

**Web Version:**
- OAuth (GitHub/Vercel)
- User sessions with JWT
- Multi-user support
- Database-backed

**CLI Version:**
- Local config file
- Single user (machine owner)
- No authentication needed
- Environment variables or CLI config

## File-by-File Comparison

### Original Structure (Kept for Web)
```
app/                    # Next.js pages and API routes
├── api/               # REST API endpoints
│   ├── tasks/        # Task management
│   ├── github/       # GitHub operations
│   └── sandboxes/    # Sandbox lifecycle
├── repos/            # Repository pages
└── tasks/            # Task management UI

lib/                    # Shared utilities
├── sandbox/          # Vercel Sandbox operations
├── db/               # Database schemas
├── auth/             # OAuth providers
└── github/           # GitHub API client

components/            # React UI components
```

### New Structure (CLI)
```
src/
├── cli/              # NEW: CLI entry point
│   └── index.ts      # Main CLI loop
│
├── tools/            # NEW: Local tool implementations
│   ├── types.ts      # Tool interfaces
│   ├── permissions.ts # User approval system
│   ├── filesystem.ts # File operations
│   ├── command.ts    # Shell execution
│   ├── git.ts        # Git operations
│   └── index.ts      # Tool registry
│
├── config/           # NEW: Local configuration
│   └── index.ts      # Config and history management
│
└── agents/           # NEW: AI agent adapters
    └── claude.ts     # (To be implemented)
```

## Code Migration Examples

### Example 1: File Operations

**Original (Sandbox):**
```typescript
// In lib/sandbox/commands.ts
await runInProject(sandbox, 'cat', ['README.md'])
await runInProject(sandbox, 'sh', ['-c', `echo "content" > file.txt`])
```

**New (Local):**
```typescript
// In src/tools/filesystem.ts
import { promises as fs } from 'fs'

export const readFileTool: Tool = {
  name: 'read_file',
  execute: async ({ path }) => {
    const permission = await requestPermission({ action: 'read', path })
    if (!permission.approved) return { success: false }
    
    const content = await fs.readFile(path, 'utf-8')
    return { success: true, output: content }
  }
}
```

### Example 2: Git Operations

**Original (Sandbox):**
```typescript
// In lib/sandbox/git.ts
await runInProject(sandbox, 'git', ['add', '.'])
await runInProject(sandbox, 'git', ['commit', '-m', message])
await runInProject(sandbox, 'git', ['push', 'origin', branch])
```

**New (Local):**
```typescript
// In src/tools/git.ts
import simpleGit from 'simple-git'

export const gitCommitTool: Tool = {
  name: 'git_commit',
  execute: async ({ message }) => {
    const permission = await requestPermission({ 
      action: 'execute', 
      command: `git commit -m "${message}"` 
    })
    if (!permission.approved) return { success: false }
    
    const git = simpleGit(process.cwd())
    await git.add('.')
    const result = await git.commit(message)
    return { success: true, data: result }
  }
}
```

### Example 3: Agent Execution

**Original (Web - Streaming to UI):**
```typescript
// In lib/sandbox/agents/claude.ts
await sandbox.runCommand({
  cmd: 'sh',
  args: ['-c', `claude "${instruction}"`],
  stdout: captureStdout, // Streams to web UI
  stderr: captureStderr
})
```

**New (CLI - Streaming to Terminal):**
```typescript
// In src/agents/claude.ts (to be implemented)
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey })

const stream = await anthropic.messages.create({
  model: 'claude-sonnet-4-5',
  messages: conversationHistory,
  tools: allTools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: parametersToSchema(t.parameters)
  })),
  stream: true
})

for await (const event of stream) {
  if (event.type === 'content_block_delta') {
    process.stdout.write(event.delta.text)
  }
  if (event.type === 'tool_use') {
    const tool = getTool(event.name)
    const result = await tool.execute(event.input)
    // Add tool result to conversation
  }
}
```

## What Stayed the Same

1. **AI Model Access**: Still using Claude, OpenAI, etc.
2. **Tool Concepts**: Read, write, execute paradigm
3. **Git Workflow**: Branch creation, commits, pushes
4. **Error Handling**: Try/catch patterns
5. **TypeScript**: Type safety throughout

## What's Different

1. **No Web Server**: Pure Node.js CLI
2. **No Database**: JSON files for state
3. **No OAuth**: Local config
4. **No Sandboxes**: Direct local execution
5. **Interactive Permissions**: User approves each action
6. **Persistent Sessions**: Not destroyed after tasks

## Next Implementation Steps

To complete the transformation:

### 1. Implement Claude API Integration
```typescript
// src/agents/claude.ts
export async function runClaudeAgent(
  message: string,
  tools: Tool[],
  apiKey: string
): Promise<void> {
  // Create Anthropic client
  // Send message with tool definitions
  // Handle tool calls
  // Stream response to terminal
}
```

### 2. Add Tool Result Handling
- Parse tool calls from AI responses
- Execute tools with permission checks
- Feed results back to AI
- Continue conversation loop

### 3. Improve CLI UX
- Better progress indicators
- Colored output for different message types
- File change previews before approval
- Diff display for modifications

### 4. Error Recovery
- Handle network failures
- Retry logic for API calls
- Graceful degradation
- Clear error messages

## Running Both Versions

You can maintain both the web app and CLI:

```bash
# Web version
pnpm dev              # Start Next.js
pnpm build            # Build for production

# CLI version
pnpm build:cli        # Compile TypeScript
pnpm cli              # Run the CLI
npm link              # Install globally
```

## Benefits of CLI Version

✅ **Simpler**: No web infrastructure
✅ **Faster**: No sandboxes to spin up
✅ **Cheaper**: No cloud resources
✅ **Transparent**: See exactly what's happening
✅ **Secure**: User controls all operations
✅ **Portable**: Works anywhere Node.js runs

## Trade-offs

❌ **No isolation**: Operations affect local files
❌ **Manual approval**: More user interaction required
❌ **Single user**: No multi-user support
❌ **No web UI**: Terminal-only interface

## Conclusion

The transformation from web app to CLI agent involves:

1. **Replacing** Vercel Sandbox with local file operations
2. **Adding** interactive permission system
3. **Removing** web/database infrastructure
4. **Simplifying** state management to local files
5. **Keeping** AI integration and tool concepts

The result is a **lightweight, local-first coding agent** that works like ChatGPT's code interpreter but runs entirely on your machine with full user control.