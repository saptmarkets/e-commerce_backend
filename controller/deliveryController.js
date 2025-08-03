const Order = require("../models/Order");
const Admin = require("../models/Admin");
const VerificationCodeGenerator = require("../lib/verification-code/generator");
const { createOrderNotification } = require("./notificationController");

// Get order details for delivery person with product checklist
const getOrderForDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('user', 'name email phone')
      .populate('deliveryInfo.assignedDriver', 'name email phone');
    
    if (!order) {
      return res.status(404).send({
        message: "Order not found"
      });
    }
    
    console.log(`Getting delivery info for order ${order.invoice}`);
    console.log(`Product checklist length: ${order.deliveryInfo?.productChecklist?.length || 0}`);
    console.log(`Cart length: ${order.cart?.length || 0}`);
    console.log(`Order total: ${order.total}, subTotal: ${order.subTotal}, shipping: ${order.shippingCost}, discount: ${order.discount}`);
    
    // Return order with delivery-specific information (matching the original order structure)
    res.send({
      _id: order._id,
      orderId: order._id,
      invoice: order.invoice,
      status: order.status,
      user_info: order.user_info, // Keep original structure
      customer: {
        name: order.user_info.name,
        contact: order.user_info.contact,
        address: order.user_info.address,
        deliveryLocation: order.user_info.deliveryLocation
      },
      cart: order.cart, // Include original cart for reference
      subTotal: order.subTotal,
      shippingCost: order.shippingCost,
      discount: order.discount,
      loyaltyDiscount: order.loyaltyDiscount || 0,
      loyaltyPointsUsed: order.loyaltyPointsUsed || 0,
      total: order.total,
      paymentMethod: order.paymentMethod,
      productChecklist: order.deliveryInfo?.productChecklist || [],
      allItemsCollected: order.deliveryInfo?.allItemsCollected || false,
      verificationCode: order.verificationCode,
      verificationCodeUsed: order.verificationCodeUsed,
      deliveryNotes: order.deliveryInfo?.deliveryNotes || '',
      assignedDriver: order.deliveryInfo?.assignedDriver,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      deliveryInfo: order.deliveryInfo
    });
    
  } catch (err) {
    console.error('Get order for delivery error:', err);
    res.status(500).send({
      message: err.message || "Error retrieving order for delivery"
    });
  }
};

// Update order status to Processing and initialize product checklist
const startOrderProcessing = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { driverId } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send({
        message: "Order not found"
      });
    }
    
    if (order.status !== 'Pending') {
      return res.status(400).send({
        message: `Cannot start processing. Order status is ${order.status}`
      });
    }
    
    console.log(`Starting processing for order ${order.invoice}`);
    console.log(`Cart items:`, order.cart?.map(item => ({ id: item.id, title: item.title, quantity: item.quantity })));
    
    // Update order status and assign driver
    order.status = 'Processing';
    order.deliveryInfo = {
      ...order.deliveryInfo,
      assignedDriver: driverId,
      assignedAt: new Date(),
      allItemsCollected: false
    };
    
    // If product checklist doesn't exist, create it from cart
    if (!order.deliveryInfo.productChecklist || order.deliveryInfo.productChecklist.length === 0) {
      order.deliveryInfo.productChecklist = VerificationCodeGenerator.generateProductChecklist(order.cart);
      console.log(`Generated product checklist:`, order.deliveryInfo.productChecklist);
    }
    
    await order.save();
    
    // Create customer notification for Processing status
    if (order.user) {
      try {
        await createOrderNotification(order.user, order._id, 'Processing', order.invoice);
        console.log(`📢 NOTIFICATION: Created Processing notification for customer ${order.user} - Order ${order.invoice}`);
      } catch (notificationError) {
        console.error('Failed to create processing notification:', notificationError);
      }
    }
    
    console.log(`Order ${order.invoice} status changed to Processing. Driver ${driverId} assigned.`);
    
    res.send({
      message: "Order processing started successfully",
      order: {
        id: order._id,
        invoice: order.invoice,
        status: order.status,
        productChecklist: order.deliveryInfo.productChecklist,
        assignedDriver: order.deliveryInfo.assignedDriver
      }
    });
    
  } catch (err) {
    console.error('Start order processing error:', err);
    res.status(500).send({
      message: err.message || "Error starting order processing"
    });
  }
};

// Mark individual product as collected
const markProductCollected = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { collected, notes, driverName } = req.body;
    
    console.log(`Marking product ${productId} as ${collected ? 'collected' : 'uncollected'} for order ${orderId}`);
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send({
        message: "Order not found"
      });
    }
    
    if (order.status !== 'Processing') {
      return res.status(400).send({
        message: `Cannot update product collection. Order status is ${order.status}`
      });
    }
    
    console.log(`Current checklist:`, order.deliveryInfo?.productChecklist?.map(item => ({ productId: item.productId, title: item.title, collected: item.collected })));
    
    // Find and update the specific product in checklist
    const productIndex = order.deliveryInfo.productChecklist.findIndex(
      item => item.productId === productId
    );
    
    if (productIndex === -1) {
      console.log(`Product ${productId} not found in checklist`);
      return res.status(404).send({
        message: "Product not found in checklist"
      });
    }
    
    // Update product collection status
    order.deliveryInfo.productChecklist[productIndex].collected = collected;
    order.deliveryInfo.productChecklist[productIndex].collectedAt = collected ? new Date() : null;
    order.deliveryInfo.productChecklist[productIndex].collectedBy = collected ? driverName : null;
    order.deliveryInfo.productChecklist[productIndex].notes = notes || '';
    
    // Check if all items are collected
    const allCollected = order.deliveryInfo.productChecklist.every(item => item.collected);
    order.deliveryInfo.allItemsCollected = allCollected;
    
    if (allCollected) {
      order.deliveryInfo.collectionCompletedAt = new Date();
      console.log(`All items collected for order ${order.invoice}`);
    }
    
    await order.save();
    
    console.log(`Product ${productId} ${collected ? 'collected' : 'uncollected'} successfully`);
    
    res.send({
      message: `Product ${collected ? 'marked as collected' : 'unmarked'}`,
      productChecklist: order.deliveryInfo.productChecklist,
      allItemsCollected: order.deliveryInfo.allItemsCollected
    });
    
  } catch (err) {
    console.error('Mark product collected error:', err);
    res.status(500).send({
      message: err.message || "Error updating product collection status"
    });
  }
};

// Update order status to "Out for Delivery" (only if all items collected)
const markOutForDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send({
        message: "Order not found"
      });
    }
    
    if (order.status !== 'Processing') {
      return res.status(400).send({
        message: `Cannot mark out for delivery. Order status is ${order.status}`
      });
    }
    
    if (!order.deliveryInfo?.allItemsCollected) {
      return res.status(400).send({
        message: "Cannot mark out for delivery. Not all items have been collected.",
        uncollectedItems: order.deliveryInfo?.productChecklist?.filter(item => !item.collected) || []
      });
    }
    
    // Update order status
    order.status = 'Out for Delivery';
    order.deliveryInfo.outForDeliveryAt = new Date();
    
    await order.save();
    
    // Create customer notification for Out for Delivery status
    if (order.user) {
      try {
        await createOrderNotification(order.user, order._id, 'Out for Delivery', order.invoice);
        console.log(`📢 NOTIFICATION: Created Out for Delivery notification for customer ${order.user} - Order ${order.invoice}`);
      } catch (notificationError) {
        console.error('Failed to create out for delivery notification:', notificationError);
      }
    }
    
    console.log(`Order ${order.invoice} marked as Out for Delivery`);
    
    res.send({
      message: "Order marked as out for delivery",
      order: {
        id: order._id,
        invoice: order.invoice,
        status: order.status,
        outForDeliveryAt: order.deliveryInfo.outForDeliveryAt
      }
    });
    
  } catch (err) {
    console.error('Mark out for delivery error:', err);
    res.status(500).send({
      message: err.message || "Error marking order out for delivery"
    });
  }
};

// Complete delivery with verification code
const completeDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { verificationCode, deliveryNotes, recipientName } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send({
        message: "Order not found"
      });
    }
    
    if (order.status !== 'Out for Delivery') {
      return res.status(400).send({
        message: `Cannot complete delivery. Order status is ${order.status}`
      });
    }
    
    // Validate verification code
    if (!verificationCode || verificationCode !== order.verificationCode) {
      return res.status(400).send({
        message: "Invalid verification code. Please check the code provided by the customer."
      });
    }
    
    if (order.verificationCodeUsed) {
      return res.status(400).send({
        message: "Verification code has already been used for this order."
      });
    }
    
    // Mark order as delivered
    order.status = 'Delivered';
    order.verificationCodeUsed = true;
    order.verificationCodeUsedAt = new Date();
    order.deliveryInfo.deliveredAt = new Date();
    order.deliveryInfo.deliveryNotes = deliveryNotes || '';
    order.deliveryInfo.deliveryProof = {
      ...order.deliveryInfo.deliveryProof,
      recipientName: recipientName || order.user_info.name
    };
    
    await order.save();
    
    // Handle stock reduction and loyalty points (existing logic from orderController)
    const { handleProductQuantity, handleLoyaltyPoints } = require("../lib/stock-controller/others");
    
    // Reduce product stock
    if (order.cart && order.cart.length > 0) {
      await handleProductQuantity(order.cart);
    }
    
    // Award loyalty points to customer
    if (order.user) {
      const orderAmountForPoints = order.subTotal + (order.shippingCost || 0) - (order.discount || 0);
      await handleLoyaltyPoints(order.user, order._id, orderAmountForPoints);
    }
    
    // Update product sales for popular products calculation (if not already updated)
    try {
      const cartItems = order.cart || [];
      for (const item of cartItems) {
        const productId = item.productId || item.id;
        if (productId) {
          const quantity = item.quantity || 1;
          const packQty = item.packQty || 1;
          const totalQuantity = quantity * packQty;
          
          // Update product sales (increment by quantity sold)
          await Product.findByIdAndUpdate(
            productId,
            { $inc: { sales: totalQuantity } },
            { new: true }
          );
        }
      }
    } catch (salesUpdateErr) {
      console.error('Failed to update product sales on delivery:', salesUpdateErr);
      // Don't fail the delivery if sales update fails
    }
    
    console.log(`✅ Order ${order.invoice} delivered successfully with verification code`);
    
    res.send({
      message: "Order delivered successfully!",
      order: {
        id: order._id,
        invoice: order.invoice,
        status: order.status,
        deliveredAt: order.deliveryInfo.deliveredAt,
        verificationCodeUsed: true
      }
    });
    
  } catch (err) {
    console.error('Complete delivery error:', err);
    res.status(500).send({
      message: err.message || "Error completing delivery"
    });
  }
};

// Get delivery statistics for admin dashboard
const getDeliveryStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    // Get orders with delivery info
    const processingOrders = await Order.countDocuments({ status: 'Processing' });
    const outForDeliveryOrders = await Order.countDocuments({ status: 'Out for Delivery' });
    const deliveredTodayOrders = await Order.countDocuments({ 
      status: 'Delivered',
      'deliveryInfo.deliveredAt': { $gte: startOfDay, $lt: endOfDay }
    });
    
    // Get orders with incomplete collections
    const ordersWithIncompleteCollections = await Order.countDocuments({
      status: 'Processing',
      'deliveryInfo.allItemsCollected': false
    });
    
    res.send({
      processingOrders,
      outForDeliveryOrders,
      deliveredTodayOrders,
      ordersWithIncompleteCollections,
      totalActiveDeliveries: processingOrders + outForDeliveryOrders
    });
    
  } catch (err) {
    console.error('Get delivery stats error:', err);
    res.status(500).send({
      message: err.message || "Error retrieving delivery statistics"
    });
  }
};

module.exports = {
  getOrderForDelivery,
  startOrderProcessing,
  markProductCollected,
  markOutForDelivery,
  completeDelivery,
  getDeliveryStats
}; 