# Delivery System API Documentation

## Overview

This document provides comprehensive documentation for the delivery system API, which includes driver/delivery personnel management, order assignment, tracking, and administrative oversight.

## Table of Contents

1. [Authentication](#authentication)
2. [Driver/Delivery Personnel API](#driverdelivery-personnel-api)
3. [Delivery Orders API](#delivery-orders-api)
4. [Admin Delivery Management API](#admin-delivery-management-api)
5. [Data Models](#data-models)
6. [Usage Examples](#usage-examples)

---

## Authentication

All API endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Role-Based Access

- **Driver**: Can access delivery personnel and delivery orders endpoints
- **Admin/Super Admin**: Can access all endpoints including admin delivery management

---

## Driver/Delivery Personnel API

Base URL: `/api/delivery-personnel`

### Authentication & Profile Management

#### POST `/login`
**Description**: Driver login  
**Authentication**: None required  
**Body**:
```json
{
  "email": "driver@example.com",
  "password": "password123"
}
```
**Response**:
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "driver": {
    "_id": "driver_id",
    "name": {"en": "John Doe"},
    "email": "driver@example.com",
    "phone": "+1234567890",
    "role": "Driver",
    "deliveryInfo": {...},
    "deliveryStats": {...}
  }
}
```

#### GET `/profile`
**Description**: Get driver profile  
**Authentication**: Driver  
**Response**:
```json
{
  "driver": {
    "_id": "driver_id",
    "name": {"en": "John Doe"},
    "email": "driver@example.com",
    "phone": "+1234567890",
    "deliveryInfo": {
      "vehicleType": "bike",
      "vehicleNumber": "ABC123",
      "isOnDuty": true,
      "availability": "available"
    },
    "deliveryStats": {
      "totalDeliveries": 150,
      "completedToday": 5,
      "averageRating": 4.8,
      "activeDeliveries": 2
    }
  }
}
```

#### PUT `/profile`
**Description**: Update driver profile  
**Authentication**: Driver  
**Body**:
```json
{
  "phone": "+1234567891",
  "deliveryInfo": {
    "vehicleType": "car",
    "maxDeliveryRadius": 15
  }
}
```

#### POST `/location`
**Description**: Update current location  
**Authentication**: Driver  
**Body**:
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

### Shift Management

#### POST `/shift/clock-in`
**Description**: Start work shift  
**Authentication**: Driver  
**Body**:
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

#### POST `/shift/clock-out`
**Description**: End work shift  
**Authentication**: Driver  

#### GET `/shift/status`
**Description**: Get current shift status  
**Authentication**: Driver  
**Response**:
```json
{
  "isOnDuty": true,
  "availability": "available",
  "shiftStartTime": "2024-01-15T09:00:00Z",
  "shiftDuration": 120,
  "activeDeliveries": 2,
  "canClockOut": false
}
```

### Statistics & Earnings

#### GET `/stats`
**Description**: Get delivery statistics  
**Authentication**: Driver  
**Response**:
```json
{
  "deliveryStats": {
    "today": 5,
    "thisWeek": 32,
    "thisMonth": 140,
    "total": 850,
    "active": 2,
    "averageRating": 4.8,
    "successRate": 98
  }
}
```

#### GET `/earnings`
**Description**: Get daily earnings  
**Authentication**: Driver  
**Query Params**: `date` (optional, format: YYYY-MM-DD)  
**Response**:
```json
{
  "date": "Mon Jan 15 2024",
  "earnings": {
    "totalDeliveries": 8,
    "deliveryFee": 50,
    "totalEarnings": 400,
    "codCollected": 1250,
    "averageOrderValue": 156.25
  },
  "deliveries": [...]
}
```

---

## Delivery Orders API

Base URL: `/api/delivery-orders`

### Order Management

#### GET `/assigned`
**Description**: Get orders assigned to the driver  
**Authentication**: Driver  
**Query Params**: 
- `status` (optional): 'active', 'Processing', 'Out for Delivery', 'Delivered'
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response**:
```json
{
  "orders": [
    {
      "_id": "order_id",
      "invoice": 10001,
      "status": "Processing",
      "customer": {
        "name": "Jane Smith",
        "contact": "+1234567890",
        "address": "123 Main St, City"
      },
      "orderSummary": {
        "itemCount": 5,
        "total": 125.50,
        "paymentMethod": "Cash"
      },
      "deliveryInfo": {
        "assignedAt": "2024-01-15T10:00:00Z",
        "productChecklist": [...],
        "allItemsCollected": false
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalOrders": 25
  }
}
```

#### GET `/:orderId`
**Description**: Get detailed order information  
**Authentication**: Driver  
**Response**:
```json
{
  "_id": "order_id",
  "invoice": 10001,
  "status": "Processing",
  "customer": {
    "name": "Jane Smith",
    "contact": "+1234567890",
    "address": "123 Main St, City",
    "deliveryLocation": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  },
  "items": [
    {
      "id": "item_id",
      "title": "Product Name",
      "price": 25.00,
      "quantity": 2,
      "total": 50.00
    }
  ],
  "financial": {
    "subTotal": 100.00,
    "shippingCost": 5.00,
    "total": 105.00,
    "paymentMethod": "Cash",
    "needsPaymentCollection": true
  },
  "delivery": {
    "assignedAt": "2024-01-15T10:00:00Z",
    "productChecklist": [...],
    "verificationCode": "ABC123",
    "estimatedDistance": "2.5 km"
  }
}
```

### Delivery Actions

#### POST `/:orderId/pick-up`
**Description**: Mark order as picked up  
**Authentication**: Driver  
**Body**:
```json
{
  "notes": "All items collected successfully",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

#### POST `/:orderId/out-for-delivery`
**Description**: Mark order as out for delivery  
**Authentication**: Driver  
**Body**:
```json
{
  "estimatedArrival": "2024-01-15T14:00:00Z",
  "notes": "En route to customer"
}
```

#### POST `/:orderId/delivered`
**Description**: Mark order as delivered  
**Authentication**: Driver  
**Body**:
```json
{
  "verificationCode": "ABC123",
  "deliveryNotes": "Delivered to customer at door",
  "recipientName": "Jane Smith",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

#### POST `/:orderId/failed`
**Description**: Mark delivery as failed  
**Authentication**: Driver  
**Body**:
```json
{
  "reason": "Customer not available",
  "details": "No answer at door, tried calling",
  "attemptRedelivery": true
}
```

---

## Admin Delivery Management API

Base URL: `/api/admin/delivery`

### Driver Management

#### GET `/drivers`
**Description**: Get all drivers  
**Authentication**: Admin  
**Query Params**: 
- `status` (optional): 'Active', 'Inactive'
- `availability` (optional): 'available', 'busy', 'offline'
- `page`, `limit` for pagination

#### POST `/drivers`
**Description**: Create new driver  
**Authentication**: Admin  
**Body**:
```json
{
  "name": {"en": "John Doe"},
  "email": "driver@example.com",
  "phone": "+1234567890",
  "password": "password123",
  "vehicleType": "bike",
  "vehicleNumber": "ABC123",
  "licenseNumber": "DL123456",
  "emergencyContact": {
    "name": "Emergency Contact",
    "phone": "+1234567891"
  }
}
```

#### PUT `/drivers/:driverId`
**Description**: Update driver information  
**Authentication**: Admin  

#### DELETE `/drivers/:driverId`
**Description**: Deactivate driver  
**Authentication**: Admin  

#### GET `/drivers/available`
**Description**: Get available drivers for assignment  
**Authentication**: Admin  
**Query Params**: `orderLocation` (optional): JSON string with latitude/longitude

### Order Assignment

#### GET `/orders/pending`
**Description**: Get pending orders (not assigned to any driver)  
**Authentication**: Admin  

#### POST `/orders/assign`
**Description**: Assign order to driver  
**Authentication**: Admin  
**Body**:
```json
{
  "orderId": "order_id",
  "driverId": "driver_id",
  "priority": "high",
  "estimatedDeliveryTime": "2024-01-15T15:00:00Z"
}
```

#### PUT `/orders/:orderId/reassign`
**Description**: Reassign order to different driver  
**Authentication**: Admin  
**Body**:
```json
{
  "newDriverId": "new_driver_id",
  "reason": "Original driver unavailable"
}
```

### Analytics & Monitoring

#### GET `/dashboard`
**Description**: Get delivery dashboard statistics  
**Authentication**: Admin  
**Response**:
```json
{
  "overview": {
    "totalDrivers": 25,
    "activeDrivers": 18,
    "onDutyDrivers": 12,
    "driverUtilization": 72
  },
  "orders": {
    "pending": 5,
    "processing": 15,
    "outForDelivery": 8,
    "deliveredToday": 45,
    "failedToday": 2
  },
  "performance": {
    "averageDeliveryTime": 35,
    "successRate": 96,
    "deliveryEfficiency": 3.75
  },
  "topDrivers": [...]
}
```

---

## Data Models

### Enhanced Admin Model (Driver Role)

```javascript
{
  // Standard admin fields
  name: Object,
  email: String,
  phone: String,
  role: "Driver",
  status: "Active" | "Inactive",
  
  // Delivery-specific fields
  deliveryInfo: {
    vehicleType: "bike" | "car" | "van" | "scooter",
    vehicleNumber: String,
    licenseNumber: String,
    phoneNumber: String,
    emergencyContact: {
      name: String,
      phone: String
    },
    workingHours: {
      start: String, // "09:00"
      end: String    // "18:00"
    },
    maxDeliveryRadius: Number, // in km
    currentLocation: {
      latitude: Number,
      longitude: Number,
      lastUpdated: Date
    },
    isOnDuty: Boolean,
    availability: "available" | "busy" | "offline"
  },
  
  deliveryStats: {
    totalDeliveries: Number,
    completedToday: Number,
    averageRating: Number,
    successRate: Number,
    averageDeliveryTime: Number, // in minutes
    totalEarnings: Number,
    earningsToday: Number
  }
}
```

### Enhanced Order Model

```javascript
{
  // Standard order fields...
  
  deliveryInfo: {
    assignedDriver: ObjectId, // Reference to Admin
    assignedAt: Date,
    assignedBy: ObjectId,
    pickedUpAt: Date,
    outForDeliveryAt: Date,
    deliveredAt: Date,
    
    // Product collection tracking
    productChecklist: [{
      productId: String,
      title: String,
      quantity: Number,
      collected: Boolean,
      collectedAt: Date,
      collectedBy: String,
      notes: String
    }],
    allItemsCollected: Boolean,
    
    // Delivery completion
    deliveryNotes: String,
    deliveryProof: {
      photo: String,
      signature: String,
      recipientName: String,
      location: {
        latitude: Number,
        longitude: Number
      }
    },
    
    // Failure tracking
    deliveryAttempts: [{
      attemptedAt: Date,
      reason: String,
      notes: String
    }]
  }
}
```

### DeliveryAssignment Model

```javascript
{
  order: ObjectId, // Reference to Order
  driver: ObjectId, // Reference to Admin
  status: "assigned" | "picked_up" | "out_for_delivery" | "delivered" | "failed",
  assignedAt: Date,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  priority: "low" | "medium" | "high" | "urgent",
  
  paymentCollection: {
    method: String,
    amount: Number,
    collectedAt: Date,
    confirmed: Boolean
  },
  
  failureReason: {
    reason: String,
    details: String,
    reportedAt: Date
  },
  
  customerFeedback: {
    rating: Number,
    comment: String,
    feedbackAt: Date
  }
}
```

---

## Usage Examples

### Driver App Flow

1. **Driver Login**:
```javascript
POST /api/delivery-personnel/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

2. **Clock In for Shift**:
```javascript
POST /api/delivery-personnel/shift/clock-in
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

3. **Get Assigned Orders**:
```javascript
GET /api/delivery-orders/assigned?status=active
```

4. **View Order Details**:
```javascript
GET /api/delivery-orders/60d5ec49f1b2c8b1f8f9e8b1
```

5. **Mark Order as Picked Up**:
```javascript
POST /api/delivery-orders/60d5ec49f1b2c8b1f8f9e8b1/pick-up
{
  "notes": "All items collected",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

6. **Complete Delivery**:
```javascript
POST /api/delivery-orders/60d5ec49f1b2c8b1f8f9e8b1/delivered
{
  "verificationCode": "ABC123",
  "deliveryNotes": "Delivered successfully",
  "recipientName": "Jane Smith"
}
```

### Admin Panel Flow

1. **View Dashboard**:
```javascript
GET /api/admin/delivery/dashboard
```

2. **Get Pending Orders**:
```javascript
GET /api/admin/delivery/orders/pending
```

3. **Get Available Drivers**:
```javascript
GET /api/admin/delivery/drivers/available
```

4. **Assign Order**:
```javascript
POST /api/admin/delivery/orders/assign
{
  "orderId": "60d5ec49f1b2c8b1f8f9e8b1",
  "driverId": "60d5ec49f1b2c8b1f8f9e8b2",
  "priority": "high"
}
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "message": "Error description",
  "error": "Detailed error information"
}
```

### Common HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

- Authentication endpoints: 5 requests per minute
- Other endpoints: 100 requests per minute per user

---

## WebSocket Events (Optional Enhancement)

For real-time updates, consider implementing WebSocket events:

- `order_assigned`: When order is assigned to driver
- `status_updated`: When order status changes
- `location_updated`: When driver location updates
- `delivery_completed`: When delivery is completed

---

## Key Features Implemented

### ✅ Driver Management System
- Enhanced Admin model with delivery-specific fields
- Driver authentication and profile management
- Shift management (clock in/out)
- Location tracking
- Performance statistics

### ✅ Order Assignment & Tracking
- Order assignment to drivers
- Product checklist for order collection
- Status tracking throughout delivery process
- Verification code system for delivery completion
- Failure handling and redelivery attempts

### ✅ Real-time Updates
- Driver location updates
- Order status changes
- Availability status management

### ✅ Admin Controls
- Driver creation and management
- Order assignment dashboard
- Delivery analytics and monitoring
- Performance tracking

### ✅ Complete Delivery Workflow
1. Order placed by customer
2. Admin assigns order to available driver
3. Driver picks up order (with product checklist)
4. Driver marks as out for delivery
5. Driver completes delivery with verification code
6. System processes stock reduction and loyalty points

---

## Next Steps

This delivery system provides a solid foundation for your marketplace. The next phase would involve:

1. **React Native Mobile App Development** (as mentioned in your plan)
2. **Real-time notifications** using WebSocket or Push Notifications
3. **GPS route optimization** for multiple deliveries
4. **Customer tracking interface** to see delivery progress
5. **Advanced analytics and reporting**

The backend system is now complete and ready for testing and deployment! 