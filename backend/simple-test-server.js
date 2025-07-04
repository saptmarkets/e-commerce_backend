require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json({ limit: "4mb" }));

// CORS Configuration
const corsOptions = {
  origin: '*', // Allow all origins for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Root route
app.get("/", (req, res) => {
  res.json({ message: "SaptMarkets Delivery API is running!", timestamp: new Date().toISOString() });
});

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API test successful!", timestamp: new Date().toISOString() });
});

// Mock delivery data
const mockOrders = [
  {
    _id: "6750123456789abcdef12345",
    invoice: "SM001",
    status: "Pending",
    customer: {
      name: "John Doe",
      contact: "+8801234567890",
      address: "123 Main Street, Dhaka, Bangladesh"
    },
    cart: [
      {
        id: "prod1",
        title: "Fresh Apples",
        quantity: 2,
        price: 150,
        image: "https://via.placeholder.com/100"
      },
      {
        id: "prod2", 
        title: "Organic Bananas",
        quantity: 1,
        price: 80,
        image: "https://via.placeholder.com/100"
      }
    ],
    orderSummary: {
      total: 230
    },
    paymentMethod: "cod",
    assignedDriver: "675012345678901234567890",
    createdAt: new Date().toISOString()
  },
  {
    _id: "6750123456789abcdef12346",
    invoice: "SM002", 
    status: "Processing",
    customer: {
      name: "Jane Smith",
      contact: "+8801234567891",
      address: "456 Oak Avenue, Dhaka, Bangladesh"
    },
    cart: [
      {
        id: "prod3",
        title: "Fresh Milk",
        quantity: 2,
        price: 120,
        image: "https://via.placeholder.com/100"
      }
    ],
    orderSummary: {
      total: 240
    },
    paymentMethod: "online",
    assignedDriver: "675012345678901234567890",
    createdAt: new Date().toISOString()
  }
];

// =====================================================
// DELIVERY API ROUTES (Mock Implementation)
// =====================================================

// Simple auth middleware that doesn't require DB
const mockAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "No token provided" });
  }
  
  // Mock user data
  req.user = {
    _id: "675012345678901234567890",
    email: "driver@saptmarkets.com",
    role: "Driver"
  };
  next();
};

// GET /api/delivery-orders/assigned - Get assigned orders
app.get('/api/delivery-orders/assigned', mockAuth, (req, res) => {
  try {
    console.log('📦 Fetching assigned orders for driver:', req.user._id);
    
    // Filter orders assigned to current driver
    const assignedOrders = mockOrders.filter(order => 
      order.assignedDriver === req.user._id
    );
    
    res.json({
      success: true,
      message: "Assigned orders fetched successfully",
      data: assignedOrders,
      count: assignedOrders.length
    });
  } catch (error) {
    console.error('Error fetching assigned orders:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch assigned orders",
      error: error.message
    });
  }
});

// GET /api/delivery-orders/:orderId - Get order details
app.get('/api/delivery-orders/:orderId', mockAuth, (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('📋 Fetching order details for:', orderId);
    
    const order = mockOrders.find(o => o._id === orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    res.json({
      success: true,
      message: "Order details fetched successfully",
      data: order
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: error.message
    });
  }
});

// PUT /api/delivery-orders/:orderId/status - Update order status
app.put('/api/delivery-orders/:orderId/status', mockAuth, (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    console.log(`📦 Updating order ${orderId} status to:`, status);
    
    const orderIndex = mockOrders.findIndex(o => o._id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    mockOrders[orderIndex].status = status;
    
    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: mockOrders[orderIndex]
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message
    });
  }
});

// POST /api/delivery-personnel/location - Update driver location
app.post('/api/delivery-personnel/location', mockAuth, (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    
    console.log(`📍 Updating driver location: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
    
    res.json({
      success: true,
      message: "Location updated successfully",
      data: {
        driverId: req.user._id,
        latitude,
        longitude,
        accuracy,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update location",
      error: error.message
    });
  }
});

// POST /api/delivery-personnel/login - Driver login
app.post('/api/delivery-personnel/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Driver login attempt:', email);
    
    // Mock authentication
    if (email === 'driver@saptmarkets.com' && password === 'driver123') {
      const mockDriver = {
        _id: "675012345678901234567890",
        name: "Test Driver",
        email: "driver@saptmarkets.com",
        role: "Driver",
        status: "active",
        phone: "+8801234567890",
        vehicleInfo: {
          type: "Motorbike",
          number: "DH-123456"
        }
      };
      
      res.json({
        success: true,
        message: "Login successful",
        data: mockDriver,
        token: "mock-jwt-token-" + Date.now()
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
});

// Handle 404 - Keep this as a last route
app.use(function(req, res, next) {
  console.log('❌ Route not found:', req.method, req.url);
  res.status(404).json({
    success: false,
    message: "Route not found",
    url: req.url,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔴 Server error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ 
    success: false,
    message: "Internal server error",
    error: err.message 
  });
});

const PORT = process.env.PORT || 5055;

app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 SaptMarkets Delivery API Server started');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log(`📱 Mobile API: http://192.168.0.120:${PORT}`);
  console.log('✅ Ready to serve delivery requests!');
}); 