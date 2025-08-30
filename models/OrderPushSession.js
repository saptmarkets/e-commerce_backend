const mongoose = require("mongoose");

const orderPushSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    sessionDate: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    
    // Session Configuration
    settings: {
      targetDate: {
        type: Date,
        required: true
      },
      orderStatus: [{
        type: String,
        enum: ['Delivered'],
        default: ['Delivered']
      }],
      maxRetries: {
        type: Number,
        default: 3
      }
    },
    
    // Summary Statistics
    summary: {
      totalOrdersFound: {
        type: Number,
        default: 0
      },
      totalOrdersProcessed: {
        type: Number,
        default: 0
      },
      totalOrdersSuccess: {
        type: Number,
        default: 0
      },
      totalOrdersFailed: {
        type: Number,
        default: 0
      },
      totalAmount: {
        type: Number,
        default: 0
      },
      totalProducts: {
        type: Number,
        default: 0
      },
      uniqueProducts: {
        type: Number,
        default: 0
      },
      newCustomersCreated: {
        type: Number,
        default: 0
      },
      existingCustomersUsed: {
        type: Number,
        default: 0
      },
      successRate: {
        type: Number,
        default: 0
      }
    },
    
    // Detailed Results for Report
    orderResults: [{
      orderObjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
      },
      invoiceNumber: {
        type: Number,
        required: true
      },
      customerInfo: {
        name: String,
        phone: String,
        email: String,
        wasCreated: {
          type: Boolean,
          default: false
        }
      },
      orderTotal: {
        type: Number,
        required: true
      },
      itemCount: {
        type: Number,
        required: true
      },
      
      // Products in this order
      products: [{
        productId: Number,                // Odoo product ID
        productName: String,
        sku: String,                      // ODOO-xxxxx
        quantity: Number,
        unitPrice: Number,
        lineTotal: Number
      }],
      
      // Sync Results
      syncStatus: {
        type: String,
        enum: ['synced', 'failed'],
        required: true
      },
      odooOrderId: Number,
      odooCustomerId: Number,
      processingTime: Number,             // Milliseconds
      errorMessage: String,
      syncedAt: Date
    }],
    
    // Session Metadata
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    startedAt: Date,
    completedAt: Date,
    processingTime: Number                // Total session time in milliseconds
  },
  {
    timestamps: true
  }
);

// Add indexes for better query performance
orderPushSessionSchema.index({ sessionId: 1 });
orderPushSessionSchema.index({ sessionDate: 1 });
orderPushSessionSchema.index({ status: 1 });
orderPushSessionSchema.index({ initiatedBy: 1 });
orderPushSessionSchema.index({ createdAt: 1 });
orderPushSessionSchema.index({ 'settings.targetDate': 1 });

// Compound indexes for common queries
orderPushSessionSchema.index({ status: 1, sessionDate: 1 });
orderPushSessionSchema.index({ initiatedBy: 1, createdAt: 1 });

const OrderPushSession = mongoose.model("OrderPushSession", orderPushSessionSchema);

module.exports = OrderPushSession;
