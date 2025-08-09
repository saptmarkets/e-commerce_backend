const mongoose = require("mongoose");

const productUnitSchema = new mongoose.Schema(
  {
    // Link to the main product
    product: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: true,
    },

    // Link to the global Unit definition
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },

    // Unit type (for backward compatibility and indexing)
    unitType: {
      type: String,
      default: 'multi',
    },

    // Display value for the package (e.g., "1", "2", "6"). Interpreted as a multiplier for the selected unitId.
    // Example: unitId refers to "Dozen" (packValue 12), unitValue: 2 means "2 Dozens".
    unitValue: {
      type: Number,
      required: true,
      min: 1, // Typically 1, meaning one instance of the referenced Unit (e.g. 1 Dozen)
      default: 1,
    },

    // How many basic units this product-unit contains (e.g., for a 'Dozen' of eggs, packQty is 12)
    packQty: {
      type: Number,
      required: true,
      min: 0.001,
    },

    // Pricing for this package unit
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // SKU for this specific unit (auto-generated if not provided)
    sku: {
      type: String,
      sparse: true,
    },

    // Barcode for this specific unit
    barcode: {
      type: String,
      sparse: true,
    },

    // Weight/volume of the entire package (optional)
    weight: {
      type: Number,
      default: 0,
    },

    // Dimensions (optional)
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },

    // Whether this is the default unit for display
    isDefault: {
      type: Boolean,
      default: false,
    },

    // Status of this unit
    isActive: {
      type: Boolean,
      default: true,
    },

    // Whether this unit is available for sale
    isAvailable: {
      type: Boolean,
      default: true,
    },

    // Minimum order quantity for this unit
    minOrderQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Maximum order quantity for this unit
    maxOrderQuantity: {
      type: Number,
      default: null,
    },

    // Cost price for this unit (for profit calculation)
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Special pricing rules
    bulkPricing: [{
      minQuantity: { type: Number, required: true },
      price: { type: Number, required: true },
    }],

    // Metadata
    tags: [{
      type: String,
      trim: true,
    }],

    // Additional attributes
    attributes: {
      color: { type: String, default: "" },
      size: { type: String, default: "" },
      flavor: { type: String, default: "" },
      material: { type: String, default: "" },
    },

    // SEO and display
    title: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    // Images specific to this unit (if different from main product)
    images: [String],

    // Sort order for display
    sortOrder: {
      type: Number,
      default: 0,
    },

    // Analytics data
    views: {
      type: Number,
      default: 0,
    },

    sales: {
      type: Number,
      default: 0,
    },

    // Accumulated quantity (in basic units) that still needs to be pushed
    // back to Odoo for this specific unit. Negative numbers mean stock
    // should be reduced in Odoo.
    pendingOdooQty: {
      type: Number,
      default: 0,
    },

    // BEGIN stock-by-location additions ------------------------------
    // Total available quantity across all active locations (basic units)
    stock: {
      type: Number,
      default: 0,
    },

    // Per-location breakdown used for branch-aware stock handling
    locationStocks: [{
      locationId: { type: Number },   // Odoo location_id
      name: { type: String },         // Human readable location name
      qty: { type: Number, default: 0 }, // Available quantity in basic units
    }],
    // END stock-by-location additions --------------------------------

    // Creation and update tracking
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "Admin",
    },

    updatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
productUnitSchema.index({ product: 1, isActive: 1 });
productUnitSchema.index({ product: 1, unit: 1, unitValue: 1 });
productUnitSchema.index({ sku: 1 }, { sparse: true });
productUnitSchema.index({ barcode: 1 }, { unique: true, sparse: true });
productUnitSchema.index({ isActive: 1, isAvailable: 1 });

// NEW: index for nested location identifier
productUnitSchema.index({ 'locationStocks.locationId': 1 });
productUnitSchema.index({ pendingOdooQty: 1 });

// Virtual fields for backward compatibility with frontend expecting productId/unitId
productUnitSchema.virtual('productId').get(function() {
  return this.product;
}).set(function(value) {
  this.product = value;
});

productUnitSchema.virtual('unitId').get(function() {
  return this.unit;
}).set(function(value) {
  this.unit = value;
});

// Ensure virtual fields are included in JSON output
productUnitSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Include both field names in JSON output for compatibility
    // Preserve populated data while providing backward compatibility
    if (ret.product) {
      ret.productId = (typeof ret.product === 'object' && ret.product._id) ? ret.product._id : ret.product;
    }
    if (ret.unit) {
      ret.unitId = (typeof ret.unit === 'object' && ret.unit._id) ? ret.unit._id : ret.unit;
    }
    return ret;
  }
});

productUnitSchema.set('toObject', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Include both field names in object output for compatibility
    // Preserve populated data while providing backward compatibility
    if (ret.product) {
      ret.productId = (typeof ret.product === 'object' && ret.product._id) ? ret.product._id : ret.product;
    }
    if (ret.unit) {
      ret.unitId = (typeof ret.unit === 'object' && ret.unit._id) ? ret.unit._id : ret.unit;
    }
    return ret;
  }
});

// Virtual for price per basic unit (for comparison)
productUnitSchema.virtual('pricePerBaseUnit').get(function() {
  if (!this.packQty || this.packQty === 0) {
    return this.price; // Fallback
  }
  return this.price / this.packQty;
});

// Virtual for total basic units in this package
productUnitSchema.virtual('totalBasicUnits').get(function() {
  if (!this.packQty) {
    return 1; // Fallback
  }
  return this.packQty;
});

// Virtual for display name
productUnitSchema.virtual('displayName').get(function() {
  if (!this.unit || !this.unit.name) {
    return 'N/A'; // Fallback if unit or name is not populated
  }
  return this.unit.name;
});

// Virtual for unit name (for easier frontend access)
productUnitSchema.virtual('unitName').get(function() {
  if (!this.unit || !this.unit.name) {
    return null; // Return null if unit is not populated
  }
  return this.unit.name;
});

// Pre-save middleware
productUnitSchema.pre('save', function(next) {
  // Auto-generate title if not provided
  if (!this.title) {
    this.title = this.displayName;
  }
  next();
});

// Pre-save middleware to ensure only one default unit per product
productUnitSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Remove default flag from other units of the same product
    await this.constructor.updateMany(
      { product: this.product, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  
  // Populate title from displayName if title is not set
  if (!this.title && this.unit) { // Ensure unit is available for displayName
    // Temporarily populate unit if it's just an ID for the virtual to work during save
    if (!this.unit.name) {
        const Unit = mongoose.model('Unit');
        const unitDefinition = await Unit.findById(this.unit);
        if (unitDefinition) {
            this.unit = unitDefinition; // Replace ID with populated object for virtual
        }
    }
    this.title = this.displayName;
  }

  next();
});

// Static method to get stock requirement for a unit sale
productUnitSchema.statics.getStockRequirement = function(unitData, quantity = 1) {
  // unitData is expected to be a ProductUnit document or object
  // It should have unitId populated or unitId.packValue accessible
  if (!unitData.unit || !unitData.unit.packValue) {
      // Fallback or error: cannot determine stock requirement without packValue
      // For now, let's assume unitValue if packValue is missing, though this is not ideal
      console.warn("Warning: unitId.packValue not available for getStockRequirement, using unitData.unitValue as fallback.");
      return (unitData.unitValue || 1) * quantity; 
  }
  const basicUnitsPerPackage = unitData.unitValue * unitData.unit.packValue;
  return basicUnitsPerPackage * quantity;
};

// Static method to calculate best value unit
productUnitSchema.statics.findBestValue = async function(productId) {
  const units = await this.find({ 
    product: productId, 
    isActive: true, 
    isAvailable: true 
  }).sort({ pricePerBaseUnit: 1 });
  
  return units.length > 0 ? units[0] : null;
};

// Instance method to check if unit provides better value than another
productUnitSchema.methods.isBetterValueThan = function(otherUnit) {
  const thisValue = this.pricePerBaseUnit;
  const otherValue = otherUnit.pricePerBaseUnit;
  return thisValue < otherValue;
};

// Instance method to calculate savings compared to basic unit
productUnitSchema.methods.calculateSavings = function(basicUnitPrice) {
  if (!basicUnitPrice || basicUnitPrice <= 0) return 0;
  
  const thisUnitCost = this.price;
  // Calculate the cost of the equivalent number of basic units
  let equivalentBasicUnitCost = 0;
  if (this.unit && this.unit.packValue) {
    equivalentBasicUnitCost = basicUnitPrice * (this.unitValue * this.unit.packValue);
  } else {
    // Fallback if packValue is not available (should ideally not happen with populated unitId)
    // This case might indicate an issue or that unitId is not populated
    console.warn("calculateSavings: unitId.packValue not available. Savings might be inaccurate.");
    equivalentBasicUnitCost = basicUnitPrice * this.unitValue; // Less accurate fallback
  }
  
  return Math.max(0, equivalentBasicUnitCost - thisUnitCost);
};

const ProductUnit = mongoose.model("ProductUnit", productUnitSchema);

module.exports = ProductUnit; 