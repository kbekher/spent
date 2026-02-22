import { Router, Request, Response } from 'express';
import { RecurringPayment } from '../models/RecurringPayment.js';
import { checkJwt } from '../middleware/auth.js';

const router = Router();

// Get all recurring payments for a user
router.get('/user/:userId', checkJwt, async (req: Request, res: Response) => {
  try {
    const payments = await RecurringPayment.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    
    // Verify createdAt is present in all payments
    const paymentsWithTimestamps = payments.map((p) => {
      const payment = p.toObject ? p.toObject() : p;
      if (!payment.createdAt) {
        console.warn('Payment missing createdAt:', payment._id);
      }
      return payment;
    });
    
    console.log(`Fetched ${paymentsWithTimestamps.length} recurring payments, all have createdAt:`, 
      paymentsWithTimestamps.every(p => p.createdAt));
    
    res.json(paymentsWithTimestamps);
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
      frequency,
      startDay,
      startMonth,
      excludedMonths,
    } = req.body;

    const payment = new RecurringPayment({
      userId,
      name,
      amount,
      categoryId,
      frequency: frequency || 'monthly',
      startDay: startDay || 1,
      startMonth,
      excludedMonths: excludedMonths || [],
      isActive: true
    });

    await payment.save();
    
    // Ensure createdAt is included in response (Mongoose timestamps should auto-set this)
    const paymentResponse = payment.toObject ? payment.toObject() : payment;
    console.log('Created recurring payment with createdAt:', paymentResponse.createdAt);
    
    res.status(201).json(paymentResponse);
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
      frequency,
      startDay,
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
        frequency,
        startDay,
        startMonth,
        excludedMonths,
        isActive,
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ error: 'Recurring payment not found' });
    }

    // Ensure createdAt is included in response
    const paymentResponse = payment.toObject ? payment.toObject() : payment;
    res.json(paymentResponse);
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

// Exclude a specific period (for recurring instance deletion)
router.post('/:id/exclude-period', checkJwt, async (req: Request, res: Response) => {
  try {
    const { periodKey } = req.body; // Format: "YYYY-MM"
    
    if (!periodKey || !/^\d{4}-\d{2}$/.test(periodKey)) {
      return res.status(400).json({ error: 'Invalid periodKey format. Expected YYYY-MM' });
    }

    const payment = await RecurringPayment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: 'Recurring payment not found' });
    }

    // Add period to excludedMonths if not already present
    if (!payment.excludedMonths.includes(periodKey)) {
      payment.excludedMonths.push(periodKey);
      await payment.save();
    }

    res.json(payment);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to exclude period', message: error.message });
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
