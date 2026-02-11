# Spent Backend API

Node.js + Express + MongoDB + Auth0 backend for the Spent expense tracker mobile app.

## Quick Start

# 1. Stop and clean everything (if needed)
```bash
cd backend
docker-compose down -v
```
# 2. Start everything
```bash
docker-compose up -d
```
# 3. Check status
```bash
docker ps
```
# 4. Test the API
```bash
curl http://localhost:3001/health
```

---------------------------

## 🎯 Quick Reference

#View logs:
```bash
docker-compose logs -f backenddocker-compose logs -f mongodb
```
# Stop everything:
```bash
docker-compose down
```
# Restart backend only:
```bash
docker-compose restart backend
```
# Rebuild after code changes:
```bash
docker-compose build backenddocker-compose up -d
```
# Your API is live at: http://localhost:3001 🚀



### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Auth0 domain and audience
- MongoDB connection string
- Server port and CORS origins

### 3. Start MongoDB
```bash
docker-compose up -d mongodb
```

### 4. Start Development Server
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Docker Deployment

### Start All Services (MongoDB + Backend)
```bash
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f
```

### Stop Services
```bash
docker-compose down
```

## API Documentation

All endpoints require Auth0 JWT authentication except `/health`.

### Health Check
- `GET /health` - Check server status

### Users
- `POST /api/users/sync` - Sync user after login
- `GET /api/users/:userId` - Get user
- `GET /api/users/:userId/settings` - Get settings
- `PUT /api/users/:userId/settings` - Update settings

### Categories
- `GET /api/categories/user/:userId` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Expenses
- `GET /api/expenses/user/:userId` - List expenses
- `GET /api/expenses/stats/user/:userId` - Get statistics
- `POST /api/expenses` - Create expense
- `DELETE /api/expenses/:id` - Delete expense

### Recurring Payments
- `GET /api/recurring-payments/user/:userId` - List payments
- `POST /api/recurring-payments` - Create payment
- `PUT /api/recurring-payments/:id` - Update payment
- `DELETE /api/recurring-payments/:id` - Delete payment

## Database Schema

### User
- auth0Id (unique)
- email (unique)
- username
- displayName
- currency

### Category
- userId
- name
- color

### Expense
- userId
- amount
- categoryId
- date
- description

### RecurringPayment
- userId
- name
- amount
- categoryId
- dayOfMonth
- frequency
- excludedMonths
- isActive

## Production Deployment

### Google Cloud Run
```bash
# Build image
docker build -t gcr.io/YOUR_PROJECT/spent-backend .

# Push to registry
docker push gcr.io/YOUR_PROJECT/spent-backend

# Deploy
gcloud run deploy spent-backend \
  --image gcr.io/YOUR_PROJECT/spent-backend \
  --platform managed \
  --region us-central1
```

### Environment Variables
Set these in your production environment:
- `MONGODB_URI` - Production MongoDB connection
- `AUTH0_DOMAIN` - Your Auth0 domain
- `AUTH0_AUDIENCE` - Your API identifier
- `NODE_ENV=production`
- `ALLOWED_ORIGINS` - Your app's URLs
