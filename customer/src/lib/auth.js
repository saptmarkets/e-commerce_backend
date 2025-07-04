import { useSession } from "next-auth/react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

/**
 * Get user session from Next.js session (Component-based)
 * @returns {Object|null} The user session or null if not found
 */
export const useUserSession = () => {
  const { data } = useSession();
  const userInfo = data?.user || null;
  return userInfo;
};

/**
 * Get the user session from cookies (can be used anywhere)
 * @returns {Object|null} The user session or null if not found
 */
export const getUserSession = () => {
  try {
    const userInfoStr = Cookies.get("userInfo");
    if (!userInfoStr) return null;
    
    const userInfo = JSON.parse(userInfoStr);
    
    // Check if token is valid and not expired
    if (userInfo?.token && !isTokenExpired(userInfo.token)) {
      return userInfo;
    } else if (userInfo?.token && isTokenExpired(userInfo.token)) {
      // If token is expired, clear the session
      clearUserSession();
      return null;
    }
    
    return userInfo;
  } catch (error) {
    console.error("Error parsing user session:", error);
    // If there's an error, clear the potentially corrupted session
    clearUserSession();
    return null;
  }
};

/**
 * Check if a JWT token is expired
 * @param {string} token - The JWT token to check
 * @returns {boolean} True if token is expired, false otherwise
 */
export const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    // Check if token has expiration claim and if it's expired
    return decoded.exp ? decoded.exp < currentTime : false;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true; // Assume expired if we can't decode
  }
};

/**
 * Clear all user session data (cookies, localStorage)
 */
export const clearUserSession = () => {
  // Clear cookies
  Cookies.remove("userInfo", { path: '/' });
  Cookies.remove("couponInfo", { path: '/' });
  
  // Clear localStorage if available
  if (typeof window !== 'undefined') {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("cartItems");
  }
};

/**
 * Handle user logout with optional redirect
 * @param {Function} dispatch - Context dispatch function
 * @param {Function} signOut - NextAuth signOut function
 * @param {boolean} shouldRedirect - Whether to redirect to login page
 */
export const handleUserLogout = async (dispatch, signOut, shouldRedirect = true) => {
  // Clear all session data
  clearUserSession();
  
  // Update context if dispatch function provided
  if (dispatch) {
    dispatch({ type: "USER_LOGOUT" });
  }
  
  // Clear NextAuth session if signOut function provided
  if (signOut) {
    try {
      await signOut({ redirect: false });
    } catch (error) {
      console.error("Error during NextAuth signOut:", error);
    }
  }
  
  // Redirect to login page if requested
  if (shouldRedirect && typeof window !== 'undefined') {
    window.location.href = "/auth/login";
  }
};
