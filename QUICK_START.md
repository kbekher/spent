# ⚡ Quick Start Guide

Get up and running in 5 minutes!

## 🎯 Prerequisites

- Node.js installed
- Docker Desktop running
- Auth0 account created
- **Latest Expo Go app** on your device (SDK 54)

## 🚀 Quick Setup

### 1. Install Everything

```bash
# Install all dependencies (root + backend)
npm run setup

# Note: This project uses Expo SDK 54 and requires legacy-peer-deps
# A .npmrc file is included to handle this automatically
```

### 2. Configure Auth0

Create a Native Application in Auth0:
- Callback URL: `spent://auth`
- Logout URL: `spent://`

Create an API in Auth0:
- Identifier: `https://spent-api`

### 3. Configure Backend

Edit `backend/.env`:

```env
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://spent-api
MONGODB_URI=mongodb://admin:password123@localhost:27017/spent?authSource=admin
```

### 4. Configure Mobile App

Edit `src/config/auth0.ts`:

```typescript
export const auth0Config = {
  domain: 'your-tenant.auth0.com',
  clientId: 'YOUR_CLIENT_ID',
  audience: 'https://spent-api',
};
```

### 5. Start Everything

**Terminal 1 - Start MongoDB:**
```bash
npm run docker:up
```

**Terminal 2 - Start Backend:**
```bash
npm run backend
```

**Terminal 3 - Start Mobile App:**
```bash
npm start
```

### 6. Run the App

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code for physical device

## ✅ Verify

1. Backend running: http://localhost:3000/health
2. MongoDB running: `docker ps` (should see spent-mongodb)
3. Mobile app opens and shows login screen

## 🎉 Done!

You're ready to track expenses!

For detailed setup and troubleshooting, see `SETUP_GUIDE.md`

## 📝 Quick Commands

```bash
# Start MongoDB
npm run docker:up

# Stop MongoDB
npm run docker:down

# Start backend
npm run backend

# Start mobile app
npm start

# iOS
npm run ios

# Android
npm run android
```

## 🐛 Issues?

**Can't connect to API?**
- iOS simulator: Use `http://localhost:3000/api`
- Android emulator: Use `http://10.0.2.2:3000/api`
- Physical device: Use your computer's IP

**Auth0 not working?**
- Check callback URLs match `spent://auth`
- Verify credentials in config files

**MongoDB won't start?**
- Ensure Docker Desktop is running
- Try: `npm run docker:down && npm run docker:up`

For more help, see `SETUP_GUIDE.md`
