import express, { Request, Response } from 'express';
import { db } from '../db';
import { v0Chats, v0ChatMessages, v0Projects } from '@shared/v0ToolsSchema';
import { eq, and } from 'drizzle-orm';
import { checkRateLimit } from '../utils/rateLimiter';

const router = express.Router();

// Middleware to check authentication
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

/**
 * POST /api/v0-tools/generate
 * Generate or continue app conversation
 * 
 * This endpoint handles:
 * - Creating new app chats
 * - Continuing existing conversations
 * - Rate limiting (3 generations per 12 hours)
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { 
      prompt, 
      projectId, 
      chatId, 
      chatName,
      attachments 
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check rate limit using IP address or user ID
    const identifier = req.ip || `user_${userId}`;
    const rateLimitResult = await checkRateLimit(identifier, 'generation');

    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `You have exceeded the rate limit of 3 generations per 12 hours. Please try again later.`,
        retryAfter: rateLimitResult.retryAfter,
        resetAt: rateLimitResult.resetAt
      });
    }

    let chat;
    let isNewChat = false;

    // If chatId is provided, continue existing conversation
    if (chatId) {
      const [existingChat] = await db
        .select()
        .from(v0Chats)
        .where(and(
          eq(v0Chats.id, chatId),
          eq(v0Chats.userId, userId)
        ));

      if (!existingChat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      chat = existingChat;
    } else {
      // Create new chat
      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required for new chats' });
      }

      // Verify project ownership
      const [project] = await db
        .select()
        .from(v0Projects)
        .where(and(
          eq(v0Projects.id, projectId),
          eq(v0Projects.userId, userId)
        ));

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      [chat] = await db
        .insert(v0Chats)
        .values({
          projectId,
          userId,
          name: chatName || 'New App',
          chatType: 'app',
          status: 'active',
          metadata: {}
        })
        .returning();

      isNewChat = true;
    }

    // Get current message count for ordering
    const existingMessages = await db
      .select()
      .from(v0ChatMessages)
      .where(eq(v0ChatMessages.chatId, chat.id));

    const nextOrderIndex = existingMessages.length;

    // Save user message
    const [userMessage] = await db
      .insert(v0ChatMessages)
      .values({
        chatId: chat.id,
        role: 'user',
        content: prompt,
        orderIndex: nextOrderIndex,
        attachments: attachments || null,
        metadata: {}
      })
      .returning();

    // TODO: Integrate with v0 SDK or AI generation service
    // For now, we'll create a mock assistant response
    const mockResponse = generateMockResponse(prompt, isNewChat);

    const [assistantMessage] = await db
      .insert(v0ChatMessages)
      .values({
        chatId: chat.id,
        role: 'assistant',
        content: mockResponse,
        orderIndex: nextOrderIndex + 1,
        metadata: {
          model: 'mock',
          generatedAt: new Date().toISOString()
        }
      })
      .returning();

    // Update chat timestamp
    await db
      .update(v0Chats)
      .set({ updatedAt: new Date() })
      .where(eq(v0Chats.id, chat.id));

    // Return response with rate limit info
    res.json({
      chat,
      userMessage,
      assistantMessage,
      isNewChat,
      rateLimit: {
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt
      }
    });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

/**
 * Mock response generator (placeholder for actual v0 SDK integration)
 */
function generateMockResponse(prompt: string, isNewChat: boolean): string {
  if (isNewChat) {
    return `# Generated App

I've created a new application based on your prompt: "${prompt}"

## Features
- Modern React interface
- Responsive design
- TypeScript support
- Tailwind CSS styling

## Next Steps
1. Review the generated code
2. Test the application
3. Deploy to Vercel

You can continue the conversation to refine and improve the application.

**Note:** This is a mock response. To enable actual AI app generation, integrate the v0 SDK with your V0_API_KEY.`;
  } else {
    return `I've updated the application based on your request: "${prompt}"

The changes have been applied and you can see them in the live preview.

**Note:** This is a mock response. To enable actual AI app generation, integrate the v0 SDK with your V0_API_KEY.`;
  }
}

export default router;
