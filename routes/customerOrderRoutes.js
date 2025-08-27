const express = require("express");
const router = express.Router();
const {
  addOrder,
  getOrderCustomer,
  getOrderById,
  getOrderByInvoice,
  sendEmailInvoiceToCustomer,
} = require("../controller/customerOrderController");
const { customerCancelOrder } = require("../controller/orderController");
const { isAuth } = require("../config/auth");

//add a order
router.post("/add", isAuth, addOrder);

//get all order by a user
router.get("/", isAuth, getOrderCustomer);

//get a order by id
router.get("/:id", isAuth, getOrderById);

//get a order by invoice
router.get("/invoice/:invoice", isAuth, getOrderByInvoice);

// Customer cancel their own order
router.put("/:id/cancel", isAuth, customerCancelOrder);

//send email to customer
router.post("/email-invoice", isAuth, sendEmailInvoiceToCustomer);

// Revert order to checkout
router.post("/:id/revert-to-checkout", isAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { version } = req.headers;
    
    // Get the order
    const Order = require("../models/Order");
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Check if user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You don't have permission to modify this order" });
    }
    
    // Check if order can be reverted
    if (order.status !== 'Received') {
      return res.status(400).json({ message: "Only received orders can be reverted to checkout" });
    }
    
    if (order.lockedAt) {
      return res.status(423).json({ message: "Order is locked and cannot be modified" });
    }
    
    if (order.deliveryInfo?.assignedDriver) {
      return res.status(423).json({ message: "Order has been assigned to a driver and cannot be modified" });
    }
    
    // Check version for concurrency control
    if (version && order.version && parseInt(version) !== order.version) {
      return res.status(409).json({ message: "Order has been modified. Please refresh and try again." });
    }
    
    // Return the cart data for checkout
    const cartData = {
      cart: order.cart || [],
      address: order.user_info || {},
      coordinates: order.coordinates || {},
      deliveryLocation: order.deliveryLocation || {},
      coupon: order.couponInfo || {},
      notes: order.notes || ""
    };
    
    res.json(cartData);
    
  } catch (error) {
    console.error("Error reverting order to checkout:", error);
    res.status(500).json({ message: "Failed to revert order to checkout" });
  }
});

module.exports = router;
