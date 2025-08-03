const mongoose = require("mongoose");

const odooPricelistSchema = new mongoose.Schema(
  {
    // Odoo identifiers
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    
    // Basic pricelist information
    name: {
      type: String,
      required: true,
    },
    
    // Currency and company
    currency_id: {
      type: Number,
      index: true,
    },
    currency_name: {
      type: String,
    },
    company_id: {
      type: Number,
      index: true,
    },
    company_name: {
      type: String,
    },
    
    // Pricelist settings
    discount_policy: {
      type: String,
      enum: ['with_discount', 'without_discount'],
      default: 'with_discount',
    },
    
    // Active status
    active: {
      type: Boolean,
      default: true,
    },
    
    // Odoo timestamps
    create_date: {
      type: Date,
      index: true,
    },
    write_date: {
      type: Date,
      index: true,
    },
    
    // Sync tracking fields
    _sync_status: {
      type: String,
      enum: ['pending', 'imported', 'failed', 'skipped'],
      default: 'pending',
      index: true,
    },
    _last_import_attempt: {
      type: Date,
    },
    _import_error: {
      type: String,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'odoo_pricelists',
  }
);

// Indexes for performance
odooPricelistSchema.index({ write_date: -1 });
odooPricelistSchema.index({ _sync_status: 1, is_active: 1 });
odooPricelistSchema.index({ currency_id: 1 });

module.exports = mongoose.model("OdooPricelist", odooPricelistSchema); 