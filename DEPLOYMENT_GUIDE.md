# 🚀 SaptMarkets E-commerce Deployment Guide

## 📋 Overview

This guide covers deployment for all components of the SaptMarkets e-commerce ecosystem:

- **Backend API** (Node.js/Express)
- **Admin Dashboard** (React.js/Vite)
- **Customer Store** (Next.js)
- **Delivery Mobile App** (React Native)
- **Database** (MongoDB Atlas)

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Dashboard│    │  Customer Store │    │ Delivery Mobile │
│   (React/Vite)  │    │   (Next.js)     │    │   (React Native)│
│   Port: 4100    │    │   Port: 3000    │    │   (Mobile App)  │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      Backend API          │
                    │   (Node.js/Express)       │
                    │      Port: 5055           │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │    MongoDB Atlas          │
                    │     (Database)            │
                    └───────────────────────────┘
```

## 🔧 Prerequisites

### Required Accounts
- [MongoDB Atlas](https://www.mongodb.com/atlas) - Database
- [Vercel](https://vercel.com) - Frontend hosting
- [Railway](https://railway.app) - Backend hosting
- [Cloudinary](https://cloudinary.com) - Image storage
- [GitHub](https://github.com) - Code repository

### Required Tools
- Node.js 18+ 
- npm or yarn
- Git
- Android Studio (for mobile app)
- MongoDB Compass (optional)

## 📦 1. Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster

1. **Sign up** at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Create a new project** called "SaptMarkets"
3. **Build a database**:
   - Choose "FREE" tier (M0)
   - Select cloud provider (AWS/Google Cloud/Azure)
   - Choose region closest to your users
   - Click "Create"

### Step 2: Configure Database Access

1. Go to **Database Access** → **Add New Database User**
2. Create user with **Read and write to any database** permissions
3. Set username and password (save these securely)

### Step 3: Configure Network Access

1. Go to **Network Access** → **Add IP Address**
2. For development: Add your IP address
3. For production: Add `0.0.0.0/0` (allows all IPs)

### Step 4: Get Connection String

1. Click **Connect** on your cluster
2. Choose **Connect your application**
3. Copy the connection string
4. Replace `<password>` with your database user password

**Example Connection String:**
```
mongodb+srv://username:password@cluster.mongodb.net/saptmarkets?retryWrites=true&w=majority
```

## 🖥️ 2. Backend API Deployment

### Option A: Railway Deployment (Recommended)

1. **Connect GitHub Repository**
   - Go to [Railway](https://railway.app)
   - Sign in with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Configure Environment Variables**
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/saptmarkets
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_SECRET_FOR_VERIFY=your_verify_secret_key_here
   NODE_ENV=production
   PORT=5055
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   SENDGRID_API_KEY=your_sendgrid_api_key
   ```

3. **Deploy**
   - Railway will automatically detect Node.js
   - Build command: `npm install`
   - Start command: `npm start`
   - Railway will provide a URL like: `https://your-app.railway.app`

### Option B: Render Deployment

1. **Create render.yaml** (already exists in backend/)
2. **Connect to Render**
   - Go to [Render](https://render.com)
   - Create new Web Service
   - Connect your GitHub repository
   - Set environment variables as above

### Option C: Heroku Deployment

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Create Heroku App**
   ```bash
   cd backend
   heroku create your-saptmarkets-backend
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set MONGODB_URI="your_mongodb_uri"
   heroku config:set JWT_SECRET="your_jwt_secret"
   heroku config:set NODE_ENV="production"
   ```

4. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

## 🛒 3. Customer Store Deployment (Next.js)

### Vercel Deployment (Recommended)

1. **Connect to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository
   - Set root directory to `customer`

2. **Configure Environment Variables**
   ```bash
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.railway.app/api
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=https://your-customer-store.vercel.app
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

3. **Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Deploy**
   - Vercel will automatically deploy
   - URL will be: `https://your-customer-store.vercel.app`

### Netlify Deployment (Alternative)

1. **Connect to Netlify**
   - Go to [Netlify](https://netlify.com)
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `.next`

2. **Configure Environment Variables** (same as Vercel)

## 🎛️ 4. Admin Dashboard Deployment (React/Vite)

### Vercel Deployment

1. **Connect to Vercel**
   - Same process as customer store
   - Set root directory to `admin`

2. **Configure Environment Variables**
   ```bash
   VITE_API_BASE_URL=https://your-backend-url.railway.app/api
   VITE_APP_NAME=SaptMarkets Admin
   VITE_APP_VERSION=1.0.0
   ```

3. **Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Netlify Deployment

1. **Connect to Netlify**
   - Same process as customer store
   - Set build command: `npm run build`
   - Set publish directory: `dist`

## 📱 5. Delivery Mobile App Deployment

### Android App Store Deployment

1. **Build APK**
   ```bash
   cd SaptMarketsDeliveryApp
   npm install
   npx react-native run-android --variant=release
   ```

2. **Generate Signed APK**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

3. **Upload to Google Play Console**
   - Create developer account
   - Upload APK
   - Configure store listing
   - Submit for review

### iOS App Store Deployment

1. **Build for iOS**
   ```bash
   cd SaptMarketsDeliveryApp
   npx react-native run-ios --configuration Release
   ```

2. **Archive in Xcode**
   - Open `.xcworkspace` in Xcode
   - Select "Any iOS Device"
   - Product → Archive
   - Upload to App Store Connect

## 🔐 6. Environment Configuration

### Backend Environment Variables

Create `.env` file in `backend/`:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/saptmarkets

# JWT Secrets
JWT_SECRET=your_super_secret_jwt_key_here
JWT_SECRET_FOR_VERIFY=your_verify_secret_key_here

# Server
NODE_ENV=production
PORT=5055

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@saptmarkets.com

# Odoo Integration (if using)
ODOO_URL=your_odoo_url
ODOO_DB=your_odoo_database
ODOO_USERNAME=your_odoo_username
ODOO_PASSWORD=your_odoo_password

# Payment Gateways
STRIPE_SECRET_KEY=your_stripe_secret_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### Frontend Environment Variables

**Customer Store** (`customer/.env.local`):
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.railway.app/api
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-customer-store.vercel.app
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

**Admin Dashboard** (`admin/.env`):
```bash
VITE_API_BASE_URL=https://your-backend-url.railway.app/api
VITE_APP_NAME=SaptMarkets Admin
VITE_APP_VERSION=1.0.0
```

## 🚀 7. Deployment Scripts

### Automated Deployment Script

Create `deploy-all.sh`:

```bash
#!/bin/bash

echo "🚀 Starting SaptMarkets Deployment..."

# 1. Deploy Backend
echo "📦 Deploying Backend..."
cd backend
git add .
git commit -m "Deploy backend updates"
git push origin main

# 2. Deploy Customer Store
echo "🛒 Deploying Customer Store..."
cd ../customer
git add .
git commit -m "Deploy customer store updates"
git push origin main

# 3. Deploy Admin Dashboard
echo "🎛️ Deploying Admin Dashboard..."
cd ../admin
git add .
git commit -m "Deploy admin dashboard updates"
git push origin main

echo "✅ All deployments initiated!"
echo "📱 Mobile app needs manual deployment"
```

Make it executable:
```bash
chmod +x deploy-all.sh
```

## 🔍 8. Post-Deployment Checklist

### Backend Verification
- [ ] API endpoints responding
- [ ] Database connection working
- [ ] File uploads working
- [ ] Email sending functional
- [ ] JWT authentication working

### Frontend Verification
- [ ] Admin dashboard accessible
- [ ] Customer store loading
- [ ] API calls working
- [ ] Images loading properly
- [ ] Payment integration working

### Mobile App Verification
- [ ] App builds successfully
- [ ] API integration working
- [ ] Push notifications working
- [ ] GPS tracking functional

## 📊 9. Monitoring & Analytics

### Backend Monitoring
- **Railway**: Built-in monitoring
- **Logs**: Check application logs
- **Database**: MongoDB Atlas monitoring

### Frontend Monitoring
- **Vercel Analytics**: Built-in
- **Google Analytics**: Configure in apps
- **Error Tracking**: Sentry integration

## 🔧 10. Troubleshooting

### Common Issues

1. **CORS Errors**
   - Update CORS configuration in backend
   - Add frontend URLs to allowed origins

2. **Database Connection Issues**
   - Check MongoDB Atlas network access
   - Verify connection string
   - Check database user permissions

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies installed
   - Check environment variables

4. **API 404 Errors**
   - Verify API base URL in frontend
   - Check backend deployment status
   - Verify route configurations

## 📞 Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test locally first
4. Check platform-specific documentation

---

**🎉 Congratulations! Your SaptMarkets e-commerce platform is now deployed and ready for production!** 