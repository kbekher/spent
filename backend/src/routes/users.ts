import { Router, Request, Response } from 'express';
import { User } from '../models/User.js';
import { checkJwt, extractUserId } from '../middleware/auth.js';

const router = Router();

// Get or create user (called after Auth0 login)
router.post('/sync', checkJwt, extractUserId, async (req: Request, res: Response) => {
  try {
    const auth0Id = (req as any).userId;
    const { email, username } = req.body;

    let user = await User.findOne({ auth0Id });

    if (!user) {
      user = new User({
        auth0Id,
        email,
        username,
        displayName: username,
        currency: 'USD',
      });
      await user.save();
    }

    res.json(user);
  } catch (error: any) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user', message: error.message });
  }
});

// Get user by ID
router.get('/:userId', checkJwt, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch user', message: error.message });
  }
});

// Get user settings
router.get('/:userId/settings', checkJwt, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      displayName: user.displayName || user.username,
      currency: user.currency,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch settings', message: error.message });
  }
});

// Update user settings
router.put('/:userId/settings', checkJwt, async (req: Request, res: Response) => {
  try {
    const { displayName, currency } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { displayName, currency },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update settings', message: error.message });
  }
});

export default router;
