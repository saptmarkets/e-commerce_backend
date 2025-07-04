/**
 * API URL Debugger utility
 * 
 * This utility helps debug API URL configuration.
 */

// Get environment variable
const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || '';

// Get the correct API URL to avoid duplicate /api paths
export const getCorrectApiUrl = (url) => {
  // Don't modify URLs that are absolute (have http:// or https://)
  if (url.startsWith('http')) {
    return url;
  }
  
  const baseHasApi = API_BASE_URL.endsWith('/api');
  const urlStartsWithApi = url.startsWith('/api') || url.startsWith('api/');
  
  if (baseHasApi && urlStartsWithApi) {
    // Remove leading /api or api/ from the URL
    return url.replace(/^\/api\/|^api\//, '');
  } else if (!baseHasApi && !urlStartsWithApi) {
    // Add /api if neither base nor URL has it
    return `/api/${url.startsWith('/') ? url.substring(1) : url}`;
  }
  
  // Return original if no adjustment needed
  return url;
};

// Debug the current API base URL configuration
export const debugApiConfig = () => {
  console.log('---------------------');
  console.log('API URL CONFIGURATION');
  console.log('---------------------');
  console.log('BASE_URL:', API_BASE_URL);
  
  // Check if the base URL already has /api
  const exampleUrl = API_BASE_URL.endsWith('/api') 
    ? `${API_BASE_URL}/products` 
    : `${API_BASE_URL}/api/products`;
    
  console.log('Example products URL:', exampleUrl);
  console.log('---------------------');
  
  return {
    baseUrl: API_BASE_URL,
    sampleUrl: exampleUrl
  };
};

export default {
  debugApiConfig,
  getCorrectApiUrl
}; 