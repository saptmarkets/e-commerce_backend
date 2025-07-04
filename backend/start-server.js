// Script to start the backend server with all routes
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const { connectDB } = require("./config/db");
const mongoose = require("mongoose");

// Import routes
const productRoutes = require("./routes/productRoutes");
const productUnitRoutes = require("./routes/productUnitRoutes");
const customerRoutes = require("./routes/customerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const orderRoutes = require("./routes/orderRoutes");
const customerOrderRoutes = require("./routes/customerOrderRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const couponRoutes = require("./routes/couponRoutes");
const attributeRoutes = require("./routes/attributeRoutes");
const settingRoutes = require("./routes/settingRoutes");
const currencyRoutes = require("./routes/currencyRoutes");
const languageRoutes = require("./routes/languageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const promotionRoutes = require("./routes/promotionRoutes");
const promotionListRoutes = require("./routes/promotionListRoutes");
const unitRoutes = require("./routes/unitRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const homepageSectionRoutes = require("./routes/homepageSectionRoutes");
const loyaltyRoutes = require("./routes/loyaltyRoutes");
const deliveryPersonnelRoutes = require("./routes/deliveryPersonnelRoutes");
const deliveryOrderRoutes = require("./routes/deliveryOrderRoutes");
const adminDeliveryRoutes = require("./routes/adminDeliveryRoutes");
const mobileDeliveryRoutes = require("./routes/mobileDeliveryRoutes");
const odooSyncRoutes = require("./routes/odooSyncRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const { isAuth, isAdmin } = require("./config/auth");

// Connect to MongoDB
try {
  connectDB();
  console.log("MongoDB connected successfully");
} catch (error) {
  console.error("MongoDB connection error:", error);
  process.exit(1);
}

const app = express();

// Middleware
app.use(express.json({ limit: "4mb" }));
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: '*', // Allow all origins for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/static", express.static(path.join(__dirname, "public")));

// Root route
app.get("/", (req, res) => {
  res.send("API is running!");
});

// Mount all API routes
app.use("/api/products", productRoutes);
app.use("/api/product-units", productUnitRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/order", isAuth, customerOrderRoutes);
app.use("/api/attributes", attributeRoutes);
app.use("/api/setting", settingRoutes);
app.use("/api/currency", isAuth, currencyRoutes);
app.use("/api/language", languageRoutes);
app.use("/api/notification", isAuth, notificationRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/promotion-lists", promotionListRoutes);
app.use("/api/units", unitRoutes);
app.use("/api", bannerRoutes);
app.use("/api/homepage-sections", homepageSectionRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/delivery", require("./routes/deliveryRoutes"));

// Delivery system routes
app.use("/api/delivery-personnel", deliveryPersonnelRoutes);
app.use("/api/delivery-orders", deliveryOrderRoutes);
app.use("/api/admin/delivery", adminDeliveryRoutes);
app.use("/api/mobile-delivery", mobileDeliveryRoutes);

// Odoo sync routes (admin only)
app.use("/api/odoo-sync", isAuth, isAdmin, odooSyncRoutes);

// Upload routes
app.use("/api/upload", uploadRoutes);

// Direct test endpoint for promotions (no authentication required)
app.get("/api/direct-test/promotions", async (req, res) => {
  const Promotion = require('./models/Promotion');
  
  try {
    const currentDate = new Date();
    console.log('Direct test - fetching all promotions at:', currentDate);
    
    // Get all promotions
    const allPromotions = await Promotion.find({}).populate("product", "title slug sku image prices stock");
    
    // Get active promotions
    const activePromotions = await Promotion.find({
      status: "active",
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    }).populate("product", "title slug sku image prices stock");
    
    res.json({
      message: "Direct promotion test",
      timestamp: new Date().toISOString(),
      counts: {
        all: allPromotions.length,
        active: activePromotions.length
      },
      allPromotions: allPromotions,
      activePromotions: activePromotions
    });
  } catch (error) {
    console.error('Error in direct test:', error);
    res.status(500).json({
      message: "Error testing promotions",
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// Direct test endpoint for fixing indexes (temporary debug endpoint)
app.get("/api/fix-indexes", async (req, res) => {
  try {
    console.log('=== FIXING PRODUCT UNIT INDEXES ===');
    
    // Get the collection directly
    const collection = mongoose.connection.db.collection('productunits');

    // List current indexes
    console.log('\n=== CURRENT INDEXES ===');
    const currentIndexes = await collection.indexes();
    let indexReport = 'Current indexes:\n';
    currentIndexes.forEach(index => {
      const indexInfo = `${index.name}: ${JSON.stringify(index.key)}`;
      console.log(indexInfo);
      indexReport += indexInfo + '\n';
    });

    // Drop problematic indexes
    const problematicIndexes = [
      'productId_1_unitId_1_unitValue_1',
      'productId_1_isActive_1', 
      'productId_1'
    ];

    let dropReport = '\nDropped indexes:\n';
    console.log('\n=== DROPPING OLD INDEXES ===');
    for (const indexName of problematicIndexes) {
      try {
        await collection.dropIndex(indexName);
        const msg = `✅ Dropped: ${indexName}`;
        console.log(msg);
        dropReport += msg + '\n';
      } catch (error) {
        const msg = `ℹ️  ${indexName} - not found or already dropped`;
        console.log(msg);
        dropReport += msg + '\n';
      }
    }

    // Create correct indexes
    let createReport = '\nCreated indexes:\n';
    console.log('\n=== CREATING NEW INDEXES ===');
    
    const indexesToCreate = [
      { index: { product: 1, unit: 1, unitValue: 1 }, name: 'product_1_unit_1_unitValue_1' },
      { index: { product: 1, isActive: 1 }, name: 'product_1_isActive_1' },
      { index: { sku: 1 }, name: 'sku_1', options: { sparse: true } },
      { index: { barcode: 1 }, name: 'barcode_1', options: { unique: true, sparse: true } },
      { index: { isActive: 1, isAvailable: 1 }, name: 'isActive_1_isAvailable_1' }
    ];

    for (const { index, name, options = {} } of indexesToCreate) {
      try {
        await collection.createIndex(index, { name, ...options });
        const msg = `✅ Created: ${name}`;
        console.log(msg);
        createReport += msg + '\n';
      } catch (error) {
        const msg = `ℹ️  ${name} - may already exist`;
        console.log(msg);
        createReport += msg + '\n';
      }
    }

    // List final indexes
    console.log('\n=== FINAL INDEXES ===');
    const finalIndexes = await collection.indexes();
    let finalReport = '\nFinal indexes:\n';
    finalIndexes.forEach(index => {
      const indexInfo = `${index.name}: ${JSON.stringify(index.key)}`;
      console.log(indexInfo);
      finalReport += indexInfo + '\n';
    });

    console.log('\n✅ Index fix completed successfully!');
    
    res.json({
      success: true,
      message: "Database indexes fixed successfully!",
      report: indexReport + dropReport + createReport + finalReport,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    res.status(500).json({
      success: false,
      message: "Error fixing database indexes",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Use express's default error handling middleware
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  res.status(400).json({ message: err.message });
});

// Handle 404 - Keep this as a last route
app.use(function(req, res, next) {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    message: "Route not found",
    path: req.url
  });
});

// Start the server
const PORT = process.env.PORT || 5055;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  const results = Object.create(null); // Or just '{}', an empty object

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }

  console.log(`Server accessible at:`);
  console.log(`  - Local: http://localhost:${PORT}`);
  if (results['Ethernet']) { // Check for Ethernet interface
    results['Ethernet'].forEach(ip => {
      console.log(`  - Network: http://${ip}:${PORT}`);
    });
  } else { // Fallback for other interface names like Wi-Fi
    Object.keys(results).forEach(netName => {
      results[netName].forEach(ip => {
        console.log(`  - Network: http://${ip}:${PORT}`);
      });
    });
  }
  
  console.log(`Test the API at: http://localhost:${PORT}/api/direct-test/promotions`);
});

// Final check to confirm MongoDB connection
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongodb connection error:'));
db.once('open', function() {
  console.log('mongodb connection success!');
});

// Print all registered routes for debugging
console.log('\n=== REGISTERED ROUTES ===');
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    // Routes registered directly on the app
    console.log(`${Object.keys(middleware.route.methods)[0].toUpperCase()} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    // Router middleware
    const path = middleware.regexp.toString()
      .replace('\\/?(?=\\/|$)', '')
      .replace('^\\/\\', '/')
      .replace('\\\\', '\\')
      .replace('(?:^|/?', '')
      .replace('(?=\\/|$)', '')
      .replace('/^', '')
      .replace('$/', '')
      .replace('/^/', '/')
      .replace('\\/?$/', '');
      
    console.log(`\nRouter at: ${path}`);
    
    try {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const method = Object.keys(handler.route.methods)[0].toUpperCase();
          console.log(`  ${method} ${path}${handler.route.path}`);
        }
      });
    } catch (error) {
      console.log(`  Error listing routes for this router: ${error.message}`);
    }
  }
}); 