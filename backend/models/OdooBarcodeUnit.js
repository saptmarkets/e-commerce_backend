const mongoose = require("mongoose");

const odooBarcodeUnitSchema = new mongoose.Schema(
  {
    // Odoo identifiers
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    
    // Basic unit information
    name: {
      type: String,
      required: true,
    },
    sequence: {
      type: Number,
      default: 10,
    },
    
    // Product references
    product_id: {
      type: Number,
      required: true,
      index: true,
    },
    product_tmpl_id: {
      type: Number,
      index: true,
    },
    product_name: {
      type: String,
    },
    
    // Barcode and quantity
    barcode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1.0,
    },
    unit: {
      type: String,
    },
    
    // Pricing information
    price: {
      type: Number,
      default: 0,
    },
    av_cost: {
      type: Number,
      default: 0,
    },
    purchase_qty: {
      type: Number,
      default: 0,
    },
    purchase_cost: {
      type: Number,
      default: 0,
    },
    sales_vat: {
      type: Number,
      default: 0,
    },
    sale_qty: {
      type: Number,
      default: 0,
    },
    
    // Company and currency
    company_id: {
      type: Number,
    },
    currency_id: {
      type: Number,
    },
    
    // Active status
    active: {
      type: Boolean,
      default: true,
      index: true,
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
    store_product_unit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductUnit",
    },
  },
  {
    timestamps: true,
    collection: 'odoo_barcode_units',
  }
);

// Indexes for performance
odooBarcodeUnitSchema.index({ write_date: -1 });
odooBarcodeUnitSchema.index({ _sync_status: 1, is_active: 1 });
odooBarcodeUnitSchema.index({ product_id: 1, active: 1 });
odooBarcodeUnitSchema.index({ sequence: 1 });

module.exports = mongoose.model("OdooBarcodeUnit", odooBarcodeUnitSchema); 