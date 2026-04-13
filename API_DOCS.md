# API Documentation

## 📡 RESTful API Overview

This document provides detailed API specifications for the Daily Task Planner application.

## 🎯 Base Information

- **Base URL**: `http://localhost:3000/api` (development)
- **Content-Type**: `application/json`
- **Accept**: `application/json`

## 🔐 Authentication

The application uses environment-based authentication with Supabase. Configure the following environment variables:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 📊 Task API Endpoints

### 1. Get All Tasks

**Endpoint:** `GET /api/tasks`

**Description:** Retrieve all tasks from the database

**Query Parameters:**
- None

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "Complete documentation",
    "description": "Write comprehensive project documentation",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "priority": "high",
    "status": "pending",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  },
  {
    "id": 2,
    "title": "Team meeting",
    "description": "Weekly team sync",
    "dueDate": "2024-01-15T14:00:00.000Z",
    "priority": "medium",
    "status": "in-progress",
    "createdAt": "2024-01-10T09:30:00.000Z",
    "updatedAt": "2024-01-12T16:45:00.000Z"
  }
]
```

**Error Responses:**
- `500 Internal Server Error`: Server-side error

### 2. Create Task

**Endpoint:** `POST /api/tasks`

**Description:** Create a new task

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description (optional)",
  "dueDate": "2024-12-31T23:59:59.000Z",
  "priority": "high",
  "status": "pending"
}
```

**Request Fields:**
- `title` (string, required): Task title
- `description` (string, optional): Task description
- `dueDate` (string, optional): ISO 8601 date format
- `priority` (string, optional): `low`, `medium`, or `high`
- `status` (string, optional): `pending`, `in-progress`, or `completed`

**Response (201):**
```json
{
  "id": 1,
  "title": "New Task",
  "description": "Task description",
  "dueDate": "2024-12-31T23:59:59.000Z",
  "priority": "high",
  "status": "pending",
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-01T10:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request body
- `500 Internal Server Error`: Server-side error

### 3. Update Task

**Endpoint:** `PUT /api/tasks`

**Description:** Update an existing task

**Request Body:**
```json
{
  "id": 1,
  "title": "Updated Task Title",
  "description": "Updated description",
  "priority": "medium",
  "status": "in-progress"
}
```

**Request Fields:**
- `id` (number, required): Task ID
- `title` (string, optional): Updated task title
- `description` (string, optional): Updated description
- `priority` (string, optional): Updated priority level
- `status` (string, optional): Updated status

**Response (200):**
```json
{
  "id": 1,
  "title": "Updated Task Title",
  "description": "Updated description",
  "dueDate": "2024-12-31T23:59:59.000Z",
  "priority": "medium",
  "status": "in-progress",
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-02T12:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found`: Task not found
- `400 Bad Request`: Invalid request body
- `500 Internal Server Error`: Server-side error

### 4. Delete Task

**Endpoint:** `DELETE /api/tasks?id={id}`

**Description:** Delete a task by ID

**Query Parameters:**
- `id` (number, required): Task ID

**Response (204):**
No content returned

**Error Responses:**
- `400 Bad Request`: ID parameter is required
- `404 Not Found`: Task not found
- `500 Internal Server Error`: Server-side error

## 👥 User API Endpoints

### 1. Get All Users

**Endpoint:** `GET /api/users`

**Description:** Retrieve all users from the database

**Query Parameters:**
- None

**Response (200):**
```json
{
  "users": [],
  "currentUser": null
}
```

**Error Responses:**
- `500 Internal Server Error`: Server-side error

### 2. Create User

**Endpoint:** `POST /api/users`

**Description:** Create a new user

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Request Fields:**
- `name` (string, required): User name
- `email` (string, required): User email address

**Response (201):**
```json
{
  "id": 123456789,
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-01T10:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request body
- `500 Internal Server Error`: Server-side error

## 📝 Request/Response Examples

### Example: Complete Task Management Flow

**1. Create a task:**
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn TypeScript",
    "description": "Complete TypeScript tutorial",
    "priority": "high"
  }'
```

**2. Get all tasks:**
```bash
curl http://localhost:3000/api/tasks
```

**3. Update a task:**
```bash
curl -X PUT http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "status": "completed",
    "priority": "low"
  }'
```

**4. Delete a task:**
```bash
curl -X DELETE "http://localhost:3000/api/tasks?id=1"
```

## ⚙️ Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200 OK`: Successful GET request
- `201 Created`: Successful POST request
- `204 No Content`: Successful DELETE request
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

## 🔧 Rate Limiting

The API includes basic rate limiting to prevent abuse. Current limits:
- **100 requests per minute** per client IP
- **1000 requests per hour** per client IP

## 📈 Performance Guidelines

- Keep response payloads under 1MB
- Use pagination for large datasets (future implementation)
- Implement caching headers for GET requests
- Use connection pooling for database connections

## 🔄 API Versioning

The API follows semantic versioning:
- URL path includes version: `/api/v1/tasks`
- Breaking changes will increment major version
- Backward-compatible changes in minor versions

---

**Last Updated**: 2026-04-13  
**Version**: 1.0.0  
**Status**: Active