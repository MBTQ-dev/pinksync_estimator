import express, { Request, Response } from 'express';
import { db } from '../db';
import { v0Projects, v0Chats } from '@shared/v0ToolsSchema';
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
 * GET /api/v0-tools/projects
 * List all projects for the authenticated user
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;

    const projects = await db
      .select()
      .from(v0Projects)
      .where(eq(v0Projects.userId, userId))
      .orderBy(desc(v0Projects.updatedAt));

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

/**
 * GET /api/v0-tools/projects/:id
 * Get project details with associated chats
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const projectId = parseInt(req.params.id);

    // Fetch project
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

    // Fetch associated chats
    const chats = await db
      .select()
      .from(v0Chats)
      .where(and(
        eq(v0Chats.projectId, projectId),
        eq(v0Chats.userId, userId),
        eq(v0Chats.status, 'active')
      ))
      .orderBy(desc(v0Chats.updatedAt));

    res.json({
      ...project,
      chats
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

/**
 * POST /api/v0-tools/projects
 * Create a new project
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { name, description, metadata } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const [project] = await db
      .insert(v0Projects)
      .values({
        userId,
        name,
        description: description || null,
        metadata: metadata || {}
      })
      .returning();

    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

/**
 * PATCH /api/v0-tools/projects/:id
 * Update a project
 */
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const projectId = parseInt(req.params.id);
    const { name, description, metadata } = req.body;

    // Verify project ownership
    const [existingProject] = await db
      .select()
      .from(v0Projects)
      .where(and(
        eq(v0Projects.id, projectId),
        eq(v0Projects.userId, userId)
      ));

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Build update object
    const updates: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (metadata !== undefined) updates.metadata = metadata;

    const [project] = await db
      .update(v0Projects)
      .set(updates)
      .where(eq(v0Projects.id, projectId))
      .returning();

    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

/**
 * DELETE /api/v0-tools/projects/:id
 * Delete a project and all associated chats
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const projectId = parseInt(req.params.id);

    // Verify project ownership
    const [existingProject] = await db
      .select()
      .from(v0Projects)
      .where(and(
        eq(v0Projects.id, projectId),
        eq(v0Projects.userId, userId)
      ));

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Delete project (cascading delete will handle chats)
    await db
      .delete(v0Projects)
      .where(eq(v0Projects.id, projectId));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
