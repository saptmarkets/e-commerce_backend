const mongoose = require("mongoose");

const odooPricelistItemSchema = new mongoose.Schema(
  {
    // Odoo identifiers
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    
    // Pricelist reference
    pricelist_id: {
      type: Number,
      required: true,
      index: true,
    },
    pricelist_name: {
      type: String,
    },
    
    // Product references
    product_tmpl_id: {
      type: Number,
      index: true,
    },
    product_id: {
      type: Number,
      index: true,
    },
    product_name: {
      type: String,
    },
    
    // Multi-unit support
    barcode_unit_id: {
      type: Number,
      index: true,
    },
    barcode_unit_name: {
      type: String,
    },
    
    // Pricing rules
    applied_on: {
      type: String,
      enum: ['3_global', '2_product_category', '1_product', '0_product_variant'],
      default: '1_product',
    },
    compute_price: {
      type: String,
      enum: ['fixed', 'percentage', 'formula'],
      default: 'fixed',
    },
    
    // Price values
    fixed_price: {
      type: Number,
    },
    price_discount: {
      type: Number,
      default: 0,
    },
    price_surcharge: {
      type: Number,
      default: 0,
    },
    price_round: {
      type: Number,
      default: 0,
    },
    price_min_margin: {
      type: Number,
      default: 0,
    },
    price_max_margin: {
      type: Number,
      default: 0,
    },
    percent_price: {
      type: Number,
      default: 0,
    },
    
    // Quantity limits
    min_quantity: {
      type: Number,
      default: 0,
    },
    max_quantity: {
      type: Number,
    },
    
    // Date validity
    date_start: {
      type: Date,
    },
    date_end: {
      type: Date,
    },
    
    // Base pricelist for formula
    base_pricelist_id: {
      type: Number,
    },
    base: {
      type: String,
      enum: ['list_price', 'standard_price', 'pricelist'],
      default: 'list_price',
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
    store_promotion_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promotion",
    },
  },
  {
    timestamps: true,
    collection: 'odoo_pricelist_items',
  }
);

// Indexes for performance
odooPricelistItemSchema.index({ write_date: -1 });
odooPricelistItemSchema.index({ _sync_status: 1, is_active: 1 });
odooPricelistItemSchema.index({ pricelist_id: 1, product_id: 1 });
odooPricelistItemSchema.index({ barcode_unit_id: 1 });
odooPricelistItemSchema.index({ date_start: 1, date_end: 1 });

module.exports = mongoose.model("OdooPricelistItem", odooPricelistItemSchema); 