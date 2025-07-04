const mongoose = require("mongoose");

const odooUomSchema = new mongoose.Schema(
  {
    // Odoo identifiers
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    
    // Basic UoM information
    name: {
      type: String,
      required: true,
    },
    category_id: {
      type: Number,
      index: true,
    },
    category_name: {
      type: String,
    },
    
    // Conversion factors
    factor: {
      type: Number,
      default: 1.0,
    },
    factor_inv: {
      type: Number,
      default: 1.0,
    },
    
    // UoM type
    uom_type: {
      type: String,
      enum: ['reference', 'bigger', 'smaller'],
      default: 'reference',
    },
    
    // Rounding precision
    rounding: {
      type: Number,
      default: 0.01,
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
    
    // Store mapping
    store_unit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
    },
  },
  {
    timestamps: true,
    collection: 'odoo_uom',
  }
);

// Indexes for performance
odooUomSchema.index({ write_date: -1 });
odooUomSchema.index({ _sync_status: 1, is_active: 1 });
odooUomSchema.index({ category_id: 1 });

module.exports = mongoose.model("OdooUom", odooUomSchema); 