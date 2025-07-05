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

// 📊 Sales Analytics Routes - Task 1.2.2 Implementation
router.get("/sales", isAuth, isAdmin, getSalesAnalytics);
router.get("/sales/export", isAuth, isAdmin, (req, res) => {
  req.query.reportType = "sales";
  exportReport(req, res);
});

// 📦 Inventory Reports Routes - Task 1.2.2 Implementation
router.get("/inventory", isAuth, isAdmin, getInventoryReports);
router.get("/inventory/export", isAuth, isAdmin, (req, res) => {
  req.query.reportType = "inventory";
  exportReport(req, res);
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