import express, { Request, Response } from 'express';
import { db } from '../db';
import { v0Chats, v0ChatMessages, v0Projects } from '@shared/v0ToolsSchema';
import { eq, and, desc } from 'drizzle-orm';

const router = express.Router();

// Middleware to check authentication
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

/**
 * GET /api/v0-tools/chats/:id
 * Retrieve chat details and history
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const chatId = parseInt(req.params.id);

    // Fetch chat
    const [chat] = await db
      .select()
      .from(v0Chats)
      .where(and(
        eq(v0Chats.id, chatId),
        eq(v0Chats.userId, userId)
      ));

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Fetch messages
    const messages = await db
      .select()
      .from(v0ChatMessages)
      .where(eq(v0ChatMessages.chatId, chatId))
      .orderBy(v0ChatMessages.orderIndex);

    res.json({
      ...chat,
      messages
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

/**
 * DELETE /api/v0-tools/chats/:id
 * Delete a chat conversation
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const chatId = parseInt(req.params.id);

    // Verify chat ownership
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

    // Soft delete by updating status
    const [chat] = await db
      .update(v0Chats)
      .set({ 
        status: 'deleted',
        updatedAt: new Date()
      })
      .where(eq(v0Chats.id, chatId))
      .returning();

    res.json({ success: true, chat });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

/**
 * PATCH /api/v0-tools/chats/:id
 * Update chat (rename)
 */
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const chatId = parseInt(req.params.id);
    const { name, metadata } = req.body;

    // Verify chat ownership
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

    // Build update object
    const updates: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updates.name = name;
    if (metadata !== undefined) updates.metadata = metadata;

    const [chat] = await db
      .update(v0Chats)
      .set(updates)
      .where(eq(v0Chats.id, chatId))
      .returning();

    res.json(chat);
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({ error: 'Failed to update chat' });
  }
});

/**
 * POST /api/v0-tools/chats/fork
 * Create a new chat from an existing one
 */
router.post('/fork', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { chatId, name, projectId } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: 'Source chat ID is required' });
    }

    // Verify source chat ownership
    const [sourceChat] = await db
      .select()
      .from(v0Chats)
      .where(and(
        eq(v0Chats.id, chatId),
        eq(v0Chats.userId, userId)
      ));

    if (!sourceChat) {
      return res.status(404).json({ error: 'Source chat not found' });
    }

    // Use source chat's project if not specified
    const targetProjectId = projectId || sourceChat.projectId;

    // Verify project ownership if specified
    if (projectId) {
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
    }

    // Create forked chat
    const [newChat] = await db
      .insert(v0Chats)
      .values({
        projectId: targetProjectId,
        userId,
        name: name || `${sourceChat.name} (Fork)`,
        chatType: sourceChat.chatType,
        parentChatId: chatId,
        status: 'active',
        metadata: { ...sourceChat.metadata, forkedFrom: chatId }
      })
      .returning();

    // Copy messages from source chat
    const sourceMessages = await db
      .select()
      .from(v0ChatMessages)
      .where(eq(v0ChatMessages.chatId, chatId))
      .orderBy(v0ChatMessages.orderIndex);

    if (sourceMessages.length > 0) {
      const messagesToInsert = sourceMessages.map(msg => ({
        chatId: newChat.id,
        role: msg.role,
        content: msg.content,
        orderIndex: msg.orderIndex,
        attachments: msg.attachments,
        metadata: msg.metadata
      }));

      await db.insert(v0ChatMessages).values(messagesToInsert);
    }

    res.status(201).json(newChat);
  } catch (error) {
    console.error('Error forking chat:', error);
    res.status(500).json({ error: 'Failed to fork chat' });
  }
});

export default router;
