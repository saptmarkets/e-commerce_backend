const mongoose = require("mongoose");

const attributeSchema = new mongoose.Schema(
  {
    title: {
      type: Object,
      required: true,
    },
    name: {
      type: Object,
      required: true,
    },
    variants: [
      {
        name: {
          type: Object,
          required: false,
        },
        status: {
          type: String,
          lowercase: true,
          enum: ["show", "hide"],
          default: "show",
        },
      },
    ],
    option: {
      type: String,
      enum: ["Dropdown", "Radio", "Checkbox"],
    },
    type: {
      type: String,
      lowercase: true,
      default: "attribute",
      enum: ["attribute", "extra"],
    },
    status: {
      type: String,
      lowercase: true,
      enum: ["show", "hide"],
      default: "show",
    },
  },
  {
    timestamps: true,
  }
);

// 🛡️ CORRUPTION PREVENTION SYSTEM - Pre-save hook
attributeSchema.pre('save', async function(next) {
  try {
    // 1. PREVENT TITLE CORRUPTION
    if (this.isModified('title') && this.title && typeof this.title === 'object') {
      const titleKeys = Object.keys(this.title);
      const hasCorruption = titleKeys.some(key => !isNaN(key) && key !== 'en' && key !== 'ar');
      
      if (hasCorruption) {
        console.warn(`🛡️ PREVENTING title corruption for attribute ${this._id}`);
        
        // Extract clean values and reconstruct
        const cleanTitle = {};
        if (this.title.en) cleanTitle.en = this.title.en;
        if (this.title.ar) cleanTitle.ar = this.title.ar;
        
        // If no valid language keys found, try to extract from corruption
        if (Object.keys(cleanTitle).length === 0) {
          const corruptedValues = Object.values(this.title).filter(val => typeof val === 'string');
          if (corruptedValues.length > 0) {
            cleanTitle.en = corruptedValues.join('');
          }
        }
        
        this.title = cleanTitle;
      }
    }

    // 2. PREVENT NAME CORRUPTION
    if (this.isModified('name') && this.name && typeof this.name === 'object') {
      const nameKeys = Object.keys(this.name);
      const hasCorruption = nameKeys.some(key => !isNaN(key) && key !== 'en' && key !== 'ar');
      
      if (hasCorruption) {
        console.warn(`🛡️ PREVENTING name corruption for attribute ${this._id}`);
        
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

    // 3. PREVENT VARIANT NAME CORRUPTION
    if (this.isModified('variants') && this.variants && Array.isArray(this.variants)) {
      this.variants.forEach((variant, index) => {
        if (variant.name && typeof variant.name === 'object') {
          const variantNameKeys = Object.keys(variant.name);
          const hasCorruption = variantNameKeys.some(key => !isNaN(key) && key !== 'en' && key !== 'ar');
          
          if (hasCorruption) {
            console.warn(`🛡️ PREVENTING variant name corruption for attribute ${this._id}, variant ${index}`);
            
            // Extract clean values and reconstruct
            const cleanVariantName = {};
            if (variant.name.en) cleanVariantName.en = variant.name.en;
            if (variant.name.ar) cleanVariantName.ar = variant.name.ar;
            
            // If no valid language keys found, try to extract from corruption
            if (Object.keys(cleanVariantName).length === 0) {
              const corruptedValues = Object.values(variant.name).filter(val => typeof val === 'string');
              if (corruptedValues.length > 0) {
                cleanVariantName.en = corruptedValues.join('');
              }
            }
            
            this.variants[index].name = cleanVariantName;
          }
        }
      });
    }

    // 4. ENSURE PROPER MULTILINGUAL STRUCTURE
    if (this.title && typeof this.title === 'object') {
      // Ensure at least English exists
      if (!this.title.en && !this.title.ar) {
        // Try to find any string value to use as English
        const stringValues = Object.values(this.title).filter(val => typeof val === 'string');
        if (stringValues.length > 0) {
          this.title.en = stringValues[0];
        } else {
          this.title.en = 'Untitled Attribute';
        }
      }
    }

    if (this.name && typeof this.name === 'object') {
      // Ensure at least English exists
      if (!this.name.en && !this.name.ar) {
        // Try to find any string value to use as English
        const stringValues = Object.values(this.name).filter(val => typeof val === 'string');
        if (stringValues.length > 0) {
          this.name.en = stringValues[0];
        } else {
          this.name.en = 'untitled-attribute';
        }
      }
    }

    next();
  } catch (error) {
    console.error('🚨 Attribute pre-save hook error:', error);
    next(error);
  }
});

// Add helpful methods for multilingual support
attributeSchema.methods.getLocalizedTitle = function(language = 'en') {
  if (!this.title || typeof this.title !== 'object') {
    return this.title || 'Untitled Attribute';
  }
  return this.title[language] || this.title.en || this.title.ar || Object.values(this.title)[0] || 'Untitled Attribute';
};

attributeSchema.methods.getLocalizedName = function(language = 'en') {
  if (!this.name || typeof this.name !== 'object') {
    return this.name || 'untitled-attribute';
  }
  return this.name[language] || this.name.en || this.name.ar || Object.values(this.name)[0] || 'untitled-attribute';
};

// Add indexes for better performance
attributeSchema.index({ 'title.en': 1 });
attributeSchema.index({ 'title.ar': 1 });
attributeSchema.index({ 'name.en': 1 });
attributeSchema.index({ 'name.ar': 1 });
attributeSchema.index({ type: 1 });
attributeSchema.index({ status: 1 });

const Attribute = mongoose.model("Attribute", attributeSchema);

module.exports = Attribute;
