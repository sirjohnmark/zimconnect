# Frontend Developer Checklist & Architecture Guide

## Pre-Development Checklist

### Backend Verification
- [ ] API is running locally (`http://localhost:8000`)
- [ ] API documentation is accessible (`/api/v1/docs/`)
- [ ] Database is populated with test data / categories
- [ ] Redis is running (for rate limiting & caching)
- [ ] Backend `.env` has correct CORS settings

### Frontend Project Scaffold
- [ ] Created React/Vue/Next.js project with npm/yarn
- [ ] Installed required packages (axios, routing library, state management)
- [ ] Created `.env.local` with `REACT_APP_API_URL=http://localhost:8000`
- [ ] API client (`services/api.js`) created with auth interceptors
- [ ] WebSocket service created (if implementing chat)
- [ ] Error handling/notification system in place

---

## Core Features to Implement (In Order)

### Phase 1: Authentication (User Sign-up/Login)
```
Screens needed:
  ✓ /register          — Registration form
  ✓ /login             — Login form
  ✓ /verify-email      — Email OTP verification
  ✓ /verify-phone      — Phone OTP verification (optional)
  ✓ /profile           — View/edit profile

API calls:
  POST /auth/register/
  POST /auth/login/
  POST /auth/email/send-otp/
  POST /auth/email/verify/
  GET /auth/profile/
  PATCH /auth/profile/
  POST /auth/logout/
```

**Key points:**
- Store tokens in localStorage (or use secure HTTP-only cookies)
- Implement auto-refresh on 401
- Show loading states during auth calls
- Validate form input before sending
- Rate limited to 5 register/hour, 10 login/hour per IP

---

### Phase 2: Browse Categories & Listings
```
Screens needed:
  ✓ /                  — Homepage with featured listings
  ✓ /categories        — All categories (hierarchical tree)
  ✓ /listings          — Search/filter/browse listings
  ✓ /listings/:slug    — Single listing detail + images

API calls:
  GET /categories/tree/ (for hierarchical display)
  GET /listings/?filters...
  GET /listings/{id}/
```

**Key points:**
- Categories have parent/child nesting — use recursive component
- Listing detail page increments `views_count` on each GET
- Use pagination for large lists (default 20/page, max 100)
- Implement full-text search with fallback to trigram matching
- Cache categories (rarely change)
- Show primary image first, gallery slider for other images

---

### Phase 3: Create Listings (For SELLERS)
```
Screens needed:
  ✓ /dashboard         — Seller dashboard
  ✓ /create-listing    — Multi-step form
  ✓ /my-listings       — List of user's listings (all statuses)
  ✓ /listing/{id}/edit — Edit listing (owner only)

API calls:
  POST /listings/                      (create DRAFT)
  PATCH /listings/{id}/                (update DRAFT)
  POST /listings/{id}/publish/         (DRAFT → ACTIVE)
  POST /listings/{id}/images/          (upload 1-10 images)
  DELETE /listings/images/{image_id}/  (delete image)
  GET /listings/my-listings/           (list user's listings)
```

**Key points:**
- Only SELLER or ADMIN role can create listings
- New listings start as DRAFT (not visible publicly)
- Listings must have at least 1 image before publishing
- Image limit: 1-10 images per listing, max 5MB each
- Upload to object storage (S3/R2) — **images are returned as signed URLs**
- Show upload progress / validation
- Mark first uploaded image as primary

---

### Phase 4: Messaging (In-App Chat)
```
Screens needed:
  ✓ /inbox             — List conversations
  ✓ /inbox/{id}        — Chat window (real-time WebSocket)

API calls (REST):
  GET /inbox/                                    (list conversations)
  POST /inbox/                                   (start conversation)
  GET /inbox/{id}/                              (conversation + messages)
  GET /inbox/unread-count/                      (badge)
  POST /inbox/messages/{id}/mark-read/          (mark read)

WebSocket (real-time):
  ws://localhost:8000/ws/chat/{id}/?token=JWT
  → type: history (initial messages)
  → type: chat_message (new message from participant)
  → type: messages_read (read receipt)
```

**Key points:**
- Messages are **real-time via WebSocket** — don't use REST polling
- Each conversation has exactly **2 participants**
- Conversations can be linked to a **listing** (optional context)
- Implement auto-reconnect with exponential backoff (3s, 6s, 12s, 30s max)
- Show unread count badge on inbox
- Auto-mark messages as read when viewed
- Show typing indicator (optional, not yet in API)

---

### Phase 5: Admin Panel (Optional Early)
```
Screens needed:
  ✓ /admin/dashboard   — Stats, analytics
  ✓ /admin/listings    — Moderate listings (approve/reject)
  ✓ /admin/users       — Manage users
  ✓ /admin/comments    — Moderate comments (future)

API calls:
  GET /admin/...       (available for ADMIN role only)
```

---

## State Management Structure

### Recommended (Using Zustand)

```javascript
// store/authStore.js
export const useAuthStore = create((set) => ({
  user: null,
  isLoading: false,
  error: null,
  
  setUser: (user) => set({ user }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearAuth: () => set({ user: null }),
}));

// store/listingsStore.js
export const useListingsStore = create((set) => ({
  listings: [],
  selectedListing: null,
  filters: { page: 1, page_size: 20 },
  
  setListings: (listings) => set({ listings }),
  setSelectedListing: (listing) => set({ selectedListing: listing }),
  updateFilters: (filters) => set(state => ({ 
    filters: { ...state.filters, ...filters } 
  })),
}));

// store/inboxStore.js
export const useInboxStore = create((set) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  unreadCount: 0,
  
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (conv) => set({ activeConversation: conv }),
  addMessage: (message) => set(state => ({
    messages: [...state.messages, message]
  })),
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
```

---

## Component Architecture

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   ├── OTPVerification.jsx
│   │   └── ProfileEditor.jsx
│   ├── listings/
│   │   ├── ListingCard.jsx
│   │   ├── ListingList.jsx
│   │   ├── ListingDetail.jsx
│   │   ├── ListingForm.jsx
│   │   └── ImageUploader.jsx
│   ├── inbox/
│   │   ├── ConversationList.jsx
│   │   ├── ChatWindow.jsx
│   │   └── MessageInput.jsx
│   ├── categories/
│   │   ├── CategoryTree.jsx
│   │   └── CategorySelect.jsx
│   └── common/
│       ├── Layout.jsx
│       ├── Navigation.jsx
│       ├── ErrorAlert.jsx
│       ├── LoadingSpinner.jsx
│       └── PaginationControls.jsx
├── pages/
│   ├── Home.jsx
│   ├── Categories.jsx
│   ├── Listings.jsx
│   ├── ListingDetail.jsx
│   ├── Dashboard.jsx
│   ├── Inbox.jsx
│   ├── Profile.jsx
│   └── NotFound.jsx
├── services/
│   ├── api.js
│   ├── auth.js
│   ├── listings.js
│   ├── inbox.js
│   ├── categories.js
│   └── websocket.js
├── hooks/
│   ├── useApi.js
│   ├── useAuth.js
│   ├── useWebSocket.js
│   └── useDebounce.js
├── store/
│   ├── authStore.js
│   ├── listingsStore.js
│   └── inboxStore.js
├── utils/
│   ├── formatters.js     (date, price, etc.)
│   ├── validators.js    (form validation)
│   └── constants.js     (enums, mappings)
└── App.jsx
```

---

## Common Implementation Patterns

### Handling Authentication

```javascript
// App.jsx
export function App() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    } else {
      // Validate token/fetch fresh user data
      authService.getProfile()
        .then(user => useAuthStore.setState({ user }))
        .catch(() => {
          localStorage.removeItem('access_token');
          router.push('/login');
        });
    }
  }, []);

  if (!user) return <LoadingSpinner />;

  return <Router {...routes} />;
}
```

### Protected Routes

```javascript
// components/ProtectedRoute.jsx
export function ProtectedRoute({ children, requiredRole = null }) {
  const { user } = useAuthStore();
  const router = useRouter();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}

// Usage in routes
<Route
  path="/create-listing"
  element={
    <ProtectedRoute requiredRole="SELLER">
      <CreateListing />
    </ProtectedRoute>
  }
/>
```

### API Error Handling

```javascript
// hooks/useApi.js
export function useApi(apiFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const call = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      setData(result);
      return result;
    } catch (err) {
      const message = err.response?.data?.error?.message || 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { data, loading, error, call };
}

// Usage
const { data: listings, loading, error, call } = useApi(listingsService.getListings);

useEffect(() => {
  call({ category: 'electronics', page: 1 });
}, []);
```

### Form Submission with Validation

```javascript
// components/CreateListingForm.jsx
import * as yup from 'yup';
import { useFormik } from 'formik';

const validationSchema = yup.object({
  title: yup.string().required('Title is required').max(200),
  description: yup.string().required().min(10),
  price: yup.number().required().positive(),
  currency: yup.string().oneOf(['USD', 'ZWL']),
  condition: yup.string().oneOf(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']),
  category_id: yup.number().required(),
  location: yup.string().required(),
});

export function CreateListingForm() {
  const [images, setImages] = useState([]);
  const navigate = useNavigate();
  const { call: createListing } = useApi(listingsService.createListing);
  const { call: uploadImages } = useApi(listingsService.uploadImages);

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      price: '',
      currency: 'USD',
      condition: '',
      category_id: '',
      location: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const listing = await createListing(values);
        
        if (images.length > 0) {
          await uploadImages(listing.id, images);
        }
        
        await listingsService.publishListing(listing.id);
        
        navigate(`/listings/${listing.slug}`);
      } catch (error) {
        toast.error(error.response?.data?.error?.message);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <input
        name="title"
        value={formik.values.title}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />
      {formik.touched.title && formik.errors.title && (
        <error>{formik.errors.title}</error>
      )}
      {/* ... other fields ... */}
    </form>
  );
}
```

---

## Testing Strategy

### Unit Tests (Services)

```javascript
// __tests__/services/auth.test.js
import { authService } from '../../services/auth';
import api from '../../services/api';

jest.mock('../../services/api');

describe('authService', () => {
  it('should login and store tokens', async () => {
    const mockData = {
      tokens: { access: 'token', refresh: 'refresh' },
      user: { id: 1, email: 'test@example.com' },
    };

    api.post.mockResolvedValue({ data: mockData });

    const result = await authService.login('test@example.com', 'password');

    expect(localStorage.getItem('access_token')).toBe('token');
    expect(result).toEqual(mockData);
  });
});
```

### Integration Tests (Components)

```javascript
// __tests__/components/LoginForm.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../../components/auth/LoginForm';

jest.mock('../../services/auth');

describe('LoginForm', () => {
  it('should submit form with valid data', async () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });
  });
});
```

### E2E Tests (Cypress)

```javascript
// cypress/e2e/auth.cy.js
describe('Authentication Flow', () => {
  it('should register and login', () => {
    cy.visit('/register');
    cy.get('input[name="email"]').type('newuser@example.com');
    cy.get('input[name="username"]').type('newuser');
    cy.get('input[name="password"]').type('SecurePass123!');
    cy.get('input[name="confirm_password"]').type('SecurePass123!');
    cy.get('button[type="submit"]').click();

    cy.contains('Check your email for OTP').should('be.visible');
    // OTP verification logic...
  });
});
```

---

## Performance Optimization

### Image Lazy Loading

```javascript
<img
  src={listing.primary_image}
  loading="lazy"
  alt={listing.title}
  width="300"
  height="200"
/>
```

### Debounced Search

```javascript
const handleSearch = useDebounce((query) => {
  fetchListings({ search: query });
}, 500);

<input onChange={(e) => handleSearch(e.target.value)} />
```

### Pagination Instead of Infinite Scroll (Initially)

```javascript
<button onClick={() => setPage(page + 1)}>Load More</button>
```

### Cache with React Query

```javascript
import { useQuery } from 'react-query';

function ListingsList() {
  const { data } = useQuery(
    ['listings', filters],
    () => listingsService.getListings(filters),
    { staleTime: 5 * 60 * 1000 } // 5 min cache
  );
}
```

---

## Common Pitfalls to Avoid

❌ **Don't:**
1. Store passwords or API keys in code/localStorage
2. Trust client-side validation alone — always validate on backend
3. Forget to handle token expiry (401 errors)
4. Make API calls in render function (use useEffect)
5. Ignore rate limits — implement retry-after
6. Upload large files without compression
7. Poll the API for real-time data (use WebSocket)
8. Make image URLs as direct links without auth (use signed URLs)

✅ **Do:**
1. Implement auto-token-refresh via interceptors
2. Show clear error messages from API (use `error.message`)
3. Use loading states for all async operations
4. Validate input before submission
5. Implement search debouncing
6. Compress images before upload
7. Use WebSocket for chat/notifications
8. Cache categories and static data
9. Implement proper RBAC checks (BUYER, SELLER, ADMIN)
10. Log errors to monitoring service (Sentry, LogRocket)

---

## Deployment Checklist

Before going to production:

- [ ] Database migrations run successfully
- [ ] All environment variables set correctly
- [ ] Frontend built and tested (`npm run build`)
- [ ] API URLs point to production domain
- [ ] HTTPS enabled on both frontend & backend
- [ ] CORS settings updated for production domain
- [ ] Rate limiting tested
- [ ] Error handling works (show user-friendly messages)
- [ ] Images serve from CDN / storage bucket
- [ ] WebSocket connections work over WSS
- [ ] Analytics/monitoring setup
- [ ] Backup & disaster recovery plan documented

---

## Support & Resources

- **API Swagger Docs:** `https://api.sanganai.co.zw/api/v1/docs/`
- **Backend Repo:** Ask the backend team
- **Slack/Discord:** Contact backend developers for issues
- **Issue Tracker:** GitHub issues or Linear

**Happy building! 🎉**
