# Todo Elephant - Comprehensive Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Setup & Installation](#setup--installation)
4. [Database Models](#database-models)
5. [API Endpoints](#api-endpoints)
6. [Security Features](#security-features)
7. [Components](#components)
8. [Monitoring & Logging](#monitoring--logging)
9. [Deployment](#deployment)
10. [Testing](#testing)

## Project Overview
Todo Elephant is an advanced task planning application enhanced with Elephant-themed features including marketplace integration, content calendar, AI-powered recommendations, and virtual staging capabilities.

## Architecture
- **Frontend**: Next.js 16.2.3 with React 19.2.4
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **State Management**: React Context & Custom Hooks
- **Styling**: Tailwind CSS v4 + MUI
- **Authentication**: JWT-based with refresh tokens
- **Real-time Features**: WebSocket support (via Socket.io planned)
- **Microservices**: Modular API routes for each feature

## Setup & Installation
1. Clone repository: `git clone https://github.com/lassestilvang/todo-elephant.git`
2. Install dependencies: `npm install`
3. Configure environment variables (see `.env.example`)
4. Start development server: `npm run dev`
5. Build for production: `npm run build && npm start`

### Environment Variables
```env
# Next.js
NEXT_PUBLIC_APP_NAME=TodoElephant
NEXT_PUBLIC_API_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/todo-elephant?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_strong_jwt_secret_here
ACCESS_TOKEN_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# Marketplace APIs
ETSY_API_KEY=your_etsy_api_key
ETSY_APP_KEY=your_etsy_app_key
AMAZON_API_KEY=your_amazon_api_key
AMAZON_ACCESS_TOKEN=your_amazon_access_token

# Security
NODE_ENV=development
DISABLE_TELEMETRY=true

# Monitoring
LOG_LEVEL=info
ENABLE_RATE_LIMITING=true
```

## Database Models

### User Model
```javascript
{
  _id: ObjectId,
  email: String (required, unique),
  passwordHash: String (required),
  name: String (required),
  role: Enum['admin', 'user', 'premium'] (default: 'user'),
  isVerified: Boolean (default: false),
  preferredThemes: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### ElephantProperty Model
```javascript
{
  _id: ObjectId,
  externalId: String (required, unique),
  externalSource: Enum['amazon', 'etsy', 'custom'] (required),
  listingUrl: String (required),
  title: String (required),
  description: String,
  price: Number (required),
  currency: String (default: 'USD'),
  thumbnailImage: String,
  dimensions: {
    depth: Number,
    height: Number,
    width: Number
  },
  styleTags: [String],
  colorPalettes: [String],
  inventoryCount: Number (default: 0),
  isAvailable: Boolean (default: true),
  userId: ObjectId (ref: User),
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Authentication
- POST `/api/auth/login` - Authenticate user
- POST `/api/auth/register` - Register new user
- POST `/api/auth/refresh` - Refresh access token
- POST `/api/auth/logout` - Logout user

### Content Calendar
- GET `/api/elephant/calendar` - Get all events and themes
- POST `/api/elephant/calendar` - Create new event
- PUT `/api/elephant/calendar/:id` - Update event
- DELETE `/api/elephant/calendar/:id` - Delete event

### Marketplace
- GET `/api/elephant/marketplace/scan` - Scan products from Amazon/Etsy
- GET `/api/elephant/marketplace/sync` - Sync products to database
- GET `/api/elephant/marketplace/:id` - Get product details
- POST `/api/elephant/marketplace/recommend` - Get AI-powered recommendations

### Recommendations
- GET `/api/elephant/recommendations` - Get personalized recommendations
- POST `/api/elephant/recommendations/generate` - Generate recommendations based on preferences

### Analytics
- GET `/api/elephant/analytics/revenue` - Get revenue forecast
- GET `/api/elephant/analytics/trends` - Get market trends
- GET `/api/elephant/analytics/sustainability` - Get sustainability metrics

### Security
- GET `/api/health` - Health check endpoint
- GET `/api/security/headers` - Get applied security headers

## Components

### UI Components
- `ContentCalendar` - Interactive calendar for scheduling
- `MarketplaceScanner` - Real-time marketplace product scanner
- `VirtualStagingStudio` - AR/VR product visualization
- `RevenueForecast` - Predictive analytics dashboard
- `CalendarView` - Task calendar integration
- `ErrorBoundary` - Global error handling

### Service Components
- `Logger` - Centralized logging system
- `Monitoring` - Performance and error monitoring
- `AuthUtils` - JWT token generation and validation
- `Orchestrator` - Workflow management system

## Security Features
1. **Authentication**: JWT-based with access (24h) and refresh (7d) tokens
2. **Authorization**: Role-based access control (RBAC)
3. **Rate Limiting**: 100 requests per 15 minutes per IP
4. **Security Headers**:
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Strict-Transport-Security: max-age=31536000; includeSubDomains
   - Referrer-Policy: strict-origin-when-cross-origin
   - Content-Security-Policy: default-src 'self'
5. **Input Validation**: All API endpoints validate input parameters
6. **Error Handling**: Centralized error logging without exposing sensitive data
7. **Password Security**: bcrypt hashing with minimum 12-character requirement

## Monitoring & Logging
- **Structured Logging**: Winston logger with JSON format
- **Log Levels**: debug, info, warn, error
- **Performance Monitoring**: Tracks API response times
- **Error Tracking**: Captures and logs all unhandled exceptions
- **Rate Limit Monitoring**: Logs when limits are approached/exceeded
- **Health Checks**: Regular endpoint health verification
- **Log Rotation**: Automatic log file rotation (max 5 files, 20MB each)

## Deployment
### Vercel Deployment
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`
4. Configure environment variables in Vercel dashboard

### Docker Deployment
```bash
# Build image
docker build -t todo-elephant .

# Run container
docker run -p 3000:3000 \
  -e MONGODB_URI=$MONGODB_URI \
  -e JWT_SECRET=$JWT_SECRET \
  -e ETSY_API_KEY=$ETSY_API_KEY \
  -e ETSY_APP_KEY=$ETSY_APP_KEY \
  -e AMAZON_API_KEY=$AMAZON_API_KEY \
  -e AMAZON_ACCESS_TOKEN=$AMAZON_ACCESS_TOKEN \
  todo-elephant
```

### Kubernetes Deployment
Manifests available in `k8s/` directory.

## Testing
### Unit Tests
- Run all tests: `npm test`
- Watch mode: `npm run test:watch`
- Coverage report: `npm run test:coverage`

### Test Structure
- `/tests` - End-to-end and integration tests
- `/src/lib/*.test.ts` - Utility function tests
- `/src/components/*.test.tsx` - Component tests
- `/app/api/*/route.test.ts` - API route tests

### Key Test Files
- `tests/recurrence/recurrence.test.ts` - Recurrence logic tests
- `src/lib/tasksApi.test.ts` - Task API tests
- `src/components/ErrorBoundary.test.tsx` - Error boundary tests
- `src/lib/status.test.ts` - Task status utilities

### Testing Tools
- Vitest for unit testing
- React Testing Library for component testing
- Supertest for API testing
- MongoDB Memory Server for in-memory database testing

## Feature Roadmap
1. [ ] Real-time collaboration with WebSockets
2. [ ] Advanced AI recommendations using LLMs
3. [ ] Mobile app (React Native)
4. [ ] Integration with smart home devices
5. [ ] Blockchain-based reward system
6. [ ] AR shopping experience integration
7. [ ] Advanced analytics dashboard
8. [ ] Multi-language support (i18n)
9. [ ] Offline functionality with PWA
10. [ ] Voice command integration

## Contributing
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open pull request

## License
MIT License - see `LICENSE` file for details.

## Contact
Lasse Stilvang - lassestilvang@example.com
Project Link: https://github.com/lassestilvang/todo-elephant