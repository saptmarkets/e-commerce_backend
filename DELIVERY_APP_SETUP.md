# SaptMarkets Delivery App Setup Guide

This guide will help you set up and run the SaptMarkets Delivery App development environment.

## Prerequisites

1. Node.js and npm installed
2. Android Studio with Android SDK installed
3. Android Emulator configured and running
4. MongoDB installed and running locally (or accessible remote instance)

## Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm run dev
   ```

The server will start on http://localhost:5055

## React Native App Setup

1. Navigate to the SaptMarketsDeliveryApp directory:
   ```
   cd SaptMarketsDeliveryApp
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the React Native Metro bundler:
   ```
   npm start
   ```

4. In a new terminal, deploy to Android:
   ```
   npm run android
   ```

## Using the Delivery App

The app comes preconfigured with a test driver account:

- **Email**: driver@saptmarkets.com
- **Password**: driver123

## API Endpoints

All delivery-related API endpoints are configured in:
`SaptMarketsDeliveryApp/src/config/apiConfig.js`

The backend is already configured to accept these API requests from the delivery app.

## Quick Start

For convenience, you can use the PowerShell script to start the backend:

```
./start-development.ps1
```

Then start the React Native app manually as described above.

## Troubleshooting

1. If Metro bundler fails to start:
   - Delete the `node_modules` folder and run `npm install` again
   - Try clearing the cache with `npm start -- --reset-cache`

2. If the app fails to connect to the backend:
   - Make sure the backend server is running
   - Check that the emulator can access localhost via 10.0.2.2
   - Check your firewall settings

3. If the Android build fails:
   - Make sure local.properties is correctly configured
   - Ensure Android SDK is properly installed and configured
   - Verify that the emulator is running 