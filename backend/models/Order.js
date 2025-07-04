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
        required: false,
      },
      email: {
        type: String,
        required: false,
      },
      contact: {
        type: String,
        required: false,
      },
      address: {
        type: String,
        required: false,
      },
      city: {
        type: String,
        required: false,
      },
      country: {
        type: String,
        required: false,
      },
      zipCode: {
        type: String,
        required: false,
      },
      // GPS delivery location data
      deliveryLocation: {
        latitude: {
          type: Number,
          required: false,
        },
        longitude: {
          type: Number,
          required: false,
        },
        accuracy: {
          type: Number,
          required: false,
        },
        googleMapsLink: {
          type: String,
          required: false,
        },
        googleMapsAddressLink: {
          type: String,
          required: false,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
      // Legacy coordinates field (for backward compatibility)
      coordinates: {
        latitude: {
          type: Number,
          required: false,
        },
        longitude: {
          type: Number,
          required: false,
        },
      },
    },
    subTotal: {
      type: Number,
      required: true,
    },
    shippingCost: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
    },
    loyaltyDiscount: {
      type: Number,
      default: 0,
    },
    loyaltyPointsUsed: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
    },
    shippingOption: {
      type: String,
      required: false,
    },
    paymentMethod: {
      type: String,
      required: true,
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
        title: String,
        quantity: Number,
        price: Number,
        originalPrice: Number,
        image: String,
        collected: { type: Boolean, default: false },
        collectedAt: Date,
        collectedBy: String, // Driver name/ID
        notes: String,
        
        // Multi-unit information
        unitName: String,
        packQty: Number,
        unitId: String,
        selectedUnitId: String,
        unitType: String,
        unitValue: Number,
        
        // Enhanced display fields
        displayQuantity: String,
        unitCalculation: String,
        totalPieces: Number,
        pieceCalculation: String,
        pricePerPiece: Number,
        pricePerPieceDisplay: String,
        pricePerBaseUnit: Number,
        unitPrice: Number,
        totalPrice: Number,
        
        // Product details
        description: String,
        sku: String,
        barcode: String,
        arabicTitle: String,
        images: [String],
        attributes: Object,
        weight: Number,
        dimensions: Object,
        tags: [String],
        
        // Combo information
        isCombo: { type: Boolean, default: false },
        comboDetails: Object,
        
        // Bulk pricing and constraints
        bulkPricing: [Object],
        costPrice: Number,
        minOrderQuantity: Number,
        maxOrderQuantity: Number
      }],
      // Delivery completion tracking
      allItemsCollected: {
        type: Boolean,
        default: false,
      },
      collectionCompletedAt: {
        type: Date,
        required: false,
      },
      deliveryNotes: {
        type: String,
        required: false,
      },
      deliveryProof: {
        photo: String,
        signature: String,
        recipientName: String,
        location: {
          latitude: Number,
          longitude: Number
        }
      }
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model(
  "Order",
  orderSchema.plugin(AutoIncrement, {
    inc_field: "invoice",
    start_seq: 10000,
  })
);
module.exports = Order;
