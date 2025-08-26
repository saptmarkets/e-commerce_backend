const mongoose = require("mongoose");

const PromotionSchema = new mongoose.Schema(
  {
    name: {
      type: Object,
      required: false,
      default: { en: "" },
    },
    description: {
      type: Object,
      default: { en: "" },
    },
    type: {
      type: String,
      enum: ["fixed_price", "bulk_purchase", "assorted_items"],
      required: true,
    },
    
    // For fixed_price and bulk_purchase: single product
    productUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductUnit",
      required: function() {
        // Only required for fixed_price promotions
        // For bulk_purchase, it's only required when selectionMode is 'products' or not specified
        if (this.type === 'fixed_price') {
          return true;
        }
        if (this.type === 'bulk_purchase') {
          return this.selectionMode === 'products' || !this.selectionMode;
        }
        return false;
      }
    },
    
    // For assorted_items: multiple products
    productUnits: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductUnit",
    }],
    
    // Common fields
    value: {
      type: Number,
      required: true,
    },
    
    minQty: {
      type: Number,
      default: 1,
    },
    
    maxQty: {
      type: Number,
      default: null,
    },
    
    // Bulk purchase specific fields
    requiredQty: {
      type: Number,
      required: function() {
        return this.type === 'bulk_purchase' && !this.minPurchaseAmount;
      }
    },
    
    freeQty: {
      type: Number,
      required: function() {
        return this.type === 'bulk_purchase';
      }
    },
    
    // New bulk purchase fields
    minPurchaseAmount: {
      type: Number,
      required: function() {
        return this.type === 'bulk_purchase' && !this.requiredQty;
      }
    },
    
    // For bulk promotions with categories or all products
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    }],
    
    // Selection mode for bulk promotions: 'products', 'categories', 'all'
    selectionMode: {
      type: String,
      enum: ["products", "categories", "all"],
      default: "products",
    },
    
    // Assorted items specific fields
    requiredItemCount: {
      type: Number,
      required: function() {
        return this.type === 'assorted_items';
      }
    },
    
    maxItemCount: {
      type: Number,
      default: null,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    
    startDate: {
      type: Date,
      required: true,
    },
    
    endDate: {
      type: Date,
      required: true,
    },
    
    promotionList: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PromotionList",
      default: null,
    },
    
    // Legacy fields for backward compatibility
    unit: {
      type: String,
      enum: ["pcs", "kg", "ctn", "outer", "g", "ml", "ltr", "piece"],
      default: "pcs",
    },
    
    // Link to Odoo pricelist item (for sync/status)
    odoo_pricelist_item_id: {
      type: Number,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 🛡️ CORRUPTION PREVENTION SYSTEM - Pre-save hook
PromotionSchema.pre('save', async function(next) {
  try {
    // 1. PREVENT NAME CORRUPTION
    if (this.isModified('name') && this.name && typeof this.name === 'object') {
      const nameKeys = Object.keys(this.name);
      const hasCorruption = nameKeys.some(key => !isNaN(key) && key !== 'en' && key !== 'ar');
      
      if (hasCorruption) {
        console.warn(`🛡️ PREVENTING name corruption for promotion ${this._id}`);
        
        // Extract clean values and reconstruct
        const cleanName = {};
        if (this.name.en) cleanName.en = this.name.en;
        if (this.name.ar) cleanName.ar = this.name.ar;
        
        // If no valid language keys found, try to extract from corruption
        if (Object.keys(cleanName).length === 0) {
          const corruptedValues = Object.values(this.name).filter(val => typeof val === 'string');
          if (corruptedValues.length > 0) {
            cleanName.en = corruptedValues.join('');
          }
        }
        
        this.name = cleanName;
      }
    }

    // 2. PREVENT DESCRIPTION CORRUPTION
    if (this.isModified('description') && this.description && typeof this.description === 'object') {
      const descKeys = Object.keys(this.description);
      const hasCorruption = descKeys.some(key => !isNaN(key) && key !== 'en' && key !== 'ar');
      
      if (hasCorruption) {
        console.warn(`🛡️ PREVENTING description corruption for promotion ${this._id}`);
        
        // Extract clean values and reconstruct
        const cleanDescription = {};
        if (this.description.en) cleanDescription.en = this.description.en;
        if (this.description.ar) cleanDescription.ar = this.description.ar;
        
        // If no valid language keys found, try to extract from corruption
        if (Object.keys(cleanDescription).length === 0) {
          const corruptedValues = Object.values(this.description).filter(val => typeof val === 'string');
          if (corruptedValues.length > 0) {
            cleanDescription.en = corruptedValues.join('');
          }
        }
        
        this.description = cleanDescription;
      }
    }

    // 3. ENSURE PROPER MULTILINGUAL STRUCTURE
    if (this.name && typeof this.name === 'object') {
      // Ensure at least English exists
      if (!this.name.en && !this.name.ar) {
        // Try to find any string value to use as English
        const stringValues = Object.values(this.name).filter(val => typeof val === 'string');
        if (stringValues.length > 0) {
          this.name.en = stringValues[0];
        } else {
          this.name.en = 'Untitled Promotion';
        }
      }
    }

    if (this.description && typeof this.description === 'object') {
      // Ensure at least English exists
      if (!this.description.en && !this.description.ar) {
        // Try to find any string value to use as English
        const stringValues = Object.values(this.description).filter(val => typeof val === 'string');
        if (stringValues.length > 0) {
          this.description.en = stringValues[0];
        }
      }
    }

    next();
  } catch (error) {
    console.error('🚨 Promotion pre-save hook error:', error);
    next(error);
  }
});

// Validation middleware
PromotionSchema.pre('save', function(next) {
  // Ensure either productUnit or productUnits is provided based on type and selection mode
  if (this.type === 'assorted_items') {
    if (!this.productUnits || this.productUnits.length === 0) {
      return next(new Error('Assorted items promotions must have at least one product unit'));
    }
    // Clear single productUnit for assorted items
    this.productUnit = undefined;
  } else if (this.type === 'bulk_purchase') {
    // Handle different selection modes for bulk purchases
    if (this.selectionMode === 'all') {
      // Clear specific products/categories for "all products" mode
      this.productUnit = undefined;
      this.productUnits = [];
      this.categories = [];
    } else if (this.selectionMode === 'categories') {
      if (!this.categories || this.categories.length === 0) {
        return next(new Error('Category-based bulk promotions must have at least one category'));
      }
      // Clear product selections for category mode
      this.productUnit = undefined;
      this.productUnits = [];
    } else if (this.selectionMode === 'products') {
      if (!this.productUnit && (!this.productUnits || this.productUnits.length === 0)) {
        return next(new Error('Product-based bulk promotions must have at least one product'));
      }
      // Clear categories for product mode
      this.categories = [];
    }
  } else {
    // Fixed price promotions
    if (!this.productUnit) {
      return next(new Error('Fixed price promotions must have a product unit'));
    }
    // Clear multiple productUnits for single product promotions
    this.productUnits = [];
    this.categories = [];
  }
  
  next();
});

// Add helpful methods for multilingual support
PromotionSchema.methods.getLocalizedName = function(language = 'en') {
  if (!this.name || typeof this.name !== 'object') {
    return this.name || 'Untitled Promotion';
  }
  return this.name[language] || this.name.en || this.name.ar || Object.values(this.name)[0] || 'Untitled Promotion';
};

PromotionSchema.methods.getLocalizedDescription = function(language = 'en') {
  if (!this.description || typeof this.description !== 'object') {
    return this.description || '';
  }
  return this.description[language] || this.description.en || this.description.ar || Object.values(this.description)[0] || '';
};

// Add index for better query performance
PromotionSchema.index({ type: 1, isActive: 1, startDate: 1, endDate: 1 });
PromotionSchema.index({ productUnit: 1, isActive: 1 });
PromotionSchema.index({ productUnits: 1, isActive: 1 });
PromotionSchema.index({ 'name.en': 1 });
PromotionSchema.index({ 'name.ar': 1 });
PromotionSchema.index({ odoo_pricelist_item_id: 1 });

module.exports = mongoose.model("Promotion", PromotionSchema); 