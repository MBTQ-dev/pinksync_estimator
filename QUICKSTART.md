# Quick Start Guide - V0 Tools

Get up and running with the v0-like AI app generation tools in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Git repository cloned

## Setup (5 minutes)

### 1. Install Dependencies (1 minute)

```bash
cd /path/to/pinksync_estimator
npm install --legacy-peer-deps
```

### 2. Configure Environment (1 minute)

Create or update your `.env` file:

```bash
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/pinksync

# Optional (for actual v0 integration)
V0_API_KEY=your_v0_api_key_here

# Optional (for distributed rate limiting)
KV_REST_API_URL=your_upstash_url
KV_REST_API_TOKEN=your_upstash_token
```

### 3. Run Database Migration (1 minute)

```bash
node server/scripts/migrate-v0-tools.js
```

You should see:
```
🚀 Starting v0 tools database migration...
📝 Running: Create v0_projects table...
✅ Completed: Create v0_projects table
...
🎉 All migrations completed successfully!
```

### 4. Start the Server (1 minute)

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### 5. Test the Feature (1 minute)

1. Open your browser to `http://localhost:5000`
2. Log in with your Replit account
3. Click "V0 Tools" in the sidebar
4. Create a new project
5. Generate an app with a prompt like "Create a todo list app"

## First Steps

### Creating Your First Project

1. Navigate to the "Projects" tab
2. Enter a project name (e.g., "My First AI App")
3. Add an optional description
4. Click "Create Project"

### Generating Your First App

1. Go to the "Generate App" tab
2. Select your project from the dropdown
3. Enter a prompt:
   ```
   Create a simple todo list application with React and TypeScript.
   Include functionality to add, complete, and delete tasks.
   ```
4. Click "Generate App"
5. Wait for the response (mock implementation is instant)

### Understanding Rate Limits

- You get 3 AI generations per 12 hours
- The counter resets on a sliding window (not fixed)
- Your remaining generations are shown at the top of the page
- After hitting the limit, you'll see when you can generate again

## API Testing

### Test with curl

```bash
# 1. Create a project
curl -X POST http://localhost:5000/api/v0-tools/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{"name": "Test Project", "description": "Testing API"}'

# 2. Generate an app
curl -X POST http://localhost:5000/api/v0-tools/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "prompt": "Create a calculator app",
    "projectId": 1,
    "chatName": "Calculator"
  }'

# 3. Check your chats
curl http://localhost:5000/api/v0-tools/projects/1 \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### Get Your Session Cookie

1. Log in to the application in your browser
2. Open Developer Tools (F12)
3. Go to Application → Cookies
4. Copy the value of `connect.sid`

## Troubleshooting

### Database Connection Error

**Error**: `DATABASE_URL must be set`

**Solution**: Make sure your `.env` file has a valid `DATABASE_URL`

### Migration Already Run

**Error**: Tables already exist

**Solution**: This is fine! The migration script uses `CREATE TABLE IF NOT EXISTS`

### Rate Limit Error (429)

**Error**: "Rate limit exceeded"

**Solution**: Wait for the time shown in the error message, or clear your rate limit:

```sql
DELETE FROM rate_limit_records WHERE identifier = 'your_ip_or_user_id';
```

### TypeScript Errors

**Error**: Build fails with TypeScript errors

**Solution**: Existing errors are in unrelated files. Your v0 tools code should compile fine.

## Next Steps

### Integrate with v0 SDK

1. Get your v0 API key from [v0.dev/settings](https://v0.dev/settings)
2. Add to `.env`:
   ```
   V0_API_KEY=your_actual_key
   ```
3. Update `server/api/v0-tools-generate.ts`:
   ```typescript
   import { V0Client } from 'v0-sdk';
   
   const v0Client = new V0Client({ 
     apiKey: process.env.V0_API_KEY 
   });
   
   // Replace mock response with actual v0 call
   const response = await v0Client.chats.create({ prompt });
   ```

### Enable Real Deployments

1. Install Vercel SDK:
   ```bash
   npm install @vercel/client
   ```
2. Update `server/api/v0-tools-deployments.ts` to use Vercel API
3. Add Vercel authentication token to environment

### Add More Features

Check `IMPLEMENTATION_SUMMARY.md` for ideas:
- Live preview iframe
- File uploads
- Voice input
- Session caching
- Webhooks

## Resources

- **Full Documentation**: [V0_TOOLS_README.md](./V0_TOOLS_README.md)
- **API Examples**: [API_TESTING_EXAMPLES.md](./API_TESTING_EXAMPLES.md)
- **Implementation Details**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

## Common Tasks

### Clear Rate Limit for Testing

```sql
DELETE FROM rate_limit_records;
```

### View All Projects

```sql
SELECT * FROM v0_projects;
```

### View All Chats

```sql
SELECT * FROM v0_chats ORDER BY created_at DESC;
```

### Check Migration Status

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'v0_%' OR table_name = 'rate_limit_records';
```

Should return:
- v0_projects
- v0_chats
- v0_chat_messages
- v0_deployments
- rate_limit_records

## Getting Help

1. Check the error logs in your terminal
2. Review the documentation files
3. Look for TODO comments in the code
4. Check the GitHub issues

## Success Indicators

You're ready to go when:
- ✅ Migration script completed successfully
- ✅ Server starts without errors
- ✅ You can see "V0 Tools" in the navigation
- ✅ You can create a project
- ✅ You can generate an app (mock response)
- ✅ Rate limiting is working (429 after 3 generations)

Congratulations! You now have a fully functional v0-like AI app generation system! 🎉
