import express, { Request, Response } from 'express';

const router = express.Router();

/**
 * GET /api/v0-tools/validate
 * Validate V0 API key and authentication
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        valid: false, 
        error: 'Not authenticated' 
      });
    }

    // Check if V0_API_KEY is configured (optional)
    const hasV0ApiKey = !!process.env.V0_API_KEY;

    res.json({
      valid: true,
      authenticated: true,
      user: {
        id: (req.user as any).id,
        username: (req.user as any).username,
        email: (req.user as any).email
      },
      features: {
        aiGeneration: hasV0ApiKey, // AI generation available if V0 API key is set
        rateLimit: true, // Rate limiting is always enabled
        deployments: true, // Deployments available (mock for now)
        fileAttachments: true,
        voiceInput: false // Voice input not yet implemented
      },
      config: {
        rateLimitWindow: '12 hours',
        rateLimitMax: 3
      }
    });
  } catch (error) {
    console.error('Error validating:', error);
    res.status(500).json({ 
      valid: false, 
      error: 'Validation failed' 
    });
  }
});

export default router;
