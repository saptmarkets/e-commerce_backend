const Order = require("../models/Order");
const Admin = require("../models/Admin");
const DeliveryAssignment = require("../models/DeliveryAssignment");

// =====================================
// ORDER MANAGEMENT FOR DRIVERS
// =====================================

// Get orders assigned to the current driver
const getAssignedOrders = async (req, res) => {
  try {
    const driverId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build query
    let query = {
      'deliveryInfo.assignedDriver': driverId
    };
    
    // Filter by status if provided
    if (status) {
      if (status === 'active') {
        query.status = { $in: ['Processing', 'Out for Delivery'] };
      } else {
        query.status = status;
      }
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get orders with pagination
    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(query)
    ]);
    
    // Format orders for driver interface
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      invoice: order.invoice,
      status: order.status,
      customer: {
        name: order.user_info?.name,
        contact: order.user_info?.contact,
        address: order.user_info?.address,
        city: order.user_info?.city,
        deliveryLocation: order.user_info?.deliveryLocation
      },
      orderSummary: {
        itemCount: order.cart?.length || 0,
        total: order.total,
        paymentMethod: order.paymentMethod
      },
      deliveryInfo: {
        assignedAt: order.deliveryInfo?.assignedAt,
        estimatedDeliveryTime: order.deliveryInfo?.estimatedDeliveryTime,
        productChecklist: order.deliveryInfo?.productChecklist || [],
        allItemsCollected: order.deliveryInfo?.allItemsCollected || false,
        verificationCode: order.verificationCode
      },
      createdAt: order.createdAt,
      priority: order.deliveryInfo?.priority || 'medium'
    }));
    
    res.json({
      orders: formattedOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalOrders: totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('Get assigned orders error:', error);
    res.status(500).json({
      message: "Error retrieving assigned orders",
      error: error.message
    });
  }
};

// Get detailed order information for driver
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const driverId = req.user._id;
    
    const order = await Order.findOne({
      _id: orderId,
      'deliveryInfo.assignedDriver': driverId
    }).populate('user', 'name email phone');
    
    if (!order) {
      return res.status(404).json({
        message: "Order not found or not assigned to you"
      });
    }
    
    // Calculate delivery distance (mock calculation - replace with actual GPS calculation)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      // Haversine formula for distance calculation
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    
    let distance = null;
    if (order.user_info?.deliveryLocation?.latitude && 
        order.user_info?.deliveryLocation?.longitude) {
      // You can get driver's current location from Admin model
      const driver = await Admin.findById(driverId);
      if (driver?.deliveryInfo?.currentLocation?.latitude &&
          driver?.deliveryInfo?.currentLocation?.longitude) {
        distance = calculateDistance(
          driver.deliveryInfo.currentLocation.latitude,
          driver.deliveryInfo.currentLocation.longitude,
          order.user_info.deliveryLocation.latitude,
          order.user_info.deliveryLocation.longitude
        );
      }
    }
    
    // Format detailed order response
    const orderDetails = {
      _id: order._id,
      invoice: order.invoice,
      status: order.status,
      
      // Customer information
      customer: {
        name: order.user_info?.name,
        contact: order.user_info?.contact,
        email: order.user?.email,
        address: order.user_info?.address,
        city: order.user_info?.city,
        country: order.user_info?.country,
        zipCode: order.user_info?.zipCode,
        deliveryLocation: order.user_info?.deliveryLocation,
        coordinates: order.user_info?.coordinates
      },
      
      // Order items
      items: order.cart?.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        sku: item.sku,
        unitName: item.unitName,
        packQty: item.packQty,
        total: item.price * item.quantity
      })) || [],
      
      // Order totals
      financial: {
        subTotal: order.subTotal,
        shippingCost: order.shippingCost,
        discount: order.discount,
        loyaltyDiscount: order.loyaltyDiscount || 0,
        total: order.total,
        paymentMethod: order.paymentMethod,
        needsPaymentCollection: order.paymentMethod === 'Cash',
        // Additional financial details for driver
        amountToCollect: order.paymentMethod === 'Cash' ? order.total : 0,
        currency: 'د.ك', // Kuwaiti Dinar
        taxAmount: order.taxAmount || 0,
        serviceCharge: order.serviceCharge || 0,
        promoDiscount: order.promoDiscount || 0,
        couponDiscount: order.couponDiscount || 0,
        // Breakdown for transparency
        breakdown: {
          itemsTotal: order.subTotal,
          delivery: order.shippingCost || 0,
          discount: (order.discount || 0) + (order.loyaltyDiscount || 0) + (order.promoDiscount || 0) + (order.couponDiscount || 0),
          tax: order.taxAmount || 0,
          service: order.serviceCharge || 0,
          finalTotal: order.total
        }
      },
      
      // Delivery specific information
      delivery: {
        assignedAt: order.deliveryInfo?.assignedAt,
        productChecklist: order.deliveryInfo?.productChecklist || [],
        allItemsCollected: order.deliveryInfo?.allItemsCollected || false,
        collectionCompletedAt: order.deliveryInfo?.collectionCompletedAt,
        outForDeliveryAt: order.deliveryInfo?.outForDeliveryAt,
        deliveredAt: order.deliveryInfo?.deliveredAt,
        deliveryNotes: order.deliveryInfo?.deliveryNotes,
        verificationCode: order.verificationCode,
        verificationCodeUsed: order.verificationCodeUsed,
        estimatedDistance: distance ? `${distance.toFixed(2)} km` : null,
        deliveryProof: order.deliveryInfo?.deliveryProof
      },
      
      timestamps: {
        orderPlaced: order.createdAt,
        lastUpdated: order.updatedAt
      }
    };
    
    res.json(orderDetails);
    
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      message: "Error retrieving order details",
      error: error.message
    });
  }
};

// Update order status (driver-specific)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes, location } = req.body;
    const driverId = req.user._id;
    
    const order = await Order.findOne({
      _id: orderId,
      'deliveryInfo.assignedDriver': driverId
    });
    
    if (!order) {
      return res.status(404).json({
        message: "Order not found or not assigned to you"
      });
    }
    
    // Validate status transitions
    const validTransitions = {
      'Processing': ['Out for Delivery'],
      'Out for Delivery': ['Delivered'],
    };
    
    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from ${order.status} to ${status}`
      });
    }
    
    // Update order status
    order.status = status;
    
    // Update delivery tracking based on status
    if (status === 'Out for Delivery') {
      order.deliveryInfo.outForDeliveryAt = new Date();
    } else if (status === 'Delivered') {
      order.deliveryInfo.deliveredAt = new Date();
    }
    
    // Add notes if provided
    if (notes) {
      order.deliveryInfo.deliveryNotes = notes;
    }
    
    // Update driver's current location if provided
    if (location && location.latitude && location.longitude) {
      const driver = await Admin.findById(driverId);
      if (driver) {
        if (!driver.deliveryInfo) driver.deliveryInfo = {};
        driver.deliveryInfo.currentLocation = {
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
          lastUpdated: new Date()
        };
        await driver.save();
      }
    }
    
    await order.save();
    
    console.log(`📦 Order ${order.invoice} status updated to ${status} by driver ${driverId}`);
    
    res.json({
      message: `Order status updated to ${status}`,
      order: {
        _id: order._id,
        invoice: order.invoice,
        status: order.status,
        updatedAt: order.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      message: "Error updating order status",
      error: error.message
    });
  }
};

// =====================================
// DELIVERY ACTIONS
// =====================================

// Mark individual product as collected/uncollected
const toggleProductCollection = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { productId, collected, notes } = req.body;
    const driverId = req.user._id;
    
    const order = await Order.findOne({
      _id: orderId,
      'deliveryInfo.assignedDriver': driverId
    });
    
    if (!order) {
      return res.status(404).json({
        message: "Order not found or not assigned to you"
      });
    }
    
    if (order.status !== 'Processing') {
      return res.status(400).json({
        message: `Cannot modify product collection. Order status is ${order.status}`
      });
    }
    
    // Find the product in the checklist
    if (!order.deliveryInfo.productChecklist) {
      return res.status(400).json({
        message: "Product checklist not found"
      });
    }
    
    const productIndex = order.deliveryInfo.productChecklist.findIndex(
      item => item.productId === productId || item.id === productId
    );
    
    if (productIndex === -1) {
      return res.status(404).json({
        message: "Product not found in checklist"
      });
    }
    
    // Update product collection status
    order.deliveryInfo.productChecklist[productIndex].collected = collected;
    order.deliveryInfo.productChecklist[productIndex].collectedAt = collected ? new Date() : null;
    order.deliveryInfo.productChecklist[productIndex].collectedBy = collected ? req.user.name?.en || req.user.email : null;
    
    if (notes) {
      order.deliveryInfo.productChecklist[productIndex].notes = notes;
    }
    
    // Check if all items are collected
    const allCollected = order.deliveryInfo.productChecklist.every(item => item.collected);
    order.deliveryInfo.allItemsCollected = allCollected;
    
    if (allCollected) {
      order.deliveryInfo.collectionCompletedAt = new Date();
    } else {
      order.deliveryInfo.collectionCompletedAt = null;
    }
    
    await order.save();
    
    const action = collected ? 'collected' : 'uncollected';
    console.log(`📦 Product ${productId} marked as ${action} in order ${order.invoice} by driver ${driverId}`);
    
    res.json({
      message: `Product marked as ${action}`,
      productChecklist: order.deliveryInfo.productChecklist,
      allItemsCollected: order.deliveryInfo.allItemsCollected,
      collectionCompletedAt: order.deliveryInfo.collectionCompletedAt
    });
    
  } catch (error) {
    console.error('Toggle product collection error:', error);
    res.status(500).json({
      message: "Error updating product collection",
      error: error.message
    });
  }
};

// Mark order as picked up
const markAsPickedUp = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { notes, location } = req.body;
    const driverId = req.user._id;
    
    const order = await Order.findOne({
      _id: orderId,
      'deliveryInfo.assignedDriver': driverId
    });
    
    if (!order) {
      return res.status(404).json({
        message: "Order not found or not assigned to you"
      });
    }
    
    if (order.status !== 'Processing') {
      return res.status(400).json({
        message: `Cannot mark as picked up. Order status is ${order.status}`
      });
    }
    
    if (!order.deliveryInfo?.allItemsCollected) {
      return res.status(400).json({
        message: "Cannot mark as picked up. Not all items have been collected."
      });
    }
    
    // Mark as picked up
    order.deliveryInfo.pickedUpAt = new Date();
    order.status = 'Out for Delivery';
    order.deliveryInfo.outForDeliveryAt = new Date();
    
    if (notes) {
      order.deliveryInfo.deliveryNotes = notes;
    }
    
    await order.save();
    
    // Update driver's availability
    const driver = await Admin.findById(driverId);
    if (driver) {
      if (!driver.deliveryInfo) driver.deliveryInfo = {};
      driver.deliveryInfo.availability = 'busy';
      
      // Update location if provided
      if (location && location.latitude && location.longitude) {
        driver.deliveryInfo.currentLocation = {
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
          lastUpdated: new Date()
        };
      }
      
      await driver.save();
    }
    
    console.log(`📦 Order ${order.invoice} marked as picked up by driver ${driverId}`);
    
    res.json({
      message: "Order marked as picked up and out for delivery",
      order: {
        _id: order._id,
        invoice: order.invoice,
        status: order.status,
        pickedUpAt: order.deliveryInfo.pickedUpAt,
        outForDeliveryAt: order.deliveryInfo.outForDeliveryAt
      }
    });
    
  } catch (error) {
    console.error('Mark as picked up error:', error);
    res.status(500).json({
      message: "Error marking order as picked up",
      error: error.message
    });
  }
};

// Mark order as out for delivery
const markOutForDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { estimatedArrival, notes } = req.body;
    const driverId = req.user._id;
    
    const order = await Order.findOne({
      _id: orderId,
      'deliveryInfo.assignedDriver': driverId
    });
    
    if (!order) {
      return res.status(404).json({
        message: "Order not found or not assigned to you"
      });
    }
    
    if (order.status !== 'Processing') {
      return res.status(400).json({
        message: `Cannot mark out for delivery. Order status is ${order.status}`
      });
    }
    
    if (!order.deliveryInfo?.allItemsCollected) {
      return res.status(400).json({
        message: "Cannot mark out for delivery. Not all items have been collected."
      });
    }
    
    // Mark as out for delivery
    order.status = 'Out for Delivery';
    order.deliveryInfo.outForDeliveryAt = new Date();
    
    if (estimatedArrival) {
      order.deliveryInfo.estimatedDeliveryTime = estimatedArrival;
    }
    
    if (notes) {
      order.deliveryInfo.deliveryNotes = notes;
    }
    
    await order.save();
    
    console.log(`🚚 Order ${order.invoice} marked as out for delivery by driver ${driverId}`);
    
    res.json({
      message: "Order marked as out for delivery",
      order: {
        _id: order._id,
        invoice: order.invoice,
        status: order.status,
        outForDeliveryAt: order.deliveryInfo.outForDeliveryAt,
        estimatedDeliveryTime: order.deliveryInfo.estimatedDeliveryTime
      }
    });
    
  } catch (error) {
    console.error('Mark out for delivery error:', error);
    res.status(500).json({
      message: "Error marking order out for delivery",
      error: error.message
    });
  }
};

// Mark order as delivered (with verification)
const markAsDelivered = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { verificationCode, deliveryNotes, recipientName, location } = req.body;
    const driverId = req.user._id;
    
    const order = await Order.findOne({
      _id: orderId,
      'deliveryInfo.assignedDriver': driverId
    });
    
    if (!order) {
      return res.status(404).json({
        message: "Order not found or not assigned to you"
      });
    }
    
    if (order.status !== 'Out for Delivery') {
      return res.status(400).json({
        message: `Cannot mark as delivered. Order status is ${order.status}`
      });
    }
    
    // Validate verification code
    if (!verificationCode || verificationCode !== order.verificationCode) {
      return res.status(400).json({
        message: "Invalid verification code. Please get the correct code from the customer."
      });
    }
    
    if (order.verificationCodeUsed) {
      return res.status(400).json({
        message: "Verification code has already been used."
      });
    }
    
    // Mark as delivered
    order.status = 'Delivered';
    order.verificationCodeUsed = true;
    order.verificationCodeUsedAt = new Date();
    order.deliveryInfo.deliveredAt = new Date();
    
    if (deliveryNotes) {
      order.deliveryInfo.deliveryNotes = deliveryNotes;
    }
    
    if (recipientName) {
      if (!order.deliveryInfo.deliveryProof) {
        order.deliveryInfo.deliveryProof = {};
      }
      order.deliveryInfo.deliveryProof.recipientName = recipientName;
    }
    
    if (location && location.latitude && location.longitude) {
      if (!order.deliveryInfo.deliveryProof) {
        order.deliveryInfo.deliveryProof = {};
      }
      order.deliveryInfo.deliveryProof.location = {
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude)
      };
    }
    
    await order.save();
    
    // Update driver stats and availability
    const driver = await Admin.findById(driverId);
    if (driver) {
      // Update delivery stats
      if (!driver.deliveryStats) driver.deliveryStats = {};
      driver.deliveryStats.totalDeliveries = (driver.deliveryStats.totalDeliveries || 0) + 1;
      driver.deliveryStats.completedToday = (driver.deliveryStats.completedToday || 0) + 1;
      
      // Update availability
      if (!driver.deliveryInfo) driver.deliveryInfo = {};
      driver.deliveryInfo.availability = 'available';
      
      await driver.save();
    }
    
    // Handle stock reduction and loyalty points (from existing delivery controller)
    try {
      const { handleProductQuantity, handleLoyaltyPoints } = require("../lib/stock-controller/others");
      
      if (order.cart && order.cart.length > 0) {
        console.log(`📦 DELIVERY: Reducing stock for ${order.cart.length} items`);
        await handleProductQuantity(order.cart);
      }
      
      if (order.user) {
        const orderAmountForPoints = order.subTotal + (order.shippingCost || 0) - (order.discount || 0);
        console.log(`💎 DELIVERY: Awarding loyalty points for order ${order.invoice}`);
        await handleLoyaltyPoints(order.user, order._id, orderAmountForPoints);
      }
    } catch (stockError) {
      console.error('Stock/loyalty processing error:', stockError);
      // Don't fail the delivery if stock processing fails
    }
    
    console.log(`✅ Order ${order.invoice} successfully delivered by driver ${driverId}`);
    
    res.json({
      message: "Order delivered successfully!",
      order: {
        _id: order._id,
        invoice: order.invoice,
        status: order.status,
        deliveredAt: order.deliveryInfo.deliveredAt,
        verificationCodeUsed: true
      }
    });
    
  } catch (error) {
    console.error('Mark as delivered error:', error);
    res.status(500).json({
      message: "Error marking order as delivered",
      error: error.message
    });
  }
};

// Mark delivery as failed
const markAsFailed = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, details, attemptRedelivery } = req.body;
    const driverId = req.user._id;
    
    if (!reason) {
      return res.status(400).json({
        message: "Failure reason is required"
      });
    }
    
    const order = await Order.findOne({
      _id: orderId,
      'deliveryInfo.assignedDriver': driverId
    });
    
    if (!order) {
      return res.status(404).json({
        message: "Order not found or not assigned to you"
      });
    }
    
    if (order.status !== 'Out for Delivery') {
      return res.status(400).json({
        message: `Cannot mark as failed. Order status is ${order.status}`
      });
    }
    
    // Add delivery attempt record
    if (!order.deliveryInfo.deliveryAttempts) {
      order.deliveryInfo.deliveryAttempts = [];
    }
    
    order.deliveryInfo.deliveryAttempts.push({
      attemptedAt: new Date(),
      reason: reason,
      notes: details || ''
    });
    
    // Determine next status
    if (attemptRedelivery && order.deliveryInfo.deliveryAttempts.length < 3) {
      // Return to processing for another delivery attempt
      order.status = 'Processing';
      order.deliveryInfo.outForDeliveryAt = null;
    } else {
      // Mark as cancelled after multiple failed attempts
      order.status = 'Cancel';
      order.cancelReason = `Delivery failed: ${reason}`;
      order.cancelledBy = 'driver';
      order.cancelledAt = new Date();
    }
    
    await order.save();
    
    // Update driver availability
    const driver = await Admin.findById(driverId);
    if (driver) {
      if (!driver.deliveryInfo) driver.deliveryInfo = {};
      driver.deliveryInfo.availability = 'available';
      await driver.save();
    }
    
    console.log(`❌ Order ${order.invoice} marked as failed by driver ${driverId}. Reason: ${reason}`);
    
    res.json({
      message: attemptRedelivery ? "Delivery marked as failed. Scheduled for retry." : "Delivery marked as failed and cancelled.",
      order: {
        _id: order._id,
        invoice: order.invoice,
        status: order.status,
        failureReason: reason,
        attemptCount: order.deliveryInfo.deliveryAttempts.length,
        willRetry: attemptRedelivery && order.deliveryInfo.deliveryAttempts.length < 3
      }
    });
    
  } catch (error) {
    console.error('Mark as failed error:', error);
    res.status(500).json({
      message: "Error marking delivery as failed",
      error: error.message
    });
  }
};

// Regenerate product checklist for orders missing it
const regenerateProductChecklist = async (req, res) => {
  try {
    const { orderId } = req.params;
    const driverId = req.user._id;
    
    console.log(`🔄 Regenerate checklist request: Order ${orderId}, Driver ${driverId}`);
    
    // First check if order exists
    const orderExists = await Order.findById(orderId);
    if (!orderExists) {
      console.log(`❌ Order ${orderId} not found`);
      return res.status(404).json({
        message: "Order not found"
      });
    }
    
    console.log(`📋 Order found: ${orderExists.invoice}, Status: ${orderExists.status}, Assigned to: ${orderExists.deliveryInfo?.assignedDriver}`);
    
    // Check if order is assigned to this driver
    const order = await Order.findOne({
      _id: orderId,
      'deliveryInfo.assignedDriver': driverId
    });
    
    if (!order) {
      console.log(`❌ Order ${orderId} not assigned to driver ${driverId}`);
      return res.status(404).json({
        message: "Order not found or not assigned to you",
        debug: {
          orderId,
          driverId,
          actualAssignedDriver: orderExists.deliveryInfo?.assignedDriver,
          orderStatus: orderExists.status
        }
      });
    }
    
    // Check if cart exists
    if (!order.cart || order.cart.length === 0) {
      console.log(`❌ Order ${order.invoice} has no cart items`);
      return res.status(400).json({
        message: "Order has no items to create checklist from",
        debug: {
          cartLength: order.cart?.length || 0,
          orderInvoice: order.invoice
        }
      });
    }
    
    // Regenerate product checklist from cart
    const VerificationCodeGenerator = require("../lib/verification-code/generator");
    const newChecklist = VerificationCodeGenerator.generateProductChecklist(order.cart);
    
    console.log(`📦 Generated checklist with ${newChecklist.length} items from ${order.cart.length} cart items`);
    
    // Initialize deliveryInfo if it doesn't exist
    if (!order.deliveryInfo) {
      order.deliveryInfo = {};
    }
    
    // Update the order
    order.deliveryInfo.productChecklist = newChecklist;
    order.deliveryInfo.allItemsCollected = false;
    order.deliveryInfo.collectionCompletedAt = null;
    
    await order.save();
    
    console.log(`✅ Regenerated product checklist for order ${order.invoice} with ${newChecklist.length} items`);
    
    res.json({
      message: "Product checklist regenerated successfully",
      productChecklist: newChecklist,
      checklistLength: newChecklist.length,
      orderInvoice: order.invoice,
      debug: {
        cartItems: order.cart.length,
        checklistItems: newChecklist.length,
        driverId,
        orderId
      }
    });
    
  } catch (error) {
    console.error('Regenerate checklist error:', error);
    res.status(500).json({
      message: "Error regenerating product checklist",
      error: error.message,
      debug: {
        orderId: req.params.orderId,
        driverId: req.user?._id,
        timestamp: new Date().toISOString()
      }
    });
  }
};

// Debug endpoint to check order assignment
const checkOrderAssignment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const driverId = req.user._id;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }
    
    const isAssigned = order.deliveryInfo?.assignedDriver?.toString() === driverId.toString();
    
    res.json({
      orderId,
      invoice: order.invoice,
      status: order.status,
      assignedDriver: order.deliveryInfo?.assignedDriver,
      currentDriver: driverId,
      isAssignedToCurrentDriver: isAssigned,
      hasCart: order.cart && order.cart.length > 0,
      cartItemCount: order.cart?.length || 0,
      hasProductChecklist: order.deliveryInfo?.productChecklist && order.deliveryInfo.productChecklist.length > 0,
      checklistItemCount: order.deliveryInfo?.productChecklist?.length || 0
    });
    
  } catch (error) {
    console.error('Check order assignment error:', error);
    res.status(500).json({
      message: "Error checking order assignment",
      error: error.message
    });
  }
};

module.exports = {
  // Order Management
  getAssignedOrders,
  getOrderDetails,
  updateOrderStatus,
  
  // Delivery Actions
  markAsPickedUp,
  markOutForDelivery,
  markAsDelivered,
  markAsFailed,
  toggleProductCollection,
  regenerateProductChecklist,
  checkOrderAssignment
}; 