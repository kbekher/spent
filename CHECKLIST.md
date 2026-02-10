# ✅ Setup Checklist

Follow this checklist to get your Spent app running.

## 📋 Pre-Setup Checklist

- [ ] Node.js installed (v18+)
- [ ] npm installed
- [ ] Docker Desktop installed and running
- [ ] Expo CLI installed (`npm install -g expo-cli`)
- [ ] iOS Simulator (Mac) or Android Studio installed
- [ ] Auth0 account created

## 🔐 Auth0 Setup Checklist

- [ ] Logged into Auth0 Dashboard
- [ ] Created Native Application
  - [ ] Named it "Spent Mobile App"
  - [ ] Selected "Native" type
- [ ] Configured Application Settings:
  - [ ] Added callback URL: `spent://auth`
  - [ ] Added logout URL: `spent://`
  - [ ] Added web origins: `spent://`
  - [ ] Saved changes
- [ ] Created API:
  - [ ] Named it "Spent API"
  - [ ] Set identifier: `https://spent-api`
  - [ ] Selected RS256 algorithm
- [ ] Noted down credentials:
  - [ ] Domain (e.g., `your-tenant.auth0.com`)
  - [ ] Client ID
  - [ ] API Identifier

## 🖥️ Backend Setup Checklist

- [ ] Navigated to backend folder: `cd backend`
- [ ] Installed dependencies: `npm install`
- [ ] Created `.env` file
- [ ] Configured `.env` with:
  - [ ] AUTH0_DOMAIN (your Auth0 domain)
  - [ ] AUTH0_AUDIENCE (your API identifier)
  - [ ] MONGODB_URI (default is fine for local)
  - [ ] PORT (3000)
  - [ ] NODE_ENV (development)
  - [ ] ALLOWED_ORIGINS (updated if using physical device)
- [ ] Started MongoDB: `docker-compose up -d mongodb`
- [ ] Verified MongoDB is running: `docker ps`
- [ ] Started backend: `npm run dev`
- [ ] Verified backend is running: Visit `http://localhost:3000/health`

## 📱 Mobile App Setup Checklist

- [ ] Navigated to project root: `cd /Users/kbekher/projects/spent`
- [ ] Installed dependencies: `npm install`
- [ ] Opened `src/config/auth0.ts`
- [ ] Updated Auth0 configuration:
  - [ ] Set `domain` to your Auth0 domain
  - [ ] Set `clientId` to your Auth0 Client ID
  - [ ] Set `audience` to your API identifier
- [ ] Updated API configuration:
  - [ ] Set correct `baseURL` for your setup
  - [ ] iOS simulator: `http://localhost:3000/api`
  - [ ] Android emulator: `http://10.0.2.2:3000/api`
  - [ ] Physical device: `http://YOUR_IP:3000/api`
- [ ] Started Expo: `npm start`
- [ ] App opened in Expo Go or simulator

## 🧪 Testing Checklist

- [ ] App loads without errors
- [ ] Login screen appears
- [ ] Clicked "Login with Auth0"
- [ ] Auth0 login page loads
- [ ] Completed authentication
- [ ] Redirected back to app
- [ ] Overview screen appears
- [ ] User name displays correctly
- [ ] Navigated to Categories tab
- [ ] Added a new category
- [ ] Category appears in list
- [ ] Navigated to Overview
- [ ] Clicked "Add Expense"
- [ ] Selected category
- [ ] Entered amount
- [ ] Submitted expense
- [ ] Expense appears in overview
- [ ] Statistics updated correctly
- [ ] Navigated to Account tab
- [ ] User info displays correctly
- [ ] Logout works

## 🐛 Troubleshooting Checklist

### If MongoDB won't start:
- [ ] Docker Desktop is running
- [ ] No other MongoDB instance on port 27017
- [ ] Tried: `docker-compose down && docker-compose up -d`
- [ ] Checked logs: `docker-compose logs mongodb`

### If Backend won't start:
- [ ] MongoDB is running
- [ ] Port 3000 is not in use
- [ ] `.env` file exists and is configured
- [ ] Auth0 credentials are correct
- [ ] Tried: `npm install` again

### If Mobile app won't connect to API:
- [ ] Backend is running
- [ ] Correct API URL in `src/config/auth0.ts`
- [ ] For physical device: using computer's IP address
- [ ] For physical device: same WiFi network
- [ ] Updated `ALLOWED_ORIGINS` in backend `.env`
- [ ] Tried: `npx expo start -c` (clear cache)

### If Auth0 login fails:
- [ ] Callback URLs match in Auth0 dashboard
- [ ] Auth0 credentials are correct in both files
- [ ] API audience matches in frontend and backend
- [ ] Tried: Logging out and logging in again

### If app crashes:
- [ ] Checked Expo terminal for errors
- [ ] Checked backend terminal for errors
- [ ] Tried: `npx expo start -c`
- [ ] Tried: `rm -rf node_modules && npm install`

## 🚀 Deployment Checklist

### Backend Deployment:
- [ ] Created Google Cloud project
- [ ] Set up MongoDB Atlas account
- [ ] Updated `MONGODB_URI` to production database
- [ ] Built Docker image
- [ ] Pushed to container registry
- [ ] Deployed to Cloud Run
- [ ] Set environment variables in Cloud Run
- [ ] Tested API health endpoint
- [ ] Updated Auth0 API settings

### Mobile App Deployment:
- [ ] Updated API URL to production
- [ ] Tested app with production API
- [ ] Created Expo account
- [ ] Installed EAS CLI: `npm install -g eas-cli`
- [ ] Logged in: `eas login`
- [ ] Configured: `eas build:configure`
- [ ] Built for iOS: `eas build --platform ios`
- [ ] Built for Android: `eas build --platform android`
- [ ] Tested builds
- [ ] Submitted to App Store: `eas submit --platform ios`
- [ ] Submitted to Google Play: `eas submit --platform android`

## 📝 Documentation Checklist

- [ ] Read `README.md` for overview
- [ ] Read `SETUP_GUIDE.md` for detailed setup
- [ ] Read `QUICK_START.md` for quick start
- [ ] Read `ARCHITECTURE.md` for system design
- [ ] Read `PROJECT_SUMMARY.md` for what was built
- [ ] Bookmarked `COMMANDS.md` for reference

## 🎉 Success Criteria

You're done when:
- [ ] ✅ Backend API is running
- [ ] ✅ MongoDB is running in Docker
- [ ] ✅ Mobile app is running
- [ ] ✅ Can login with Auth0
- [ ] ✅ Can add categories
- [ ] ✅ Can add expenses
- [ ] ✅ Statistics display correctly
- [ ] ✅ Can logout
- [ ] ✅ All features work smoothly

## 🎓 Learning Checklist

After completing this project, you now understand:
- [ ] React Native mobile development
- [ ] Expo workflow
- [ ] Auth0 authentication
- [ ] OAuth 2.0 flow
- [ ] JWT tokens
- [ ] Redux state management
- [ ] REST API development
- [ ] Express.js framework
- [ ] MongoDB database
- [ ] Mongoose ODM
- [ ] Docker containerization
- [ ] TypeScript
- [ ] Full-stack architecture

## 📚 Next Steps

- [ ] Customize the UI to your liking
- [ ] Add more features (budgets, reports, etc.)
- [ ] Deploy to production
- [ ] Share with friends and family
- [ ] Add to your portfolio
- [ ] Write blog post about what you learned

---

**Print this checklist and check off items as you complete them!** ✓
