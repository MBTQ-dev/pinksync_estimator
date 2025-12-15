import express, { Request, Response } from 'express';
import { db } from '../db';
import { v0Deployments, v0Chats } from '@shared/v0ToolsSchema';
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
 * POST /api/v0-tools/deployments
 * Deploy generated apps to Vercel or other platforms
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { chatId, platform = 'vercel' } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: 'Chat ID is required' });
    }

    // Verify chat ownership
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

    // Create deployment record
    const [deployment] = await db
      .insert(v0Deployments)
      .values({
        chatId,
        userId,
        platform,
        status: 'pending',
        metadata: {}
      })
      .returning();

    // TODO: Integrate with actual deployment platform (Vercel, Netlify, etc.)
    // For now, simulate deployment process
    // Note: Using setTimeout creates an untracked promise; in production, use a proper job queue
    setTimeout(async () => {
      try {
        // Simulate successful deployment
        const mockDeploymentUrl = `https://${chat.name.toLowerCase().replace(/\s+/g, '-')}-${deployment.id}.vercel.app`;
        
        await db
          .update(v0Deployments)
          .set({
            status: 'success',
            deploymentUrl: mockDeploymentUrl,
            deploymentId: `dpl_mock_${deployment.id}`,
            completedAt: new Date(),
            logs: [{
              timestamp: new Date().toISOString(),
              message: 'Deployment completed successfully',
              level: 'info'
            }]
          })
          .where(eq(v0Deployments.id, deployment.id));
      } catch (error) {
        console.error('Error updating deployment:', error);
        // In production, this should be handled by a job queue with proper retry logic
      }
    }, 3000); // Simulate 3 second deployment

    res.status(201).json(deployment);
  } catch (error) {
    console.error('Error creating deployment:', error);
    res.status(500).json({ error: 'Failed to create deployment' });
  }
});

/**
 * GET /api/v0-tools/deployments/:id
 * Get deployment status
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const deploymentId = parseInt(req.params.id);

    const [deployment] = await db
      .select()
      .from(v0Deployments)
      .where(and(
        eq(v0Deployments.id, deploymentId),
        eq(v0Deployments.userId, userId)
      ));

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    res.json(deployment);
  } catch (error) {
    console.error('Error fetching deployment:', error);
    res.status(500).json({ error: 'Failed to fetch deployment' });
  }
});

/**
 * GET /api/v0-tools/deployments/chat/:chatId
 * Get all deployments for a chat
 */
router.get('/chat/:chatId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const chatId = parseInt(req.params.chatId);

    // Verify chat ownership
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

    const deployments = await db
      .select()
      .from(v0Deployments)
      .where(eq(v0Deployments.chatId, chatId))
      .orderBy(desc(v0Deployments.createdAt));

    res.json(deployments);
  } catch (error) {
    console.error('Error fetching deployments:', error);
    res.status(500).json({ error: 'Failed to fetch deployments' });
  }
});

export default router;
