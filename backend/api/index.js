require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
// const http = require("http");
// const { Server } = require("socket.io");

const { connectDB } = require("../config/db");
const productRoutes = require("../routes/productRoutes");
const customerRoutes = require("../routes/customerRoutes");
const adminRoutes = require("../routes/adminRoutes");
const orderRoutes = require("../routes/orderRoutes");
const customerOrderRoutes = require("../routes/customerOrderRoutes");
const categoryRoutes = require("../routes/categoryRoutes");
const couponRoutes = require("../routes/couponRoutes");
const attributeRoutes = require("../routes/attributeRoutes");
const settingRoutes = require("../routes/settingRoutes");
const currencyRoutes = require("../routes/currencyRoutes");
const languageRoutes = require("../routes/languageRoutes");
const notificationRoutes = require("../routes/notificationRoutes");
const promotionRoutes = require("../routes/promotionRoutes");
const promotionListRoutes = require("../routes/promotionListRoutes");
const unitRoutes = require("../routes/unitRoutes");
const productUnitRoutes = require("../routes/productUnitRoutes");
const migrationRoutes = require("../routes/migrationRoutes");
const bannerRoutes = require("../routes/bannerRoutes");
const { isAuth, isAdmin } = require("../config/auth");
const uploadRoutes = require("../routes/uploadRoutes");
// const {
//   getGlobalSetting,
//   getStoreCustomizationSetting,
// } = require("../lib/notification/setting");

connectDB();
const app = express();

// We are using this for the express-rate-limit middleware
// See: https://github.com/nfriedly/express-rate-limit
// app.enable('trust proxy');
app.set("trust proxy", 1);

app.use(express.json({ limit: "4mb" }));
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: '*', // Allow all origins temporarily for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Serve static files from the "public" directory - this should come BEFORE API routes
app.use(express.static(path.join(__dirname, "../public")));
app.use("/static", express.static(path.join(__dirname, "../public")));

//root route
app.get("/", (req, res) => {
  res.send("API is running!");
});

// API routes
app.use("/api/products", productRoutes);
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
app.use("/api/product-units", productUnitRoutes);
app.use("/api/migrations", migrationRoutes);

//if you not use admin dashboard then these two route will not needed.
app.use("/api/admin", adminRoutes);
app.use("/api", bannerRoutes); // Banner routes (both admin and public)
app.use("/api/orders", orderRoutes);

// Add missing delivery routes
const deliveryPersonnelRoutes = require("../routes/deliveryPersonnelRoutes");
const deliveryOrderRoutes = require("../routes/deliveryOrderRoutes");
const adminDeliveryRoutes = require("../routes/adminDeliveryRoutes");
const mobileDeliveryRoutes = require("../routes/mobileDeliveryRoutes");

app.use("/api/delivery-personnel", deliveryPersonnelRoutes);
app.use("/api/delivery-orders", deliveryOrderRoutes);
app.use("/api/admin/delivery", adminDeliveryRoutes);
app.use("/api/mobile-delivery", mobileDeliveryRoutes);

// API testing route
app.get("/api/test", (req, res) => {
  res.json({ message: "API test route is working!" });
});

// CORS test endpoint
app.get("/api/cors-test", (req, res) => {
  res.json({
    message: "CORS is working!",
    headers: {
      origin: req.headers.origin || 'No Origin',
      referer: req.headers.referer || 'No Referer',
      host: req.headers.host || 'No Host'
    },
    timestamp: new Date().toISOString()
  });
});

// Direct test endpoint for promotions
app.get("/api/direct-test/promotions", async (req, res) => {
  const Promotion = require('../models/Promotion');
  
  try {
    const currentDate = new Date();
    console.log('Direct test - fetching active promotions at:', currentDate);
    
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

app.use("/api/upload", uploadRoutes);

// Use express's default error handling middleware
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  res.status(400).json({ message: err.message });
});

// Handle 404 - Keep this as a last route
app.use(function(req, res, next) {
  res.status(404).json({
    message: "Route not found"
  });
});

const PORT = process.env.PORT || 5055;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// app.listen(PORT, () => console.log(`server running on port ${PORT}`));

// set up socket
// const io = new Server(server, {
//   cors: {
//     origin: [
//       "http://localhost:3000",
//       "http://localhost:4100",
//       "https://admin-saptmarkets.vercel.app",
//       "https://dashtar-admin.vercel.app",
//       "https://saptmarkets-store.vercel.app",
//       "https://saptmarkets-admin.netlify.app",
//       "https://dashtar-admin.netlify.app",
//       "https://saptmarkets-store-nine.vercel.app",
//     ], //add your origin here instead of this
//     methods: ["PUT", "GET", "POST", "DELETE", "PATCH", "OPTIONS"],
//     credentials: false,
//     transports: ["websocket"],
//   },
// });
