# V0-Like AI App Generation Tools for mbtq.dev Platform

This implementation adds v0-like AI app generation capabilities as built-in tools for the mbtq.dev platform.

## Features

### 1. AI App Generation
- Create applications from natural language prompts
- Continue conversations to refine and improve apps
- Mock AI responses (ready for v0 SDK integration)

### 2. Project Management
- Organize work into projects with multiple chat conversations
- Create, read, update, and delete projects
- Associate multiple chats with each project

### 3. Chat Management
- Continue conversations seamlessly
- Fork chats to explore different directions
- Rename and delete chats as needed
- Full conversation history tracking

### 4. Rate Limiting
- Built-in rate limiting (3 AI generations per 12 hours)
- Sliding window algorithm using database storage
- Prevents abuse while ensuring fair usage
- Fail-open strategy for reliability

### 5. Deployment Support
- One-click deployment capability (mock implementation)
- Track deployment history and status
- Support for multiple deployment platforms
- Ready for Vercel, Netlify, or custom integrations

### 6. File Attachments
- Support for file attachments in prompts
- Stored with message metadata
- Ready for integration with file storage service

## API Routes

### Authentication
- `GET /api/v0-tools/validate` - Validate API key and check authentication status

### Projects
- `GET /api/v0-tools/projects` - List all projects
- `GET /api/v0-tools/projects/:id` - Get project details with associated chats
- `POST /api/v0-tools/projects` - Create new project
- `PATCH /api/v0-tools/projects/:id` - Update project
- `DELETE /api/v0-tools/projects/:id` - Delete project

### Chats
- `GET /api/v0-tools/chats/:id` - Retrieve chat details and history
- `DELETE /api/v0-tools/chats/:id` - Delete (soft delete) chat conversation
- `PATCH /api/v0-tools/chats/:id` - Update chat (rename)
- `POST /api/v0-tools/chats/fork` - Create a new chat from an existing one

### AI Generation
- `POST /api/v0-tools/generate` - Generate or continue app conversation
  - Requires: `prompt`, `projectId` (for new chat) or `chatId` (for continuation)
  - Optional: `chatName`, `attachments`
  - Returns: chat, messages, and rate limit info

### Deployments
- `POST /api/v0-tools/deployments` - Deploy generated apps
- `GET /api/v0-tools/deployments/:id` - Get deployment status
- `GET /api/v0-tools/deployments/chat/:chatId` - Get all deployments for a chat

## Database Schema

### V0 Projects
```typescript
{
  id: serial (primary key)
  userId: integer (foreign key to users)
  name: text
  description: text
  createdAt: timestamp
  updatedAt: timestamp
  metadata: jsonb
}
```

### V0 Chats
```typescript
{
  id: serial (primary key)
  projectId: integer (foreign key to v0_projects)
  userId: integer (foreign key to users)
  name: text
  v0ChatId: text (optional, from v0 platform)
  chatType: text ('app' or 'continuation')
  parentChatId: integer (optional, for forked chats)
  status: text ('active', 'archived', 'deleted')
  createdAt: timestamp
  updatedAt: timestamp
  metadata: jsonb
}
```

### V0 Chat Messages
```typescript
{
  id: serial (primary key)
  chatId: integer (foreign key to v0_chats)
  role: text ('user', 'assistant', 'system')
  content: text
  v0MessageId: text (optional, from v0 platform)
  orderIndex: integer
  attachments: jsonb
  createdAt: timestamp
  metadata: jsonb
}
```

### V0 Deployments
```typescript
{
  id: serial (primary key)
  chatId: integer (foreign key to v0_chats)
  userId: integer (foreign key to users)
  platform: text ('vercel', 'netlify', etc.)
  deploymentUrl: text
  deploymentId: text (from deployment platform)
  status: text ('pending', 'in_progress', 'success', 'failed')
  createdAt: timestamp
  completedAt: timestamp
  logs: jsonb
  error: text
  metadata: jsonb
}
```

### Rate Limit Records
```typescript
{
  id: serial (primary key)
  identifier: text (IP address or user ID)
  action: text (type of action being rate limited)
  timestamp: timestamp
  metadata: jsonb
}
```

## Tech Stack

- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Rate Limiting**: Database-backed sliding window algorithm
- **Authentication**: Replit Auth integration
- **API**: RESTful endpoints

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL database connection string |
| `V0_API_KEY` | No | v0 Platform API key (if using actual v0 integration) |

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file with required variables

3. **Push database schema:**
   ```bash
   npm run db:push
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Usage Examples

### Creating a Project
```bash
POST /api/v0-tools/projects
{
  "name": "My AI App Project",
  "description": "Building a productivity tool"
}
```

### Generating an App
```bash
POST /api/v0-tools/generate
{
  "prompt": "Create a todo list app with React and TypeScript",
  "projectId": 1,
  "chatName": "Todo App"
}
```

### Continuing a Conversation
```bash
POST /api/v0-tools/generate
{
  "prompt": "Add dark mode support",
  "chatId": 1
}
```

### Forking a Chat
```bash
POST /api/v0-tools/chats/fork
{
  "chatId": 1,
  "name": "Todo App with Calendar",
  "projectId": 1
}
```

### Deploying an App
```bash
POST /api/v0-tools/deployments
{
  "chatId": 1,
  "platform": "vercel"
}
```

## Rate Limiting

The system implements rate limiting to prevent abuse:

- **Limit**: 3 AI generations per 12 hours per identifier (IP address or user ID)
- **Algorithm**: Sliding window with database storage
- **Response**: 429 status code when limit exceeded
- **Headers**: Rate limit info included in responses

Example rate limit response:
```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the rate limit of 3 generations per 12 hours. Please try again later.",
  "retryAfter": 7200,
  "resetAt": "2025-12-16T09:28:36.675Z"
}
```

## Integration with v0 SDK

To enable actual AI app generation:

1. Sign up for v0 Platform API at [v0.dev](https://v0.dev)
2. Get your API key from settings
3. Set `V0_API_KEY` environment variable
4. Update `server/api/v0-tools-generate.ts` to integrate v0 SDK:

```typescript
import { V0Client } from 'v0-sdk'; // Install v0-sdk package

const v0Client = new V0Client({ apiKey: process.env.V0_API_KEY });

// In generate endpoint:
const response = await v0Client.chats.create({
  prompt: prompt,
  // ... other options
});
```

## Future Enhancements

- [ ] Live preview iframe support
- [ ] Voice input (speech-to-text integration)
- [ ] Real Vercel deployment integration
- [ ] Session caching for improved performance
- [ ] File upload handling
- [ ] Multi-user collaboration
- [ ] Export/import project functionality
- [ ] Advanced rate limiting with different tiers
- [ ] Webhook support for deployment events

## Security Considerations

- All endpoints require authentication
- Rate limiting prevents abuse
- User ownership verification on all resources
- SQL injection protection via Drizzle ORM
- Input validation on all requests
- Soft deletes for data recovery

## Testing

To test the API endpoints:

```bash
# Check authentication
curl http://localhost:5000/api/v0-tools/validate

# Create a project
curl -X POST http://localhost:5000/api/v0-tools/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project"}'

# Generate an app
curl -X POST http://localhost:5000/api/v0-tools/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Create a calculator app","projectId":1}'
```

## Contributing

1. Follow existing code style and patterns
2. Add tests for new features
3. Update documentation
4. Run linting before committing

## License

MIT
