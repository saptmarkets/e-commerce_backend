import { NextResponse } from "next/server";

// This function can be marked `async` if using `await` inside
export async function middleware(request) {
  try {
    // Skip middleware for public routes and static files
    const publicPaths = [
      '/auth/login',
      '/auth/signup',
      '/auth/forget-password',
      '/auth/error',  // Add error path to public paths
      '/api/auth',
      '/_next',
      '/images',
      '/favicon.ico'
    ];
    
    const currentPath = new URL(request.url).pathname;
    
    // Check if the current path starts with any of the public paths
    if (publicPaths.some(path => currentPath.startsWith(path))) {
      return NextResponse.next();
    }

    // Only check auth for protected routes
    const isProtectedRoute = currentPath.startsWith('/checkout') || currentPath.startsWith('/user');
    
    if (!isProtectedRoute) {
      return NextResponse.next();
    }

    // Get the user info from cookies
    const userInfoCookie = request.cookies.get("userInfo");
    
    if (!userInfoCookie || !userInfoCookie.value) {
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('error', 'Please login to continue');
      url.searchParams.set('redirectUrl', encodeURIComponent(currentPath));
      return NextResponse.redirect(url);
    }

    let userInfo;
    try {
      userInfo = JSON.parse(userInfoCookie.value);
      
      // Check if token exists and is not expired
      if (!userInfo.token) {
        throw new Error('Invalid or expired session');
      }

      // Clone the request headers and add the authorization token
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('Authorization', `Bearer ${userInfo.token}`);

      // If we get here, the user is properly authenticated
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (e) {
      console.error('Authentication error:', e);
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('error', e.message || 'Authentication failed');
      url.searchParams.set('redirectUrl', encodeURIComponent(currentPath));
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error('Middleware error:', error);
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('error', 'An unexpected error occurred');
    return NextResponse.redirect(url);
  }
}

// Configure which paths the middleware will run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}; 