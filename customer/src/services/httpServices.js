import axios from "axios";

// Get API base URL from environment or use default
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://e-commerce-backend-l0s0.onrender.com/api";

// Create axios instance with default config
const httpServices = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
httpServices.interceptors.request.use(
  (config) => {
    // Get token from localStorage if available
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
httpServices.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear session data
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        
        // Redirect to login page if not already there
        if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
          window.location.href = "/login";
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Token management functions
const setToken = (token) => {
  if (token) {
    httpServices.defaults.headers.common.Authorization = `Bearer ${token}`;
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
  }
};

const clearToken = () => {
  delete httpServices.defaults.headers.common.Authorization;
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
};

export { setToken, clearToken };
export default httpServices; 
