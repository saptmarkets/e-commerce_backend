const mongoose = require('mongoose');

const { Schema } = mongoose;

const ProductsSummarySchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    productTitle: { type: String },
    unitId: { type: Schema.Types.ObjectId, ref: 'ProductUnit' },
    unitName: { type: String },
    quantity_before: { type: Number, default: 0 },
    quantity_after: { type: Number, default: 0 },
    total_changed: { type: Number, default: 0 },
    invoice_numbers: [{ type: String }],
    sync_status: { type: String, enum: ['synced', 'failed', 'pending'], default: 'pending' },
    odoo: {
      productId: { type: Number },
      productName: { type: String },
      unitName: { type: String },
    },
  },
  { _id: false }
);

const ErrorLogSchema = new Schema(
  {
    storeProductId: { type: String },
    storeProductName: { type: String },
    error: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SuccessLogSchema = new Schema(
  {
    storeProductId: { type: String },
    storeProductName: { type: String },
    odooProductId: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const StockPushSessionSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    sessionId: { type: String, index: true, unique: true },
    initiatedBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    status: { type: String, enum: ['in_progress', 'completed', 'partial', 'failed'], default: 'in_progress' },

    settings: {
      pushStock: { type: Boolean, default: true },
      pushPricing: { type: Boolean, default: false },
      pushCategories: { type: Boolean, default: false },
      forceUpdate: { type: Boolean, default: false },
      sourceLocationId: { type: Number },
      destinationLocationId: { type: Number },
    },

    products_summary: { type: [ProductsSummarySchema], default: [] },
    error_logs: { type: [ErrorLogSchema], default: [] },
    success_logs: { type: [SuccessLogSchema], default: [] },

    totalProducts: { type: Number, default: 0 },
    totalQuantityChanged: { type: Number, default: 0 },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

StockPushSessionSchema.index({ createdAt: -1 });

StockPushSessionSchema.methods.addErrorLog = async function (storeProductId, storeProductName, error) {
  try {
    this.error_logs.push({ storeProductId, storeProductName, error });
    await this.save();
  } catch (e) {
    // best-effort; avoid throwing from helper to not mask original error paths
  }
};

StockPushSessionSchema.methods.addSuccessLog = async function (storeProductId, storeProductName, odooProductId) {
  try {
    this.success_logs.push({ storeProductId, storeProductName, odooProductId });
    await this.save();
  } catch (e) {
    // best-effort
  }
};

module.exports = mongoose.models.StockPushSession || mongoose.model('StockPushSession', StockPushSessionSchema); 