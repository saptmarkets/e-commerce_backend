const express = require("express");
const router = express.Router();
const { isAuth, isAdmin } = require("../config/auth");

// Import report controller functions
const {
  getSalesAnalytics,
  getInventoryReports,
  getCustomerInsights,
  getDeliveryPerformance,
  getFinancialReports,
  getExecutiveDashboard,
  exportReport
} = require("../controller/reportController");

// Import advanced sales analytics controller - Task 2.1.2
const {
  getSalesOverview,
  getProductPerformance,
  getCustomerAnalytics,
  getSalesTrends,
  getGeographicAnalysis,
  getPaymentMethodAnalysis,
  getTopProducts,
  getCategorySales,
  exportSalesReport,
  getSalesDashboard
} = require("../controller/salesAnalyticsController");

// Import inventory analytics controller - Task 3.1.2
const InventoryAnalyticsController = require("../controller/inventoryAnalyticsController");
const inventoryAnalyticsController = new InventoryAnalyticsController();

// 📊 Sales Analytics Routes - Task 2.1.2 Advanced Implementation
// Legacy route for backward compatibility
router.get("/sales", isAuth, isAdmin, getSalesAnalytics);

// 🔥 New Advanced Sales Analytics Routes - Task 2.1.2
router.get("/sales/overview", isAuth, isAdmin, getSalesOverview);
router.get("/sales/products", isAuth, isAdmin, getProductPerformance);
router.get("/sales/customers", isAuth, isAdmin, getCustomerAnalytics);
router.get("/sales/trends", isAuth, isAdmin, getSalesTrends);
router.get("/sales/geographic", isAuth, isAdmin, getGeographicAnalysis);
router.get("/sales/payment-methods", isAuth, isAdmin, getPaymentMethodAnalysis);
router.get("/sales/top-products", isAuth, isAdmin, getTopProducts);
router.get("/sales/categories", isAuth, isAdmin, getCategorySales);
router.get("/sales/dashboard", isAuth, isAdmin, getSalesDashboard);

// 📄 Sales Export Routes - Task 2.1.2
router.get("/sales/export", isAuth, isAdmin, exportSalesReport);
router.post("/sales/export", isAuth, isAdmin, exportSalesReport);

// Legacy export route
router.get("/sales/export/legacy", isAuth, isAdmin, (req, res) => {
  req.query.reportType = "sales";
  exportReport(req, res);
});

// 📦 Inventory Reports Routes - Task 1.2.2 Implementation
router.get("/inventory", isAuth, isAdmin, getInventoryReports);
router.get("/inventory/export", isAuth, isAdmin, (req, res) => {
  req.query.reportType = "inventory";
  exportReport(req, res);
});

// 📦 Advanced Inventory Analytics Routes - Task 3.1.2 Implementation
router.get("/inventory/overview", isAuth, isAdmin, (req, res) => {
  inventoryAnalyticsController.getStockOverview(req, res);
});
router.get("/inventory/movement", isAuth, isAdmin, (req, res) => {
  inventoryAnalyticsController.getStockMovement(req, res);
});
router.get("/inventory/velocity", isAuth, isAdmin, (req, res) => {
  inventoryAnalyticsController.getProductVelocity(req, res);
});
router.get("/inventory/valuation", isAuth, isAdmin, (req, res) => {
  inventoryAnalyticsController.getInventoryValuation(req, res);
});
router.get("/inventory/abc-analysis", isAuth, isAdmin, (req, res) => {
  inventoryAnalyticsController.getABCAnalysis(req, res);
});
router.get("/inventory/dashboard", isAuth, isAdmin, (req, res) => {
  inventoryAnalyticsController.getInventoryDashboard(req, res);
});
router.get("/inventory/export/advanced", isAuth, isAdmin, (req, res) => {
  inventoryAnalyticsController.exportInventoryReport(req, res);
});

// 👥 Customer Insights Routes - Task 1.2.2 Implementation
router.get("/customers", isAuth, isAdmin, getCustomerInsights);
router.get("/customers/export", isAuth, isAdmin, (req, res) => {
  req.query.reportType = "customers";
  exportReport(req, res);
});

// 🚚 Delivery Performance Routes - Task 1.2.2 Implementation
router.get("/delivery", isAuth, isAdmin, getDeliveryPerformance);
router.get("/delivery/export", isAuth, isAdmin, (req, res) => {
  req.query.reportType = "delivery";
  exportReport(req, res);
});

// 💰 Financial Reports Routes - Task 1.2.2 Implementation
router.get("/financial", isAuth, isAdmin, getFinancialReports);
router.get("/financial/export", isAuth, isAdmin, (req, res) => {
  req.query.reportType = "financial";
  exportReport(req, res);
});

// 📈 Executive Dashboard Routes - Task 1.2.2 Implementation
router.get("/executive", isAuth, isAdmin, getExecutiveDashboard);
router.get("/executive/export", isAuth, isAdmin, (req, res) => {
  req.query.reportType = "executive";
  exportReport(req, res);
});

// 📄 General Export Route - Task 1.2.2 Implementation
router.get("/export", isAuth, isAdmin, exportReport);

module.exports = router; 