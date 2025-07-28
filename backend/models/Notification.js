const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for backward compatibility with global notifications
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: false,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: false,
    },
    type: {
      type: String,
      enum: ["order", "product", "promotion", "system", "global"],
      default: "system",
    },
    title: {
      type: String,
      required: false,
    },
    message: {
      type: String,
      required: false, // Made optional to support translation keys
    },
    // New translation support fields
    titleKey: {
      type: String,
      required: false,
    },
    messageKey: {
      type: String,
      required: false,
    },
    titleData: {
      type: Object,
      default: {},
    },
    messageData: {
      type: Object,
      default: {},
    },
    image: {
      type: String,
      required: false,
    },
    actionUrl: {
      type: String,
      required: false,
    },
    orderInvoice: {
      type: Number,
      required: false,
    },
    status: {
      type: String,
      enum: ["read", "unread"],
      default: "unread",
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
notificationSchema.index({ customerId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ type: 1, status: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
