# SaptMarkets Backend API Specification

## 📋 Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Authentication & Authorization](#authentication--authorization)
7. [File Upload & Media Management](#file-upload--media-management)
8. [Odoo ERP Integration](#odoo-erp-integration)
9. [Real-time Features](#real-time-features)
10. [Security Features](#security-features)
11. [Performance Optimizations](#performance-optimizations)
12. [Environment Configuration](#environment-configuration)
13. [Deployment](#deployment)
14. [Monitoring & Analytics](#monitoring--analytics)

---

## 🎯 Overview

The SaptMarkets Backend is a comprehensive Node.js/Express.js API that powers a multi-component e-commerce ecosystem consisting of:
- **Customer Store** (Next.js frontend)
- **Admin Dashboard** (React.js frontend)
- **Delivery Mobile App** (React Native)
- **Odoo ERP Integration** (Real-time synchronization)

### Key Features
- Multi-tenant e-commerce platform
- Real-time inventory management
- Advanced product unit system
- Comprehensive order management
- Delivery system with GPS tracking
- Odoo ERP synchronization
- Multi-language support (Arabic/English)
- Real-time notifications
- Analytics and reporting
- Payment gateway integration

---

## 🛠 Technology Stack

### Core Framework
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling

### Authentication & Security
- **JWT** (jsonwebtoken) - Token-based authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting

### File Management
- **Multer** - File upload handling
- **Cloudinary** - Cloud image storage and optimization

### Email Services
- **SendGrid** - Primary email service
- **Nodemailer** - Fallback email service
- **Mailchecker** - Email validation

### Real-time Communication
- **Socket.io** - Real-time bidirectional communication

### External Integrations
- **Odoo ERP** - Product, inventory, and pricing synchronization
- **PDFKit** - PDF generation for invoices and reports

### Development Tools
- **Nodemon** - Development server with auto-restart
- **dotenv** - Environment variable management

---

## 🏗 Architecture

### Directory Structure
```
backend/
├── config/                 # Configuration files
│   ├── auth.js            # Authentication middleware
│   ├── db.js              # Database connection
│   ├── cloudinary.js      # Cloudinary configuration
│   └── seed.js            # Database seeding
├── controller/            # Business logic controllers
│   ├── productController.js
│   ├── orderController.js
│   ├── customerController.js
│   ├── adminController.js
│   ├── deliveryController.js
│   ├── odooSyncController.js
│   └── ... (25 controllers)
├── models/                # Mongoose schemas
│   ├── Product.js
│   ├── Order.js
│   ├── Customer.js
│   ├── Admin.js
│   ├── Category.js
│   ├── Unit.js
│   ├── Promotion.js
│   └── ... (30 models)
├── routes/                # API route definitions
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   ├── customerRoutes.js
│   ├── adminRoutes.js
│   ├── deliveryRoutes.js
│   └── ... (25 route files)
├── services/              # External service integrations
│   ├── odooService.js
│   ├── odooSyncService.js
│   ├── odooImportService.js
│   ├── SalesAnalyticsService.js
│   ├── CustomerAnalyticsService.js
│   ├── InventoryAnalyticsService.js
│   └── DeliveryAnalyticsService.js
├── utils/                 # Utility functions and data
│   ├── settings.js        # Store customization settings
│   ├── products.js        # Sample product data
│   ├── categories.js      # Sample category data
│   ├── customers.js       # Sample customer data
│   └── ... (15 utility files)
├── scripts/               # Database migration scripts
├── migrations/            # Database migration files
├── lib/                   # Third-party library configurations
├── public/                # Static files
└── start-server.js        # Main server entry point
```

### Server Configuration
- **Port**: 5055 (configurable via environment)
- **Request Timeout**: 10 minutes
- **Body Size Limit**: 4MB
- **CORS**: Configured for multiple origins
- **Security**: Helmet.js for security headers

---

## 🗄 Database Schema

### Core Models

#### 1. Product Model
```javascript
{
  productId: String,           // Odoo product ID
  sku: String,                 // Stock keeping unit
  barcode: String,             // Product barcode
  title: Object,               // Multi-language title {en: "", ar: ""}
  description: Object,         // Multi-language description
  slug: String,                // URL-friendly identifier
  categories: [ObjectId],      // Multiple category references
  category: ObjectId,          // Primary category
  image: Array,                // Product images (max 10)
  stock: Number,               // Total stock quantity
  locationStocks: [{           // Location-specific stock
    locationId: Number,        // Odoo location ID
    name: String,              // Location name
    qty: Number                // Available quantity
  }],
  sales: Number,               // Total sales count
  tag: [String],               // Product tags
  price: Number,               // Single selling price
  prices: {                    // Structured pricing
    price: Number,
    originalPrice: Number,
    discount: Number
  },
  basicUnit: ObjectId,         // Reference to Unit model
  status: String,              // active/inactive
  featured: Boolean,           // Featured product flag
  trending: Boolean,           // Trending product flag
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. ProductUnit Model
```javascript
{
  productId: ObjectId,         // Reference to Product
  unitId: ObjectId,            // Reference to Unit
  unitValue: Number,           // Conversion value
  price: Number,               // Unit-specific price
  stock: Number,               // Unit-specific stock
  isActive: Boolean,           // Unit availability
  isDefault: Boolean,          // Default unit flag
  conversionRate: Number,      // Conversion to basic unit
  barcode: String,             // Unit-specific barcode
  sku: String,                 // Unit-specific SKU
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. Order Model
```javascript
{
  user: ObjectId,              // Reference to Customer
  invoice: Number,             // Auto-incremented invoice number
  cart: [{                     // Order items
    id: String,
    title: String,
    price: Number,
    quantity: Number,
    image: String,
    productId: String,
    selectedUnitId: String,
    unitName: String,
    unitValue: Number,
    packQty: Number,
    basePrice: Number,
    sku: String,
    category: String,
    isCombo: Boolean,          // Combo deal flag
    promotion: Object,         // Promotion details
    selectedProducts: Object,  // Combo product breakdown
    comboPrice: Number,
    comboDetails: Object       // Detailed combo information
  }],
  user_info: {                 // Customer information
    name: String,
    email: String,
    contact: String,
    address: String,
    city: String,
    country: String,
    zipCode: String,
    deliveryLocation: {        // GPS coordinates
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      googleMapsLink: String,
      googleMapsAddressLink: String
    }
  },
  payment_status: String,      // pending/paid/failed
  payment_method: String,      // stripe/paypal/razorpay/cod
  order_status: String,        // pending/processing/shipped/delivered/cancelled
  delivery_status: String,     // pending/assigned/picked/delivered
  delivery_personnel: ObjectId, // Reference to delivery personnel
  delivery_fee: Number,
  subtotal: Number,
  total: Number,
  discount: Number,
  coupon: ObjectId,            // Applied coupon
  notes: String,
  estimated_delivery: Date,
  actual_delivery: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. Customer Model
```javascript
{
  name: String,                // Customer name
  email: String,               // Email address (unique)
  phone: String,               // Phone number
  password: String,            // Hashed password
  avatar: String,              // Profile image
  address: String,             // Default address
  city: String,                // City
  country: String,             // Country
  zipCode: String,             // Postal code
  isVerified: Boolean,         // Email verification status
  isActive: Boolean,           // Account status
  role: String,                // customer
  loyalty_points: Number,      // Loyalty program points
  total_orders: Number,        // Order count
  total_spent: Number,         // Total amount spent
  last_login: Date,            // Last login timestamp
  createdAt: Date,
  updatedAt: Date
}
```

#### 5. Admin Model
```javascript
{
  name: String,                // Admin name
  email: String,               // Email address (unique)
  phone: String,               // Phone number
  password: String,            // Hashed password
  avatar: String,              // Profile image
  role: String,                // admin/super_admin
  permissions: [String],       // Admin permissions
  isActive: Boolean,           // Account status
  last_login: Date,            // Last login timestamp
  createdAt: Date,
  updatedAt: Date
}
```

#### 6. Category Model
```javascript
{
  name: Object,                // Multi-language name {en: "", ar: ""}
  slug: String,                // URL-friendly identifier
  description: Object,         // Multi-language description
  image: String,               // Category image
  parent: ObjectId,            // Parent category reference
  children: [ObjectId],        // Child categories
  isActive: Boolean,           // Category status
  isHome: Boolean,             // Homepage display flag
  sortOrder: Number,           // Display order
  createdAt: Date,
  updatedAt: Date
}
```

#### 7. Unit Model
```javascript
{
  name: Object,                // Multi-language name {en: "", ar: ""}
  symbol: String,              // Unit symbol (kg, L, pcs)
  type: String,                // weight/volume/piece
  isBasic: Boolean,            // Basic unit flag
  conversionRate: Number,      // Conversion to basic unit
  isActive: Boolean,           // Unit status
  sortOrder: Number,           // Display order
  createdAt: Date,
  updatedAt: Date
}
```

#### 8. Promotion Model
```javascript
{
  name: Object,                // Multi-language name
  description: Object,         // Multi-language description
  type: String,                // discount/combo/bogo
  discount_type: String,       // percentage/fixed
  discount_value: Number,      // Discount amount
  startDate: Date,             // Promotion start date
  endDate: Date,               // Promotion end date
  status: String,              // active/inactive
  products: [ObjectId],        // Applicable products
  categories: [ObjectId],      // Applicable categories
  minimum_order: Number,       // Minimum order amount
  maximum_discount: Number,    // Maximum discount limit
  usage_limit: Number,         // Usage limit per customer
  used_count: Number,          // Current usage count
  isActive: Boolean,           // Promotion status
  createdAt: Date,
  updatedAt: Date
}
```

#### 9. DeliveryAssignment Model
```javascript
{
  order: ObjectId,             // Reference to Order
  delivery_personnel: ObjectId, // Reference to delivery personnel
  status: String,              // assigned/picked/delivered/cancelled
  assigned_at: Date,           // Assignment timestamp
  picked_at: Date,             // Pickup timestamp
  delivered_at: Date,          // Delivery timestamp
  estimated_delivery: Date,    // Estimated delivery time
  actual_delivery: Date,       // Actual delivery time
  notes: String,               // Delivery notes
  rating: Number,              // Customer rating
  feedback: String,            // Customer feedback
  createdAt: Date,
  updatedAt: Date
}
```

### Odoo Integration Models

#### 10. OdooProduct Model
```javascript
{
  odoo_id: Number,             // Odoo product ID
  name: String,                // Product name in Odoo
  default_code: String,        // Odoo default code
  barcode: String,             // Product barcode
  list_price: Number,          // Odoo list price
  standard_price: Number,      // Odoo cost price
  categ_id: Number,            // Odoo category ID
  type: String,                // product/consu/service
  active: Boolean,             // Odoo active status
  last_sync: Date,             // Last synchronization timestamp
  sync_status: String,         // success/failed/pending
  error_message: String,       // Sync error details
  createdAt: Date,
  updatedAt: Date
}
```

#### 11. OdooSyncLog Model
```javascript
{
  sync_type: String,           // products/inventory/pricing
  status: String,              // success/failed/in_progress
  start_time: Date,            // Sync start timestamp
  end_time: Date,              // Sync end timestamp
  records_processed: Number,   // Number of records processed
  records_successful: Number,  // Successfully synced records
  records_failed: Number,      // Failed sync records
  error_details: String,       // Error information
  created_by: ObjectId,        // Admin who initiated sync
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 API Endpoints

### Base URL: `http://localhost:5055/api`

### Authentication Endpoints
```
POST   /customer/register              # Customer registration
POST   /customer/login                 # Customer login
POST   /customer/forget-password       # Password reset request
POST   /customer/reset-password        # Password reset
POST   /customer/email-verification    # Email verification
POST   /admin/login                    # Admin login
POST   /admin/forget-password          # Admin password reset
POST   /admin/reset-password           # Admin password reset
```

### Product Endpoints
```
GET    /products                       # Get all products
GET    /products/:id                   # Get product by ID
GET    /products/slug/:slug            # Get product by slug
GET    /products/search                # Search products
GET    /products/category/:categoryId  # Get products by category
GET    /products/featured              # Get featured products
GET    /products/trending              # Get trending products
POST   /products                       # Create product (Admin)
PUT    /products/:id                   # Update product (Admin)
DELETE /products/:id                   # Delete product (Admin)
```

### Product Unit Endpoints
```
GET    /product-units                  # Get all product units
GET    /product-units/product/:productId # Get units for product
POST   /product-units                  # Create product unit (Admin)
PUT    /product-units/:id              # Update product unit (Admin)
DELETE /product-units/:id              # Delete product unit (Admin)
```

### Category Endpoints
```
GET    /category                       # Get all categories
GET    /category/:id                   # Get category by ID
GET    /category/slug/:slug            # Get category by slug
GET    /category/tree                  # Get category tree
POST   /category                       # Create category (Admin)
PUT    /category/:id                   # Update category (Admin)
DELETE /category/:id                   # Delete category (Admin)
```

### Order Endpoints
```
GET    /order                          # Get all orders (Admin)
GET    /order/:id                      # Get order by ID
POST   /order                          # Create order (Customer)
PUT    /order/:id                      # Update order (Admin)
DELETE /order/:id                      # Delete order (Admin)
GET    /order/analytics                # Order analytics (Admin)
```

### Customer Order Endpoints (Authenticated)
```
GET    /order                          # Get customer orders
GET    /order/:id                      # Get customer order by ID
POST   /order                          # Create customer order
PUT    /order/:id/cancel               # Cancel customer order
```

### Customer Endpoints
```
GET    /customer                       # Get all customers (Admin)
GET    /customer/:id                   # Get customer by ID
GET    /customer/profile               # Get customer profile (Authenticated)
PUT    /customer/profile               # Update customer profile (Authenticated)
DELETE /customer/:id                   # Delete customer (Admin)
GET    /customer/analytics             # Customer analytics (Admin)
```

### Admin Endpoints
```
GET    /admin                          # Get all admins (Super Admin)
GET    /admin/:id                      # Get admin by ID
POST   /admin                          # Create admin (Super Admin)
PUT    /admin/:id                      # Update admin (Super Admin)
DELETE /admin/:id                      # Delete admin (Super Admin)
```

### Delivery Endpoints
```
GET    /delivery                       # Get delivery information
POST   /delivery/calculate             # Calculate delivery fee
GET    /delivery-personnel             # Get delivery personnel (Admin)
POST    /delivery-personnel            # Create delivery personnel (Admin)
PUT    /delivery-personnel/:id         # Update delivery personnel (Admin)
DELETE /delivery-personnel/:id         # Delete delivery personnel (Admin)
```

### Mobile Delivery Endpoints
```
POST   /mobile-delivery/login          # Delivery personnel login
GET    /mobile-delivery/orders         # Get assigned orders
PUT    /mobile-delivery/orders/:id     # Update order status
POST    /mobile-delivery/location      # Update delivery location
```

### Promotion Endpoints
```
GET    /promotions                     # Get all promotions
GET    /promotions/:id                 # Get promotion by ID
GET    /promotions/active              # Get active promotions
POST    /promotions                    # Create promotion (Admin)
PUT    /promotions/:id                 # Update promotion (Admin)
DELETE /promotions/:id                 # Delete promotion (Admin)
```

### Coupon Endpoints
```
GET    /coupon                         # Get all coupons (Admin)
GET    /coupon/:code                   # Validate coupon code
POST    /coupon                        # Create coupon (Admin)
PUT    /coupon/:id                     # Update coupon (Admin)
DELETE /coupon/:id                     # Delete coupon (Admin)
```

### Banner Endpoints
```
GET    /banner                         # Get all banners
GET    /banner/:id                     # Get banner by ID
POST    /banner                        # Create banner (Admin)
PUT    /banner/:id                     # Update banner (Admin)
DELETE /banner/:id                     # Delete banner (Admin)
```

### Homepage Section Endpoints
```
GET    /homepage-sections              # Get homepage sections
GET    /homepage-sections/:id          # Get section by ID
POST    /homepage-sections             # Create section (Admin)
PUT    /homepage-sections/:id          # Update section (Admin)
DELETE /homepage-sections/:id          # Delete section (Admin)
```

### Notification Endpoints (Authenticated)
```
GET    /notification                   # Get customer notifications
POST    /notification/read             # Mark notification as read
DELETE /notification/:id               # Delete notification
```

### Setting Endpoints
```
GET    /setting                        # Get store settings
PUT    /setting                        # Update store settings (Admin)
```

### Upload Endpoints
```
POST    /upload/image                  # Upload image
POST    /upload/multiple               # Upload multiple images
DELETE /upload/:filename               # Delete uploaded file
```

### Odoo Sync Endpoints (Admin Only)
```
POST    /odoo-sync/products            # Sync products from Odoo
POST    /odoo-sync/inventory           # Sync inventory from Odoo
POST    /odoo-sync/pricing             # Sync pricing from Odoo
GET     /odoo-sync/logs                # Get sync logs
POST    /odoo-sync/test-connection     # Test Odoo connection
```

### Report Endpoints (Admin Only)
```
GET     /reports/sales                 # Sales reports
GET     /reports/inventory             # Inventory reports
GET     /reports/customers             # Customer reports
GET     /reports/delivery              # Delivery reports
GET     /reports/analytics             # General analytics
```

### Utility Endpoints
```
GET     /currency                      # Get supported currencies
GET     /language                      # Get supported languages
GET     /attributes                    # Get product attributes
```

---

## 🔐 Authentication & Authorization

### JWT Token Structure
```javascript
{
  _id: ObjectId,              // User ID
  name: String,               // User name
  email: String,              // User email
  role: String                // customer/admin/super_admin
}
```

### Token Configuration
- **Access Token**: 7 days expiration
- **Verification Token**: 24 hours expiration
- **Secret Keys**: Separate keys for access and verification

### Middleware Functions

#### 1. isAuth
- Validates JWT token
- Adds user data to request object
- Handles token corruption detection
- Returns 401 for invalid/missing tokens

#### 2. isAdmin
- Requires valid authentication
- Checks user role for admin privileges
- Returns 403 for insufficient permissions

#### 3. isCustomer
- Optional authentication for customer endpoints
- Allows access without token for public features
- Sets customer ID in headers when available

#### 4. requireCustomerAuth
- Strict customer authentication
- Returns 401 for unauthenticated requests
- Validates customer ID format

### Password Security
- **Hashing**: bcryptjs with salt rounds
- **Encryption**: AES-256 for sensitive data
- **Validation**: Email format and strength requirements

---

## 📁 File Upload & Media Management

### Cloudinary Integration
- **Cloud Storage**: Automatic image optimization
- **Transformations**: Resize, crop, format conversion
- **CDN**: Global content delivery network
- **Backup**: Automatic backup and versioning

### Upload Configuration
```javascript
{
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
}
```

### Supported File Types
- **Images**: JPG, PNG, GIF, WebP, AVIF
- **Maximum Size**: 4MB per file
- **Maximum Files**: 10 images per product

### Upload Endpoints
```
POST /api/upload/image          # Single image upload
POST /api/upload/multiple       # Multiple image upload
DELETE /api/upload/:filename    # Delete uploaded file
```

### Image Processing
- **Automatic Optimization**: Quality and format optimization
- **Responsive Images**: Multiple sizes for different devices
- **Lazy Loading**: Efficient image loading
- **Alt Text**: Accessibility support

---

## 🔄 Odoo ERP Integration

### Integration Overview
The backend maintains real-time synchronization with Odoo ERP system for:
- Product catalog management
- Inventory tracking
- Pricing updates
- Category management
- Stock level monitoring

### Odoo Service Configuration
```javascript
{
  host: process.env.ODOO_HOST,
  port: process.env.ODOO_PORT,
  database: process.env.ODOO_DATABASE,
  username: process.env.ODOO_USERNAME,
  password: process.env.ODOO_PASSWORD,
  batchSize: 200,
  maxRetries: 3
}
```

### Synchronization Types

#### 1. Product Synchronization
- **Frequency**: On-demand and scheduled
- **Data**: Product details, images, categories
- **Conflict Resolution**: Odoo as source of truth
- **Error Handling**: Retry mechanism with logging

#### 2. Inventory Synchronization
- **Real-time**: Stock level updates
- **Location-based**: Multiple warehouse support
- **Unit Conversion**: Automatic unit conversion
- **Threshold Alerts**: Low stock notifications

#### 3. Pricing Synchronization
- **Pricelist Support**: Multiple pricing tiers
- **Currency Conversion**: Multi-currency support
- **Promotional Pricing**: Discount and promotion sync
- **Cost Price Tracking**: Margin calculation

### Sync Models

#### OdooProduct
- Maps Odoo products to local database
- Maintains sync status and error tracking
- Supports incremental updates

#### OdooSyncLog
- Tracks all synchronization activities
- Records success/failure statistics
- Provides audit trail for debugging

#### OdooPricelist
- Manages multiple pricing tiers
- Supports customer-specific pricing
- Handles promotional pricing

#### OdooStock
- Real-time inventory tracking
- Location-based stock management
- Unit conversion support

### API Endpoints for Odoo Sync
```
POST /api/odoo-sync/products        # Sync products
POST /api/odoo-sync/inventory        # Sync inventory
POST /api/odoo-sync/pricing          # Sync pricing
GET  /api/odoo-sync/logs             # View sync logs
POST /api/odoo-sync/test-connection  # Test connection
```

### Error Handling
- **Connection Failures**: Automatic retry with exponential backoff
- **Data Validation**: Schema validation before import
- **Conflict Resolution**: Merge strategies for conflicting data
- **Logging**: Comprehensive error logging and monitoring

---

## ⚡ Real-time Features

### Socket.io Integration
- **Real-time Updates**: Live order status updates
- **Delivery Tracking**: GPS location updates
- **Inventory Alerts**: Low stock notifications
- **Admin Notifications**: Order and system alerts

### Event Types
```javascript
// Order Events
'order_created'           // New order notification
'order_status_changed'    // Order status update
'order_assigned'          // Order assigned to delivery

// Delivery Events
'delivery_location'       // GPS location update
'delivery_status'         // Delivery status change
'delivery_completed'      // Delivery completion

// Inventory Events
'stock_updated'           // Stock level change
'low_stock_alert'         // Low stock notification

// System Events
'admin_notification'      // Admin system alerts
'customer_notification'   // Customer notifications
```

### Room Management
- **Admin Room**: All admin users
- **Customer Room**: Individual customer rooms
- **Delivery Room**: Delivery personnel room
- **Order Room**: Order-specific updates

### Connection Management
- **Authentication**: JWT-based socket authentication
- **Reconnection**: Automatic reconnection handling
- **Heartbeat**: Connection health monitoring
- **Cleanup**: Automatic cleanup of disconnected users

---

## 🛡 Security Features

### Security Headers (Helmet.js)
```javascript
{
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  frameguard: {
    action: 'deny'
  }
}
```

### Rate Limiting
```javascript
{
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
}
```

### Input Validation
- **Sanitization**: XSS prevention
- **Validation**: Schema-based validation
- **Type Checking**: Strict type validation
- **SQL Injection**: Mongoose ORM protection

### CORS Configuration
```javascript
{
  origin: [
    'http://localhost:4100',  // Admin dashboard
    'http://localhost:3000',  // Customer store
    'http://localhost:3001'   // Development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'company'],
  credentials: true
}
```

### Data Encryption
- **Passwords**: bcryptjs hashing
- **Sensitive Data**: AES-256 encryption
- **Tokens**: JWT with secure secrets
- **API Keys**: Environment variable protection

---

## ⚡ Performance Optimizations

### Database Optimizations
- **Indexing**: Strategic database indexes
- **Query Optimization**: Efficient MongoDB queries
- **Connection Pooling**: Optimized connection management
- **Caching**: Redis caching for frequently accessed data

### API Optimizations
- **Pagination**: Efficient data pagination
- **Filtering**: Advanced filtering capabilities
- **Sorting**: Optimized sorting algorithms
- **Projection**: Selective field retrieval

### File Upload Optimizations
- **Image Compression**: Automatic image optimization
- **CDN**: Global content delivery
- **Lazy Loading**: Efficient image loading
- **Caching**: Browser and CDN caching

### Memory Management
- **Garbage Collection**: Optimized memory usage
- **Stream Processing**: Efficient file processing
- **Connection Limits**: Controlled resource usage
- **Timeout Handling**: Proper request timeout management

---

## ⚙ Environment Configuration

### Required Environment Variables
```bash
# Server Configuration
PORT=5055
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/saptmarkets

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_SECRET_FOR_VERIFY=your-verification-secret-key

# Email Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDER_EMAIL=noreply@saptmarkets.com
EMAIL_USER=your-email-user
EMAIL_PASSWORD=your-email-password

# Cloudinary Configuration
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Odoo ERP Configuration
ODOO_HOST=localhost
ODOO_PORT=8069
ODOO_DATABASE=forapi_17
ODOO_USERNAME=admin
ODOO_PASSWORD=admin
ODOO_BATCH_SIZE=200
ODOO_MAX_RETRIES=3
BRANCH_LOCATION_IDS=1,2,3

# Application URLs
STORE_URL=http://localhost:3000
ADMIN_URL=http://localhost:4100

# Encryption
ENCRYPT_PASSWORD=saptmarkets-default-encryption-key-123
```

### Environment-Specific Configurations

#### Development
```javascript
{
  NODE_ENV: 'development',
  LOG_LEVEL: 'debug',
  CORS_ORIGINS: ['http://localhost:3000', 'http://localhost:4100'],
  MONGODB_URI: 'mongodb://localhost:27017/saptmarkets_dev'
}
```

#### Production
```javascript
{
  NODE_ENV: 'production',
  LOG_LEVEL: 'error',
  CORS_ORIGINS: ['https://store.saptmarkets.com', 'https://admin.saptmarkets.com'],
  MONGODB_URI: 'mongodb://production-server:27017/saptmarkets_prod'
}
```

---

## 🚀 Deployment

### Production Requirements
- **Node.js**: Version 18+ recommended
- **MongoDB**: Version 5+ with replica set
- **Memory**: Minimum 2GB RAM
- **Storage**: SSD recommended for database
- **Network**: Stable internet connection for Odoo sync

### Deployment Steps
1. **Environment Setup**
   ```bash
   npm install --production
   cp .env.example .env
   # Configure environment variables
   ```

2. **Database Setup**
   ```bash
   npm run migrate:all
   npm run seed
   ```

3. **Service Configuration**
   ```bash
   # Using PM2
   pm2 start start-server.js --name saptmarkets-backend
   pm2 save
   pm2 startup
   ```

4. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name api.saptmarkets.com;
       
       location / {
           proxy_pass http://localhost:5055;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Monitoring
- **Process Monitoring**: PM2 process management
- **Log Management**: Centralized logging
- **Health Checks**: API health endpoints
- **Performance Monitoring**: Response time tracking

---

## 📊 Monitoring & Analytics

### Built-in Analytics Services

#### 1. Sales Analytics
- **Revenue Tracking**: Daily, weekly, monthly revenue
- **Order Analysis**: Order volume and trends
- **Product Performance**: Best-selling products
- **Customer Behavior**: Purchase patterns

#### 2. Customer Analytics
- **Customer Segmentation**: Demographics and behavior
- **Loyalty Analysis**: Customer retention and loyalty
- **Purchase History**: Individual customer insights
- **Engagement Metrics**: Customer interaction tracking

#### 3. Inventory Analytics
- **Stock Levels**: Real-time inventory tracking
- **Turnover Rates**: Product turnover analysis
- **Reorder Points**: Automatic reorder suggestions
- **Waste Tracking**: Expired product monitoring

#### 4. Delivery Analytics
- **Delivery Performance**: On-time delivery rates
- **Route Optimization**: Delivery route analysis
- **Customer Satisfaction**: Delivery ratings and feedback
- **Cost Analysis**: Delivery cost optimization

### Analytics Endpoints
```
GET /api/reports/sales              # Sales reports
GET /api/reports/customers          # Customer analytics
GET /api/reports/inventory          # Inventory reports
GET /api/reports/delivery           # Delivery analytics
GET /api/reports/analytics          # General analytics
```

### Data Export
- **CSV Export**: Report data export
- **PDF Reports**: Printable reports
- **Real-time Dashboards**: Live analytics
- **Scheduled Reports**: Automated reporting

### Performance Metrics
- **Response Time**: API response time tracking
- **Error Rates**: Error monitoring and alerting
- **Throughput**: Request per second monitoring
- **Resource Usage**: CPU and memory monitoring

---

## 🔧 Development & Maintenance

### Scripts and Utilities
```json
{
  "scripts": {
    "start": "node start-server.js",
    "dev": "nodemon start-server.js",
    "migrate:units": "node migrations/create-basic-units.js",
    "migrate:product-units": "node migrations/create-missing-product-units.js",
    "migrate:all": "node migrations/run-all-migrations.js",
    "migrate:categories": "node scripts/category-migration.js",
    "migrate:categories-units": "node scripts/categories-units-migration.js",
    "clean:home-category": "node scripts/clean-home-category.js",
    "optimize": "node create-performance-indexes.js",
    "seed": "node migration-script.js"
  }
}
```

### Database Migrations
- **Version Control**: Migration version tracking
- **Rollback Support**: Migration rollback capabilities
- **Data Validation**: Migration data integrity checks
- **Performance**: Optimized migration execution

### Testing Strategy
- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Database Tests**: Data integrity testing
- **Performance Tests**: Load and stress testing

### Documentation
- **API Documentation**: Comprehensive endpoint documentation
- **Code Comments**: Inline code documentation
- **Architecture Diagrams**: System architecture documentation
- **Deployment Guides**: Step-by-step deployment instructions

---

## 📝 Conclusion

The SaptMarkets Backend is a robust, scalable, and feature-rich e-commerce API that provides:

- **Comprehensive E-commerce Functionality**: Complete product, order, and customer management
- **Real-time Integration**: Seamless Odoo ERP synchronization
- **Advanced Analytics**: Detailed business intelligence and reporting
- **Multi-platform Support**: API support for web, mobile, and admin platforms
- **Security & Performance**: Enterprise-grade security and optimization
- **Scalability**: Designed for growth and high traffic

The system is built with modern best practices, comprehensive error handling, and extensive monitoring capabilities, making it suitable for production e-commerce operations.

---

*Last Updated: December 2024*
*Version: 1.0.0* 