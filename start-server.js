require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const { connectDB } = require("./config/db");
const { isAuth, isAdmin } = require("./config/auth");
const mongoose = require("mongoose");

// Import routes
const adminRoutes = require("./routes/adminRoutes");
const attributeRoutes = require("./routes/attributeRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const bulkUploadRoutes = require("./routes/bulkUploadRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const couponRoutes = require("./routes/couponRoutes");
const currencyRoutes = require("./routes/currencyRoutes");
const customerRoutes = require("./routes/customerRoutes");
const customerOrderRoutes = require("./routes/customerOrderRoutes");
const customerOrderController = require("./controller/customerOrderController");
const customerOrderHandlers = customerOrderController;
const customerGetOrderByInvoice = customerOrderHandlers.getOrderByInvoice;
const customerGetOrderById = customerOrderHandlers.getOrderById;
const deliveryRoutes = require("./routes/deliveryRoutes");
const deliveryOrderRoutes = require("./routes/deliveryOrderRoutes");
const deliveryPersonnelRoutes = require("./routes/deliveryPersonnelRoutes");
const adminDeliveryRoutes = require("./routes/adminDeliveryRoutes");
const homepageSectionRoutes = require("./routes/homepageSectionRoutes");
const languageRoutes = require("./routes/languageRoutes");
const loyaltyRoutes = require("./routes/loyaltyRoutes");
const mobileDeliveryRoutes = require("./routes/mobileDeliveryRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const odooRoutes = require("./routes/odooRoutes");
const odooSyncRoutes = require("./routes/odooSyncRoutes");
const orderRoutes = require("./routes/orderRoutes");
const orderController = require("./controller/orderController");
const productRoutes = require("./routes/productRoutes");
const productUnitRoutes = require("./routes/productUnitRoutes");
const promotionRoutes = require("./routes/promotionRoutes");
const promotionListRoutes = require("./routes/promotionListRoutes");
const reportRoutes = require("./routes/reportRoutes");
const settingRoutes = require("./routes/settingRoutes");
const stockMovementRoutes = require("./routes/stockMovementRoutes");
const unitRoutes = require("./routes/unitRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
// New stock push sessions
let stockPushSessionRoutes = null;
try {
  stockPushSessionRoutes = require("./routes/stockPushSessionRoutes");
} catch (err) {
  console.warn(
    "[startup] Optional module './routes/stockPushSessionRoutes' not found; skipping.",
    err && err.message ? `Reason: ${err.message}` : ""
  );
}

// Start
console.log("🚀 Starting SAPT Markets Backend...");
connectDB();

const app = express();

// Security & parsers
app.use(helmet());
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true, limit: "4mb" }));

// CORS
const defaultAllowed = [
  "http://localhost:4100",
  "http://127.0.0.1:4100",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  // Admin & Customer production apps
  "https://e-commerce-admin-five-sable.vercel.app",
  "https://e-commerce-customer-three.vercel.app",
  // Allow other vercel previews for this project (safe wildcard)
  /^https:\/\/e-commerce-(admin|customer)-[\w-]+\.vercel\.app$/,
  // Broad vercel wildcard for compatibility with preview and branch URLs
  /^https:\/\/.*\.vercel\.app$/,
];
const envOrigins = (process.env.CORS_ORIGINS || "").split(",").filter(Boolean).map(s => s.trim());
const allowedOrigins = [...defaultAllowed, ...envOrigins];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const ok = allowedOrigins.some((o) => {
      if (o instanceof RegExp) return o.test(origin);
      return o === origin;
    });
    callback(ok ? null : new Error("Not allowed by CORS"), ok);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "company",
  ],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Additional headers for robust preflight handling
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.some((o) => (o instanceof RegExp ? o.test(origin) : o === origin))) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, company"
    );
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/receipts", express.static(path.join(__dirname, "public", "receipts")));

// Health/basic
app.get("/", (req, res) => res.send("API is running!"));
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Mount API routes (prefix with /api)
app.use("/api/admin", adminRoutes);
app.use("/api/attribute", attributeRoutes);
// Banner routes - mount both singular and plural for compatibility
app.use("/api/banner", bannerRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/bulk-upload", bulkUploadRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/customer-order", customerOrderRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/delivery-order", deliveryOrderRoutes);
app.use("/api/delivery-orders", deliveryOrderRoutes); // compatibility alias
app.use("/api/delivery-personnel", deliveryPersonnelRoutes);
app.use("/api/admin/delivery", adminDeliveryRoutes);
// Homepage sections - mount both singular and plural for compatibility
app.use("/api/homepage-section", homepageSectionRoutes);
app.use("/api/homepage-sections", homepageSectionRoutes);
app.use("/api/language", languageRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/mobile-delivery", mobileDeliveryRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/odoo", odooRoutes);
app.use("/api/odoo-sync", odooSyncRoutes);
// Admin and Customer order routes
app.use("/api/order", isAuth, customerOrderRoutes);
app.use("/api/orders", orderRoutes); // compatibility alias for admin
app.use("/api/product", productRoutes);
app.use("/api/product-unit", productUnitRoutes);
app.use("/api/promotion", promotionRoutes);
app.use("/api/promotion-list", promotionListRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/setting", settingRoutes);
app.use("/api/stock-movement", stockMovementRoutes);
app.use("/api/unit", unitRoutes);
app.use("/api/units", unitRoutes); // compatibility alias
app.use("/api/upload", uploadRoutes);
// Admin alias for stock movements (compatibility)
app.use("/api/admin/stock-movements", isAuth, isAdmin, stockMovementRoutes);
// New: stock push sessions for admin UI (optional)
if (stockPushSessionRoutes && (typeof stockPushSessionRoutes === 'function' || (stockPushSessionRoutes && typeof stockPushSessionRoutes.use === 'function'))) {
  app.use("/api/admin/stock-push-sessions", stockPushSessionRoutes);
} else if (stockPushSessionRoutes) {
  console.warn("[startup] stockPushSessionRoutes is not a valid router; skipping mount");
}

// Fallback bridge: directly wire controller handlers to avoid 404s if router fails to mount
try {
  const spsCtrl = require("./controller/stockPushSessionController");
  const { isAuth, isAdmin } = require("./config/auth");
  app.get("/api/admin/stock-push-sessions", isAuth, isAdmin, (req, res, next) => spsCtrl.listSessions(req, res, next));
  app.get("/api/admin/stock-push-sessions/stats", isAuth, isAdmin, (req, res, next) => spsCtrl.getStats(req, res, next));
  app.post("/api/admin/stock-push-sessions", isAuth, isAdmin, (req, res, next) => spsCtrl.createSession(req, res, next));
  app.post("/api/admin/stock-push-sessions/:id/sync", isAuth, isAdmin, (req, res, next) => spsCtrl.syncSession(req, res, next));
  app.delete("/api/admin/stock-push-sessions/:id", isAuth, isAdmin, (req, res, next) => spsCtrl.deleteSession(req, res, next));
} catch (e) {
  console.warn("[startup] Could not wire fallback stock-push session endpoints:", e && e.message ? e.message : e);
}

// Compatibility mounts for customer app (pluralized paths)
app.use("/api/products", productRoutes);
app.use("/api/attributes", attributeRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/product-units", productUnitRoutes);
app.use("/api/promotion-lists", promotionListRoutes);

// Explicit admin dashboard endpoints to ensure compatibility
app.get("/api/orders/dashboard", (req, res, next) => orderController.getDashboardOrders(req, res, next));
app.get("/api/orders/dashboard-recent-order", (req, res, next) => orderController.getDashboardRecentOrder(req, res, next));
app.get("/api/orders/dashboard-count", (req, res, next) => orderController.getDashboardCount(req, res, next));
app.get("/api/orders/dashboard-amount", (req, res, next) => orderController.getDashboardAmount(req, res, next));
app.get("/api/orders/best-seller/chart", (req, res, next) => orderController.getBestSellerProductChart(req, res, next));

// Errors
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  res.status(500).json({ message: err.message || "Something went wrong" });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5055;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
}); 
