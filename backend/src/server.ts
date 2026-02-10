// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDatabase } from './config/database.js';
import { handleJwtError } from './middleware/auth.js';

// Import routes
import usersRouter from './routes/users.js';
import categoriesRouter from './routes/categories.js';
import expensesRouter from './routes/expenses.js';
import recurringPaymentsRouter from './routes/recurringPayments.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:8081', 'exp://localhost:8081'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Allow any origin in development
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/recurring-payments', recurringPaymentsRouter);

// JWT error handler
app.use(handleJwtError);

// Global error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔐 Auth0 Domain: ${process.env.AUTH0_DOMAIN}`);
      console.log(`🌐 CORS Origins: ${allowedOrigins.join(', ')}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
