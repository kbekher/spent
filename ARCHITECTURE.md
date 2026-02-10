# 🏗️ Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE APP                               │
│                     (React Native + Expo)                        │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Screens    │  │  Navigation  │  │  Components  │          │
│  │              │  │              │  │              │          │
│  │ - Login      │  │ - Stack Nav  │  │ - Category   │          │
│  │ - Overview   │  │ - Tab Nav    │  │ - Expense    │          │
│  │ - Add        │  │              │  │ - Stats      │          │
│  │ - Categories │  │              │  │              │          │
│  │ - Account    │  │              │  │              │          │
│  └──────┬───────┘  └──────────────┘  └──────────────┘          │
│         │                                                        │
│  ┌──────▼─────────────────────────────────────────────┐         │
│  │           Redux Store (State Management)           │         │
│  │                                                     │         │
│  │  - authSlice          - expensesSlice              │         │
│  │  - categoriesSlice    - recurringPaymentsSlice     │         │
│  └──────┬──────────────────────────────────────────┬──┘         │
│         │                                           │            │
│  ┌──────▼──────────┐                    ┌──────────▼──────────┐ │
│  │  Auth0 Helper   │                    │    API Service      │ │
│  │  (expo-auth)    │                    │     (axios)         │ │
│  └──────┬──────────┘                    └──────────┬──────────┘ │
└─────────┼─────────────────────────────────────────┼────────────┘
          │                                          │
          │ OAuth 2.0                                │ REST API
          │ + JWT                                    │ + JWT Bearer
          │                                          │
┌─────────▼──────────┐                    ┌──────────▼──────────┐
│                    │                    │                     │
│   Auth0 Service    │                    │   Backend API       │
│   (auth0.com)      │                    │   (Node.js/Express) │
│                    │                    │                     │
│ - User Auth        │                    │  ┌───────────────┐  │
│ - JWT Tokens       │                    │  │   Routes      │  │
│ - User Profile     │◄───────────────────┤  │               │  │
│                    │   JWT Verification │  │ - Users       │  │
└────────────────────┘                    │  │ - Categories  │  │
                                          │  │ - Expenses    │  │
                                          │  │ - Recurring   │  │
                                          │  └───────┬───────┘  │
                                          │          │          │
                                          │  ┌───────▼───────┐  │
                                          │  │  Middleware   │  │
                                          │  │               │  │
                                          │  │ - Auth JWT    │  │
                                          │  │ - CORS        │  │
                                          │  │ - Error       │  │
                                          │  └───────┬───────┘  │
                                          │          │          │
                                          │  ┌───────▼───────┐  │
                                          │  │    Models     │  │
                                          │  │  (Mongoose)   │  │
                                          │  │               │  │
                                          │  │ - User        │  │
                                          │  │ - Category    │  │
                                          │  │ - Expense     │  │
                                          │  │ - Recurring   │  │
                                          │  └───────┬───────┘  │
                                          └──────────┼──────────┘
                                                     │
                                                     │ MongoDB Driver
                                                     │
                                          ┌──────────▼──────────┐
                                          │                     │
                                          │   MongoDB Database  │
                                          │   (Docker Container)│
                                          │                     │
                                          │  Collections:       │
                                          │  - users            │
                                          │  - categories       │
                                          │  - expenses         │
                                          │  - recurringpayments│
                                          │                     │
                                          └─────────────────────┘
```

## Data Flow

### 1. User Authentication Flow

```
User → Login Screen → Auth0 Login → Auth0 Returns Token
                                           ↓
                        Store Token in SecureStore
                                           ↓
                        Sync User with Backend API
                                           ↓
                        Backend Creates/Updates User in MongoDB
                                           ↓
                        Return User Data to App
                                           ↓
                        Store in Redux → Navigate to Overview
```

### 2. Add Expense Flow

```
User → Add Expense Screen → Enter Amount & Category
                                      ↓
                        Dispatch addExpense Action
                                      ↓
                        API Call with JWT Token
                                      ↓
                        Backend Validates JWT
                                      ↓
                        Save to MongoDB
                                      ↓
                        Return Saved Expense
                                      ↓
                        Update Redux Store
                                      ↓
                        UI Updates Automatically
```

### 3. View Statistics Flow

```
User → Overview Screen → Dispatch fetchExpenseStats
                                      ↓
                        API Call: GET /expenses/stats/user/:userId
                                      ↓
                        Backend Queries MongoDB
                                      ↓
                        Aggregate by Category
                                      ↓
                        Return Statistics
                                      ↓
                        Update Redux Store
                                      ↓
                        Render Charts & Totals
```

## Technology Stack

### Frontend (Mobile)
- **Framework**: React Native 0.76
- **Platform**: Expo SDK 52
- **Language**: TypeScript
- **State**: Redux Toolkit
- **Navigation**: React Navigation v7
- **Auth**: expo-auth-session + Auth0
- **Storage**: expo-secure-store
- **HTTP**: Axios

### Backend (API)
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB 8.0
- **ODM**: Mongoose
- **Auth**: express-jwt + jwks-rsa
- **Security**: Helmet, CORS
- **Logging**: Morgan

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database**: MongoDB (Docker image)
- **Deployment**: Google Cloud Run (recommended)
- **CI/CD**: GitHub Actions (optional)

## Security

### Authentication
- OAuth 2.0 with PKCE flow
- JWT tokens with RS256 signing
- Secure token storage (expo-secure-store)
- Token validation on every API request

### API Security
- CORS protection
- Helmet security headers
- JWT verification middleware
- Input validation
- Rate limiting (recommended for production)

### Database Security
- MongoDB authentication
- Network isolation (Docker network)
- Indexed queries for performance
- Data validation with Mongoose schemas

## Deployment Architecture (Production)

```
┌─────────────────┐
│   Mobile App    │
│   (iOS/Android) │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│   Auth0 CDN     │
│  (auth0.com)    │
└─────────────────┘
         │
         ▼
┌─────────────────┐       ┌──────────────────┐
│  Google Cloud   │       │  MongoDB Atlas   │
│    Cloud Run    │◄──────┤  (Managed DB)    │
│  (Backend API)  │       │                  │
└─────────────────┘       └──────────────────┘
         │
         ▼
┌─────────────────┐
│   Cloud CDN     │
│  (Static Assets)│
└─────────────────┘
```

## Scalability Considerations

### Current Setup (Development)
- Single backend instance
- Local MongoDB
- Good for: Development, testing, small user base

### Production Recommendations
1. **Backend**: Deploy to Cloud Run (auto-scales)
2. **Database**: Use MongoDB Atlas (managed, replicated)
3. **CDN**: CloudFlare for static assets
4. **Monitoring**: Google Cloud Monitoring
5. **Logging**: Cloud Logging
6. **Caching**: Redis for session/data caching

## Performance Optimizations

### Mobile App
- Redux state persistence
- Lazy loading of screens
- Image optimization
- Memoized components
- Efficient list rendering (FlatList)

### Backend
- Database indexes on frequently queried fields
- Connection pooling
- Gzip compression
- Response caching
- Query optimization

### Database
- Compound indexes for complex queries
- Aggregation pipelines for statistics
- TTL indexes for temporary data
- Sharding for large datasets (future)

## Monitoring & Observability

### Recommended Tools
- **Application**: Sentry for error tracking
- **API**: Google Cloud Monitoring
- **Database**: MongoDB Atlas monitoring
- **Logs**: Cloud Logging or ELK stack
- **Analytics**: Mixpanel or Amplitude

## Future Enhancements

### Features
- [ ] Budget tracking and alerts
- [ ] Data export (CSV, PDF)
- [ ] Multi-currency support
- [ ] Receipt photo upload
- [ ] Expense sharing (split bills)
- [ ] Reports and insights
- [ ] Offline mode with sync

### Technical
- [ ] GraphQL API option
- [ ] WebSocket for real-time updates
- [ ] Push notifications
- [ ] Biometric authentication
- [ ] End-to-end encryption
- [ ] Multi-region deployment
- [ ] Automated testing (Jest, Detox)

---

For implementation details, see the source code and inline documentation.
