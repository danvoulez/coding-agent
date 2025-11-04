# Quick Start Examples

## Basic Setup

### 1. Install and build

```bash
pnpm install
pnpm build:cli
```

### 2. Configure API keys

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. (Optional) Configure LogLine

```bash
export LOGLINE_API_URL="https://your-api-gateway.amazonaws.com/prod"
export LOGLINE_TENANT="acme"  
export LOGLINE_TOKEN="Bearer your-jwt-token"
```

### 4. Run

```bash
pnpm cli
```

## Example Sessions

### Example 1: Simple File Creation

```
You: Create a file called greet.js with a function that greets a user by name

🔧 Calling tool: write_file

📄 AI wants to write to file: greet.js
   Changes: 102 characters
Allow? yes

✓ Success