import axios from "axios";
import Cookies from "js-cookie";

// Log the API base URL only in development
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5055/api";
if (process.env.NODE_ENV === 'development') {
  console.log("Using API base URL:", apiBaseUrl);
}

// Create axios instance with optimized configuration
const instance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000, // Reduced from 50s to 15s for faster failure recovery
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
  },
  // Enable request caching
  withCredentials: false,
});

// Simple in-memory cache for GET requests
const requestCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache key generator
const getCacheKey = (config) => {
  return `${config.method}:${config.url}:${JSON.stringify(config.params)}`;
};

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    // Get token from cookies
    const userInfo = Cookies.get("userInfo");
    if (userInfo) {
      try {
        const { token } = JSON.parse(userInfo);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Error parsing userInfo cookie:", error);
        // If cookie is invalid, remove it
        Cookies.remove("userInfo", { path: '/' });
      }
    }
    
    // Check cache for GET requests
    if (config.method === 'get') {
      const cacheKey = getCacheKey(config);
      const cachedResponse = requestCache.get(cacheKey);
      
      if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_DURATION) {
        // Return cached response
        config.adapter = () => {
          return Promise.resolve({
            data: cachedResponse.data,
            status: 200,
            statusText: 'OK',
            headers: cachedResponse.headers,
            config,
            isCached: true
          });
        };
      }
    }
    
    // Log request URL only in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request to: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
instance.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === 'get' && !response.isCached && response.status === 200) {
      const cacheKey = getCacheKey(response.config);
      requestCache.set(cacheKey, {
        data: response.data,
        headers: response.headers,
        timestamp: Date.now()
      });
      
      // Clean old cache entries
      if (requestCache.size > 100) {
        const oldestKey = requestCache.keys().next().value;
        requestCache.delete(oldestKey);
      }
    }
    
    // Log response only in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response from ${response.config.url}: Status ${response.status}`);
    }
    
    return response.data;
  },
  (error) => {
    // Only log errors in development or for important errors
    if (process.env.NODE_ENV === 'development' || error.response?.status >= 500) {
      console.error("API Error:", error?.response?.status, error?.response?.data || error?.message);
    }
    
    if (error.response) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Failed API call to ${error.config?.url}:`, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
    } else if (error.request) {
      if (process.env.NODE_ENV === 'development') {
        console.error('No response received:', error.request);
      }
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log("Unauthorized access detected, clearing session");
      
      // Clear auth data
      Cookies.remove("userInfo", { path: '/' });
      localStorage.removeItem("userInfo");
      
      // Clear token from headers
      delete instance.defaults.headers.common.Authorization;
      
      // If we're not already on the login page, redirect
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
        // Give a slight delay to allow any current operations to complete
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 300);
      }
    }
    
    return Promise.reject(error);
  }
);

const setToken = (token) => {
  if (token) {
    instance.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
};

const clearToken = () => {
  delete instance.defaults.headers.common.Authorization;
};

// Clear cache function for when data needs to be refreshed
const clearCache = (pattern) => {
  if (pattern) {
    for (const key of requestCache.keys()) {
      if (key.includes(pattern)) {
        requestCache.delete(key);
      }
    }
  } else {
    requestCache.clear();
  }
};

const requests = {
  get: (url, config = {}) => instance.get(url, config),
  post: (url, body, config = {}) => {
    // Clear related cache on POST
    clearCache(url.split('?')[0]);
    return instance.post(url, body, config);
  },
  put: (url, body, config = {}) => {
    // Clear related cache on PUT
    clearCache(url.split('?')[0]);
    return instance.put(url, body, config);
  },
  patch: (url, body, config = {}) => {
    // Clear related cache on PATCH
    clearCache(url.split('?')[0]);
    return instance.patch(url, body, config);
  },
  delete: (url, config = {}) => {
    // Clear related cache on DELETE
    clearCache(url.split('?')[0]);
    return instance.delete(url, config);
  },
};

export { setToken, clearToken, clearCache };
export default requests; 
