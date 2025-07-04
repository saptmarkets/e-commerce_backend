I have now refactored the API service in the delivery app. I found that it was using a mix of old and new API routes, and many of the routes were hardcoded. This was causing the "Route not found" error you were seeing.

I have done the following:
1.  Centralized all the correct API routes into the `apiConfig.js` file.
2.  Updated the `api.ts` service to use these centralized routes for all API calls.
3.  Removed several unused and incorrect functions that were pointing to old server endpoints.

This should resolve the clock-in issue. Please restart the backend server with `npm install && npm start` and then try to clock in again in the app. Let me know if it works. 