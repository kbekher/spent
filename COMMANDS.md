# 📝 Useful Commands Reference

Quick reference for all commands you'll need.

## 🚀 Setup Commands

```bash
# Install all dependencies (mobile + backend)
npm run setup

# Install mobile app dependencies only
npm install

# Install backend dependencies only
cd backend && npm install
```

## 🐳 Docker Commands

```bash
# Start MongoDB container
npm run docker:up
# or
cd backend && docker-compose up -d

# Stop MongoDB container
npm run docker:down
# or
cd backend && docker-compose down

# View MongoDB logs
cd backend && docker-compose logs -f mongodb

# Restart MongoDB
cd backend && docker-compose restart mongodb

# Remove MongoDB data (fresh start)
cd backend && docker-compose down -v

# Check running containers
docker ps

# Access MongoDB shell
docker exec -it spent-mongodb mongosh -u admin -p password123
```

## 🖥️ Backend Commands

```bash
# Start backend in development mode (with auto-reload)
npm run backend
# or
cd backend && npm run dev

# Build backend for production
cd backend && npm run build

# Start backend in production mode
cd backend && npm start

# View backend logs
cd backend && npm run docker:logs
```

## 📱 Mobile App Commands

```bash
# Start Expo development server
npm start
# or
npx expo start

# Start with cache cleared
npx expo start -c

# Start on iOS simulator
npm run ios
# or
npx expo start --ios

# Start on Android emulator
npm run android
# or
npx expo start --android

# Start web version
npm run web
# or
npx expo start --web

# Install new dependency
npm install <package-name>

# Update Expo SDK
npx expo install expo@latest

# Check for outdated packages
npm outdated
```

## 🔍 Debugging Commands

```bash
# View all running processes
ps aux | grep node

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Check if port is in use
lsof -i :3000

# View network connections
netstat -an | grep 3000

# Check Docker status
docker info

# View Docker disk usage
docker system df

# Clean up Docker
docker system prune -a
```

## 🧪 Testing Commands (when tests are added)

```bash
# Run mobile app tests
npm test

# Run backend tests
cd backend && npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## 📦 Build Commands

```bash
# Build backend for production
cd backend && npm run build

# Build mobile app for iOS
npx expo build:ios

# Build mobile app for Android
npx expo build:android

# Create development build
eas build --profile development --platform ios
eas build --profile development --platform android

# Create production build
eas build --profile production --platform all
```

## 🌐 Deployment Commands

```bash
# Deploy backend to Google Cloud Run
cd backend
docker build -t gcr.io/YOUR_PROJECT/spent-backend .
docker push gcr.io/YOUR_PROJECT/spent-backend
gcloud run deploy spent-backend --image gcr.io/YOUR_PROJECT/spent-backend

# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

## 🔧 Maintenance Commands

```bash
# Update all dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix security vulnerabilities
npm audit fix

# Clean node_modules
rm -rf node_modules package-lock.json
npm install

# Clear Expo cache
npx expo start -c

# Clear Metro bundler cache
npx react-native start --reset-cache
```

## 📊 Database Commands

```bash
# Access MongoDB shell
docker exec -it spent-mongodb mongosh -u admin -p password123

# Inside MongoDB shell:
use spent                          # Switch to spent database
show collections                   # List all collections
db.users.find()                   # View all users
db.expenses.find()                # View all expenses
db.categories.find()              # View all categories
db.expenses.countDocuments()      # Count expenses
db.expenses.deleteMany({})        # Delete all expenses (careful!)

# Export database
docker exec spent-mongodb mongodump --out /backup

# Import database
docker exec spent-mongodb mongorestore /backup

# Backup database
docker exec spent-mongodb mongodump --archive=/backup/spent.archive --db spent
```

## 🔐 Auth0 Commands

```bash
# Test Auth0 token (replace with your token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/users/sync

# Decode JWT token (install jwt-cli first: npm install -g jwt-cli)
jwt decode YOUR_TOKEN
```

## 📱 Device Commands

```bash
# List iOS simulators
xcrun simctl list devices

# Boot iOS simulator
xcrun simctl boot "iPhone 15"

# List Android emulators
emulator -list-avds

# Start Android emulator
emulator -avd Pixel_5_API_33

# Get device IP address (Mac)
ifconfig | grep "inet " | grep -v 127.0.0.1

# Get device IP address (Windows)
ipconfig

# Test API from device
curl http://YOUR_IP:3000/health
```

## 🎯 Quick Workflows

### Start Everything (3 terminals)

**Terminal 1:**
```bash
cd /Users/kbekher/projects/spent
npm run docker:up
```

**Terminal 2:**
```bash
cd /Users/kbekher/projects/spent
npm run backend
```

**Terminal 3:**
```bash
cd /Users/kbekher/projects/spent
npm start
```

### Fresh Start (Reset Everything)

```bash
# Stop all services
npm run docker:down

# Clean mobile app
rm -rf node_modules package-lock.json
npm install

# Clean backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Start fresh
cd ..
npm run docker:up
npm run backend  # In another terminal
npm start        # In another terminal
```

### Deploy to Production

```bash
# 1. Build backend
cd backend
npm run build

# 2. Test backend
npm start

# 3. Build Docker image
docker build -t spent-backend .

# 4. Push to registry
docker push your-registry/spent-backend

# 5. Build mobile app
cd ..
eas build --platform all

# 6. Submit to stores
eas submit --platform all
```

## 💡 Pro Tips

```bash
# Run multiple commands in one terminal (Mac/Linux)
npm run docker:up && npm run backend

# Run backend in background
npm run backend &

# View all npm scripts
npm run

# Check Node.js version
node --version

# Check npm version
npm --version

# Check Expo version
npx expo --version

# Check Docker version
docker --version

# Update npm
npm install -g npm@latest

# Update Expo CLI
npm install -g expo-cli@latest

# Clear all caches
npm cache clean --force
npx expo start -c
cd backend && rm -rf dist
```

## 🆘 Emergency Commands

```bash
# Kill all Node processes (careful!)
pkill -f node

# Kill all Docker containers
docker kill $(docker ps -q)

# Free up disk space
docker system prune -a --volumes

# Reset Expo
rm -rf ~/.expo
rm -rf node_modules
npm install

# Reset Metro bundler
rm -rf /tmp/metro-*
rm -rf /tmp/haste-*

# Reset iOS simulator
xcrun simctl erase all

# Reset Android emulator
adb shell pm clear com.yourcompany.spent
```

---

**Bookmark this file for quick reference!** 📌
