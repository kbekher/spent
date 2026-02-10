# 🔧 Development Setup

## Recommended Development Workflow

For the best development experience, use this setup:

### 1. Run MongoDB in Docker
```bash
# Start only MongoDB (not the backend)
cd /Users/kbekher/projects/spent/backend
docker-compose up -d mongodb
```

### 2. Run Backend Locally
```bash
# In a separate terminal - run backend with hot-reload
cd /Users/kbekher/projects/spent/backend
npm run dev
```

### 3. Run Mobile App
```bash
# In another terminal - run Expo
cd /Users/kbekher/projects/spent
npx expo start
```

---

## Why This Setup?

✅ **MongoDB in Docker**
- Consistent database environment
- Easy to reset/restart
- No local MongoDB installation needed

✅ **Backend Locally**
- Hot-reload on file changes (faster development)
- Easier debugging with console.log
- Direct access to error messages
- Can use debugger

✅ **Mobile App Locally**
- Hot-reload on file changes
- Fast refresh
- Easy testing on multiple devices

---

## Quick Commands

### Start Development

```bash
# Terminal 1: MongoDB
cd backend && docker-compose up -d mongodb

# Terminal 2: Backend  
cd backend && npm run dev

# Terminal 3: Mobile App
npx expo start
```

### Stop Everything

```bash
# Stop backend (Ctrl+C in terminal)

# Stop MongoDB
cd backend && docker-compose down
```

### Restart Everything

```bash
# Restart MongoDB
cd backend && docker-compose restart mongodb

# Restart backend (Ctrl+C then npm run dev again)

# Restart Expo (Ctrl+C then npx expo start again)
```

---

## Checking Status

### Check MongoDB
```bash
docker ps --filter "name=spent-mongodb"

# Should show: spent-mongodb running on port 27017
```

### Check Backend
```bash
curl http://localhost:3000/health

# Should return: {"status":"ok",...}
```

### Check Expo
- QR code should appear in terminal
- Metro bundler should be running

---

## Common Issues

### Port 3000 Already in Use

**Problem**: Backend won't start because port is in use

**Solution**: Stop the Docker backend container
```bash
docker stop spent-backend
```

Then run backend locally:
```bash
cd backend && npm run dev
```

### MongoDB Connection Failed

**Problem**: Backend can't connect to MongoDB

**Solution**: Make sure MongoDB Docker container is running
```bash
docker ps --filter "name=spent-mongodb"

# If not running:
cd backend && docker-compose up -d mongodb
```

### Backend Environment Variables

Make sure `backend/.env` has:
```env
MONGODB_URI=mongodb://admin:password123@localhost:27017/spent?authSource=admin
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://spent-api
PORT=3000
NODE_ENV=development
```

---

## Full Docker Setup (Alternative)

If you prefer to run **everything in Docker**:

```bash
# Start both MongoDB and backend
cd backend && docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

**Note**: This is slower for development because you don't get hot-reload.

---

## Production vs Development

### Development (Recommended)
- MongoDB: Docker ✅
- Backend: Local ✅
- Mobile: Local ✅

**Benefits**: Fast hot-reload, easy debugging

### Testing Full Stack
- MongoDB: Docker ✅
- Backend: Docker ✅
- Mobile: Local ✅

**Benefits**: Test production-like environment

### Production
- MongoDB: MongoDB Atlas (cloud)
- Backend: Google Cloud Run (or similar)
- Mobile: Published to App Stores

---

## Useful Development Commands

```bash
# Watch backend logs
cd backend && npm run dev

# Watch MongoDB logs
docker logs spent-mongodb -f

# Clear Expo cache
npx expo start -c

# Rebuild Docker backend (if needed)
cd backend && docker-compose up -d --build backend

# Reset MongoDB data
cd backend && docker-compose down -v
cd backend && docker-compose up -d mongodb
```

---

**Bookmark this file for quick reference during development!** 🔖
