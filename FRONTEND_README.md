# Frontend Developer Onboarding Guide

Welcome! This guide helps you quickly get up to speed building the frontend for **Zimora API** — a Zimbabwe classifieds/marketplace platform.

---

## TL;DR — Start Here

### What This API Does
- **Browse listings** from sellers (like OLX, Classifieds)
- **Create & publish listings** (SELLER role)
- **Search & filter** by category, location, price, condition
- **In-app messaging** between buyers and sellers (real-time WebSocket chat)
- **OTP verification** for phone and email
- **Admin panel** for content moderation (ADMIN role)

### Core Technology Stack (Backend)
- Django 5.2 + Django REST Framework
- PostgreSQL database
- Redis cache & rate limiting
- Django Channels + WebSocket (real-time chat)
- S3/Cloudflare R2 image storage
- Celery for background tasks (OTP sending, etc.)

### Your Frontend Tech Stack (Recommended)
```bash
npm install axios react-router-dom zustand react-query tailwindcss formik yup
```

---

## Documentation Files

| File | Purpose | Read Time |
|------|---------|-----------|
| **[FRONTEND_API_GUIDE.md](./FRONTEND_API_GUIDE.md)** | Complete API reference with all endpoints, auth flow, examples | 30 min |
| **[FRONTEND_QUICK_REFERENCE.md](./FRONTEND_QUICK_REFERENCE.md)** | Cheat sheet with quick lookup tables, cURL examples | 5 min |
| **[FRONTEND_SETUP.md](./FRONTEND_SETUP.md)** | Step-by-step dev environment setup with code samples | 20 min |
| **[FRONTEND_CHECKLIST.md](./FRONTEND_CHECKLIST.md)** | Feature implementation phases, architecture, patterns | 25 min |

**Start with:** Quick Reference (5 min) → API Guide (30 min) → Setup Guide (20 min)

---

## First 30 Minutes — Setup

### 1. Clone the repo and verify backend is running
```bash
cd zimoraAPI
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements/dev.txt
python manage.py runserver
# Should see: "Starting development server at http://127.0.0.1:8000/"
```

### 2. Test the API
```bash
# In another terminal, try:
curl http://localhost:8000/api/v1/categories/tree/ | json_pp
# Should return category tree structure
```

### 3. Create React app
```bash
npx create-react-app zimora-frontend
cd zimora-frontend
npm install axios react-router-dom zustand
```

### 4. Setup API client
Copy the following into your React project:

**`src/services/api.js`** — HTTP client with auto-refresh
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const { data } = await api.post('/auth/token/refresh/', { refresh });
        localStorage.setItem('access_token', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 5. Test login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin"}'
# Copy the tokens to localStorage
```

**Done!** You're now ready to build.

---

## Implementation Roadmap

### Week 1: Auth & Browsing

**Day 1-2: Authentication**
- [ ] Implement `/register` page with validation
- [ ] Implement `/login` page
- [ ] Store JWT tokens in localStorage
- [ ] Implement token auto-refresh on 401
- [ ] Create logout functionality

**Day 3-4: Browse Listings**
- [ ] Display categories (hierarchical tree)
- [ ] Display active listings with pagination
- [ ] Implement search/filter by category, location, price, condition
- [ ] Implement "View listing detail" page (increments views)
- [ ] Show primary image + image gallery

**Day 5: Polish**
- [ ] Error handling (show error messages to user)
- [ ] Loading states on all API calls
- [ ] Form validation before submission

### Week 2: Seller Features & Messaging

**Day 6-7: Create Listings (SELLER)**
- [ ] Implement "Create listing" form
- [ ] Multi-step: Enter details → Upload images → Publish
- [ ] Image upload with preview & validation (max 5MB)
- [ ] Implement "My listings" page (owned by user)
- [ ] Allow editing DRAFT listings

**Day 8-9: Messaging**
- [ ] List conversations (/inbox)
- [ ] Start conversation with buyer/seller
- [ ] REST API for conversation history
- [ ] WebSocket for real-time chat (show received messages instantly)
- [ ] Unread badge on conversations

**Day 10: Polish**
- [ ] Auto-reconnect WebSocket on disconnect
- [ ] Read receipts (mark message as read)
- [ ] Show unread count

### Week 3: Admin & Optional Features

**Day 11-12: Admin Panel (Optional)**
- [ ] Admin dashboard with stats
- [ ] Listing moderation (approve/reject)
- [ ] User management
- [ ] Comment moderation (future)

**Day 13-14: Mobile & Optimization**
- [ ] Responsive design (mobile-first)
- [ ] Image lazy loading
- [ ] Search debouncing
- [ ] Paginated results (don't load all at once)

**Day 15: Deployment**
- [ ] Build production bundle
- [ ] Update API_URL to production domain
- [ ] Test WebSocket over WSS
- [ ] Deploy to hosting (Vercel, Netlify, etc.)

---

## Essential Endpoints Quick Map

```
┌─────────────────────────────────────────────────────────────┐
│                    ZIMORA API QUICK MAP                     │
├─────────────────────────────────────────────────────────────┤
│ 📋 CATEGORIES                                               │
│  GET /categories/          - All categories (flat)          │
│  GET /categories/tree/     - Hierarchical tree              │
│  GET /categories/{id}/     - Single category                │
├─────────────────────────────────────────────────────────────┤
│ 🏪 LISTINGS (Marketplace)                                   │
│  GET  /listings/           - Public listings (paginated)    │
│  GET  /listings/{id}/      - Details + images               │
│  POST /listings/           - Create (SELLER only)           │
│  PATCH /listings/{id}/     - Update (owner only)            │
│  POST /listings/{id}/publish/ - Publish (DRAFT→ACTIVE)      │
│  POST /listings/{id}/images/ - Upload images (1-10)         │
│  GET  /listings/my-listings/ - Your listings                │
├─────────────────────────────────────────────────────────────┤
│ 💬 INBOX (Messaging)                                        │
│  GET  /inbox/              - List conversations             │
│  POST /inbox/              - Start conversation             │
│  GET  /inbox/{id}/         - Conversation + messages        │
│  POST /inbox/{id}/messages/ - Send message (REST)           │
│  WS   /ws/chat/{id}/?token=JWT - Real-time chat            │
├─────────────────────────────────────────────────────────────┤
│ 👤 AUTH (Account)                                           │
│  POST /auth/register/      - Create account                 │
│  POST /auth/login/         - Get JWT tokens                 │
│  GET  /auth/profile/       - Get user profile               │
│  PATCH /auth/profile/      - Update profile                 │
│  POST /auth/logout/        - Logout                         │
│  POST /auth/email/send-otp/ - Send email OTP               │
│  POST /auth/email/verify/  - Verify email OTP              │
└─────────────────────────────────────────────────────────────┘

Only authenticated endpoints need: Authorization: Bearer <token>
Listing list, category, and detail endpoints are PUBLIC.
```

---

## Common Tasks & Examples

### Task 1: Display All Listings
```javascript
import { useEffect, useState } from 'react';
import api from './services/api';

export function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/listings/?page=1')
      .then(res => setListings(res.data.results))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {listings.map(listing => (
        <div key={listing.id}>
          <h3>{listing.title}</h3>
          <p>${listing.price} {listing.currency}</p>
          {listing.primary_image && (
            <img src={listing.primary_image} alt={listing.title} />
          )}
        </div>
      ))}
    </div>
  );
}
```

### Task 2: Create Listing with Images
```javascript
export async function handleCreateListing(formData, imageFiles) {
  try {
    // Step 1: Create listing
    const listingRes = await api.post('/listings/', {
      title: formData.title,
      description: formData.description,
      price: formData.price,
      currency: 'USD',
      condition: 'LIKE_NEW',
      category_id: 5,
      location: 'HARARE',
    });
    const listing = listingRes.data;

    // Step 2: Upload images
    const imgFormData = new FormData();
    imageFiles.forEach(img => imgFormData.append('images', img));
    await api.post(`/listings/${listing.id}/images/`, imgFormData);

    // Step 3: Publish
    await api.post(`/listings/${listing.id}/publish/`);

    alert('Listing published!');
    window.location.href = `/listings/${listing.slug}`;
  } catch (error) {
    alert(error.response?.data?.error?.message || 'Error');
  }
}
```

### Task 3: WebSocket Chat
```javascript
export function ChatWindow({ conversationId }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const ws = new WebSocket(
      `ws://localhost:8000/ws/chat/${conversationId}/?token=${token}`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'history') {
        setMessages(data.messages);
      } else if (data.type === 'chat_message') {
        setMessages(prev => [...prev, data.message]);
      }
    };

    return () => ws.close();
  }, [conversationId]);

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>
          <strong>{msg.sender.username}:</strong> {msg.content}
        </div>
      ))}
    </div>
  );
}
```

---

## Debugging Tips

### Check API in Browser DevTools
```javascript
// In console:
const token = localStorage.getItem('access_token');
fetch('http://localhost:8000/api/v1/auth/profile/', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(console.log)
```

### Test Backend Directly
```bash
# List categories
curl http://localhost:8000/api/v1/categories/tree/

# Login
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Check API docs
curl http://localhost:8000/api/v1/schema/ | json_pp
```

### WebSocket Connection Issues
```javascript
// Test WS in console:
const token = localStorage.getItem('access_token');
const ws = new WebSocket(`ws://localhost:8000/ws/chat/1/?token=${token}`);
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Message:', JSON.parse(e.data));
ws.onerror = (e) => console.error('Error:', e);
```

---

## Key Points to Remember

✅ **DO:**
- Read `FRONTEND_API_GUIDE.md` before starting
- Use the provided API client with auto-token-refresh
- Implement loading states for all async operations
- Show error messages from API to users
- Test with Swagger UI (`/api/v1/docs/`)
- Compress images before upload
- Use WebSocket for chat (don't poll)
- Paginate results (don't load 10,000 listings at once)

❌ **DON'T:**
- Store passwords or API keys in code
- Ignore rate limits (implement retry-after logic)
- Use localStorage for sensitive data (consider secure HTTP-only cookies)
- Forget to include Authorization header on protected routes
- Make API calls in render function (use useEffect)
- Upload uncompressed images (max 5MB per image)
- Poll API for real-time updates (use WebSocket)
- Mix CORS origins (dev vs prod)

---

## Getting Help

1. **API Documentation:** Read [FRONTEND_API_GUIDE.md](./FRONTEND_API_GUIDE.md)
2. **Live Swagger UI:** `http://localhost:8000/api/v1/docs/`
3. **Backend Issues:** Contact the backend team
4. **Stuck?** Check the code examples in `FRONTEND_SETUP.md`

---

## Next Steps

1. **Read** [FRONTEND_QUICK_REFERENCE.md](./FRONTEND_QUICK_REFERENCE.md) (5 min)
2. **Read** [FRONTEND_API_GUIDE.md](./FRONTEND_API_GUIDE.md) (30 min)
3. **Follow** [FRONTEND_SETUP.md](./FRONTEND_SETUP.md) to setup dev environment
4. **Implement** Phase 1 from [FRONTEND_CHECKLIST.md](./FRONTEND_CHECKLIST.md)
5. **Start coding!**

---

**Happy coding! 🚀**

*Last updated: April 2026*  
*API Version: 1.0*  
*Framework: Django 5.2 REST Framework*
