# 🚀 SaptMarkets E-commerce Platform

A comprehensive multi-platform e-commerce ecosystem built with modern technologies.

## 📋 Overview

SaptMarkets is a full-featured e-commerce platform consisting of:

- **🛒 Customer Store** (Next.js) - Customer-facing e-commerce website
- **🎛️ Admin Dashboard** (React.js/Vite) - Complete admin management panel
- **📱 Delivery Mobile App** (React Native) - Mobile app for delivery personnel
- **⚙️ Backend API** (Node.js/Express) - Central API server
- **🗄️ Database** (MongoDB Atlas) - Cloud database

## 🏗️ Architecture

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

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- MongoDB Atlas account
- Android Studio (for mobile app)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/saptmarkets.git
   cd saptmarkets
   ```

2. **Start all servers**
   ```bash
   # Windows
   start-all-servers.bat
   
   # Linux/Mac
   chmod +x start-all-servers.sh
   ./start-all-servers.sh
   ```

3. **Access applications**
   - Backend API: http://localhost:5055
   - Admin Dashboard: http://localhost:4100
   - Customer Store: http://localhost:3000
   - React Native Metro: http://localhost:8081

## 📦 Deployment

### 🗄️ 1. Database Setup (MongoDB Atlas)

1. Create MongoDB Atlas account
2. Create a new cluster (FREE tier recommended)
3. Configure database access and network access
4. Get connection string

### ⚙️ 2. Backend Deployment

**Option A: Railway (Recommended)**
```bash
# 1. Connect to Railway
# 2. Set environment variables
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/saptmarkets
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=production
PORT=5055

# 3. Deploy
git push origin main
```

**Option B: Render**
```bash
# Use existing render.yaml configuration
# Set environment variables in Render dashboard
```

### 🛒 3. Customer Store Deployment

**Vercel Deployment**
```bash
# 1. Connect to Vercel
# 2. Set root directory to 'customer'
# 3. Configure environment variables
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.railway.app/api
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-customer-store.vercel.app

# 4. Deploy
git push origin main
```

### 🎛️ 4. Admin Dashboard Deployment

**Vercel Deployment**
```bash
# 1. Connect to Vercel
# 2. Set root directory to 'admin'
# 3. Configure environment variables
VITE_API_BASE_URL=https://your-backend-url.railway.app/api

# 4. Deploy
git push origin main
```

### 📱 5. Mobile App Deployment

**Android App Store**
```bash
cd SaptMarketsDeliveryApp
npm install
npx react-native run-android --variant=release
```

**iOS App Store**
```bash
cd SaptMarketsDeliveryApp
npx react-native run-ios --configuration Release
# Use Xcode to archive and upload to App Store Connect
```

## 🔧 Environment Configuration

### Backend Environment Variables

Create `backend/.env`:
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
```

### Frontend Environment Variables

**Customer Store** (`customer/.env.local`):
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.railway.app/api
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-customer-store.vercel.app
```

**Admin Dashboard** (`admin/.env`):
```bash
VITE_API_BASE_URL=https://your-backend-url.railway.app/api
VITE_APP_NAME=SaptMarkets Admin
VITE_APP_VERSION=1.0.0
```

## 🚀 Automated Deployment

### Using Deployment Scripts

**Linux/Mac:**
```bash
chmod +x deploy-all.sh
./deploy-all.sh
```

**Windows:**
```bash
deploy-backend.bat
deploy-frontend.bat
build-mobile.bat
```

## 📊 Features

### Customer Store
- ✅ Product browsing and search
- ✅ Shopping cart management
- ✅ Secure checkout process
- ✅ User authentication
- ✅ Order tracking
- ✅ Multi-language support (Arabic/English)
- ✅ Payment gateway integration
- ✅ Real-time inventory updates

### Admin Dashboard
- ✅ Product management
- ✅ Order processing
- ✅ User management
- ✅ Inventory control
- ✅ Analytics and reporting
- ✅ Category management
- ✅ Coupon and promotion management
- ✅ Delivery management

### Delivery Mobile App
- ✅ Driver authentication
- ✅ Order assignment
- ✅ GPS tracking
- ✅ Delivery status updates
- ✅ Photo capture for deliveries
- ✅ Earnings tracking
- ✅ Route optimization

### Backend API
- ✅ RESTful API design
- ✅ JWT authentication
- ✅ File upload handling
- ✅ Real-time notifications
- ✅ Payment processing
- ✅ Email notifications
- ✅ Odoo ERP integration
- ✅ Analytics and reporting

## 🔐 Security Features

- JWT-based authentication
- Password encryption with bcrypt
- CORS protection
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection

## 📱 Mobile App Features

- **Android**: APK generation and Google Play Store deployment
- **iOS**: Xcode build and App Store deployment
- **Expo**: EAS Build for cloud builds
- **Permissions**: Camera, Location, Internet access

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **File Storage**: Cloudinary
- **Email**: SendGrid
- **Real-time**: Socket.io

### Frontend
- **Customer Store**: Next.js, Redux, Tailwind CSS
- **Admin Dashboard**: React.js, Vite, Tailwind CSS
- **Mobile App**: React Native, TypeScript

### DevOps
- **Backend Hosting**: Railway, Render, Heroku
- **Frontend Hosting**: Vercel, Netlify
- **Database**: MongoDB Atlas
- **Mobile**: EAS Build, App Store Connect, Google Play Console

## 📈 Performance Optimizations

- **Backend**: Request timeout handling, rate limiting
- **Frontend**: Code splitting, lazy loading, image optimization
- **Database**: Indexing, connection pooling
- **Mobile**: Bundle optimization, asset compression

## 🔍 Monitoring & Analytics

- **Backend**: Railway/Render built-in monitoring
- **Frontend**: Vercel Analytics, Google Analytics
- **Database**: MongoDB Atlas monitoring
- **Error Tracking**: Sentry integration

## 🐛 Troubleshooting

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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**🎉 Congratulations! Your SaptMarkets e-commerce platform is ready for production!** 