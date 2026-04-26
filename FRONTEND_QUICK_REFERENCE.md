# Zimora API — Frontend Quick Reference

## API URLs

| Environment | URL |
|-------------|-----|
| **Development** | `http://localhost:8000/api/v1/` |
| **Production** | `https://api.sanganai.co.zw/api/v1/` |

---

## Authentication

### Get Tokens
```bash
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Use Token
```bash
curl http://localhost:8000/api/v1/auth/profile/ \
  -H "Authorization: Bearer <access_token>"
```

### Refresh Token
```bash
curl -X POST http://localhost:8000/api/v1/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "<refresh_token>"}'
```

---

## Essential Endpoints

### Categories (Browse)
| Method | Endpoint | Auth? | Returns |
|--------|----------|-------|---------|
| GET | `/categories/` | ❌ | All categories (flat) |
| GET | `/categories/tree/` | ❌ | Nested category tree |
| GET | `/categories/{id}/` | ❌ | Single category |

### Listings (Marketplace)
| Method | Endpoint | Auth? | Notes |
|--------|----------|-------|-------|
| GET | `/listings/` | ❌ | Public, paginated (20/page) |
| GET | `/listings/{id}/` | ❌ | Detail, increments views |
| POST | `/listings/` | ✅ | Create (SELLER only) |
| PATCH | `/listings/{id}/` | ✅ | Update (owner only) |
| POST | `/listings/{id}/publish/` | ✅ | DRAFT → ACTIVE |
| POST | `/listings/{id}/images/` | ✅ | Upload 1-10 images |
| DELETE | `/listings/images/{image_id}/` | ✅ | Delete single image |
| GET | `/listings/my-listings/` | ✅ | Your listings |

### Inbox (Messages)
| Method | Endpoint | Auth? | Notes |
|--------|----------|-------|-------|
| GET | `/inbox/` | ✅ | Your conversations |
| POST | `/inbox/` | ✅ | Start conversation |
| GET | `/inbox/{id}/` | ✅ | Conversation + messages |
| POST | `/inbox/{id}/messages/` | ✅ | Send message |
| POST | `/inbox/messages/{msg_id}/mark-read/` | ✅ | Mark as read |
| GET | `/inbox/unread-count/` | ✅ | Total unread |

### Auth (Account)
| Method | Endpoint | Auth? |
|--------|----------|-------|
| POST | `/auth/register/` | ❌ |
| POST | `/auth/login/` | ❌ |
| POST | `/auth/logout/` | ✅ |
| POST | `/auth/token/refresh/` | ❌ |
| GET | `/auth/profile/` | ✅ |
| PATCH | `/auth/profile/` | ✅ |
| POST | `/auth/phone/send-otp/` | ✅ |
| POST | `/auth/phone/verify/` | ✅ |
| POST | `/auth/email/send-otp/` | ✅ |
| POST | `/auth/email/verify/` | ✅ |

---

## Query Parameters

### Listings List
```
?page=1                    # Page number
?page_size=50              # Results per page (max 100)
?category=electronics      # Category slug
?location=HARARE           # City code
?min_price=100.00
?max_price=50000.00
?condition=NEW             # NEW, LIKE_NEW, GOOD, FAIR, POOR
?featured=true
?ordering=created_at       # or -created_at, price, -price, views_count, -views_count
?search=iphone             # Full-text search
```

### Other Lists
```
?page=1
?page_size=20
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| **200** | OK |
| **201** | Created |
| **204** | No Content |
| **400** | Bad Request (validation error) |
| **401** | Unauthorized (no/invalid token) |
| **403** | Forbidden (no permission) |
| **404** | Not Found |
| **409** | Conflict (duplicate, etc.) |
| **422** | Unprocessable Entity |
| **429** | Rate Limited |
| **500** | Server Error |

---

## Error Response Format

```json
{
  "error": {
    "code": "service_error",
    "message": "User-friendly message",
    "details": {
      "field_name": ["Specific error"]
    }
  }
}
```

---

## Enums

### User Role
- `BUYER`
- `SELLER`
- `ADMIN`
- `MODERATOR`

### Listing Status
- `DRAFT` (private)
- `ACTIVE` (public)
- `SOLD`
- `ARCHIVED`
- `REJECTED`

### Listing Condition
- `NEW`
- `LIKE_NEW`
- `GOOD`
- `FAIR`
- `POOR`

### Currency
- `USD`
- `ZWL`

### Zimbabwe Cities
- HARARE, BULAWAYO, MUTARE, GWERU, KWEKWE, KADOMA, MASVINGO, CHINHOYI, BINDURA, CHEGUTU, MARONDERA, KAROI, VICTORIA_FALLS, HWANGE, BEITBRIDGE, CHITUNGWIZA, EPWORTH, NORTON, RUWA, ZVISHAVANE, CHIREDZI, CHIPINGE, RUSAPE, PLUMTREE, GWANDA, SHURUGWI, REDCLIFF, KARIBA, NYANGA, MVURWI, GOKWE, LUPANE, TRIANGLE, PENHALONGA, OTHER

---

## Rate Limits

| Endpoint | Limit | Scope |
|----------|-------|-------|
| Register | 5/hour | IP |
| Login | 10/hour | IP |
| Send OTP | 3/hour | User |
| Verify OTP | 10/hour | User |
| Create Listing | 20/day | User |
| Upload Image | 30/day | User |
| Send Message | 60/hour | User |
| Other endpoints | 120/min | User |

On 429, check `Retry-After` header for seconds to wait.

---

## WebSocket Chat

### Connection
```javascript
ws = new WebSocket('ws://localhost:8000/ws/chat/{id}/?token=<JWT>')
```

### Sending
```json
{ "type": "chat_message", "content": "Hello" }
{ "type": "mark_read", "message_id": 42 }
```

### Receiving
```json
{ "type": "history", "messages": [...] }
{ "type": "chat_message", "message": {...} }
{ "type": "messages_read", "message_id": 42, "reader": "username" }
{ "type": "error", "message": "..." }
```

---

## Common Flows

### 1. User Registration & Email Verification
```
1. POST /auth/register/ → user created (OTP sent in background)
2. POST /auth/email/send-otp/ → resend if needed
3. POST /auth/email/verify/ → {"otp": "123456"}
4. GET /auth/profile/ → email_verified: true
```

### 2. Browse & View Listing
```
1. GET /categories/tree/ → show categories
2. GET /listings/?category=electronics → search/filter
3. GET /listings/15/ → detail (increments views)
4. GET /listings/15/messages/ → (if messaging available)
```

### 3. Create & Publish Listing (SELLER)
```
1. POST /listings/ → create DRAFT
2. POST /listings/15/images/ → upload images
3. POST /listings/15/publish/ → DRAFT → ACTIVE
```

### 4. Message About Listing
```
1. POST /inbox/ → {"participant_id": 5, "listing_id": 15}
2. GET /inbox/1/ → see conversation
3. WebSocket ws://...?token=X → real-time chat
4. POST /inbox/1/messages/ → send message
```

### 5. Token Refresh Flow
```javascript
1. Access token expires (15 min)
2. GET any resource → 401 error
3. POST /auth/token/refresh/ → new access token
4. Retry original request with new token
```

---

## Common Mistakes to Avoid

❌ **Don't:**
- Use `/api/` (deprecated) instead of `/api/v1/`
- Store passwords or API keys in code
- Ignore rate limits — implement retry logic
- Forget to include `Authorization` header on protected routes
- Send large payloads without checking size limits (5MB images max)
- Poll the API excessively — use WebSocket for chat

✅ **Do:**
- Store JWT tokens in `localStorage` or secure HTTP-only cookies
- Implement token refresh before expiry or on 401
- Handle 429 errors with exponential backoff
- Validate form input before sending
- Show user-friendly error messages from `error.message`
- Use WebSocket for real-time features (chat, notifications)
- Paginate results (use the `results` array + `next` URL)

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:8000/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "SecurePass123!",
    "confirm_password": "SecurePass123!",
    "role": "BUYER",
    "phone": "+263771234567",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### List Listings
```bash
curl "http://localhost:8000/api/v1/listings/?page=1&category=electronics" \
  -H "Accept: application/json"
```

### Get Profile (with token)
```bash
curl http://localhost:8000/api/v1/auth/profile/ \
  -H "Authorization: Bearer <access_token>"
```

### Create Listing
```bash
curl -X POST http://localhost:8000/api/v1/listings/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "iPhone 13 Pro",
    "description": "Excellent condition",
    "price": "5000.00",
    "currency": "USD",
    "condition": "LIKE_NEW",
    "category_id": 5,
    "location": "HARARE"
  }'
```

---

## Documentation

- **Full API Guide:** See `FRONTEND_API_GUIDE.md`
- **Live Swagger UI:** `https://api.sanganai.co.zw/api/v1/docs/`
- **ReDoc:** `https://api.sanganai.co.zw/api/v1/redoc/`
- **OpenAPI Schema:** `https://api.sanganai.co.zw/api/v1/schema.json`
