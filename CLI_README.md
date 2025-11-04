# Coding Agent CLI - Headless AI-Powered IDE

This is a **headless CLI coding agent** that combines local file operations with LogLine's governed prompt and memory systems. Claude acts as the orchestrator, using tools to read/write files, execute commands, and access your centrally-managed prompts and memories.

## Architecture

```
User → CLI → Claude API (orchestrator)
              ↓
              Decides which tools to use:
              ├─ Local Tools (file ops, git, commands)
              └─ LogLine Tools (prompts, memory, data)
              ↓
              Executes with user permission
              ↓
              Returns results → Claude continues
```

## Key Differences from Web Version

| Feature | Web Version | CLI Version |
|---------|-------------|-------------|
| **Execution** | Vercel Sandbox (cloud) | Local file system + LogLine API |
| **Interface** | Next.js web app | Terminal CLI |
| **AI Orchestration** | Direct sandbox commands | Claude with tool calling |
| **Prompts** | Hardcoded | LogLine ledger (versioned) |
| **Memory** | Local/database | LogLine spans (governed) |
| **Permissions** | Automatic in sandbox | Interactive user approval |

### Architecture

```
src/
├── cli/           # CLI entry point and conversation loop
├── tools/         # Local file and command execution tools
├── agents/        # AI agent implementations (Claude, OpenAI)
├── config/        # Local configuration and history management
└── types/         # TypeScript type definitions
```

## Installation

```bash
# Install dependencies
pnpm install

# Build the CLI
pnpm build:cli

# Link globally (optional)
npm link
```

## Configuration

### Required: Claude API Key

```bash
export ANTHROPIC_API_KEY="your-anthropic-key"
```

Or configure interactively:
```bash
coding-agent
> /config
```

### Optional: LogLine Integration

Enable governed prompts and persistent memory:

```bash
export LOGLINE_API_URL="https://your-api.execute-api.region.amazonaws.com/prod"
export LOGLINE_TENANT="your-tenant-id"
export LOGLINE_TOKEN="Bearer your-token"
export LOGLINE_WS_URL="wss://your-api.execute-api.region.amazonaws.com/prod" # optional
```

**Without LogLine:**
- Agent works with local file operations only
- No governed prompts
- No persistent memory across sessions

**With LogLine:**
- ✅ Versioned, centrally-managed prompts
- ✅ Persistent memory in ledger (spans)
- ✅ Governance via manifests and policies
- ✅ Full audit trail
- ✅ Tenant isolation

## Usage

### Start the CLI

```bash
# If installed globally
coding-agent

# Or run directly
node dist/cli/index.js
```

### Available Commands

- `/help` - Show available commands and tools
- `/config` - Configure API keys interactively
- `/auto` - Toggle auto-approve mode (skips permission prompts)
- `/clear` - Clear conversation history
- `/exit` - Exit the agent

### Example Interaction

```
You: Create a new file called hello.js with a simple hello world function

📄 AI wants to write to file: hello.js
   Changes: 120 characters
Allow this action? (yes/no/always/never): yes

✓ File created

You: Run git status

⚡ AI wants to run command: git status
   Purpose: Check repository status
Allow this action? (yes/no/always/never): yes
```

### Auto-Approve Mode

For faster workflows, enable auto-approve:

```
You: /auto
⚡ Auto-approve mode ENABLED
   All operations will execute automatically

You: Create README.md and add a title

📄 Auto-approved: Writing to README.md
✓ Done
```

**⚠️ Use with caution** - auto-approve bypasses all safety prompts!

## Available Tools

Claude intelligently chooses from these tools:

### Local File System
- **read_file** - Read file contents with permission
- **write_file** - Write or modify files (creates directories as needed)
- **list_directory** - List directory contents

### Local Commands
- **execute_command** - Run any shell command with approval

### Git Operations
- **git_status** - Check git repository status
- **git_diff** - View changes
- **git_commit** - Stage and commit changes
- **git_create_branch** - Create and switch to new branch
- **git_push** - Push commits to remote

### Web Browsing
- **web_search** - Search the internet using DuckDuckGo
- **fetch_webpage** - Download and extract text from any webpage

### LogLine Tools (when configured)
- **logline_prompt_fetch** - Get versioned prompts from the ledger
- **logline_memory_store** - Save to governed memory system
- **logline_memory_search** - Search memories semantically
- **git_commit** - Stage and commit changes
- **git_create_branch** - Create and switch to new branch
- **git_push** - Push commits to remote

## Implementation Details

### Tool Calling Flow

1. User sends a message
2. AI analyzes request and selects appropriate tools
3. For each tool call:
   - Permission prompt shown to user
   - User approves/denies
   - Tool executes if approved
4. AI receives tool results
5. AI provides response to user

### Permission System

All file operations and command executions require user approval:

- **Read operations**: Show file path
- **Write operations**: Show path and content size
- **Delete operations**: Show what will be deleted
- **Command execution**: Show full command and purpose

Response options:
- `yes` - Allow this operation
- `no` - Deny this operation
- `always` - Allow all future operations (use with caution)
- `never` - Exit the agent

### Security

- No automatic file modifications
- All commands require approval
- API keys stored securely in local config
- Conversation history is local-only
- No telemetry or external data sharing

## Next Steps

The current implementation includes:
- ✅ CLI infrastructure
- ✅ Tool system with permissions
- ✅ Local file operations
- ✅ Command execution
- ✅ Git operations
- ✅ Configuration management
- ✅ Conversation history

Still needed:
- 🔲 Claude API integration with tool calling
- 🔲 OpenAI API integration
- 🔲 Streaming responses
- 🔲 Better error handling
- 🔲 Tool result parsing and chaining
- 🔲 Session resumption
- 🔲 Multi-turn conversations with context

## Comparison with Web Version

### Removed Dependencies
- ❌ Next.js / React
- ❌ PostgreSQL / Drizzle ORM
- ❌ Vercel Sandbox
- ❌ OAuth providers
- ❌ Web UI components

### New Dependencies
- ✅ readline (for CLI input)
- ✅ inquirer (for interactive prompts)
- ✅ chalk (for colored terminal output)
- ✅ ora (for loading spinners)
- ✅ simple-git (for local git operations)

### Code Reuse
- Tool concepts (adapted for local execution)
- Agent prompting strategies
- Configuration patterns
- Error handling approaches

## Contributing

To add new tools:

1. Create a new file in `src/tools/`
2. Implement the `Tool` interface
3. Add to `src/tools/index.ts`
4. Update documentation

## License

Same as the original coding-agent-template project.