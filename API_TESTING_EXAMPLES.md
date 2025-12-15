# V0 Tools API Testing Examples

This file contains example API calls to test the v0 tools functionality.

## Prerequisites

1. Ensure the database migration has been run:
   ```bash
   node server/scripts/migrate-v0-tools.js
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Authenticate with the application (you need a valid session cookie)

## Example API Calls

### 1. Validate API and Check Features

```bash
curl http://localhost:5000/api/v0-tools/validate \
  -H "Cookie: your-session-cookie"
```

Expected response:
```json
{
  "valid": true,
  "authenticated": true,
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  },
  "features": {
    "aiGeneration": false,
    "rateLimit": true,
    "deployments": true,
    "fileAttachments": true,
    "voiceInput": false
  },
  "config": {
    "rateLimitWindow": "12 hours",
    "rateLimitMax": 3
  }
}
```

### 2. Create a Project

```bash
curl -X POST http://localhost:5000/api/v0-tools/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "My First AI App",
    "description": "Testing the v0 tools integration"
  }'
```

Expected response:
```json
{
  "id": 1,
  "userId": 1,
  "name": "My First AI App",
  "description": "Testing the v0 tools integration",
  "createdAt": "2025-12-15T21:00:00.000Z",
  "updatedAt": "2025-12-15T21:00:00.000Z",
  "metadata": {}
}
```

### 3. List All Projects

```bash
curl http://localhost:5000/api/v0-tools/projects \
  -H "Cookie: your-session-cookie"
```

### 4. Get Project Details

```bash
curl http://localhost:5000/api/v0-tools/projects/1 \
  -H "Cookie: your-session-cookie"
```

Expected response includes project and associated chats:
```json
{
  "id": 1,
  "userId": 1,
  "name": "My First AI App",
  "description": "Testing the v0 tools integration",
  "createdAt": "2025-12-15T21:00:00.000Z",
  "updatedAt": "2025-12-15T21:00:00.000Z",
  "metadata": {},
  "chats": []
}
```

### 5. Generate an App

```bash
curl -X POST http://localhost:5000/api/v0-tools/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "prompt": "Create a simple todo list application with React and TypeScript",
    "projectId": 1,
    "chatName": "Todo List App"
  }'
```

Expected response:
```json
{
  "chat": {
    "id": 1,
    "projectId": 1,
    "userId": 1,
    "name": "Todo List App",
    "chatType": "app",
    "status": "active",
    "createdAt": "2025-12-15T21:00:00.000Z",
    "updatedAt": "2025-12-15T21:00:00.000Z",
    "metadata": {}
  },
  "userMessage": {
    "id": 1,
    "chatId": 1,
    "role": "user",
    "content": "Create a simple todo list application with React and TypeScript",
    "orderIndex": 0,
    "createdAt": "2025-12-15T21:00:00.000Z"
  },
  "assistantMessage": {
    "id": 2,
    "chatId": 1,
    "role": "assistant",
    "content": "# Generated App\n\nI've created a new application...",
    "orderIndex": 1,
    "createdAt": "2025-12-15T21:00:00.000Z"
  },
  "isNewChat": true,
  "rateLimit": {
    "remaining": 2,
    "resetAt": "2025-12-16T09:00:00.000Z"
  }
}
```

### 6. Continue a Conversation

```bash
curl -X POST http://localhost:5000/api/v0-tools/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "prompt": "Add dark mode support to the app",
    "chatId": 1
  }'
```

### 7. Get Chat Details

```bash
curl http://localhost:5000/api/v0-tools/chats/1 \
  -H "Cookie: your-session-cookie"
```

Expected response includes all messages:
```json
{
  "id": 1,
  "projectId": 1,
  "userId": 1,
  "name": "Todo List App",
  "chatType": "app",
  "status": "active",
  "createdAt": "2025-12-15T21:00:00.000Z",
  "updatedAt": "2025-12-15T21:00:00.000Z",
  "metadata": {},
  "messages": [
    {
      "id": 1,
      "chatId": 1,
      "role": "user",
      "content": "Create a simple todo list application...",
      "orderIndex": 0,
      "createdAt": "2025-12-15T21:00:00.000Z"
    },
    {
      "id": 2,
      "chatId": 1,
      "role": "assistant",
      "content": "# Generated App...",
      "orderIndex": 1,
      "createdAt": "2025-12-15T21:00:00.000Z"
    }
  ]
}
```

### 8. Fork a Chat

```bash
curl -X POST http://localhost:5000/api/v0-tools/chats/fork \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "chatId": 1,
    "name": "Todo List with Calendar",
    "projectId": 1
  }'
```

### 9. Rename a Chat

```bash
curl -X PATCH http://localhost:5000/api/v0-tools/chats/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "Enhanced Todo List"
  }'
```

### 10. Deploy an App

```bash
curl -X POST http://localhost:5000/api/v0-tools/deployments \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "chatId": 1,
    "platform": "vercel"
  }'
```

Expected response:
```json
{
  "id": 1,
  "chatId": 1,
  "userId": 1,
  "platform": "vercel",
  "status": "pending",
  "createdAt": "2025-12-15T21:00:00.000Z",
  "metadata": {}
}
```

### 11. Get Deployment Status

```bash
curl http://localhost:5000/api/v0-tools/deployments/1 \
  -H "Cookie: your-session-cookie"
```

After a few seconds, the status should change to "success":
```json
{
  "id": 1,
  "chatId": 1,
  "userId": 1,
  "platform": "vercel",
  "status": "success",
  "deploymentUrl": "https://enhanced-todo-list-1.vercel.app",
  "deploymentId": "dpl_mock_1",
  "createdAt": "2025-12-15T21:00:00.000Z",
  "completedAt": "2025-12-15T21:00:03.000Z",
  "logs": [
    {
      "timestamp": "2025-12-15T21:00:03.000Z",
      "message": "Deployment completed successfully",
      "level": "info"
    }
  ]
}
```

### 12. Get All Deployments for a Chat

```bash
curl http://localhost:5000/api/v0-tools/deployments/chat/1 \
  -H "Cookie: your-session-cookie"
```

### 13. Delete a Chat

```bash
curl -X DELETE http://localhost:5000/api/v0-tools/chats/1 \
  -H "Cookie: your-session-cookie"
```

### 14. Update a Project

```bash
curl -X PATCH http://localhost:5000/api/v0-tools/projects/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "Updated Project Name",
    "description": "Updated description"
  }'
```

### 15. Delete a Project

```bash
curl -X DELETE http://localhost:5000/api/v0-tools/projects/1 \
  -H "Cookie: your-session-cookie"
```

## Rate Limiting Test

To test rate limiting, make 4 generation requests in quick succession:

```bash
# Request 1 (should succeed)
curl -X POST http://localhost:5000/api/v0-tools/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"prompt": "Create app 1", "projectId": 1}'

# Request 2 (should succeed)
curl -X POST http://localhost:5000/api/v0-tools/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"prompt": "Create app 2", "projectId": 1}'

# Request 3 (should succeed)
curl -X POST http://localhost:5000/api/v0-tools/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"prompt": "Create app 3", "projectId": 1}'

# Request 4 (should fail with 429 status)
curl -X POST http://localhost:5000/api/v0-tools/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"prompt": "Create app 4", "projectId": 1}'
```

Expected response for the 4th request:
```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the rate limit of 3 generations per 12 hours. Please try again later.",
  "retryAfter": 43200,
  "resetAt": "2025-12-16T09:00:00.000Z"
}
```

## Notes

- Replace `your-session-cookie` with an actual session cookie from an authenticated session
- All endpoints except `/validate` require authentication
- The mock AI responses are placeholders - integrate v0 SDK for actual AI generation
- Deployments are simulated and complete after 3 seconds
- Rate limiting uses a sliding 12-hour window with a limit of 3 generations
