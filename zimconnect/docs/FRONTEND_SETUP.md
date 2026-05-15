# Frontend Environment Setup

## Node/React Project Setup

### 1. Environment Variables (.env.local)

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=10000  # milliseconds

# Storage Keys
REACT_APP_STORAGE_KEY_ACCESS_TOKEN=access_token
REACT_APP_STORAGE_KEY_REFRESH_TOKEN=refresh_token
REACT_APP_STORAGE_KEY_USER=user

# Feature Flags
REACT_APP_ENABLE_WEBSOCKET=true
REACT_APP_WEBSOCKET_RECONNECT_INTERVAL=3000  # milliseconds
REACT_APP_WEBSOCKET_RECONNECT_MAX_ATTEMPTS=10

# Development
REACT_APP_DEBUG=false
```

### 2. Development Server Setup

```bash
# Install dependencies
npm install axios react-router-dom zustand  # or redux, context api

# Start dev server
npm start

# or with custom port
PORT=3000 npm start
```

### 3. Production Build

```bash
# Build for production
npm run build

# Test production build locally
npm install -g serve
serve -s build
```

### Production Environment (.env.production)

```bash
REACT_APP_API_URL=https://api.sanganai.co.zw
REACT_APP_API_TIMEOUT=10000
REACT_APP_ENABLE_WEBSOCKET=true
REACT_APP_DEBUG=false
```

---

## VUE/NUXT Project Setup

### .env.development

```bash
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=10000
VITE_ENABLE_WEBSOCKET=true
```

### .env.production

```bash
VITE_API_URL=https://api.sanganai.co.zw
VITE_API_TIMEOUT=10000
VITE_ENABLE_WEBSOCKET=true
```

### vite.config.js

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

---

## API Client Setup (Axios)

### services/api.js

```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000;

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry login/refresh endpoints
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/token/refresh')
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await api.post('/auth/token/refresh/', {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Token refresh failed → clear auth & redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### services/auth.js

```javascript
import api from './api';

export const authService = {
  register: async (data) => {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    const { tokens, user } = response.data;
    
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { tokens, user };
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    await api.post('/auth/logout/', { refresh: refreshToken });
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.patch('/auth/profile/', data);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  sendPhoneOTP: async () => {
    const response = await api.post('/auth/phone/send-otp/');
    return response.data;
  },

  verifyPhoneOTP: async (otp) => {
    const response = await api.post('/auth/phone/verify/', { otp });
    return response.data;
  },

  sendEmailOTP: async () => {
    const response = await api.post('/auth/email/send-otp/');
    return response.data;
  },

  verifyEmailOTP: async (otp) => {
    const response = await api.post('/auth/email/verify/', { otp });
    return response.data;
  },
};
```

### services/listings.js

```javascript
import api from './api';

export const listingsService = {
  getListings: async (params = {}) => {
    const response = await api.get('/listings/', { params });
    return response.data;
  },

  getListingDetail: async (id) => {
    const response = await api.get(`/listings/${id}/`);
    return response.data;
  },

  createListing: async (data) => {
    const response = await api.post('/listings/', data);
    return response.data;
  },

  updateListing: async (id, data) => {
    const response = await api.patch(`/listings/${id}/`, data);
    return response.data;
  },

  publishListing: async (id) => {
    const response = await api.post(`/listings/${id}/publish/`);
    return response.data;
  },

  uploadImages: async (id, images) => {
    const formData = new FormData();
    images.forEach((img) => formData.append('images', img));
    
    const response = await api.post(`/listings/${id}/images/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteImage: async (imageId) => {
    await api.delete(`/listings/images/${imageId}/`);
  },

  getMyListings: async (params = {}) => {
    const response = await api.get('/listings/my-listings/', { params });
    return response.data;
  },
};
```

### services/inbox.js

```javascript
import api from './api';

export const inboxService = {
  getConversations: async (params = {}) => {
    const response = await api.get('/inbox/', { params });
    return response.data;
  },

  startConversation: async (participantId, listingId) => {
    const response = await api.post('/inbox/', {
      participant_id: participantId,
      listing_id: listingId,
    });
    return response.data;
  },

  getConversation: async (id) => {
    const response = await api.get(`/inbox/${id}/`);
    return response.data;
  },

  sendMessage: async (conversationId, content) => {
    const response = await api.post(`/inbox/${conversationId}/messages/`, {
      content,
    });
    return response.data;
  },

  markMessageAsRead: async (messageId) => {
    const response = await api.post(`/inbox/messages/${messageId}/mark-read/`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/inbox/unread-count/');
    return response.data;
  },
};
```

### services/categories.js

```javascript
import api from './api';

export const categoriesService = {
  getCategories: async () => {
    const response = await api.get('/categories/');
    return response.data.results;
  },

  getCategoryTree: async () => {
    const response = await api.get('/categories/tree/');
    return response.data;
  },

  getCategory: async (id) => {
    const response = await api.get(`/categories/${id}/`);
    return response.data;
  },
};
```

---

## WebSocket Client Setup

### services/websocket.js

```javascript
export class WebSocketClient {
  constructor(conversationId, token) {
    this.conversationId = conversationId;
    this.token = token;
    this.url = `${process.env.REACT_APP_API_URL}/ws/chat/${conversationId}/?token=${token}`;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = parseInt(process.env.REACT_APP_WEBSOCKET_RECONNECT_MAX_ATTEMPTS) || 10;
    this.reconnectInterval = parseInt(process.env.REACT_APP_WEBSOCKET_RECONNECT_INTERVAL) || 3000;
    this.listeners = {};
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.emit('disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * this.reconnectAttempts;
    console.log(`Attempting reconnect in ${delay}ms...`);

    setTimeout(() => {
      this.connect().catch((err) => {
        console.error('Reconnect failed:', err);
      });
    }, delay);
  }

  handleMessage(data) {
    switch (data.type) {
      case 'history':
        this.emit('history', data.messages);
        break;
      case 'chat_message':
        this.emit('message', data.message);
        break;
      case 'messages_read':
        this.emit('read', data);
        break;
      case 'error':
        this.emit('error', data.message);
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  send(type, payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...payload }));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  sendMessage(content) {
    this.send('chat_message', { content });
  }

  markAsRead(messageId) {
    this.send('mark_read', { message_id: messageId });
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  emit(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(...args));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
```

### hooks/useWebSocket.js (React)

```javascript
import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketClient } from '../services/websocket';

export const useWebSocket = (conversationId) => {
  const wsRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token || !conversationId) return;

    const ws = new WebSocketClient(conversationId, token);

    ws.on('connected', () => {
      setIsConnected(true);
      setError(null);
    });

    ws.on('disconnected', () => {
      setIsConnected(false);
    });

    ws.on('history', (hist) => {
      setMessages(hist);
    });

    ws.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    ws.on('error', (err) => {
      setError(typeof err === 'string' ? err : 'Connection error');
    });

    ws.connect().catch((err) => {
      setError('Failed to connect');
    });

    wsRef.current = ws;

    return () => {
      ws.disconnect();
    };
  }, [conversationId]);

  const sendMessage = useCallback((content) => {
    if (wsRef.current && isConnected) {
      wsRef.current.sendMessage(content);
    }
  }, [isConnected]);

  const markAsRead = useCallback((messageId) => {
    if (wsRef.current && isConnected) {
      wsRef.current.markAsRead(messageId);
    }
  }, [isConnected]);

  return { messages, isConnected, error, sendMessage, markAsRead };
};
```

---

## CORS Configuration

By default, the API allows requests from:
- `http://localhost:3000` (development)
- `https://sanganai.co.zw` (production)
- `https://www.sanganai.co.zw`
- `https://api.sanganai.co.zw`

If you're running frontend on a different port, add it to the backend's `CORS_ALLOWED_ORIGINS` in `.env`.

---

## Development Checklist

- [ ] Set `REACT_APP_API_URL=http://localhost:8000` in `.env.local`
- [ ] Verify backend is running on port 8000
- [ ] Test register/login flow
- [ ] Test token refresh on 401
- [ ] Test file uploads (max 5MB per image)
- [ ] Test WebSocket connection for chat
- [ ] Test pagination (load next pages)
- [ ] Test search/filter functionality
- [ ] Handle all error codes (400, 401, 403, 404, 429, etc.)
- [ ] Display rate limit messages to user
- [ ] Show loading states during API calls
- [ ] Implement retry logic for network errors

---

## Troubleshooting

### CORS Error

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
```javascript
// Make sure your frontend URL is in backend's CORS_ALLOWED_ORIGINS
// Or use a proxy in development:

// vite.config.js or webpack
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  }
}
```

### Token Always Expires

**Error:** Getting 401 frequently

**Solution:**
- Access token lifetime is **15 minutes**
- Implement refresh token logic (see api.js interceptor above)
- Call `/auth/token/refresh/` before token expires

### WebSocket Connection Failed

**Error:** `WebSocket connection failed`

**Solution:**
```javascript
// Make sure token is valid and conversation exists
const token = localStorage.getItem('access_token');
const url = `ws://localhost:8000/ws/chat/{conversationId}/?token=${token}`;
// Add proper ws:// or wss:// protocol
```

### Rate Limit Errors (429)

**Error:** `Too many requests. Try again in X seconds.`

**Solution:**
```javascript
// Implement exponential backoff
if (error.status === 429) {
  const retryAfter = error.response.data.error.details.retry_after;
  setTimeout(() => retryRequest(), retryAfter * 1000);
}
```

---

## Recommended Packages

```bash
npm install \
  axios \                    # HTTP client
  react-router-dom \        # Routing
  zustand \                 # State management (lightweight)
  react-query \             # Data fetching & caching
  tailwindcss \             # Styling
  react-hot-toast \         # Notifications
  formik \                  # Form validation
  yup \                     # Schema validation
  dayjs                     # Date formatting
```

---

## Performance Tips

1. **Pagination:** Always paginate large lists — don't load all results at once
2. **Image optimization:** Compress images before upload (max 5MB)
3. **Lazy loading:** Load images/listings on scroll
4. **Caching:** Use `react-query` to cache listings and reduce API calls
5. **WebSocket:** Use for real-time chat, don't poll
6. **Code splitting:** Lazy load pages with `React.lazy()`
