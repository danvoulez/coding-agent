#!/usr/bin/env node

/**
 * Headless coding agent CLI - ChatGPT-style interaction with local tool calling
 */

import { createInterface } from 'readline'
import { nanoid } from 'nanoid'
import chalk from 'chalk'
import ora from 'ora'
import { loadConfig, saveConfig, getApiKey, addMessage, getSessionMessages, getLogLineConfig } from '../config/index'
import { LogLineClient } from '../config/logline'
import { ClaudeAgent } from '../agents/claude'
import { fileSystemTools } from '../tools/filesystem'
import { commandTools } from '../tools/command'
import { closePermissionInterface, setAutoApprove, isAutoApproveEnabled } from '../tools/permissions'

// Session management
let currentSessionId = nanoid()
let conversationHistory: Array<{ role: string; content: string }> = []
let agent: ClaudeAgent | null = null

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: chalk.cyan('You: '),
})

/**
 * Display welcome message and setup instructions
 */
async function displayWelcome(): Promise<void> {
  console.clear()
  console.log(chalk.bold.blue('🤖 Coding Agent CLI'))
  console.log(chalk.gray('─'.repeat(50)))
  console.log()

  const config = await loadConfig()
  const logLineConfig = await getLogLineConfig()

  // Check API keys
  if (!config.anthropicApiKey && !process.env.ANTHROPIC_API_KEY) {
    console.log(chalk.yellow('⚠️  No Anthropic API key found'))
    console.log(chalk.gray('   Set ANTHROPIC_API_KEY environment variable'))
    console.log(chalk.gray('   or run: /config'))
    console.log()
  } else {
    console.log(chalk.green('✓ Claude API key configured'))
  }

  // Check LogLine configuration
  if (!logLineConfig.apiUrl || !logLineConfig.tenant || !logLineConfig.token) {
    console.log(chalk.yellow('⚠️  LogLine not configured (optional)'))
    console.log(chalk.gray('   Memory and prompts will use local storage'))
    console.log(chalk.gray('   To enable: set LOGLINE_API_URL, LOGLINE_TENANT, LOGLINE_TOKEN'))
    console.log()
  } else {
    console.log(chalk.green('✓ LogLine configured'))
    console.log(chalk.gray(`   Tenant: ${logLineConfig.tenant}`))
    console.log(chalk.gray(`   API: ${logLineConfig.apiUrl}`))
    console.log()
  }

  console.log(chalk.gray('Type your coding task and I will help you.'))
  console.log(chalk.gray('Commands: /help, /config, /clear, /auto, /exit'))
  console.log(chalk.gray('─'.repeat(50)))
  console.log()
}

/**
 * Display available commands
 */
function displayHelp(): void {
  console.log()
  console.log(chalk.bold('Available Commands:'))
  console.log()
  console.log(chalk.cyan('  /help    ') + ' - Show this help message')
  console.log(chalk.cyan('  /config  ') + ' - Configure API keys')
  console.log(chalk.cyan('  /auto    ') + ' - Toggle auto-approve mode (currently: ' + (isAutoApproveEnabled() ? chalk.green('ON') : chalk.red('OFF')) + ')')
  console.log(chalk.cyan('  /clear   ') + ' - Clear conversation history')
  console.log(chalk.cyan('  /exit    ') + ' - Exit the agent')
  console.log()
  console.log(chalk.bold('Available Tools:'))
  console.log()
  console.log(chalk.cyan('  📄 read_file      ') + ' - Read file contents')
  console.log(chalk.cyan('  ✏️  write_file     ') + ' - Write to a file')
  console.log(chalk.cyan('  📁 list_directory ') + ' - List directory contents')
  console.log(chalk.cyan('  ⚡ execute_command') + ' - Run shell commands')
  console.log(chalk.cyan('  🔧 git_*          ') + ' - Git operations (status, commit, push, etc.)')
  console.log(chalk.cyan('  🌐 web_search     ') + ' - Search the internet')
  console.log(chalk.cyan('  📰 fetch_webpage  ') + ' - Read webpage content')
  console.log(chalk.cyan('  🧠 logline_*      ') + ' - LogLine tools (prompts, memory)')
  console.log()
  if (isAutoApproveEnabled()) {
    console.log(chalk.yellow('⚠️  Auto-approve is ON - all actions will be executed automatically'))
    console.log(chalk.gray('   Use /auto to toggle off for safety'))
    console.log()
  }
}

/**
 * Configure API keys interactively
 */
async function configureApiKeys(): Promise<void> {
  const { default: inquirer } = await import('inquirer')
  const config = await loadConfig()

  const answers = await inquirer.prompt([
    {
      type: 'password',
      name: 'anthropicApiKey',
      message: 'Anthropic API Key (press Enter to skip):',
      default: config.anthropicApiKey || '',
    },
    {
      type: 'password',
      name: 'openaiApiKey',
      message: 'OpenAI API Key (press Enter to skip):',
      default: config.openaiApiKey || '',
    },
    {
      type: 'list',
      name: 'defaultModel',
      message: 'Default model:',
      choices: ['claude-sonnet-4-5-20250929', 'claude-3-7-sonnet-20250219', 'gpt-4', 'gpt-3.5-turbo'],
      default: config.defaultModel || 'claude-sonnet-4-5-20250929',
    },
  ])

  await saveConfig({
    ...config,
    ...answers,
  })

  console.log(chalk.green('\n✓ Configuration saved'))
  console.log()
}

/**
 * Initialize the Claude agent
 */
async function initializeAgent(): Promise<ClaudeAgent | null> {
  const apiKey = await getApiKey('anthropic')
  if (!apiKey) {
    console.log(chalk.red('\n✗ Cannot initialize agent: No Anthropic API key found'))
    console.log(chalk.gray('  Run /config to set up your API key\n'))
    return null
  }

  const logLineConfig = await getLogLineConfig()
  let logLineClient: LogLineClient | undefined

  if (logLineConfig.apiUrl && logLineConfig.tenant && logLineConfig.token) {
    logLineClient = new LogLineClient({
      apiUrl: logLineConfig.apiUrl,
      wsUrl: logLineConfig.wsUrl,
      tenant: logLineConfig.tenant,
      token: logLineConfig.token,
    })
    console.log(chalk.green('✓ LogLine tools enabled'))
  }

  const newAgent = new ClaudeAgent({
    apiKey,
    model: 'claude-sonnet-4-5-20250929',
    logLineClient,
  })

  // Add system context
  newAgent.addSystemContext(`You are a helpful coding assistant with access to local file operations and LogLine tools.

Your capabilities:
- Read, write, and modify local files
- Execute shell commands
- Perform git operations
- Search the internet and read web pages
- ${logLineClient ? 'Access governed prompts from LogLine\n- Store and search memories in LogLine' : 'Local-only mode (LogLine not configured)'}

Always ask for permission before modifying files or running commands.
Be concise and helpful.`)

  return newAgent
}

/**
 * Process user message with AI (placeholder - to be implemented)
 */
async function processMessage(message: string): Promise<void> {
  if (!agent) {
    agent = await initializeAgent()
    if (!agent) {
      return
    }
  }

  const spinner = ora('Thinking...').start()

  try {
    // Add user message to history
    conversationHistory.push({
      role: 'user',
      content: message,
    })

    await addMessage(currentSessionId, 'user', message)

    let responseText = ''

    // Call Claude with streaming
    const response = await agent.sendMessage(message, (chunk) => {
      // Stop spinner on first chunk
      if (spinner.isSpinning) {
        spinner.stop()
        console.log()
        process.stdout.write(chalk.blue('Assistant: '))
      }
      process.stdout.write(chunk)
      responseText += chunk
    })

    if (spinner.isSpinning) {
      spinner.stop()
    }

    console.log()
    console.log()

    conversationHistory.push({
      role: 'assistant',
      content: responseText || response,
    })

    await addMessage(currentSessionId, 'assistant', responseText || response)
  } catch (error) {
    spinner.stop()
    console.error(chalk.red('\n✗ Error:'), error instanceof Error ? error.message : 'Unknown error')
    console.log()
  }
}

/**
 * Main CLI loop
 */
async function main(): Promise<void> {
  await displayWelcome()

  rl.prompt()

  rl.on('line', async (input: string) => {
    const message = input.trim()

    if (!message) {
      rl.prompt()
      return
    }

    // Handle commands
    if (message.startsWith('/')) {
      const command = message.toLowerCase()

      switch (command) {
        case '/help':
          displayHelp()
          break

        case '/config':
          await configureApiKeys()
          break

        case '/auto':
          const currentState = isAutoApproveEnabled()
          setAutoApprove(!currentState)
          if (!currentState) {
            console.log(chalk.yellow('⚡ Auto-approve mode ENABLED'))
            console.log(chalk.gray('   All file operations and commands will execute automatically'))
            console.log(chalk.gray('   Use /auto again to disable for safety'))
          } else {
            console.log(chalk.green('✓ Auto-approve mode DISABLED'))
            console.log(chalk.gray('   You will be asked to approve each action'))
          }
          console.log()
          break

        case '/clear':
          conversationHistory = []
          currentSessionId = nanoid()
          if (agent) {
            agent.clearHistory()
          }
          console.log(chalk.yellow('✓ Conversation cleared'))
          console.log()
          break

        case '/exit':
        case '/quit':
          console.log(chalk.yellow('\nGoodbye! 👋\n'))
          closePermissionInterface()
          rl.close()
          process.exit(0)
          break

        default:
          console.log(chalk.red(`Unknown command: ${command}`))
          console.log(chalk.gray('Type /help for available commands'))
          console.log()
      }

      rl.prompt()
      return
    }

    // Process user message
    await processMessage(message)
    rl.prompt()
  })

  rl.on('close', () => {
    console.log(chalk.yellow('\nGoodbye! 👋\n'))
    closePermissionInterface()
    process.exit(0)
  })
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('\nUnhandled error:'), error)
  closePermissionInterface()
  process.exit(1)
})

// Start the CLI
main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error)
  closePermissionInterface()
  process.exit(1)
})
