# Zimora API — Frontend Developer Guide

**Last Updated:** April 2026  
**API Version:** v1  
**Framework:** Django 5.2 REST Framework  
**Live Docs:** `https://api.sanganai.co.zw/api/v1/docs/` (Swagger UI)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Base URL & Versioning](#base-url--versioning)
4. [All Endpoints](#all-endpoints)
5. [Data Models & Types](#data-models--types)
6. [Pagination & Filtering](#pagination--filtering)
7. [Error Handling](#error-handling)
8. [WebSocket Chat](#websocket-chat)
9. [Rate Limiting](#rate-limiting)
10. [Constants & Enums](#constants--enums)
11. [Code Examples](#code-examples)

---

## Quick Start

### Setup

1. **Install dependencies:**
   ```bash
   npm install axios  # or fetch / your HTTP client
   ```

2. **Set environment variables:**
   ```env
   REACT_APP_API_URL=http://localhost:8000  # dev
   REACT_APP_API_URL=https://api.sanganai.co.zw  # prod
   ```

3. **Create API client:**
   ```javascript
   // api.js
   import axios from 'axios';
   
   const api = axios.create({
     baseURL: process.env.REACT_APP_API_URL,
     timeout: 10000,
   });
   
   // Inject JWT token on all requests
   api.interceptors.request.use((config) => {
     const token = localStorage.getItem('access_token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   
   // Handle 401 → refresh token
   api.interceptors.response.use(
     (response) => response,
     async (error) => {
       const original = error.config;
       if (error.response?.status === 401 && !original._retry) {
         original._retry = true;
         try {
           const refresh = localStorage.getItem('refresh_token');
           const { data } = await api.post('/api/v1/auth/token/refresh/', { refresh });
           localStorage.setItem('access_token', data.access);
           original.headers.Authorization = `Bearer ${data.access}`;
           return api(original);
         } catch (err) {
           // Redirect to login
           window.location.href = '/login';
           return Promise.reject(err);
         }
       }
       return Promise.reject(error);
     }
   );
   
   export default api;
   ```

---

## Authentication

### JWT Flow

Zimora uses **JWT Bearer tokens** with the following lifecycle:

| Token | Lifetime | Purpose |
|-------|----------|---------|
| **access** | 15 minutes | All API requests |
| **refresh** | 7 days | Obtain new access token |

### 1. Register

**Endpoint:** `POST /api/v1/auth/register/`

**Request:**
```json
{
  "email": "alice@example.com",
  "username": "alice",
  "password": "SecurePass123!",
  "confirm_password": "SecurePass123!",
  "role": "BUYER",  // or "SELLER"
  "phone": "+263771234567",
  "first_name": "Alice",
  "last_name": "Smith"
}
```

**Response (201):**
```json
{
  "id": 1,
  "email": "alice@example.com",
  "username": "alice",
  "first_name": "Alice",
  "last_name": "Smith",
  "phone": "+263771234567",
  "role": "BUYER",
  "profile_picture": null,
  "bio": "",
  "location": "",
  "phone_verified": false,
  "email_verified": false,
  "is_verified": false,
  "is_active": true,
  "created_at": "2026-04-20T10:00:00Z",
  "updated_at": "2026-04-20T10:00:00Z"
}
```

**Note:** After registration, **OTP emails/SMS are sent in the background**. User should verify phone and email.

### 2. Login

**Endpoint:** `POST /api/v1/auth/login/`

**Request:**
```json
{
  "email": "alice@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "user": {
    "id": 1,
    "email": "alice@example.com",
    "username": "alice",
    "first_name": "Alice",
    "last_name": "Smith",
    "phone": "+263771234567",
    "role": "BUYER",
    "profile_picture": null,
    "bio": "",
    "location": "",
    "phone_verified": false,
    "email_verified": false,
    "is_verified": false,
    "is_active": true,
    "created_at": "2026-04-20T10:00:00Z",
    "updated_at": "2026-04-20T10:00:00Z"
  }
}
```

**Store in localStorage:**
```javascript
localStorage.setItem('access_token', data.tokens.access);
localStorage.setItem('refresh_token', data.tokens.refresh);
localStorage.setItem('user', JSON.stringify(data.user));
```

### 3. Refresh Token

**Endpoint:** `POST /api/v1/auth/token/refresh/`

**Request:**
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Logout

**Endpoint:** `POST /api/v1/auth/logout/`

**Request:**
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "message": "Successfully logged out."
}
```

**Then clear localStorage:**
```javascript
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
localStorage.removeItem('user');
```

### 5. Get Current Profile

**Endpoint:** `GET /api/v1/auth/profile/`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "email": "alice@example.com",
  "username": "alice",
  "first_name": "Alice",
  "last_name": "Smith",
  "phone": "+263771234567",
  "role": "BUYER",
  "profile_picture": "https://...",
  "bio": "I love buying and selling goods",
  "location": "HARARE",
  "phone_verified": true,
  "email_verified": true,
  "is_verified": true,
  "is_active": true,
  "created_at": "2026-04-20T10:00:00Z",
  "updated_at": "2026-04-20T12:30:00Z"
}
```

### 6. Update Profile

**Endpoint:** `PATCH /api/v1/auth/profile/`

**Request (fields are optional):**
```json
{
  "first_name": "Alice",
  "last_name": "Smith",
  "phone": "+263771234567",
  "bio": "New bio",
  "location": "BULAWAYO",
  "profile_picture": <multipart image file>
}
```

**Response (200):** Updated profile object

### Phone/Email OTP Verification

#### Send Phone OTP
**Endpoint:** `POST /api/v1/auth/phone/send-otp/`  
**Response:** `{"message": "OTP sent to phone"}`

#### Verify Phone OTP
**Endpoint:** `POST /api/v1/auth/phone/verify/`  
**Request:** `{"otp": "123456"}`  
**Response:** `{"message": "Phone verified"}` + *phone_verified flag updated to true*

#### Send Email OTP
**Endpoint:** `POST /api/v1/auth/email/send-otp/`  
**Response:** `{"message": "OTP sent to email"}`

#### Verify Email OTP
**Endpoint:** `POST /api/v1/auth/email/verify/`  
**Request:** `{"otp": "123456"}`  
**Response:** `{"message": "Email verified"}` + *email_verified flag updated to true*

---

## Base URL & Versioning

**Development:**
```
http://localhost:8000/api/v1/
```

**Production:**
```
https://api.sanganai.co.zw/api/v1/
```

**Legacy /api/ routes** return a **301 redirect** to `/api/v1/` with a `Deprecation` header.

**API Root endpoint:**
```
GET /api/v1/
```

Returns:
```json
{
  "name": "Sanganai API",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/v1/auth/",
    "categories": "/api/v1/categories/",
    "listings": "/api/v1/listings/",
    "inbox": "/api/v1/inbox/",
    "admin_panel": "/api/v1/admin/",
    "docs": "/api/v1/docs/",
    "redoc": "/api/v1/redoc/",
    "schema": "/api/v1/schema/",
    "websocket_chat": "ws://host/ws/chat/{conversation_id}/?token=JWT"
  }
}
```

---

## All Endpoints

### Categories

#### List Categories (Flat)
```
GET /api/v1/categories/
```
**Response:**
```json
{
  "count": 10,
  "next": "?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Electronics",
      "slug": "electronics",
      "description": "All things electronic",
      "parent": null,
      "icon": "📱",
      "image": "https://...",
      "is_active": true,
      "display_order": 0,
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-01-15T10:00:00Z"
    },
    ...
  ]
}
```

#### List Categories (Tree)
```
GET /api/v1/categories/tree/
```
**Response:**
```json
{
  "id": 1,
  "name": "Electronics",
  "slug": "electronics",
  "description": "...",
  "icon": "📱",
  "image": "https://...",
  "is_active": true,
  "display_order": 0,
  "children": [
    {
      "id": 5,
      "name": "Mobile Phones",
      "slug": "mobile-phones",
      "description": "...",
      "icon": "📞",
      "image": "https://...",
      "is_active": true,
      "display_order": 0,
      "children": []
    },
    ...
  ]
}
```

#### Get Category Detail
```
GET /api/v1/categories/{id}/
```

---

### Listings

#### List Active Listings (Public)
```
GET /api/v1/listings/
```

**Query Parameters:**
| Param | Type | Example |
|-------|------|---------|
| `page` | int | `?page=1` |
| `page_size` | int | `?page_size=20` (max 100) |
| `category` | slug | `?category=electronics` |
| `location` | code | `?location=HARARE` |
| `min_price` | decimal | `?min_price=100.00` |
| `max_price` | decimal | `?max_price=50000.00` |
| `condition` | enum | `?condition=NEW` |
| `search` | string | `?search=phone` (full-text search) |
| `featured` | bool | `?featured=true` |
| `ordering` | string | `?ordering=created_at,-price,views_count` |

**Response:**
```json
{
  "count": 250,
  "next": "?page=2",
  "previous": null,
  "results": [
    {
      "id": 15,
      "title": "iPhone 13 Pro",
      "slug": "iphone-13-pro",
      "price": "5000.00",
      "currency": "USD",
      "condition": "LIKE_NEW",
      "status": "ACTIVE",
      "location": "HARARE",
      "category": {
        "name": "Mobile Phones",
        "slug": "mobile-phones"
      },
      "owner": {
        "username": "john_seller"
      },
      "primary_image": "https://...",
      "is_featured": true,
      "views_count": 145,
      "created_at": "2026-04-15T10:00:00Z"
    },
    ...
  ]
}
```

#### Get Listing Detail
```
GET /api/v1/listings/{listing_id}/
```

**Response:**
```json
{
  "id": 15,
  "title": "iPhone 13 Pro",
  "slug": "iphone-13-pro",
  "description": "Pristine condition, no scratches...",
  "price": "5000.00",
  "currency": "USD",
  "condition": "LIKE_NEW",
  "status": "ACTIVE",
  "location": "HARARE",
  "category": {
    "name": "Mobile Phones",
    "slug": "mobile-phones"
  },
  "owner": {
    "id": 5,
    "username": "john_seller",
    "profile_picture": "https://...",
    "created_at": "2026-01-10T10:00:00Z"
  },
  "images": [
    {
      "id": 42,
      "image": "https://...",
      "caption": "Front view",
      "display_order": 0,
      "is_primary": true
    },
    {
      "id": 43,
      "image": "https://...",
      "caption": "Back view",
      "display_order": 1,
      "is_primary": false
    }
  ],
  "is_featured": true,
  "views_count": 145,
  "created_at": "2026-04-15T10:00:00Z",
  "updated_at": "2026-04-15T10:30:00Z",
  "published_at": "2026-04-15T10:05:00Z"
}
```

**Note:** Each GET to detail endpoint **increments views_count** by 1.

#### Create Listing (SELLER/ADMIN only)
```
POST /api/v1/listings/
```

**Request:**
```json
{
  "title": "iPhone 13 Pro",
  "description": "Pristine condition, no scratches...",
  "price": "5000.00",
  "currency": "USD",
  "condition": "LIKE_NEW",
  "category_id": 5,
  "location": "HARARE"
}
```

**Response (201):** Listing detail object (status: DRAFT, published_at: null)

#### Update Listing (Owner/ADMIN only)
```
PATCH /api/v1/listings/{listing_id}/
```

**Request (all fields optional):**
```json
{
  "title": "...",
  "description": "...",
  "price": "...",
  "currency": "...",
  "condition": "...",
  "category_id": "...",
  "location": "..."
}
```

#### Publish Listing (Move from DRAFT → ACTIVE)
```
POST /api/v1/listings/{listing_id}/publish/
```

**Response (200):** `{"message": "Listing published"}`

#### Upload Listing Images
```
POST /api/v1/listings/{listing_id}/images/
```

**Request (multipart/form-data):**
```
images: [<file1>, <file2>, ..., <file10>]  // 1-10 images max
```

**Response (201):**
```json
{
  "images": [
    {
      "id": 42,
      "image": "https://...",
      "caption": "",
      "display_order": 0,
      "is_primary": true
    },
    ...
  ]
}
```

#### Delete Image
```
DELETE /api/v1/listings/images/{image_id}/
```

**Response (204):** No content

#### Get My Listings
```
GET /api/v1/listings/my-listings/
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:** Same as listing list (pagination, filtering, etc.)

**Response:** Same as listings list, but filtered to current user's listings

---

### Inbox (Messaging)

#### List Conversations
```
GET /api/v1/inbox/
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "participants": [
        {
          "id": 3,
          "username": "alice",
          "profile_picture": "https://..."
        },
        {
          "id": 5,
          "username": "bob",
          "profile_picture": "https://..."
        }
      ],
      "listing": {
        "id": 15,
        "title": "iPhone 13 Pro",
        "primary_image": "https://..."
      },
      "last_message": {
        "id": 42,
        "sender": {
          "id": 5,
          "username": "bob",
          "profile_picture": "https://..."
        },
        "content": "Is this still available?",
        "is_read": false,
        "created_at": "2026-04-20T14:30:00Z"
      },
      "unread_count": 1,
      "updated_at": "2026-04-20T14:30:00Z"
    },
    ...
  ]
}
```

#### Create/Start Conversation
```
POST /api/v1/inbox/
```

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "participant_id": 5,
  "listing_id": 15
}
```

**Response (201):** Conversation detail object

#### Get Conversation Detail
```
GET /api/v1/inbox/{conversation_id}/
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "participants": [...],
  "listing": {...},
  "last_message": {...},
  "unread_count": 1,
  "updated_at": "2026-04-20T14:30:00Z",
  "messages": [
    {
      "id": 40,
      "sender": {
        "id": 3,
        "username": "alice",
        "profile_picture": "https://..."
      },
      "content": "Hey, is the iPhone still available?",
      "is_read": true,
      "created_at": "2026-04-20T13:00:00Z"
    },
    {
      "id": 41,
      "sender": {
        "id": 5,
        "username": "bob",
        "profile_picture": "https://..."
      },
      "content": "Yes, it is!",
      "is_read": true,
      "created_at": "2026-04-20T13:15:00Z"
    },
    {
      "id": 42,
      "sender": {
        "id": 5,
        "username": "bob",
        "profile_picture": "https://..."
      },
      "content": "Is this still available?",
      "is_read": false,
      "created_at": "2026-04-20T14:30:00Z"
    }
  ]
}
```

#### Send Message
```
POST /api/v1/inbox/{conversation_id}/messages/
```

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "content": "What's the lowest price?"
}
```

**Response (201):**
```json
{
  "id": 43,
  "sender": {
    "id": 3,
    "username": "alice",
    "profile_picture": "https://..."
  },
  "content": "What's the lowest price?",
  "is_read": false,
  "created_at": "2026-04-20T15:00:00Z"
}
```

#### Mark Message as Read
```
POST /api/v1/inbox/messages/{message_id}/mark-read/
```

**Headers:** `Authorization: Bearer <token>`

**Response (200):** `{"message": "Message marked as read"}`

#### Get Unread Count
```
GET /api/v1/inbox/unread-count/
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "unread_count": 3
}
```

---

## Data Models & Types

### User Model

```javascript
{
  id: number,
  email: string,
  username: string,
  first_name: string,
  last_name: string,
  phone: string,
  role: "BUYER" | "SELLER" | "ADMIN" | "MODERATOR",
  profile_picture: string | null,  // image URL
  bio: string,
  location: ZimbabweCity,
  phone_verified: boolean,
  email_verified: boolean,
  is_verified: boolean,  // true if email_verified OR phone_verified
  is_active: boolean,
  created_at: string,  // ISO 8601 datetime
  updated_at: string   // ISO 8601 datetime
}
```

### Category Model

```javascript
{
  id: number,
  name: string,
  slug: string,
  description: string,
  parent: number | null,  // ID of parent category
  icon: string,  // emoji or icon name
  image: string | null,  // image URL
  is_active: boolean,
  display_order: number,  // for sorting
  created_at: string,
  updated_at: string,
  children?: Category[]  // nested (when using /tree/)
}
```

### Listing Model

```javascript
{
  id: number,
  title: string,
  slug: string,
  description: string,
  price: string,  // decimal "5000.00"
  currency: "USD" | "ZWL",
  condition: "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR",
  status: "DRAFT" | "ACTIVE" | "SOLD" | "ARCHIVED" | "REJECTED",
  location: ZimbabweCity,
  category: {
    name: string,
    slug: string
  },
  owner: {
    id: number,
    username: string,
    profile_picture: string | null,
    created_at: string  // (in detail view only)
  },
  images: ListingImage[],
  is_featured: boolean,
  views_count: number,
  rejection_reason: string | null,  // if status === REJECTED
  created_at: string,
  updated_at: string,
  published_at: string | null
}
```

### ListingImage Model

```javascript
{
  id: number,
  image: string,  // image URL
  caption: string,
  display_order: number,
  is_primary: boolean
}
```

### Conversation Model

```javascript
{
  id: number,
  participants: User[],  // always 2 users
  listing: {
    id: number,
    title: string,
    primary_image: string | null
  } | null,
  last_message: Message | null,
  unread_count: number,
  messages: Message[],  // (in detail view only)
  updated_at: string
}
```

### Message Model

```javascript
{
  id: number,
  sender: User,  // minimal user object
  content: string,
  is_read: boolean,
  created_at: string
}
```

---

## Pagination & Filtering

### Pagination

All list endpoints use **page-based pagination** with default page size of **20**.

**Query Parameters:**
```
?page=1           // Page number (default: 1)
?page_size=50     // Results per page (default: 20, max: 100)
```

**Response Format:**
```json
{
  "count": 250,           // total results
  "next": "?page=2",      // URL to next page (null if last)
  "previous": null,       // URL to previous page (null if first)
  "results": [...]        // array of objects
}
```

### Filtering

#### Listings Filters
```
?category=electronics         // category slug
?location=HARARE              // Zimbabwe city
?min_price=100.00
?max_price=50000.00
?condition=NEW                // NEW, LIKE_NEW, GOOD, FAIR, POOR
?featured=true                // featured listings only
?ordering=created_at          // or -created_at (desc), price, -price, views_count, -views_count
```

#### Full-Text Search
```
?search=iphone
```

**Search behavior:**
- Uses PostgreSQL `ts_vector` for full-text search across **title (weight A)**, **description (weight B)**, and **location (weight C)**
- Results ranked by relevance, then recency
- Falls back to **trigram similarity** (`pg_trgm`) on title if no full-text results (typo tolerance)

---

## Error Handling

All API errors return a **consistent error envelope:**

```json
{
  "error": {
    "code": "service_error",
    "message": "A user-friendly error message",
    "details": {
      "field_name": ["Specific validation error"]
    }
  }
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `service_error` | 400 | Business logic violation |
| `conflict` | 409 | Resource already exists |
| `unprocessable_entity` | 422 | Well-formed but can't be processed |
| `permission_denied` | 403 | Not authorized |
| `not_found` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

### Example Error Responses

#### Validation Error (400)
```json
{
  "error": {
    "code": "service_error",
    "message": "A user with this email already exists.",
    "details": {
      "email": ["A user with this email already exists."]
    }
  }
}
```

#### Not Found (404)
```json
{
  "error": {
    "code": "not_found",
    "message": "The requested resource was not found.",
    "details": {}
  }
}
```

#### Rate Limited (429)
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again in 3600 seconds.",
    "details": {
      "retry_after": 3600
    }
  }
}
```

#### Permission Denied (403)
```json
{
  "error": {
    "code": "permission_denied",
    "message": "You do not have permission to perform this action.",
    "details": {}
  }
}
```

---

## WebSocket Chat

### Connection

**Endpoint:**
```
ws://localhost:8000/ws/chat/{conversation_id}/?token=<JWT_ACCESS_TOKEN>
```

**Example:**
```javascript
const token = localStorage.getItem('access_token');
const conversationId = 1;

const ws = new WebSocket(
  `ws://localhost:8000/ws/chat/${conversationId}/?token=${token}`
);

ws.onopen = () => {
  console.log('Connected to chat');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Message received:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from chat');
};
```

### Message Types

#### Initial Connection → Server Sends History
**Type:** `history`

```json
{
  "type": "history",
  "messages": [
    {
      "id": 40,
      "sender": { "id": 3, "username": "alice", "profile_picture": "..." },
      "content": "Hey, is the iPhone still available?",
      "is_read": true,
      "created_at": "2026-04-20T13:00:00Z"
    },
    ...
  ]
}
```

#### New Message from Any Participant
**Type:** `chat_message`

```json
{
  "type": "chat_message",
  "message": {
    "id": 42,
    "sender": { "id": 5, "username": "bob", "profile_picture": "..." },
    "content": "Is this still available?",
    "is_read": false,
    "created_at": "2026-04-20T14:30:00Z"
  }
}
```

#### Sending a Message (Client → Server)
```json
{
  "type": "chat_message",
  "content": "What's your lowest price?"
}
```

#### Read Receipt
**Type:** `messages_read`

```json
{
  "type": "messages_read",
  "message_id": 42,
  "reader": "alice"
}
```

#### Marking Messages as Read (Client → Server)
```json
{
  "type": "mark_read",
  "message_id": 42
}
```

#### Error
**Type:** `error`

```json
{
  "type": "error",
  "message": "Authentication failed"
}
```

### WebSocket Best Practices

1. **Reconnection logic:** Implement exponential backoff retry (3s, 6s, 12s, 30s max)
2. **Pong handler:** Respond to server pings to keep connection alive
3. **Cleanup:** Close WebSocket when user leaves conversation or logs out
4. **Error handling:** Show user-friendly messages on connection failure

---

## Rate Limiting

The API enforces rate limits on sensitive endpoints to prevent abuse.

### Rate Limit Headers

Every response includes rate limit info:
```
X-RateLimit-Limit: 10          # requests allowed
X-RateLimit-Remaining: 8       # requests remaining
X-RateLimit-Reset: 1713607200  # unix timestamp when limit resets
```

### Limits by Endpoint

| Endpoint | Limit | Scope |
|----------|-------|-------|
| `POST /auth/register/` | 5/hour | IP address |
| `POST /auth/login/` | 10/hour | IP address |
| `POST /auth/*/send-otp/` | 3/hour | User |
| `POST /auth/*/verify/` | 10/hour | User (brute force protection) |
| `POST /listings/` | 20/day | User |
| `POST /listings/*/images/` | 30/day | User |
| `POST /inbox/*/messages/` | 60/hour | User |
| Any other endpoint | 120/minute | User |

### Handling Rate Limits

**Check headers on 429 response:**
```javascript
const retryAfter = response.headers['retry-after'];
// retryAfter is in seconds
setTimeout(() => retryRequest(), retryAfter * 1000);
```

---

## Constants & Enums

### User Roles

```javascript
UserRole = {
  BUYER: "BUYER",
  SELLER: "SELLER",
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR"
}
```

### Listing Status

```javascript
ListingStatus = {
  DRAFT: "DRAFT",           // Not yet public
  ACTIVE: "ACTIVE",         // Published and visible
  SOLD: "SOLD",             // Marked as sold
  ARCHIVED: "ARCHIVED",     // Manually archived
  REJECTED: "REJECTED"      // Rejected by moderator (rejection_reason filled)
}
```

### Listing Condition

```javascript
ListingCondition = {
  NEW: "NEW",
  LIKE_NEW: "LIKE_NEW",
  GOOD: "GOOD",
  FAIR: "FAIR",
  POOR: "POOR"
}
```

### Currency

```javascript
Currency = {
  USD: "USD",
  ZWL: "ZWL"
}
```

### Zimbabwe Cities

```javascript
ZimbabweCity = {
  // Major cities
  HARARE: "HARARE",
  BULAWAYO: "BULAWAYO",
  MUTARE: "MUTARE",
  GWERU: "GWERU",
  KWEKWE: "KWEKWE",
  KADOMA: "KADOMA",
  MASVINGO: "MASVINGO",
  CHINHOYI: "CHINHOYI",
  BINDURA: "BINDURA",
  CHEGUTU: "CHEGUTU",
  MARONDERA: "MARONDERA",
  KAROI: "KAROI",
  VICTORIA_FALLS: "VICTORIA_FALLS",
  HWANGE: "HWANGE",
  BEITBRIDGE: "BEITBRIDGE",
  
  // Provincial towns
  CHITUNGWIZA: "CHITUNGWIZA",
  EPWORTH: "EPWORTH",
  NORTON: "NORTON",
  RUWA: "RUWA",
  ZVISHAVANE: "ZVISHAVANE",
  CHIREDZI: "CHIREDZI",
  CHIPINGE: "CHIPINGE",
  RUSAPE: "RUSAPE",
  PLUMTREE: "PLUMTREE",
  GWANDA: "GWANDA",
  SHURUGWI: "SHURUGWI",
  REDCLIFF: "REDCLIFF",
  KARIBA: "KARIBA",
  NYANGA: "NYANGA",
  MVURWI: "MVURWI",
  GOKWE: "GOKWE",
  LUPANE: "LUPANE",
  TRIANGLE: "TRIANGLE",
  PENHALONGA: "PENHALONGA",
  OTHER: "OTHER"
}
```

---

## Code Examples

### React Hook for API Calls

```javascript
// useApi.js
import { useState, useCallback } from 'react';
import api from './api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, url, data = null) => {
    setLoading(true);
    setError(null);
    try {
      const config = { method, url };
      if (data) config.data = data;
      
      const response = await api(config);
      setLoading(false);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'An error occurred';
      setError(errorMsg);
      setLoading(false);
      throw err;
    }
  }, []);

  return { request, loading, error };
};

// Usage
const { request, loading, error } = useApi();

const listings = await request('GET', '/api/v1/listings/?category=electronics');
```

### Login Flow

```javascript
const handleLogin = async (email, password) => {
  try {
    const { data } = await api.post('/api/v1/auth/login/', {
      email,
      password
    });

    // Store tokens and user
    localStorage.setItem('access_token', data.tokens.access);
    localStorage.setItem('refresh_token', data.tokens.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Redirect to dashboard
    navigate('/dashboard');
  } catch (error) {
    const message = error.response?.data?.error?.message || 'Login failed';
    alert(message);
  }
};
```

### Create Listing with Images

```javascript
const handleCreateListing = async (formData) => {
  try {
    // Step 1: Create listing (DRAFT)
    const listingRes = await api.post('/api/v1/listings/', {
      title: formData.title,
      description: formData.description,
      price: formData.price,
      currency: formData.currency,
      condition: formData.condition,
      category_id: formData.category_id,
      location: formData.location
    });

    const listing = listingRes.data;

    // Step 2: Upload images if provided
    if (formData.images && formData.images.length > 0) {
      const imgFormData = new FormData();
      formData.images.forEach(img => {
        imgFormData.append('images', img);
      });

      await api.post(`/api/v1/listings/${listing.id}/images/`, imgFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }

    // Step 3: Publish listing
    await api.post(`/api/v1/listings/${listing.id}/publish/`);

    alert('Listing published successfully!');
    navigate(`/listings/${listing.slug}`);
  } catch (error) {
    const message = error.response?.data?.error?.message || 'Error creating listing';
    alert(message);
  }
};
```

### Real-time Chat

```javascript
// useWebSocket.js
import { useEffect, useRef, useCallback } from 'react';

export const useWebSocket = (conversationId) => {
  const wsRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const ws = new WebSocket(
      `ws://localhost:8000/ws/chat/${conversationId}/?token=${token}`
    );

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'history') {
        setMessages(data.messages);
      } else if (data.type === 'chat_message') {
        setMessages(prev => [...prev, data.message]);
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    wsRef.current = ws;

    return () => ws.close();
  }, [conversationId]);

  const sendMessage = useCallback((content) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        content
      }));
    }
  }, []);

  const markAsRead = useCallback((messageId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'mark_read',
        message_id: messageId
      }));
    }
  }, []);

  return { messages, isConnected, sendMessage, markAsRead };
};

// Usage
const { messages, sendMessage } = useWebSocket(conversationId);
```

### Search with Full-Text & Fallback

```javascript
const handleSearch = async (searchTerm) => {
  try {
    // Primary: full-text search via ts_vector
    const res = await api.get('/api/v1/listings/', {
      params: {
        search: searchTerm,
        category: selectedCategory,
        ordering: '-created_at'
      }
    });

    if (res.data.results.length > 0) {
      setListings(res.data.results);
    } else {
      // Fallback to trigram on title (typo tolerance) handled server-side
      // Show results or "No listings found"
      setListings([]);
    }
  } catch (error) {
    console.error('Search failed:', error);
  }
};
```

---

## Contact & Support

- **Live API Docs:** https://api.sanganai.co.zw/api/v1/docs/
- **Alternative Docs:** https://api.sanganai.co.zw/api/v1/redoc/
- **OpenAPI Schema:** https://api.sanganai.co.zw/api/v1/schema/
- **Admin Panel:** https://api.sanganai.co.zw/admin/

---

**Happy coding! 🚀**
