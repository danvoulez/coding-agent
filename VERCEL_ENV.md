# Vercel Environment Variables Setup

## Required Environment Variables

Add these to your Vercel project settings (Settings → Environment Variables):

### Database
```
POSTGRES_URL=your-postgres-connection-string
```

### Authentication & Security
```
JWE_SECRET=your-random-secret-key-min-32-chars
ENCRYPTION_KEY=your-random-encryption-key
```

### AI Provider Keys (at least one required)

```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
CURSOR_API_KEY=...
```

### Vercel Sandbox (for code execution)
```
VERCEL_API_TOKEN=your-vercel-token
VERCEL_TEAM_ID=your-team-id
```

### Optional: GitHub Integration
```
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-secret
```

### Optional: LogLine Integration
```
LOGLINE_API_URL=https://your-api.execute-api.region.amazonaws.com/prod
LOGLINE_TENANT=your-tenant-id
LOGLINE_TOKEN=Bearer your-token
LOGLINE_WS_URL=wss://your-api.execute-api.region.amazonaws.com/prod
```

### Optional: AI Gateway (for branch naming, etc.)
```
AI_GATEWAY_API_KEY=your-ai-gateway-key
```

### Public Variables (already in code)
```
NEXT_PUBLIC_AUTH_PROVIDERS=github,vercel
```

## How to Add Variables in Vercel

1. Go to your project on Vercel
2. Click **Settings** → **Environment Variables**
3. Add each variable with its value
4. Select which environments (Production, Preview, Development)
5. Click **Save**
6. Redeploy your app for changes to take effect

## Guest Mode

The app now works **without authentication** for testing:
- Tasks created without login use a `guest` user ID
- No GitHub/Vercel OAuth required to start conversations
- Authentication can be added later via LogLine integration

## LogLine Future Integration

When you're ready to integrate LogLine as the LLM service provider:
1. Set up LogLine API URL and credentials
2. The app will use LogLine's managed LLM instead of user API keys
3. Full governance and audit trail in LogLine ledger
4. No need for users to provide their own API keys
