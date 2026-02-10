# 💰 Spent - Mobile Expense Tracker

A full-stack mobile expense tracking application built with React Native (Expo), Node.js, MongoDB, and Auth0 authentication.

## 📱 Features

- **Secure Authentication**: Auth0 integration for secure user authentication
- **Expense Tracking**: Add, view, and categorize expenses
- **Category Management**: Create and manage custom expense categories
- **Monthly Overview**: View spending statistics by month and category
- **Recurring Payments**: Set up and manage recurring expenses
- **Real-time Sync**: All data synced with cloud backend

## 🏗️ Architecture

### Frontend (Mobile App)
- **Framework**: React Native with Expo
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation
- **Authentication**: Auth0 with expo-auth-session
- **Styling**: React Native StyleSheet

### Backend (API Server)
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: MongoDB (Docker)
- **Authentication**: Auth0 JWT verification
- **API**: RESTful API with JSON responses

### Database
- **MongoDB**: Running in Docker container
- **Collections**: Users, Categories, Expenses, RecurringPayments
- **Indexes**: Optimized for query performance

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- Docker and Docker Compose
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Studio (for Android emulator)

### 1. Auth0 Setup

1. Create a free Auth0 account at [https://auth0.com](https://auth0.com)
2. Create a new **Native Application**
3. Configure the following settings:
   - **Allowed Callback URLs**: `spent://auth`
   - **Allowed Logout URLs**: `spent://`
   - **Allowed Web Origins**: `spent://`
4. Create an **API** in Auth0:
   - Name: `Spent API`
   - Identifier: `https://spent-api` (or your custom identifier)
5. Note down:
   - Domain (e.g., `your-tenant.auth0.com`)
   - Client ID
   - API Identifier

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Edit `backend/.env` with your Auth0 credentials:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://admin:password123@localhost:27017/spent?authSource=admin

# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://spent-api

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:8081,exp://192.168.1.100:8081
```

**Start MongoDB with Docker:**

```bash
# Start MongoDB container
docker-compose up -d mongodb

# View logs
docker-compose logs -f mongodb
```

**Start the backend server:**

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

The API will be available at `http://localhost:3000`

### 3. Mobile App Setup

```bash
# Navigate to project root
cd /path/to/spent

# Install dependencies
npm install

# Configure Auth0
```

Edit `src/config/auth0.ts`:

```typescript
export const auth0Config = {
  domain: 'your-tenant.auth0.com',
  clientId: 'YOUR_AUTH0_CLIENT_ID',
  audience: 'https://spent-api',
};

export const apiConfig = {
  baseURL: __DEV__ 
    ? 'http://localhost:3000/api'  // For iOS simulator
    // ? 'http://10.0.2.2:3000/api'  // For Android emulator
    : 'https://your-production-api.com/api',
};
```

**Start the Expo development server:**

```bash
# Start Expo
npx expo start

# Or with specific platform
npx expo start --ios
npx expo start --android
npx expo start --web
```

Scan the QR code with:
- **iOS**: Camera app or Expo Go app
- **Android**: Expo Go app

## 🐳 Docker Deployment

To run both backend and MongoDB together:

```bash
cd backend

# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (deletes data)
docker-compose down -v
```

## 📡 API Endpoints

### Authentication
All endpoints (except health check) require a valid Auth0 JWT token in the `Authorization` header:
```
Authorization: Bearer <your-access-token>
```

### Users
- `POST /api/users/sync` - Sync user after Auth0 login
- `GET /api/users/:userId` - Get user details
- `GET /api/users/:userId/settings` - Get user settings
- `PUT /api/users/:userId/settings` - Update user settings

### Categories
- `GET /api/categories/user/:userId` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Expenses
- `GET /api/expenses/user/:userId` - Get all expenses (with filters)
- `GET /api/expenses/stats/user/:userId` - Get expense statistics
- `POST /api/expenses` - Create expense
- `DELETE /api/expenses/:id` - Delete expense

### Recurring Payments
- `GET /api/recurring-payments/user/:userId` - Get all recurring payments
- `POST /api/recurring-payments` - Create recurring payment
- `PUT /api/recurring-payments/:id` - Update recurring payment
- `DELETE /api/recurring-payments/:id` - Delete recurring payment

## 🌐 Deploying to Production

### Backend Deployment (Google Cloud)

1. **Set up Google Cloud Project**
   ```bash
   gcloud init
   gcloud projects create spent-app
   ```

2. **Deploy MongoDB**
   - Use Google Cloud SQL or MongoDB Atlas
   - Update `MONGODB_URI` in production environment

3. **Deploy Backend**
   ```bash
   # Build Docker image
   docker build -t gcr.io/spent-app/backend ./backend
   
   # Push to Google Container Registry
   docker push gcr.io/spent-app/backend
   
   # Deploy to Cloud Run
   gcloud run deploy spent-backend \
     --image gcr.io/spent-app/backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

4. **Set Environment Variables**
   ```bash
   gcloud run services update spent-backend \
     --set-env-vars="AUTH0_DOMAIN=your-tenant.auth0.com" \
     --set-env-vars="AUTH0_AUDIENCE=https://spent-api" \
     --set-env-vars="MONGODB_URI=your-production-mongodb-uri"
   ```

### Mobile App Deployment

1. **Update API URL** in `src/config/auth0.ts`
2. **Build for iOS**:
   ```bash
   eas build --platform ios
   ```
3. **Build for Android**:
   ```bash
   eas build --platform android
   ```
4. **Submit to App Stores**:
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

## 🔧 Development

### Project Structure

```
spent/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── types/          # TypeScript types
│   │   └── server.ts       # Express server
│   ├── docker-compose.yml  # Docker configuration
│   ├── Dockerfile          # Backend container
│   └── package.json
├── src/                    # React Native app
│   ├── components/         # Reusable components
│   ├── config/            # App configuration
│   ├── navigation/        # Navigation setup
│   ├── screens/           # App screens
│   ├── services/          # API services
│   ├── store/             # Redux store
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── App.tsx                # App entry point
├── app.json              # Expo configuration
└── package.json
```

### Available Scripts

**Backend:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services

**Mobile App:**
- `npx expo start` - Start Expo development server
- `npx expo start --ios` - Start on iOS simulator
- `npx expo start --android` - Start on Android emulator
- `npx expo start --web` - Start web version

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure Docker is running: `docker ps`
- Check MongoDB logs: `docker-compose logs mongodb`
- Verify connection string in `.env`

### Auth0 Authentication Issues
- Verify callback URLs in Auth0 dashboard
- Check that `scheme` in `app.json` matches Auth0 config
- Ensure API audience matches in both frontend and backend

### API Connection Issues (Mobile)
- **iOS Simulator**: Use `http://localhost:3000`
- **Android Emulator**: Use `http://10.0.2.2:3000`
- **Physical Device**: Use your computer's IP address (e.g., `http://192.168.1.100:3000`)
- Ensure backend is running and accessible

### Expo Issues
- Clear cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Update Expo: `npm install expo@latest`

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using React Native, Node.js, MongoDB, and Auth0
