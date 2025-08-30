const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    invoice: {
      type: Number,
      required: false,
    },
    cart: [{
      id: String,
      title: String,
      price: Number,
      quantity: Number,
      image: String,
      
      // Regular product fields
      productId: String,
      selectedUnitId: String,
      unitName: String,
      unitValue: Number,
      packQty: Number,
      basePrice: Number,
      sku: String,
      category: String,
      
      // Combo deal specific fields
      isCombo: { type: Boolean, default: false },
      promotion: Object,
      selectedProducts: Object, // { productId: quantity }
      comboPrice: Number,
      comboDetails: {
        promotionId: String,
        promotionName: String,
        requiredItemCount: Number,
        totalValue: Number,
        productBreakdown: [{
          productId: String,
          productTitle: String,
          quantity: Number,
          unitPrice: Number,
          image: String
        }]
      }
    }],
    user_info: {
      name: {
        type: String,
        required: true,
      },
      contact: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: false,
      },
      address: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: false,
      },
      city: {
        type: String,
        required: false,
      },
      zipCode: {
        type: String,
        required: false,
      },
    },
    subTotal: {
      type: Number,
      required: true,
    },
    shippingCost: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      required: false,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      default: "Pending",
    },

    cardInfo: {
      type: Object,
      required: false,
    },
    status: {
      type: String,
      enum: ["Received", "Processing", "Out for Delivery", "Delivered", "Cancel"],
    },
    cancelReason: {
      type: String,
      required: false,
    },
    cancelledBy: {
      type: String,
      enum: ["admin", "customer"],
      required: false,
    },
    cancelledAt: {
      type: Date,
      required: false,
    },
    
    // New fields for order editing functionality
    version: {
      type: Number,
      default: 1,
    },
    lockedAt: {
      type: Date,
      required: false,
    },
    lockedReason: {
      type: String,
      enum: ["driver_accepted", "admin_locked", "processing_started"],
      required: false,
    },
    cancelledReason: {
      type: String,
      enum: ["edit_revert", "customer_request", "admin_cancel", "payment_failed", "out_of_stock"],
      required: false,
    },
    previousOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: false,
    },
    
    // Order Verification Code System
    verificationCode: {
      type: String,
      required: false,
    },
    verificationCodeUsed: {
      type: Boolean,
      default: false,
    },
    verificationCodeUsedAt: {
      type: Date,
      required: false,
    },
    
    // Delivery Tracking System
    deliveryInfo: {
      assignedDriver: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Admin",
        required: false 
      },
      assignedAt: {
        type: Date,
        required: false,
      },
      pickedUpAt: {
        type: Date,
        required: false,
      },
      outForDeliveryAt: {
        type: Date,
        required: false,
      },
      deliveredAt: {
        type: Date,
        required: false,
      },
      // Status History Tracking
      statusHistory: [{
        status: {
          type: String,
          enum: ["Received", "Processing", "Out for Delivery", "Delivered", "Cancel"]
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        driverName: String,
        driverId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin"
        },
        notes: String
      }],
      // Product collection checklist
      productChecklist: [{
        productId: String,
        productTitle: String,
        quantity: Number,
        collected: { type: Boolean, default: false },
        collectedAt: Date,
        notes: String
      }],
      allItemsCollected: { type: Boolean, default: false },
      collectionCompletedAt: Date
    },
        
    // Loyalty system fields
    loyaltyPointsUsed: {
      type: Number,
      default: 0,
    },
    loyaltyPointsEarned: {
      type: Number,
      default: 0,
    },
    loyaltyDiscount: {
      type: Number,
      default: 0,
      },

    // Coupon system fields
    couponCode: {
        type: String,
        required: false,
      },
    couponDiscount: {
      type: Number,
      default: 0,
    },

    // Location data for delivery
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    deliveryLocation: {
          latitude: Number,
      longitude: Number,
      googleMapsLink: String,
      googleMapsAddressLink: String,
      accuracy: Number,
    },

    // Company information for invoice
    company_info: {
      company: String,
      address: String,
      phone: String,
      email: String,
      website: String,
      currency: String,
      vat_number: String,
    },

    // Notes field
    notes: {
      type: String,
      required: false,
    },

    // Odoo Integration Fields
    odooSync: {
      status: {
        type: String,
        enum: ['pending', 'synced', 'failed', 'partial'],
        default: null,
        required: false
      },
      odooOrderId: {
        type: Number,
        required: false,
        default: null
      },              // Odoo sales order ID
      odooCustomerId: {
        type: Number,
        required: false,
        default: null
      },           // Odoo customer/partner ID
      sessionId: {
        type: String,
        required: false,
        default: null
      },                // Links to OrderPushSession
      syncedAt: {
        type: Date,
        required: false,
        default: null
      },                   // When sync was completed
      attempts: { 
        type: Number, 
        default: 0,
        required: false
      },
      errorMessage: {
        type: String,
        required: false,
        default: null
      },              // Error details if sync failed
      errorType: {
        type: String,
        enum: ['customer_creation_failed', 'product_not_found', 'odoo_api_error', 'validation_error'],
        default: null,
        required: false
      },
      lastAttemptAt: {
        type: Date,
        required: false,
        default: null
      }
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ invoice: 1 });
orderSchema.index({ version: 1 });
orderSchema.index({ lockedAt: 1 });
orderSchema.index({ previousOrderId: 1 });

// Odoo sync indexes for better performance
orderSchema.index({ 'odooSync.status': 1 });
orderSchema.index({ 'odooSync.sessionId': 1 });
orderSchema.index({ 'odooSync.odooOrderId': 1 });
orderSchema.index({ 'odooSync.odooCustomerId': 1 });
orderSchema.index({ status: 1, 'odooSync.status': 1 }); // For finding delivered orders pending sync
orderSchema.index({ 'odooSync.lastAttemptAt': 1 }); // For retry logic

// Pre-save middleware to ensure odooSync is properly initialized
orderSchema.pre('save', function(next) {
  // If this is a new order and odooSync is not provided, initialize it
  if (this.isNew && !this.odooSync) {
    this.odooSync = {
      status: null,
      odooOrderId: null,
      odooCustomerId: null,
      sessionId: null,
      syncedAt: null,
      attempts: 0,
      errorMessage: null,
      errorType: null,
      lastAttemptAt: null
    };
  }
  next();
});

// Auto-increment invoice number
  orderSchema.plugin(AutoIncrement, {
    inc_field: "invoice",
  start_seq: 100000,
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
