require("dotenv").config();
const mongoose = require("mongoose");
const MailChecker = require("mailchecker");

const Order = require("../models/Order");
const Product = require("../models/Product");
const { sendEmail } = require("../lib/email-sender/sender");
const { handleCreateInvoice } = require("../lib/email-sender/create");
const { handleProductQuantity, handleLoyaltyPoints, handleOrderCancellation } = require("../lib/stock-controller/others");
const customerInvoiceEmailBody = require("../lib/email-sender/templates/order-to-customer");
const VerificationCodeGenerator = require("../lib/verification-code/generator");
const { createOrderNotification } = require("./notificationController");

// Feature flag for revert-to-checkout functionality (default enabled if not set)
const REVERT_TO_CHECKOUT_ENABLED = (process.env.REVERT_TO_CHECKOUT_ENABLED ?? 'true') === 'true';

const addOrder = async (req, res) => {
  try {
    console.log('📦 Order creation request received:', {
      hasUser: !!req.user,
      userId: req.user?._id,
      paymentMethod: req.body.paymentMethod,
      cartLength: req.body.cart?.length,
      hasUserInfo: !!req.body.user_info
    });

    // Check payment method
    if (req.body.paymentMethod !== 'COD') {
      return res.status(400).send({
        message: "Only Cash on Delivery is available at the moment",
      });
    }

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).send({
        message: "You must be logged in to place an order",
      });
    }

    // Handle loyalty points redemption if provided
    if (req.body.loyaltyPointsUsed && req.body.loyaltyPointsUsed > 0) {
      const LoyaltyService = require('../lib/loyalty-system/loyaltyService');
      
      try {
        // Redeem points and get updated customer balance
        await LoyaltyService.redeemPoints(req.user._id, req.body.loyaltyPointsUsed);
        console.log(`Redeemed ${req.body.loyaltyPointsUsed} loyalty points for customer ${req.user._id}`);
      } catch (loyaltyError) {
        console.error('Loyalty redemption error:', loyaltyError.message);
        return res.status(400).send({
          message: `Loyalty points redemption failed: ${loyaltyError.message}`,
        });
      }
    }

    // Validate required fields
    if (!req.body.cart || !Array.isArray(req.body.cart) || req.body.cart.length === 0) {
      return res.status(400).send({ message: "Cart is required and cannot be empty" });
    }
    
    if (!req.body.user_info || !req.body.user_info.name || !req.body.user_info.contact || !req.body.user_info.address) {
      return res.status(400).send({ message: "User info (name, contact, address) is required" });
    }
    
    if (!req.body.subTotal || !req.body.total) {
      return res.status(400).send({ message: "Subtotal and total are required" });
    }
    
    // Fix cart image fields before processing
    if (req.body.cart && Array.isArray(req.body.cart)) {
      req.body.cart = req.body.cart.map(item => {
        if (item.image && Array.isArray(item.image)) {
          return {
            ...item,
            image: item.image.length > 0 ? item.image[0] : ''
          };
        }
        return item;
      });
    }

    // Generate verification code and product checklist
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Generate simple product checklist from cart items
    const productChecklist = req.body.cart.map((item, index) => {
      const productTitle = item.title || 
                          item.name || 
                          item.productTitle || 
                          `Product ${index + 1}`;
                          
      return {
        productId: item.id || item.productId || `product_${index}`,
        productTitle: productTitle, // Changed from 'title' to 'productTitle' to match schema
        quantity: item.quantity || 1,
        collected: false,
        collectedAt: null,
        notes: ''
      };
    });

    // Create and save order
    const newOrder = new Order({
      ...req.body,
      user: req.user._id,
      paymentStatus: 'Pending', // For COD, payment is pending until delivery
      status: 'Received',
      version: 1,
      verificationCode: verificationCode,
      verificationCodeUsed: false,
      deliveryInfo: {
        productChecklist: productChecklist,
        allItemsCollected: false
      }
    });
    
    const order = await newOrder.save();
    
    // Update product sales for popular products calculation
    try {
      const cartItems = req.body.cart || [];
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
      console.error('Failed to update product sales:', salesUpdateErr);
      // Don't fail the order creation if sales update fails
    }
        
    // Create a notification containing the verification (secret) code for the customer
    try {
      await createOrderNotification(req.user._id, order._id, 'Received', order.invoice, verificationCode);
    } catch (notifErr) {
      console.error('Failed to create verification code notification:', notifErr);
    }
    
    res.status(201).send({
      ...order.toObject(),
      message: `Order created successfully! Your verification code is: ${verificationCode}. Your order is in queue and will be assigned to a driver shortly.`
    });
    
    // Handle loyalty points for order creation
    if (req.body.loyaltyPointsUsed && req.body.loyaltyPointsUsed > 0) {
      handleLoyaltyPoints(order);
    }
    
  } catch (err) {
    console.error('Order creation error:', err.message);
    res.status(500).send({
      message: err.message || "Some error occurred while creating the order",
    });
  }
};

// Revert order to checkout (cancel and return cart data)
const revertToCheckout = async (req, res) => {
  try {
    // Check if feature is enabled
    if (!REVERT_TO_CHECKOUT_ENABLED) {
      return res.status(404).send({
        message: "Feature not available",
      });
    }

    const { id } = req.params;
    const { version } = req.headers['if-match'] ? { version: parseInt(req.headers['if-match']) } : { version: null };
    const idempotencyKey = req.headers['idempotency-key'];

    // Validate required headers
    if (!version) {
      return res.status(400).send({
        message: "If-Match header with version is required",
      });
    }

    if (!idempotencyKey) {
      return res.status(400).send({
        message: "Idempotency-Key header is required",
      });
    }

    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).send({
        message: "Order not found",
      });
    }

    // Check ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).send({
        message: "You don't have permission to modify this order",
      });
    }

    // Check version for optimistic concurrency
    if (order.version !== version) {
      return res.status(409).send({
        message: "Order has been modified. Please refresh and try again.",
        currentVersion: order.version,
      });
    }

    // Check if order can be reverted
    if (order.status !== 'Received') {
      return res.status(423).send({
        message: "Order cannot be modified. Current status: " + order.status,
      });
    }

    // Check if order is locked (driver accepted)
    if (order.lockedAt || order.deliveryInfo?.assignedDriver) {
      return res.status(423).send({
        message: "Order has been accepted by a driver and cannot be modified",
      });
    }

    // Start transaction for atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update order status to cancelled
      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        {
          $set: {
            status: 'Cancel',
            cancelReason: 'Customer requested to edit order',
            cancelledBy: 'customer',
            cancelledAt: new Date(),
            cancelledReason: 'edit_revert',
            version: order.version + 1,
          }
        },
        { new: true, session }
      );

      // Handle order cancellation (restore stock, handle loyalty points)
      await handleOrderCancellation(order, session);

      // Build rehydrated cart from order
      const cart = order.cart.map(item => ({
        id: item.productId || item.id,
        productId: item.productId || item.id,
        title: item.title,
        quantity: item.quantity,
        selectedUnitId: item.selectedUnitId,
        unitName: item.unitName,
        unitValue: item.unitValue,
        packQty: item.packQty,
        price: item.price,
        basePrice: item.basePrice,
        image: item.image,
        sku: item.sku,
        category: item.category,
        isCombo: item.isCombo,
        promotion: item.promotion,
        selectedProducts: item.selectedProducts,
        comboPrice: item.comboPrice,
        comboDetails: item.comboDetails,
      }));

      // Prepare response with cart and address data
      const response = {
        cart,
        address: {
          name: order.user_info.name,
          contact: order.user_info.contact,
          email: order.user_info.email,
          address: order.user_info.address,
          country: order.user_info.country,
          city: order.user_info.city,
          zipCode: order.user_info.zipCode,
        },
        coordinates: order.coordinates,
        deliveryLocation: order.deliveryLocation,
        coupon: order.couponCode ? {
          code: order.couponCode,
          // Note: Coupon validity will be re-checked at checkout
        } : null,
        notes: order.notes,
        message: "Order cancelled successfully. Your items have been restored to checkout.",
      };

      await session.commitTransaction();

      // TODO: Emit socket event for delivery app
      // io.emit('order_cancelled', { 
      //   orderId: id, 
      //   reason: 'edit_revert',
      //   version: updatedOrder.version 
      // });

      console.log(`Order ${order.invoice} reverted to checkout by customer ${req.user._id}`);

      res.status(200).send(response);

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (err) {
    console.error('Revert to checkout error:', err.message);
    res.status(500).send({
      message: err.message || "Some error occurred while reverting the order",
    });
  }
};

// get all orders for a user
const getOrderCustomer = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const pages = Number(page) || 1;
    const limits = Number(limit) || 8;
    const skip = (pages - 1) * limits;

    const totalDoc = await Order.countDocuments({ user: req.user._id });

    // total pending order count
    const totalPendingOrder = await Order.aggregate([
      {
        $match: {
          status: "Pending",
          user: mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ]);

    // total processing order count
    const totalProcessingOrder = await Order.aggregate([
      {
        $match: {
          status: "Processing",
          user: mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalDeliveredOrder = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
          user: mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ]);

    // query for orders
    const orders = await Order.find({ user: req.user._id })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limits);

    res.send({
      orders,
      limits,
      pages,
      pending: totalPendingOrder.length === 0 ? 0 : totalPendingOrder[0].count,
      processing: totalProcessingOrder.length === 0 ? 0 : totalProcessingOrder[0].count,
      delivered: totalDeliveredOrder.length === 0 ? 0 : totalDeliveredOrder[0].count,
      totalDoc,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    // Return 410 Gone if order is cancelled to prevent opening in delivery app
    if (order && order.status === 'Cancel') {
      return res.status(410).send({
        code: 'ORDER_CANCELLED',
        message: 'This order has been cancelled',
      });
    }
    
    res.send(order);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getOrderByInvoice = async (req, res) => {
  try {
    const invoiceParam = req.params.invoice;
    let order;

    // Check if the parameter looks like a MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(invoiceParam)) {
      order = await Order.findById(invoiceParam);
    } else {
      // Otherwise, try to find by the numerical invoice number
      order = await Order.findOne({ invoice: Number(invoiceParam) });
    }

    if (!order) {
      return res.status(404).send({
        message: "Order not found",
      });
    }

    // IMPORTANT: Check if the user making the request is the one who owns the order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).send({
        message: "You do not have permission to view this order.",
      });
    }

    res.send(order);
  } catch (err) {
    console.error("Error in getOrderByInvoice:", err);
    res.status(500).send({
      message: "An error occurred while retrieving the order.",
      error: err.message
    });
  }
};

const sendEmailInvoiceToCustomer = async (req, res) => {
  try {
    const user = req.body.user_info;
    
    if (!MailChecker.isValid(user?.email)) {
      return res.status(400).send({
        message: "Invalid or disposable email address. Please provide a valid email.",
      });
    }

    const pdf = await handleCreateInvoice(req.body, `${req.body.invoice}.pdf`);

    const option = {
      date: req.body.date,
      invoice: req.body.invoice,
      status: req.body.status,
      method: 'Cash on Delivery',
      subTotal: req.body.subTotal,
      total: req.body.total,
      discount: req.body.discount,
      shipping: req.body.shippingCost,
      currency: req.body.company_info.currency,
      company_name: req.body.company_info.company,
      company_address: req.body.company_info.address,
      company_phone: req.body.company_info.phone,
      company_email: req.body.company_info.email,
      company_website: req.body.company_info.website,
      vat_number: req.body?.company_info?.vat_number,
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      address: user?.address,
      cart: req.body.cart,
    };

    const emailData = {
      to: user.email,
      subject: `Your Order - ${req.body.invoice} at ${req.body.company_info.company}`,
      html: customerInvoiceEmailBody(option),
      attachments: [
        {
          filename: `${req.body.invoice}.pdf`,
          content: pdf,
        },
      ],
    };
    
    try {
      await sendEmail(emailData);
      res.send({
        message: `Invoice successfully sent to the customer ${user.name}`
      });
    } catch (emailError) {
      console.error("Failed to send invoice email:", emailError);
      res.status(500).send({
        message: "Failed to send invoice email. Please try again."
      });
    }
  } catch (err) {
    console.error("Invoice generation error:", err);
    res.status(500).send({
      message: err.message,
    });
  }
};

module.exports = {
  addOrder,
  getOrderById,
  getOrderCustomer,
  getOrderByInvoice,
  sendEmailInvoiceToCustomer,
  revertToCheckout,
};
