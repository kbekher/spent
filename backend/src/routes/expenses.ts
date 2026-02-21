import { Router, Request, Response } from 'express';
import { Expense } from '../models/Expense.js';
import { Category } from '../models/Category.js';
import { checkJwt } from '../middleware/auth.js';

const router = Router();

// Get all expenses for a user with optional filters
router.get('/user/:userId', checkJwt, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, categoryId } = req.query;
    
    const query: any = { userId: req.params.userId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }
    
    if (categoryId) {
      query.categoryId = categoryId;
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch expenses', message: error.message });
  }
});

// Get expense statistics
router.get('/stats/user/:userId', checkJwt, async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    const userId = req.params.userId;

    const query: any = { userId };

    if (year) {
      const startDate = new Date(Number(year), month ? Number(month) - 1 : 0, 1);
      const endDate = month
        ? new Date(Number(year), Number(month), 0, 23, 59, 59)
        : new Date(Number(year), 11, 31, 23, 59, 59);

      query.date = { $gte: startDate, $lte: endDate };
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    const categories = await Category.find({ userId });

    // Calculate totals by category
    const categoryMap = new Map(categories.map(cat => [cat._id.toString(), cat]));
    const categoryTotals = new Map<string, number>();

    let total = 0;
    expenses.forEach(expense => {
      total += expense.amount;
      const catId = expense.categoryId.toString();
      categoryTotals.set(catId, (categoryTotals.get(catId) || 0) + expense.amount);
    });

    const byCategory = Array.from(categoryTotals.entries())
      .map(([catId, amount]) => {
        const category = categoryMap.get(catId);
        return {
          name: category?.name || 'Unknown',
          color: category?.color || '#gray',
          total: amount,
        };
      })
      .sort((a, b) => b.total - a.total);

    res.json({
      total,
      byCategory,
      expenses,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
  }
});

// Create a new expense
router.post('/', checkJwt, async (req: Request, res: Response) => {
  try {
    const { userId, amount, categoryId, date, description } = req.body;

    const expense = new Expense({
      userId,
      amount,
      categoryId,
      date: date ? new Date(date) : new Date(),
      description,
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create expense', message: error.message });
  }
});

// Update an expense
router.put('/:id', checkJwt, async (req: Request, res: Response) => {
  try {
    const { amount, categoryId, description, date } = req.body;

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        ...(amount !== undefined && { amount }),
        ...(categoryId !== undefined && { categoryId }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: new Date(date) }),
      },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update expense', message: error.message });
  }
});

// Delete an expense
router.delete('/:id', checkJwt, async (req: Request, res: Response) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete expense', message: error.message });
  }
});

export default router;
