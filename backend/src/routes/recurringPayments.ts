import { Router, Request, Response } from 'express';
import { RecurringPayment } from '../models/RecurringPayment.js';
import { checkJwt } from '../middleware/auth.js';

const router = Router();

// Get all recurring payments for a user
router.get('/user/:userId', checkJwt, async (req: Request, res: Response) => {
  try {
    const payments = await RecurringPayment.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch recurring payments', message: error.message });
  }
});

// Create a new recurring payment
router.post('/', checkJwt, async (req: Request, res: Response) => {
  try {
    const {
      userId,
      name,
      amount,
      categoryId,
      dayOfMonth,
      frequency,
      startMonth,
      excludedMonths,
    } = req.body;

    const payment = new RecurringPayment({
      userId,
      name,
      amount,
      categoryId,
      dayOfMonth,
      frequency: frequency || 'monthly',
      startMonth,
      excludedMonths: excludedMonths || [],
      isActive: true,
    });

    await payment.save();
    res.status(201).json(payment);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create recurring payment', message: error.message });
  }
});

// Update a recurring payment
router.put('/:id', checkJwt, async (req: Request, res: Response) => {
  try {
    const {
      name,
      amount,
      categoryId,
      dayOfMonth,
      frequency,
      startMonth,
      excludedMonths,
      isActive,
    } = req.body;

    const payment = await RecurringPayment.findByIdAndUpdate(
      req.params.id,
      {
        name,
        amount,
        categoryId,
        dayOfMonth,
        frequency,
        startMonth,
        excludedMonths,
        isActive,
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ error: 'Recurring payment not found' });
    }

    res.json(payment);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update recurring payment', message: error.message });
  }
});

// Toggle exclude month
router.post('/:id/toggle-exclude', checkJwt, async (req: Request, res: Response) => {
  try {
    const { month } = req.body;
    const payment = await RecurringPayment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: 'Recurring payment not found' });
    }

    const index = payment.excludedMonths.indexOf(month);
    if (index > -1) {
      payment.excludedMonths.splice(index, 1);
    } else {
      payment.excludedMonths.push(month);
    }

    await payment.save();
    res.json(payment);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to toggle exclude month', message: error.message });
  }
});

// Delete a recurring payment
router.delete('/:id', checkJwt, async (req: Request, res: Response) => {
  try {
    const payment = await RecurringPayment.findByIdAndDelete(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: 'Recurring payment not found' });
    }

    res.json({ message: 'Recurring payment deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete recurring payment', message: error.message });
  }
});

export default router;
