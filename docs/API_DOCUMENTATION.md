# Todo Elephant API Documentation

## Authentication
- **POST /api/auth/login**: Authenticate user with email/password
- **POST /api/auth/register**: Create new user account
- **POST /api/auth/refresh**: Generate new access token

## Content Calendar
- **GET /api/elephant/calendar**: List all events and themes
- **POST /api/elephant/calendar**: Create new event
- **PUT /api/elephant/calendar/:id**: Update event
- **DELETE /api/elephant/calendar/:id**: Delete event

## Marketplace Integration
- **POST /api/elephant/marketplace/scan**: Scan Amazon/Etsy products
- **GET /api/elephant/marketplace/:id**: Get product details
- **POST /api/elephant/marketplace/recommend**: AI-powered product recommendations

## VR/3D Features
- **GET /api/elephant/vr/models**: List available 3D models
- **POST /api/elephant/vr/place**: Place object in virtual scene

## Analytics
- **GET /api/elephant/analytics/revenue**: Get revenue forecast
- **GET /elephant/analytics/sustainability**: Environmental impact report

## Security
- **GET /api/health**: System health check
- **GET /api/security/headers**: View applied security headers

## Rate Limiting
- 100 requests/minute per IP
- Exceeds triggers 429 response