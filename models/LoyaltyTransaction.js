const mongoose = require("mongoose");

const loyaltyTransactionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    
    type: {
      type: String,
      enum: ["earned", "redeemed", "expired", "bonus", "refund"],
      required: true,
    },
    
    points: {
      type: Number,
      required: true,
    },
    
    description: {
      type: String,
      required: true,
    },
    
    // Related order (if applicable)
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: false,
    },
    
    // For redemption tracking
    redemptionDetails: {
      discountAmount: {
        type: Number,
        default: 0
      },
      pointsUsed: {
        type: Number,
        default: 0
      }
    },
    
    // Balance after this transaction
    balanceAfter: {
      type: Number,
      required: true,
    },
    
    // Expiry date for earned points
    expiryDate: {
      type: Date,
      required: false,
    },
    
    // Status for tracking
    status: {
      type: String,
      enum: ["active", "expired", "used"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
loyaltyTransactionSchema.index({ customer: 1, createdAt: -1 });
loyaltyTransactionSchema.index({ customer: 1, type: 1 });
loyaltyTransactionSchema.index({ expiryDate: 1, status: 1 });

const LoyaltyTransaction = mongoose.model("LoyaltyTransaction", loyaltyTransactionSchema);

module.exports = LoyaltyTransaction; 