import { Router, Request, Response } from 'express';
import { Category } from '../models/Category.js';
import { checkJwt } from '../middleware/auth.js';

const router = Router();

// Get all categories for a user
router.get('/user/:userId', checkJwt, async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({ userId: req.params.userId }).sort({ createdAt: 1 });
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch categories', message: error.message });
  }
});

// Create a new category
router.post('/', checkJwt, async (req: Request, res: Response) => {
  try {
    const { userId, name, color } = req.body;

    const category = new Category({
      userId,
      name,
      color: color || '#3b82f6',
    });

    await category.save();
    res.status(201).json(category);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create category', message: error.message });
  }
});

// Update a category
router.put('/:id', checkJwt, async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, color },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update category', message: error.message });
  }
});

// Delete a category
router.delete('/:id', checkJwt, async (req: Request, res: Response) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete category', message: error.message });
  }
});

export default router;
