const express = require("express");
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  getOrderCustomer,
  updateOrder,
  deleteOrder,
  getDashboardOrders,
  getDashboardRecentOrder,
  getBestSellerProductChart,
  getDashboardCount,
  getDashboardAmount,
  cancelOrder,
  customerCancelOrder,
  debugOrder,
  restoreLoyaltyPointsManually,
  testLoyaltyRestore,
} = require("../controller/orderController");

//get all orders
router.get("/", getAllOrders);

// get dashboard orders data
router.get("/dashboard", getDashboardOrders);

// dashboard recent-order
router.get("/dashboard-recent-order", getDashboardRecentOrder);

// dashboard order count
router.get("/dashboard-count", getDashboardCount);

// dashboard order amount
router.get("/dashboard-amount", getDashboardAmount);

// chart data for product
router.get("/best-seller/chart", getBestSellerProductChart);

//get all order by a user
router.get("/customer/:id", getOrderCustomer);

//get a order by id
router.get("/:id", getOrderById);

// Debug order details
router.get("/:id/debug", debugOrder);

//update a order
router.put("/:id", updateOrder);

//delete a order
router.delete("/:id", deleteOrder);

// Cancel an order (admin)
router.put("/:id/cancel", cancelOrder);

// Manual loyalty points restoration
router.put("/:id/restore-points", restoreLoyaltyPointsManually);

// Test loyalty service
router.post("/test-loyalty-restore", testLoyaltyRestore);

module.exports = router;
