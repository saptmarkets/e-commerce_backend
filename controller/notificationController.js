const Notification = require("../models/Notification");

// Utility function to create customer notifications automatically
const createOrderNotification = async (customerId, orderId, orderStatus, orderInvoice, verificationCode = null) => {
  try {
    if (!customerId || !orderId) return;

    let titleKey, messageKey, actionUrl;

    switch (orderStatus) {
      case 'Received':
        // Initial notification containing the secret / verification code
        titleKey = 'orderVerificationCode';
        messageKey = 'orderReceivedMessage';
        actionUrl = `/order/${orderInvoice}`;
        break;
      case 'Pending':
        titleKey = 'orderConfirmed';
        messageKey = 'orderConfirmedMessage';
        actionUrl = `/order/${orderInvoice}`;
        break;
      case 'Processing':
        titleKey = 'orderProcessing';
        messageKey = 'orderProcessingMessage';
        actionUrl = `/order/${orderInvoice}`;
        break;
      case 'Out for Delivery':
        titleKey = 'outForDelivery';
        messageKey = 'outForDeliveryMessage';
        actionUrl = `/order/${orderInvoice}`;
        break;
      case 'Delivered':
        titleKey = 'orderDelivered';
        messageKey = 'orderDeliveredMessage';
        actionUrl = `/order/${orderInvoice}`;
        break;
      case 'Cancel':
        titleKey = 'orderCancelled';
        messageKey = 'orderCancelledMessage';
        actionUrl = `/order/${orderInvoice}`;
        break;
      default:
        return; // Don't create notification for unknown status
    }

    const notification = new Notification({
      customerId,
      orderId,
      orderInvoice, // Add invoice number to notification
      type: 'order',
      titleKey,
      messageKey,
      titleData: { orderInvoice },
      messageData: { orderInvoice, verificationCode },
      actionUrl,
      status: 'unread'
    });

    await notification.save();

    // If the order is marked as Delivered or Cancelled, remove the previous verification-code notification
    if (['Delivered', 'Cancel'].includes(orderStatus)) {
      try {
        await Notification.deleteMany({ orderId, titleKey: 'orderVerificationCode' });
      } catch (cleanupErr) {
        console.error('Error cleaning up verification code notifications:', cleanupErr);
      }
    }

    console.log(`Created notification for customer ${customerId}: ${titleKey}`);
  } catch (error) {
    console.error('Error creating order notification:', error);
  }
};

// Utility function to create welcome notification for new customers
const createWelcomeNotification = async (customerId, customerName) => {
  try {
    if (!customerId) return;

    const notification = new Notification({
      customerId,
      type: 'system',
      titleKey: 'welcomeToSaptMarkets',
      messageKey: 'welcomeMessage',
      titleData: {},
      messageData: { customerName },
      actionUrl: '/products',
      status: 'unread'
    });

    await notification.save();
    console.log(`Created welcome notification for customer ${customerId}`);
  } catch (error) {
    console.error('Error creating welcome notification:', error);
  }
};

// Utility function to create product-related notifications
const createProductNotification = async (customerId, productId, type, customMessage) => {
  try {
    if (!customerId) return;

    let titleKey, messageKey;

    switch (type) {
      case 'back_in_stock':
        titleKey = 'productBackInStock';
        messageKey = 'productBackInStockMessage';
        break;
      case 'price_drop':
        titleKey = 'priceDropAlert';
        messageKey = 'priceDropMessage';
        break;
      case 'recommendation':
        titleKey = 'productRecommendation';
        messageKey = 'productRecommendationMessage';
        break;
      default:
        titleKey = 'productUpdate';
        messageKey = 'productUpdateMessage';
    }

    const notification = new Notification({
      customerId,
      productId,
      type: 'product',
      titleKey,
      messageKey,
      titleData: {},
      messageData: {},
      actionUrl: `/product/${productId}`,
      status: 'unread'
    });

    await notification.save();
    console.log(`Created product notification for customer ${customerId}: ${titleKey}`);
  } catch (error) {
    console.error('Error creating product notification:', error);
  }
};

const addNotification = async (req, res) => {
  try {
    if (req.body.productId) {
      const isAdded = await Notification.findOne({
        productId: req.body.productId,
        customerId: req.body.customerId,
      });
      if (isAdded) {
        return res.end();
      } else {
        const newNotification = new Notification(req.body);
        await newNotification.save();
        res.status(200).send({
          message: "Notification save successfully!",
        });
      }
    } else {
      const newNotification = new Notification(req.body);
      await newNotification.save();
      res.status(200).send({
        message: "Notification save successfully!",
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllNotification = async (req, res) => {
  try {
    const { page } = req.query;

    const pages = page;
    const limits = 5;
    const skip = (pages - 1) * limits;
    const totalDoc = await Notification.countDocuments();
    const totalUnreadDoc = await Notification.countDocuments({
      status: "unread",
    });
    const notifications = await Notification.find({
      status: { $in: ["read", "unread"] },
    })
      .sort({
        _id: -1,
      })
      .skip(skip)
      .limit(limits);

    res.send({ totalDoc, totalUnreadDoc, notifications });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getCustomerNotifications = async (req, res) => {
  try {
    const customerId = req.user?._id || req.headers['customer-id'];
    const { page = 1, limit = 10 } = req.query;

    if (!customerId) {
      return res.status(401).send({
        message: "Customer authentication required",
      });
    }

    const pages = parseInt(page);
    const limits = parseInt(limit);
    const skip = (pages - 1) * limits;

    const query = {
      $or: [
        { customerId: customerId },
        { type: "global", customerId: null },
      ],
      status: { $in: ["read", "unread"] },
    };

    const totalDoc = await Notification.countDocuments(query);
    const totalUnreadDoc = await Notification.countDocuments({
      ...query,
      status: "unread",
    });

    const notifications = await Notification.find(query)
      .populate('orderId', 'invoice status')
      .populate('productId', 'title slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limits);

    res.send({ 
      totalDoc, 
      totalUnreadDoc, 
      notifications,
      currentPage: pages,
      totalPages: Math.ceil(totalDoc / limits)
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const createCustomerNotification = async (req, res) => {
  try {
    const { customerId, type, title, message, orderId, productId, image, actionUrl } = req.body;

    if (!customerId) {
      return res.status(400).send({
        message: "Customer ID is required for customer notifications",
      });
    }

    const newNotification = new Notification({
      customerId,
      type: type || 'system',
      title,
      message,
      orderId,
      productId,
      image,
      actionUrl,
      status: 'unread'
    });

    await newNotification.save();
    
    res.status(200).send({
      message: "Customer notification created successfully!",
      notification: newNotification
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const createGlobalNotification = async (req, res) => {
  try {
    const { type, title, message, image, actionUrl } = req.body;

    const newNotification = new Notification({
      customerId: null,
      type: 'global',
      title,
      message,
      image,
      actionUrl,
      status: 'unread'
    });

    await newNotification.save();
    
    res.status(200).send({
      message: "Global notification created successfully!",
      notification: newNotification
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateStatusNotification = async (req, res) => {
  try {
    const newStatus = req.body.status;
    const customerId = req.user?._id || req.headers['customer-id'];

    const query = { _id: req.params.id };
    if (customerId && req.user?.role !== 'admin') {
      query.$or = [
        { customerId: customerId },
        { type: "global", customerId: null }
      ];
    }

    const notification = await Notification.findOneAndUpdate(
      query,
      { $set: { status: newStatus } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).send({
        message: "Notification not found or access denied",
      });
    }

    let totalDoc = 0;
    if (customerId) {
      totalDoc = await Notification.countDocuments({
        $or: [
          { customerId: customerId },
          { type: "global", customerId: null }
        ],
        status: "unread"
      });
    } else {
      totalDoc = await Notification.countDocuments({ status: "unread" });
    }

    res.send({
      totalDoc,
      message: `Notification marked as ${newStatus}!`,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateManyStatusNotification = async (req, res) => {
  try {
    const customerId = req.user?._id || req.headers['customer-id'];
    
    const query = { _id: { $in: req.body.ids } };
    if (customerId && req.user?.role !== 'admin') {
      query.$or = [
        { customerId: customerId },
        { type: "global", customerId: null }
      ];
    }

    await Notification.updateMany(
      query,
      { $set: { status: req.body.status } },
      { multi: true }
    );

    res.send({
      message: "Notifications updated successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const deleteNotificationById = async (req, res) => {
  try {
    const customerId = req.user?._id || req.headers['customer-id'];
    
    const query = { _id: req.params.id };
    if (customerId && req.user?.role !== 'admin') {
      query.$or = [
        { customerId: customerId },
        { type: "global", customerId: null }
      ];
    }

    const result = await Notification.deleteOne(query);
    
    if (result.deletedCount === 0) {
      return res.status(404).send({
        message: "Notification not found or access denied",
        });
    }

        res.send({
          message: "Notification deleted successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const deleteNotificationByProductId = async (req, res) => {
  try {
    Notification.deleteOne({ productId: req.params.id }, (err) => {
      if (err) {
        res.status(500).send({
          message: err.message,
        });
      } else {
        res.send({
          message: "Notification deleted successfully!",
        });
      }
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const deleteManyNotification = async (req, res) => {
  try {
    const customerId = req.user?._id || req.headers['customer-id'];
    
    const query = { _id: { $in: req.body.ids } };
    if (customerId && req.user?.role !== 'admin') {
      query.$or = [
        { customerId: customerId },
        { type: "global", customerId: null }
      ];
    }

    await Notification.deleteMany(query);

    res.send({
      message: `Notifications deleted successfully!`,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

module.exports = {
  getAllNotification,
  addNotification,
  updateStatusNotification,
  deleteNotificationById,
  deleteNotificationByProductId,
  updateManyStatusNotification,
  deleteManyNotification,
  getCustomerNotifications,
  createCustomerNotification,
  createGlobalNotification,
  createOrderNotification,
  createWelcomeNotification,
  createProductNotification,
};
