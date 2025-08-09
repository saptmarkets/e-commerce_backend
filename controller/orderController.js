const Order = require("../models/Order");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const { handleOrderCancellation, handleProductQuantity, handleLoyaltyPoints } = require("../lib/stock-controller/others");
const LoyaltyService = require("../lib/loyalty-system/loyaltyService");
const { createOrderNotification } = require("./notificationController");

const getAllOrders = async (req, res) => {
  const {
    day,
    status,
    page,
    limit,
    method,
    endDate,
    // download,
    // sellFrom,
    startDate,
    customerName,
  } = req.query;

  //  day count
  let date = new Date();
  const today = date.toString();
  date.setDate(date.getDate() - Number(day));
  const dateTime = date.toString();

  const beforeToday = new Date();
  beforeToday.setDate(beforeToday.getDate() - 1);
  // const before_today = beforeToday.toString();

  const startDateData = new Date(startDate);
  startDateData.setDate(startDateData.getDate());
  const start_date = startDateData.toString();

  // console.log(" start_date", start_date, endDate);

  const queryObject = {};

  if (!status) {
    queryObject.$or = [
      { status: { $regex: `Received`, $options: "i" } },
      { status: { $regex: `Pending`, $options: "i" } },
      { status: { $regex: `Processing`, $options: "i" } },
      { status: { $regex: `Out for Delivery`, $options: "i" } },
      { status: { $regex: `Delivered`, $options: "i" } },
      { status: { $regex: `Cancel`, $options: "i" } },
    ];
  }

  if (customerName) {
    queryObject.$or = [
      { "user_info.name": { $regex: `${customerName}`, $options: "i" } },
      { invoice: { $regex: `${customerName}`, $options: "i" } },
    ];
  }

  if (day) {
    queryObject.createdAt = { $gte: dateTime, $lte: today };
  }

  if (status) {
    queryObject.status = { $regex: `${status}`, $options: "i" };
  }

  if (startDate && endDate) {
    queryObject.updatedAt = {
      $gt: start_date,
      $lt: endDate,
    };
  }
  if (method) {
    queryObject.paymentMethod = { $regex: `${method}`, $options: "i" };
  }

  const pages = Number(page) || 1;
  const limits = Number(limit);
  const skip = (pages - 1) * limits;

  try {
    // total orders count
    const totalDoc = await Order.countDocuments(queryObject);
    const orders = await Order.find(queryObject)
      .select(
        "_id invoice paymentMethod subTotal total user_info discount shippingCost status createdAt updatedAt"
      )
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limits);

    let methodTotals = [];
    if (startDate && endDate) {
      // console.log("filter method total");
      const filteredOrders = await Order.find(queryObject, {
        _id: 1,
        // subTotal: 1,
        total: 1,

        paymentMethod: 1,
        // createdAt: 1,
        updatedAt: 1,
      }).sort({ updatedAt: -1 });
      for (const order of filteredOrders) {
        const { paymentMethod, total } = order;
        const existPayment = methodTotals.find(
          (item) => item.method === paymentMethod
        );

        if (existPayment) {
          existPayment.total += total;
        } else {
          methodTotals.push({
            method: paymentMethod,
            total: total,
          });
        }
      }
    }

    res.send({
      orders,
      limits,
      pages,
      totalDoc,
      methodTotals,
      // orderOverview,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getOrderCustomer = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.id }).sort({ _id: -1 });
    res.send(orders);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    // console.log("getOrderById");

    const order = await Order.findById(req.params.id);
    res.send(order);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, ...otherUpdates } = req.body;

    console.log(`🔄 ORDER UPDATE: Processing update for order ${id}`, { status, otherUpdates });

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).send({
        message: "Order not found",
      });
    }

    const oldStatus = order.status;
    console.log(`📋 ORDER UPDATE: Order ${order.invoice} status change: ${oldStatus} → ${status}`);

    // Update order status
    if (status) {
      console.log(`🔄 ORDER STATUS UPDATE: Order ${order.invoice} (${order._id}) status changing from "${oldStatus}" to "${status}"`);
      
      // When order is delivered, reduce stock and award loyalty points
      if (status === 'Delivered' && oldStatus !== 'Delivered') {
        console.log(`🚀 ORDER DELIVERED: Processing order ${order.invoice} (${order._id})`);
        console.log(`📋 Order cart:`, order.cart ? order.cart.length : 'No cart');
        
        // Reduce product stock
        if (order.cart && order.cart.length > 0) {
          console.log(`📦 CALLING handleProductQuantity with ${order.cart.length} items`);
          // Add admin_id to order object for stock movement creation
          const orderWithAdmin = {
            ...order.toObject(),
            admin_id: req.admin?._id || req.user?._id || null
          };
          await handleProductQuantity(order.cart, orderWithAdmin);
          console.log(`✅ handleProductQuantity completed for order ${order.invoice}`);
        } else {
          console.warn(`⚠️ No cart items found for order ${order.invoice}`);
        }
        
        // Award loyalty points to customer
        if (order.user) {
          const orderAmountForPoints = order.subTotal + (order.shippingCost || 0) - (order.discount || 0);
          await handleLoyaltyPoints(order.user, order._id, orderAmountForPoints);
        }
      }
      
      // When order is cancelled, restore stock and loyalty points
      else if (status === 'Cancel' && oldStatus !== 'Cancel') {
        await handleOrderCancellation(order, "Order cancelled");
      }
      
      // Create customer notification for status change
      if (order.user) {
        try {
          await createOrderNotification(order.user, order._id, status, order.invoice);
          console.log(`📢 NOTIFICATION: Created notification for customer ${order.user} - Order ${order.invoice} status: ${status}`);
        } catch (notificationError) {
          console.error('Failed to create order notification:', notificationError);
          // Don't fail order update if notification creation fails
        }
      }
    }

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status, ...otherUpdates },
      { new: true }
    );



    res.send({
      data: updatedOrder,
      message: "Order updated successfully!",
    });
    
  } catch (err) {
    console.error('❌ ORDER UPDATE: Error updating order:', err.message);
    res.status(500).send({
      message: err.message || "Some error occurred while updating the order",
    });
  }
};

const deleteOrder = (req, res) => {
  Order.deleteOne({ _id: req.params.id }, (err) => {
    if (err) {
      res.status(500).send({
        message: err.message,
      });
    } else {
      res.status(200).send({
        message: "Order Deleted Successfully!",
      });
    }
  });
};

// get dashboard recent order
const getDashboardRecentOrder = async (req, res) => {
  try {
    // console.log("getDashboardRecentOrder");

    const { page, limit } = req.query;

    const pages = Number(page) || 1;
    const limits = Number(limit) || 8;
    const skip = (pages - 1) * limits;

    const queryObject = {};

    queryObject.$or = [
      { status: { $regex: `Pending`, $options: "i" } },
      { status: { $regex: `Processing`, $options: "i" } },
      { status: { $regex: `Delivered`, $options: "i" } },
      { status: { $regex: `Cancel`, $options: "i" } },
    ];

    const totalDoc = await Order.countDocuments(queryObject);

    // query for orders
    const orders = await Order.find(queryObject)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limits);

    // console.log('order------------<', orders);

    res.send({
      orders: orders,
      page: page,
      limit: limit,
      totalOrder: totalDoc,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// get dashboard count
const getDashboardCount = async (req, res) => {
  try {
    // console.log("getDashboardCount");

    const totalDoc = await Order.countDocuments();

    // total padding order count
    const totalPendingOrder = await Order.aggregate([
      {
        $match: {
          status: "Pending",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // total processing order count
    const totalProcessingOrder = await Order.aggregate([
      {
        $match: {
          status: "Processing",
        },
      },
      {
        $group: {
          _id: null,
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // total delivered order count
    const totalDeliveredOrder = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
        },
      },
      {
        $group: {
          _id: null,
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    res.send({
      totalOrder: totalDoc,
      totalPendingOrder: totalPendingOrder[0] || 0,
      totalProcessingOrder: totalProcessingOrder[0]?.count || 0,
      totalDeliveredOrder: totalDeliveredOrder[0]?.count || 0,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getDashboardAmount = async (req, res) => {
  // console.log('total')
  let week = new Date();
  week.setDate(week.getDate() - 10);

  // console.log('getDashboardAmount');

  const currentDate = new Date();
  currentDate.setDate(1); // Set the date to the first day of the current month
  currentDate.setHours(0, 0, 0, 0); // Set the time to midnight

  const lastMonthStartDate = new Date(currentDate); // Copy the current date
  lastMonthStartDate.setMonth(currentDate.getMonth() - 1); // Subtract one month

  let lastMonthEndDate = new Date(currentDate); // Copy the current date
  lastMonthEndDate.setDate(0); // Set the date to the last day of the previous month
  lastMonthEndDate.setHours(23, 59, 59, 999); // Set the time to the end of the day

  try {
    // total order amount
    const totalAmount = await Order.aggregate([
      {
        $group: {
          _id: null,
          tAmount: {
            $sum: "$total",
          },
        },
      },
    ]);
    // console.log('totalAmount',totalAmount)
    const thisMonthOrderAmount = await Order.aggregate([
      {
        $project: {
          year: { $year: "$updatedAt" },
          month: { $month: "$updatedAt" },
          total: 1,
          subTotal: 1,
          discount: 1,
          updatedAt: 1,
          createdAt: 1,
          status: 1,
        },
      },
      {
        $match: {
          $or: [{ status: { $regex: "Delivered", $options: "i" } }],
          year: { $eq: new Date().getFullYear() },
          month: { $eq: new Date().getMonth() + 1 },
          // $expr: {
          //   $eq: [{ $month: "$updatedAt" }, { $month: new Date() }],
          // },
        },
      },
      {
        $group: {
          _id: {
            month: {
              $month: "$updatedAt",
            },
          },
          total: {
            $sum: "$total",
          },
          subTotal: {
            $sum: "$subTotal",
          },

          discount: {
            $sum: "$discount",
          },
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $limit: 1,
      },
    ]);

    const lastMonthOrderAmount = await Order.aggregate([
      {
        $project: {
          year: { $year: "$updatedAt" },
          month: { $month: "$updatedAt" },
          total: 1,
          subTotal: 1,
          discount: 1,
          updatedAt: 1,
          createdAt: 1,
          status: 1,
        },
      },
      {
        $match: {
          $or: [{ status: { $regex: "Delivered", $options: "i" } }],

          updatedAt: { $gt: lastMonthStartDate, $lt: lastMonthEndDate },
        },
      },
      {
        $group: {
          _id: {
            month: {
              $month: "$updatedAt",
            },
          },
          total: {
            $sum: "$total",
          },
          subTotal: {
            $sum: "$subTotal",
          },

          discount: {
            $sum: "$discount",
          },
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $limit: 1,
      },
    ]);

    // console.log("thisMonthlyOrderAmount ===>", thisMonthlyOrderAmount);

    // order list last 10 days
    const orderFilteringData = await Order.find(
      {
        $or: [{ status: { $regex: `Delivered`, $options: "i" } }],
        updatedAt: {
          $gte: week,
        },
      },

      {
        paymentMethod: 1,
        paymentDetails: 1,
        total: 1,
        createdAt: 1,
        updatedAt: 1,
      }
    );

    res.send({
      totalAmount:
        totalAmount.length === 0
          ? 0
          : parseFloat(totalAmount[0].tAmount).toFixed(2),
      thisMonthlyOrderAmount: thisMonthOrderAmount[0]?.total,
      lastMonthOrderAmount: lastMonthOrderAmount[0]?.total,
      ordersData: orderFilteringData,
    });
  } catch (err) {
    // console.log('err',err)
    res.status(500).send({
      message: err.message,
    });
  }
};

const getBestSellerProductChart = async (req, res) => {
  try {
    // console.log("getBestSellerProductChart");

    const totalDoc = await Order.countDocuments({});
    const bestSellingProduct = await Order.aggregate([
      {
        $unwind: "$cart",
      },
      {
        $group: {
          _id: "$cart.title",

          count: {
            $sum: "$cart.quantity",
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $limit: 4,
      },
    ]);

    res.send({
      totalDoc,
      bestSellingProduct,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getDashboardOrders = async (req, res) => {
  const { page, limit } = req.query;

  const pages = Number(page) || 1;
  const limits = Number(limit) || 8;
  const skip = (pages - 1) * limits;

  let week = new Date();
  week.setDate(week.getDate() - 10);

  const start = new Date().toDateString();

  // (startDate = '12:00'),
  //   (endDate = '23:59'),
  // console.log("page, limit", page, limit);

  try {
    const totalDoc = await Order.countDocuments({});

    // query for orders
    const orders = await Order.find({})
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limits);

    const totalAmount = await Order.aggregate([
      {
        $group: {
          _id: null,
          tAmount: {
            $sum: "$total",
          },
        },
      },
    ]);

    // total order amount
    const todayOrder = await Order.find({ createdAt: { $gte: start } });

    // this month order amount
    const totalAmountOfThisMonth = await Order.aggregate([
      {
        $group: {
          _id: {
            year: {
              $year: "$createdAt",
            },
            month: {
              $month: "$createdAt",
            },
          },
          total: {
            $sum: "$total",
          },
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $limit: 1,
      },
    ]);

    // total padding order count
    const totalPendingOrder = await Order.aggregate([
      {
        $match: {
          status: "Pending",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // total delivered order count
    const totalProcessingOrder = await Order.aggregate([
      {
        $match: {
          status: "Processing",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // total delivered order count
    const totalDeliveredOrder = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    //weekly sale report
    // filter order data
    const weeklySaleReport = await Order.find({
      $or: [{ status: { $regex: `Delivered`, $options: "i" } }],
      createdAt: {
        $gte: week,
      },
    });

    res.send({
      totalOrder: totalDoc,
      totalAmount:
        totalAmount.length === 0
          ? 0
          : parseFloat(totalAmount[0].tAmount).toFixed(2),
      todayOrder: todayOrder,
      totalAmountOfThisMonth:
        totalAmountOfThisMonth.length === 0
          ? 0
          : parseFloat(totalAmountOfThisMonth[0].total).toFixed(2),
      totalPendingOrder:
        totalPendingOrder.length === 0 ? 0 : totalPendingOrder[0],
      totalProcessingOrder:
        totalProcessingOrder.length === 0 ? 0 : totalProcessingOrder[0].count,
      totalDeliveredOrder:
        totalDeliveredOrder.length === 0 ? 0 : totalDeliveredOrder[0].count,
      orders,
      weeklySaleReport,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Debug endpoint to check order details
const debugOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    console.log('🔍 DEBUG ORDER:', {
      orderId: order._id,
      invoice: order.invoice,
      status: order.status,
      loyaltyPointsUsed: order.loyaltyPointsUsed,
      loyaltyDiscount: order.loyaltyDiscount,
      hasLoyaltyFields: {
        loyaltyPointsUsed: 'loyaltyPointsUsed' in order,
        loyaltyDiscount: 'loyaltyDiscount' in order
      },
      cart: order.cart?.length || 0,
      user: order.user
    });

    res.send({
      orderId: order._id,
      invoice: order.invoice,
      status: order.status,
      loyaltyPointsUsed: order.loyaltyPointsUsed,
      loyaltyDiscount: order.loyaltyDiscount,
      cart: order.cart?.length || 0,
      user: order.user,
      fullOrder: order
    });

  } catch (err) {
    console.error("Debug order error:", err);
    res.status(500).send({
      message: err.message,
    });
  }
};

// Cancel an order (admin or customer)
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelReason, cancelledBy } = req.body;

    console.log(`🚀 ADMIN CANCEL: Starting cancellation for order ${id}, reason: ${cancelReason}`);

    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      console.log(`❌ ADMIN CANCEL: Order ${id} not found`);
      return res.status(404).send({
        message: "Order not found",
      });
    }

    console.log(`📋 ADMIN CANCEL: Order details:`, {
      orderId: order._id,
      invoice: order.invoice,
      status: order.status,
      loyaltyPointsUsed: order.loyaltyPointsUsed,
      loyaltyDiscount: order.loyaltyDiscount,
      customer: order.user,
      cartItems: order.cart?.length || 0
    });

    // Check if order can be cancelled
    if (order.status === "Delivered") {
      console.log(`❌ ADMIN CANCEL: Cannot cancel delivered order ${order.invoice}`);
      return res.status(400).send({
        message: "Cannot cancel a delivered order",
      });
    }

    if (order.status === "Cancel") {
      console.log(`❌ ADMIN CANCEL: Order ${order.invoice} already cancelled`);
      return res.status(400).send({
        message: "Order is already cancelled",
      });
    }

    // For customer cancellation, verify it's their order
    if (cancelledBy === 'customer' && req.user && order.user.toString() !== req.user._id.toString()) {
      console.log(`❌ ADMIN CANCEL: Permission denied for customer cancellation`);
      return res.status(403).send({
        message: "You can only cancel your own orders",
      });
    }

    console.log(`🔄 ADMIN CANCEL: Processing cancellation for order ${order.invoice}`);
    
    // Process the cancellation (restore stock and loyalty points)
    const cancellationResult = await handleOrderCancellation(order, cancelReason);
    console.log(`📊 ADMIN CANCEL: Cancellation result:`, cancellationResult);
    
    // Also remove earned points if order was cancelled before delivery
    if (order.status === "Pending" || order.status === "Processing") {
      console.log(`🔄 ADMIN CANCEL: Removing earned points for pending/processing order`);
      const earnedPointsResult = await LoyaltyService.removeEarnedPointsFromCancelledOrder(order.user, order._id);
      console.log(`📊 ADMIN CANCEL: Earned points removal result:`, earnedPointsResult);
    }

    // Update order status
    order.status = "Cancel";
    order.cancelReason = cancelReason || 'Order cancelled';
    order.cancelledBy = cancelledBy || 'admin';
    order.cancelledAt = new Date();
    
    await order.save();

    console.log(`✅ ADMIN CANCEL: Order ${order.invoice} successfully cancelled`);

    res.send({
      message: "Order cancelled successfully",
      order,
      cancellationDetails: cancellationResult
    });

  } catch (err) {
    console.error("💥 ADMIN CANCEL: Order cancellation error:", err);
    res.status(500).send({
      message: err.message || "Failed to cancel order",
    });
  }
};

// Customer cancel their own order
const customerCancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;

    // Find the order and verify it belongs to the customer
    const order = await Order.findOne({ 
      _id: id, 
      user: req.user._id 
    });

    if (!order) {
      return res.status(404).send({
        message: "Order not found or you don't have permission to cancel this order",
      });
    }

    // Check if order can be cancelled
    if (order.status === "Delivered") {
      return res.status(400).send({
        message: "Cannot cancel a delivered order",
      });
    }

    if (order.status === "Cancel") {
      return res.status(400).send({
        message: "Order is already cancelled",
      });
    }

    console.log(`Customer ${req.user._id} cancelling order ${order.invoice}`);
    
    // Process the cancellation
    const cancellationResult = await handleOrderCancellation(order, cancelReason);
    
    // Remove earned points if order was cancelled before delivery
    if (order.status === "Pending" || order.status === "Processing") {
      await LoyaltyService.removeEarnedPointsFromCancelledOrder(order.user, order._id);
    }

    // Update order status
    order.status = "Cancel";
    order.cancelReason = cancelReason || 'Cancelled by customer';
    order.cancelledBy = 'customer';
    order.cancelledAt = new Date();
    
    await order.save();

    res.send({
      message: "Order cancelled successfully",
      order,
      cancellationDetails: cancellationResult
    });

  } catch (err) {
    console.error("Customer order cancellation error:", err);
    res.status(500).send({
      message: err.message || "Failed to cancel order",
    });
  }
};

// Manual loyalty points restoration (for testing/recovery)
const restoreLoyaltyPointsManually = async (req, res) => {
  try {
    const { id } = req.params;
    const { pointsToRestore } = req.body;

    console.log(`🔧 MANUAL RESTORE: Starting manual restoration for order ${id}, points: ${pointsToRestore}`);

    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      console.log(`❌ MANUAL RESTORE: Order ${id} not found`);
      return res.status(404).send({
        message: "Order not found",
      });
    }

    console.log(`📋 MANUAL RESTORE: Order details:`, {
      orderId: order._id,
      invoice: order.invoice,
      status: order.status,
      loyaltyPointsUsed: order.loyaltyPointsUsed,
      loyaltyDiscount: order.loyaltyDiscount,
      customer: order.user
    });

    // Use provided points or from order
    const finalPointsToRestore = pointsToRestore || order.loyaltyPointsUsed;
    
    if (!finalPointsToRestore || finalPointsToRestore <= 0) {
      return res.status(400).send({
        message: "No points to restore",
      });
    }

    console.log(`🔄 MANUAL RESTORE: Restoring ${finalPointsToRestore} points to customer ${order.user}`);

    // Call the loyalty service directly
    const result = await LoyaltyService.restorePointsFromCancelledOrder(order.user, order._id, finalPointsToRestore);
    
    console.log(`📊 MANUAL RESTORE: Restoration result:`, result);

    res.send({
      message: "Points restored successfully",
      order: {
        id: order._id,
        invoice: order.invoice,
        customer: order.user
      },
      restorationResult: result,
      pointsRestored: finalPointsToRestore
    });

  } catch (err) {
    console.error("💥 MANUAL RESTORE: Error:", err);
    res.status(500).send({
      message: err.message || "Failed to restore points",
    });
  }
};

// Test loyalty service restoration (for debugging)
const testLoyaltyRestore = async (req, res) => {
  try {
    const { customerId, orderId, points } = req.body;

    console.log(`🧪 TEST LOYALTY: Testing restoration - Customer: ${customerId}, Order: ${orderId}, Points: ${points}`);

    if (!customerId || !points || points <= 0) {
      return res.status(400).send({
        message: "Missing required data: customerId, points",
      });
    }

    // Call the loyalty service directly
    const result = await LoyaltyService.restorePointsFromCancelledOrder(customerId, orderId || 'test-order', points);
    
    console.log(`🧪 TEST LOYALTY: Result:`, result);

    res.send({
      message: "Test restoration completed",
      result: result
    });

  } catch (err) {
    console.error("🧪 TEST LOYALTY: Error:", err);
    res.status(500).send({
      message: err.message || "Test failed",
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  getOrderCustomer,
  updateOrder,
  deleteOrder,
  getBestSellerProductChart,
  getDashboardOrders,
  getDashboardRecentOrder,
  getDashboardCount,
  getDashboardAmount,
  cancelOrder,
  customerCancelOrder,
  debugOrder,
  restoreLoyaltyPointsManually,
  testLoyaltyRestore,
};
