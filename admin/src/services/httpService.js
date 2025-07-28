import axios from "axios";
import Cookies from "js-cookie";
import { getCorrectApiUrl } from "../utils/apiDebugger";

// Get the correct base URL from environment variable
const getBaseUrl = () => {
  // Use environment variable for API base URL
  const baseUrl = import.meta.env.VITE_APP_API_BASE_URL || "http://127.0.0.1:5055/api";
  // Log the configured base URL
  console.log("API Base URL from env:", import.meta.env.VITE_APP_API_BASE_URL);
  console.log("Using API Base URL:", baseUrl);
  
  return baseUrl;
};

// Debug info for API URL
const BASE_URL = getBaseUrl();
console.log("Using API Base URL:", BASE_URL);

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 500000, // Increased from 50000ms (50s) to 500000ms (500s) - 10x increase for Odoo sync operations
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
instance.interceptors.request.use(function (config) {
  // Do something before request is sent
  let adminInfo;
  if (Cookies.get("adminInfo")) {
    adminInfo = JSON.parse(Cookies.get("adminInfo"));
  }

  let company;
  if (Cookies.get("company")) {
    company = Cookies.get("company");
  }

  // Fix URL path for API requests - ensure proper /api/ prefix without duplication
  if (config.url && !config.url.startsWith('http')) {
    const originalUrl = config.url;
    
    // Special handling for units and categories endpoints
    if (config.url.includes('units') || config.url.includes('category')) {
      console.log(`Special endpoint detected: ${config.url}`);
    }
    
    // Check if BASE_URL already includes /api
    const baseHasApi = BASE_URL.includes('/api');
    
    if (baseHasApi) {
      // BASE_URL already has /api, so just use the relative URL
      // Remove leading slash from path to avoid double slashes
      let cleanUrl = config.url.startsWith('/') ? config.url.substring(1) : config.url;
      // Always add a leading slash for proper URL construction
      config.url = `/${cleanUrl}`;
      console.log(`BASE_URL has /api, using path: ${originalUrl} -> ${config.url}`);
    } else {
      // BASE_URL doesn't have /api, so add it
      const cleanUrl = config.url.replace(/^\/+/, ''); // Remove leading slashes
      config.url = `/api/${cleanUrl}`;
      console.log(`Added API prefix: ${originalUrl} -> ${config.url}`);
    }
  }

  console.log(`Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
  
  // Add headers
  const headers = {
    authorization: adminInfo ? `Bearer ${adminInfo.token}` : null,
    company: company || null,
  };

  return {
    ...config,
    headers: {
      ...config.headers,
      ...headers
    },
  };
}, function (error) {
  console.error("Request error:", error);
  return Promise.reject(error);
});

// Add a response interceptor
instance.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, {
      status: response.status,
      statusText: response.statusText,
      data: response.data ? (typeof response.data === 'object' ? 'object' : 'non-object') : 'no data'
    });
    
    // Enhanced logging for troubleshooting specific endpoints
    if (response.config.url.includes('units') || 
        response.config.url.includes('category') || 
        response.config.url.includes('product-units') || 
        response.config.url.includes('products')) {
      
      console.log('API response details:', {
        url: response.config.url,
        method: response.config.method,
        status: response.status,
        hasData: !!response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : [],
        firstItem: Array.isArray(response.data) && response.data.length > 0 ? 
          (typeof response.data[0] === 'object' ? Object.keys(response.data[0]) : typeof response.data[0]) : 
          null
      });
      
      // Check for empty arrays
      if (Array.isArray(response.data) && response.data.length === 0) {
        console.warn(`Empty array received from ${response.config.url}`);
      }
      
      // Check for data structure issues
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        // If we expect an array but got an object with a data property that's an array
        if (response.data.data && Array.isArray(response.data.data)) {
          console.log('Found data array inside response object:', {
            dataLength: response.data.data.length,
            firstItemType: response.data.data.length > 0 ? typeof response.data.data[0] : 'none'
          });
        }
        // If we expect an array but got an object with units or categories property that's an array
        if (response.data.units && Array.isArray(response.data.units)) {
          console.log('Found units array inside response object:', {
            unitsLength: response.data.units.length,
            firstUnitType: response.data.units.length > 0 ? typeof response.data.units[0] : 'none'
          });
        }
        if (response.data.categories && Array.isArray(response.data.categories)) {
          console.log('Found categories array inside response object:', {
            categoriesLength: response.data.categories.length,
            firstCategoryType: response.data.categories.length > 0 ? typeof response.data.categories[0] : 'none'
          });
        }
      }
    }
    
    return response;
  },
  (error) => {
    console.error("Response error:", error.message);
    
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
      console.error("URL:", error.config.url);
      console.error("Method:", error.config.method);
      console.error("Headers:", error.config.headers);
      
      // Special handling for units and categories endpoint errors
      if (error.config.url.includes('units') || error.config.url.includes('category')) {
        console.error(`Error with ${error.config.url.includes('units') ? 'units' : 'category'} endpoint`);
        console.error("This might be due to API route changes or backend issues");
      }
      
      if (error.response.status === 404) {
        console.error("404 Not Found Error - Full URL:", `${error.config.baseURL}${error.config.url}`);
        
        // Try to log available API routes for debugging
        console.error("You might want to check if this route exists in your backend");
      }
    } else if (error.request) {
      console.error("Request was made but no response received");
      console.error("Request:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    
    return Promise.reject(error);
  }
);

const responseBody = (response) => {
  // Special handling for units and categories endpoints to normalize responses
  if (response.config.url.includes('/units') || response.config.url.includes('/category')) {
    console.log('Processing response from units/category endpoint');
    // If the response is an object with a units or categories property, return that
    if (response.data && typeof response.data === 'object') {
      if (response.data.units) {
        console.log(`Returning ${response.data.units.length} units from response.data.units`);
        return response.data;
      }
      if (response.data.categories) {
        console.log(`Returning ${response.data.categories.length} categories from response.data.categories`);
        return response.data;
      }
      if (response.data.data && Array.isArray(response.data.data)) {
        console.log(`Returning data array with ${response.data.data.length} items`);
        return response.data;
      }
    }
    // IMPORTANT: If none of the nested conditions matched, but it's a /units or /category URL,
    // we still want to return the direct response.data (which is the array in this case).
    return response.data; // <--- THIS LINE IS THE FIX!
  }
  return response.data;
};

const requests = {
  get: (url, body, headers) =>
    instance.get(url, body, headers).then(responseBody),

  post: (url, body) => instance.post(url, body).then(responseBody),

  put: (url, body, headers) =>
    instance.put(url, body, headers).then(responseBody),

  patch: (url, body) => instance.patch(url, body).then(responseBody),

  delete: (url, body) => 
    instance.delete(url, { data: body }).then(responseBody),
};

export default requests;
