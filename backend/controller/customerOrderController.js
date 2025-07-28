require("dotenv").config();
const mongoose = require("mongoose");
const MailChecker = require("mailchecker");

const Order = require("../models/Order");
const { sendEmail } = require("../lib/email-sender/sender");
const { handleCreateInvoice } = require("../lib/email-sender/create");
const { handleProductQuantity, handleLoyaltyPoints } = require("../lib/stock-controller/others");
const customerInvoiceEmailBody = require("../lib/email-sender/templates/order-to-customer");
const VerificationCodeGenerator = require("../lib/verification-code/generator");
const { createOrderNotification } = require("./notificationController");

const addOrder = async (req, res) => {
  try {
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

    // Detailed logging for incoming user_info
    console.log('Received req.body.user_info:', req.body.user_info);
    console.log('Received req.body.user_info.contact:', req.body.user_info?.contact);
    console.log('Received req.body.contact (top-level):', req.body.contact);

    // Generate verification code and product checklist
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const productChecklist = VerificationCodeGenerator.generateProductChecklist(req.body.cart);

    // Create and save order
    const newOrder = new Order({
      ...req.body,
      user: req.user._id,
      paymentStatus: 'Pending', // For COD, payment is pending until delivery
      status: 'Received',
      verificationCode: verificationCode,
      verificationCodeUsed: false,
      deliveryInfo: {
        productChecklist: productChecklist,
        allItemsCollected: false
      }
    });
    
    const order = await newOrder.save();
    
    console.log(`⏳ Order ${order.invoice} created with status 'Received'. It is now available for drivers to accept.`);
    
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
};
