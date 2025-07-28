const mongoose = require("mongoose");

const odooProductSchema = new mongoose.Schema(
  {
    // Odoo identifiers
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    product_tmpl_id: {
      type: Number,
      required: true,
      index: true,
    },
    // Note: product_id is the same as id in Odoo, so we use 'id' field
    
    // Basic product information
    name: {
      type: String,
      required: true,
    },
    default_code: {
      type: String,
      index: true,
    },
    barcode: {
      type: String,
      index: true,
    },
    
    // Pricing
    list_price: {
      type: Number,
      default: 0,
    },
    standard_price: {
      type: Number,
      default: 0,
    },
    
    // Stock information
    qty_available: {
      type: Number,
      default: 0,
    },
    virtual_available: {
      type: Number,
      default: 0,
    },
    
    // Category and UoM references
    categ_id: {  // Changed from category_id to categ_id
      type: Number,
      index: true,
    },
    uom_id: {
      type: Number,
      index: true,
    },
    uom_po_id: {
      type: Number,
    },
    
    // Product type and status
    type: {
      type: String,
      enum: ['product', 'consu', 'service'],
      default: 'product',
    },
    sale_ok: {
      type: Boolean,
      default: true,
    },
    purchase_ok: {
      type: Boolean,
      default: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    
    // Multi-units support
    barcode_unit_ids: [{
      type: Number,
    }],
    barcode_unit_count: {
      type: Number,
      default: 0,
    },
    
    // Product attributes and variants
    attributes: [{
      attribute_id: Number,
      attribute_name: String,
      value: String,
    }],
    
    // Additional fields
    description_sale: String,
    weight: Number,
    volume: Number,
    
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
    _odoo_rev: {
      type: String,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    
    // Store mapping
    store_product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  },
  {
    timestamps: true,
    collection: 'odoo_products',
  }
);

// Indexes for performance
odooProductSchema.index({ write_date: -1 });
odooProductSchema.index({ _sync_status: 1, is_active: 1 });
odooProductSchema.index({ categ_id: 1, active: 1 });  // Changed from category_id to categ_id
odooProductSchema.index({ barcode: 1 }, { sparse: true });

module.exports = mongoose.model("OdooProduct", odooProductSchema); 