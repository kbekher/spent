# 🚀 Spent App - Complete Setup Guide

This guide will walk you through setting up the Spent expense tracker app from scratch.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js** (v18+) - [Download](https://nodejs.org/)
- [ ] **npm** or **yarn** - Comes with Node.js
- [ ] **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- [ ] **Expo CLI** - Install: `npm install -g expo-cli`
- [ ] **iOS Simulator** (Mac only) or **Android Studio** (for emulator)
- [ ] **Auth0 Account** - [Sign up free](https://auth0.com)

## 🔐 Step 1: Auth0 Configuration

### Create Auth0 Application

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Click **Applications** → **Create Application**
3. Name: `Spent Mobile App`
4. Type: **Native**
5. Click **Create**

### Configure Application Settings

In your application settings:

**Allowed Callback URLs:**
```
spent://auth
```

**Allowed Logout URLs:**
```
spent://
```

**Allowed Web Origins:**
```
spent://
```

**Allowed Origins (CORS):**
```
http://localhost:8081
exp://localhost:8081
```

Click **Save Changes**

### Create Auth0 API

1. Click **APIs** → **Create API**
2. Name: `Spent API`
3. Identifier: `https://spent-api` (or your custom URL)
4. Signing Algorithm: **RS256**
5. Click **Create**

### Save Your Credentials

You'll need these values:
- **Domain**: `your-tenant.auth0.com`
- **Client ID**: Found in Application settings
- **API Identifier**: `https://spent-api`

## 🗄️ Step 2: Backend Setup

### Install Backend Dependencies

```bash
cd /path/to/spent/backend
npm install
```

### Configure Environment Variables

Create `.env` file in the `backend` folder:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://admin:password123@localhost:27017/spent?authSource=admin

# Auth0 Configuration (REPLACE WITH YOUR VALUES)
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://spent-api

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration (update with your IP if using physical device)
ALLOWED_ORIGINS=http://localhost:8081,exp://192.168.1.100:8081
```

**Important**: Replace `your-tenant.auth0.com` with your actual Auth0 domain!

### Start MongoDB

```bash
# Start MongoDB in Docker
cd /path/to/spent/backend
docker-compose up -d mongodb

# Verify it's running
docker ps

# You should see: spent-mongodb
```

### Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 3000
```

Test the API:
```bash
curl http://localhost:3000/health
```

## 📱 Step 3: Mobile App Setup

### Install Mobile App Dependencies

```bash
cd /path/to/spent
npm install
```

### Configure Auth0 in Mobile App

Edit `src/config/auth0.ts`:

```typescript
export const auth0Config = {
  domain: 'your-tenant.auth0.com',        // ← Your Auth0 domain
  clientId: 'YOUR_CLIENT_ID_HERE',        // ← Your Auth0 Client ID
  audience: 'https://spent-api',          // ← Your API identifier
};

export const apiConfig = {
  baseURL: __DEV__ 
    ? 'http://localhost:3000/api'         // iOS simulator
    // ? 'http://10.0.2.2:3000/api'       // Android emulator
    // ? 'http://192.168.1.100:3000/api'  // Physical device (use your IP)
    : 'https://your-production-api.com/api',
};
```

**For Physical Device:**
1. Find your computer's IP address:
   - Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Windows: `ipconfig`
2. Replace `localhost` with your IP (e.g., `192.168.1.100`)
3. Update `ALLOWED_ORIGINS` in backend `.env`

### Start Expo Development Server

```bash
npx expo start
```

You'll see a QR code in the terminal.

### Run on Device/Simulator

**iOS Simulator (Mac only):**
```bash
Press 'i' in the terminal
```

**Android Emulator:**
```bash
Press 'a' in the terminal
```

**Physical Device:**
1. Install **Expo Go** app from App Store or Google Play
2. Scan the QR code with:
   - iOS: Camera app
   - Android: Expo Go app

## ✅ Step 4: Verify Everything Works

### Test Backend

1. Backend should be running on `http://localhost:3000`
2. MongoDB should be running in Docker
3. Test health endpoint:
   ```bash
   curl http://localhost:3000/health
   ```

### Test Mobile App

1. App should load and show login screen
2. Click "Login with Auth0"
3. Complete authentication
4. You should see the Overview screen

### Test Full Flow

1. **Login** with Auth0
2. **Add a Category**: Go to Categories tab → Add Category
3. **Add an Expense**: Go to Overview → Add Expense
4. **View Statistics**: Check Overview tab for spending summary

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"

**Solution:**
```bash
# Check if Docker is running
docker ps

# Restart MongoDB
cd backend
docker-compose down
docker-compose up -d mongodb

# Check logs
docker-compose logs mongodb
```

### Issue: "Auth0 authentication failed"

**Solutions:**
- Verify callback URLs in Auth0 dashboard match `spent://auth`
- Check that Auth0 credentials in `src/config/auth0.ts` are correct
- Ensure API audience matches in both frontend and backend

### Issue: "Cannot connect to API from mobile app"

**Solutions:**

**iOS Simulator:**
- Use `http://localhost:3000/api`

**Android Emulator:**
- Use `http://10.0.2.2:3000/api`

**Physical Device:**
- Use your computer's IP: `http://192.168.1.X:3000/api`
- Ensure device and computer are on same WiFi network
- Update `ALLOWED_ORIGINS` in backend `.env`

### Issue: "Expo won't start"

**Solution:**
```bash
# Clear cache
npx expo start -c

# Or reinstall
rm -rf node_modules
npm install
npx expo start
```

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in backend/.env
PORT=3001
```

## 🎉 Success!

If everything is working:
- ✅ Backend API running on port 3000
- ✅ MongoDB running in Docker
- ✅ Mobile app running on Expo
- ✅ Can login with Auth0
- ✅ Can add categories and expenses

## 🚀 Next Steps

### Development
- Customize the UI colors and styles
- Add more features (budgets, reports, etc.)
- Implement data export functionality

### Production Deployment
1. **Backend**: Deploy to Google Cloud Run or Heroku
2. **Database**: Use MongoDB Atlas (free tier available)
3. **Mobile**: Build and submit to App Stores with EAS Build

See `README.md` for detailed deployment instructions.

## 📚 Additional Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Docker Documentation](https://docs.docker.com/)

## 💬 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review the logs:
   - Backend: Check terminal where `npm run dev` is running
   - MongoDB: `docker-compose logs mongodb`
   - Mobile: Check Expo terminal
3. Open an issue on GitHub with error details

---

Happy tracking! 💰
