const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: false,
    },
    sku: {
      type: String,
      required: false,
    },
    barcode: {
      type: String,
      required: false,
    },
    title: {
      type: Object,
      required: true,
    },
    description: {
      type: Object,
      required: false,
    },
    slug: {
      type: String,
      required: true,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    image: {
      type: Array,
      required: false,
      default: [],
      validate: {
        validator: function(v) {
          return Array.isArray(v) && v.length <= 10; // Max 10 images
        },
        message: 'Maximum 10 images allowed per product'
      }
    },
    stock: {
      type: Number,
      required: false,
    },
    // Detailed stock info for each warehouse / branch
    locationStocks: [{
      locationId: { type: Number },   // Odoo location_id
      name: { type: String },         // e.g. "WH/Branch A"
      qty: { type: Number, default: 0 }, // Quantity in basic units
    }],
    sales: {
      type: Number,
      required: false,
    },
    tag: [String],
    
    // SINGLE selling price only
    price: {
      type: Number,
      required: true, // Price of one single basicUnit
    },
    
    // Structured pricing object (recommended for production)
    prices: {
      price: {
        type: Number,
        required: false,
      },
      originalPrice: {
        type: Number,
        required: false,
      },
      discount: {
        type: Number,
        default: 0,
      },
    },
    
    // Basic unit type reference
    basicUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
      index: true, // Ensure index for better performance
    },
    
    // Basic unit type (for quick reference) - DEPRECATED
    basicUnitType: {
      type: String,
      // required: true, // No longer strictly required, will be derived or phased out
      // enum: ["pcs", "kg", "g", "l", "ml", "bottle", "can", "pack", "box", "unit", "other"], // Removed enum validation
      // default: "pcs",
      comment: "DEPRECATED: This field will be removed. Use populated basicUnit.shortCode or basicUnit.name instead."
    },
    
    // Multi-units configuration (enhanced for production grocery schema)
    multiUnits: [{
      unit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Unit",
        required: true,
      },
      unitType: {
        type: String,
        default: "multi",
      },
      packQty: {
        type: Number,
        required: true,
        default: 1,
      },
      price: {
        type: Number,
        required: true,
      },
      originalPrice: {
        type: Number,
        required: false,
      },
      sku: {
        type: String,
        required: false,
        default: "",
      },
      barcode: {
        type: String,
        required: false,
        default: "",
      },
      isDefault: {
        type: Boolean,
        default: false,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      minOrderQuantity: {
        type: Number,
        default: 1,
      },
      maxOrderQuantity: {
        type: Number,
        required: false,
      }
    }],
    
    // Flag to indicate if product has multi-units (managed by productUnitController)
    hasMultiUnits: {
      type: Boolean,
      default: false,
    },

    // Stores distinct unit IDs from active ProductUnit entries for this product (managed by productUnitController)
    availableUnits: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit'
    }],
    
    // Traditional variants for other attributes (color, size, etc.) - keeping for backward compatibility
    variants: [
      {
        variantTitle: String,
        variantPrice: Number,
        quantity: Number,
        sku: String,
        barcode: String,
        productId: String,
        attributes: [
          {
            name: String,
            value: String,
          }
        ]
      }
    ],
    
    isCombination: {
      type: Boolean,
      required: true,
    },
    
    status: {
      type: String,
      default: "show",
      enum: ["show", "hide"],
    },

    // Add this field for Odoo integration
    odooProductId: {
      type: Number,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add compound index for better performance
productSchema.index({ category: 1, status: 1 });
productSchema.index({ basicUnit: 1 });
// productSchema.index({ basicUnitType: 1 }); // Index on deprecated field can be removed later
productSchema.index({ hasMultiUnits: 1 });
productSchema.index({ availableUnits: 1 }); // Index on availableUnits
// Quick lookup by branch/location
productSchema.index({ 'locationStocks.locationId': 1 });

// Pre-save middleware to auto-set hasMultiUnits - REMOVED as this is handled by productUnitController
// productSchema.pre('save', function(next) {
//   if (this.multiUnits && this.multiUnits.length > 0) { // Check if multiUnits is defined
//     this.hasMultiUnits = true;
//   } else {
//     this.hasMultiUnits = false;
//   }
//   next();
// });

// Pre-save hook to prevent title/description corruption and sync basicUnitType
productSchema.pre('save', async function(next) {
  
  // 1. PREVENT TITLE/DESCRIPTION CORRUPTION
  if (this.isModified('title') && this.title && typeof this.title === 'object') {
    const titleKeys = Object.keys(this.title);
    const hasCorruption = titleKeys.some(key => !isNaN(key) && key !== 'en' && key !== 'ar');
    
    if (hasCorruption) {
      console.warn(`🛡️  PREVENTING title corruption for product ${this._id}`);
      
      // Extract clean values
      const cleanTitle = {};
      if (this.title.en) cleanTitle.en = this.title.en;
      if (this.title.ar) cleanTitle.ar = this.title.ar;
      
      // If no clean values, reconstruct from character array
      if (!cleanTitle.en && !cleanTitle.ar) {
        const charKeys = titleKeys.filter(key => !isNaN(key)).sort((a, b) => parseInt(a) - parseInt(b));
        if (charKeys.length > 0) {
          cleanTitle.en = charKeys.map(key => this.title[key]).join('');
          console.warn(`🔧 Reconstructed title: "${cleanTitle.en}"`);
        }
      }
      
      this.title = cleanTitle;
    }
  }
  
  if (this.isModified('description') && this.description && typeof this.description === 'object') {
    const descKeys = Object.keys(this.description);
    const hasCorruption = descKeys.some(key => !isNaN(key) && key !== 'en' && key !== 'ar');
    
    if (hasCorruption) {
      console.warn(`🛡️  PREVENTING description corruption for product ${this._id}`);
      
      // Extract clean values
      const cleanDesc = {};
      if (this.description.en) cleanDesc.en = this.description.en;
      if (this.description.ar) cleanDesc.ar = this.description.ar;
      
      // If no clean values, reconstruct from character array
      if (!cleanDesc.en && !cleanDesc.ar) {
        const charKeys = descKeys.filter(key => !isNaN(key)).sort((a, b) => parseInt(a) - parseInt(b));
        if (charKeys.length > 0) {
          cleanDesc.en = charKeys.map(key => this.description[key]).join('');
          console.warn(`🔧 Reconstructed description (${cleanDesc.en.length} chars)`);
        }
      }
      
      this.description = cleanDesc;
    }
  }
  
  // 2. SYNC BASIC UNIT TYPE
  if (this.isModified('basicUnit') || (this.isNew && this.basicUnit)) {
    if (this.basicUnit) {
      try {
        const Unit = mongoose.model('Unit'); // Important: Get model this way inside hook
        const unitDoc = await Unit.findById(this.basicUnit);
        if (unitDoc && unitDoc.shortCode) {
          // If basicUnitType has an enum, check against it. Otherwise, just assign.
          const basicUnitTypePath = productSchema.path('basicUnitType');
          const enumValues = basicUnitTypePath.enumValues;
          if (enumValues && enumValues.length > 0 && !enumValues.includes(unitDoc.shortCode)) {
            // console.warn(`Product ${this.title?.en || this._id}: basicUnit.shortCode '${unitDoc.shortCode}' not in basicUnitType enum. Setting to default or clearing.`);
            // this.basicUnitType = basicUnitTypePath.defaultValue || 'other'; // Or handle as error
            // For now, let's just assign, assuming enum might be relaxed/removed for basicUnitType
             this.basicUnitType = unitDoc.shortCode;
          } else {
            this.basicUnitType = unitDoc.shortCode;
          }
        } else if (unitDoc) {
          // console.warn(`Product ${this.title?.en || this._id}: basicUnit (ID: ${this.basicUnit}) found but has no shortCode. Clearing basicUnitType.`);
          this.basicUnitType = undefined; // Or set to a default like 'other'
        } else {
          // console.warn(`Product ${this.title?.en || this._id}: basicUnit (ID: ${this.basicUnit}) not found. Clearing basicUnitType.`);
          this.basicUnitType = undefined;
        }
      } catch (error) {
        console.error("Error in Product pre-save hook while syncing basicUnitType:", error.message);
        // Decide how to handle error, maybe set a default or allow save to continue
      }
    }
  } else if (this.isNew && !this.basicUnit) {
    // If it's a new product and no basicUnit is set, clear basicUnitType
    this.basicUnitType = undefined;
  }
  
  next();
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
