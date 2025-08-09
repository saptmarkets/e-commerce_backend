const mongoose = require("mongoose");

const odooCategorySchema = new mongoose.Schema(
  {
    // Odoo identifiers
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    
    // Basic category information
    name: {
      type: String,
      required: true,
    },
    complete_name: {
      type: String,
    },
    
    // Hierarchy
    parent_id: {
      type: Number,
      index: true,
    },
    parent_name: {
      type: String,
    },
    child_ids: [{
      type: Number,
    }],
    
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
    store_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
  },
  {
    timestamps: true,
    collection: 'odoo_categories',
  }
);

// Indexes for performance
odooCategorySchema.index({ write_date: -1 });
odooCategorySchema.index({ _sync_status: 1, is_active: 1 });
odooCategorySchema.index({ parent_id: 1 });

module.exports = mongoose.model("OdooCategory", odooCategorySchema); 