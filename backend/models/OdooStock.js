const mongoose = require("mongoose");

const odooStockSchema = new mongoose.Schema(
  {
    // Odoo identifiers
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    
    // Product and location references
    product_id: {
      type: Number,
      required: true,
      index: true,
    },
    product_name: {
      type: String,
    },
    location_id: {
      type: Number,
      required: true,
      index: true,
    },
    location_name: {
      type: String,
    },
    
    // Stock quantities
    quantity: {
      type: Number,
      default: 0,
    },
    reserved_quantity: {
      type: Number,
      default: 0,
    },
    available_quantity: {
      type: Number,
      default: 0,
    },
    
    // Additional stock information
    lot_id: {
      type: Number,
    },
    lot_name: {
      type: String,
    },
    package_id: {
      type: Number,
    },
    owner_id: {
      type: Number,
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
    collection: 'odoo_stock',
  }
);

// Indexes for performance
odooStockSchema.index({ write_date: -1 });
odooStockSchema.index({ _sync_status: 1, is_active: 1 });
odooStockSchema.index({ product_id: 1, location_id: 1 });

module.exports = mongoose.model("OdooStock", odooStockSchema); 