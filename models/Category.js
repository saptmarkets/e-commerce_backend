const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: Object,
      required: true,
    },
    description: {
      type: Object,
      required: false,
    },
    slug: {
      type: String,
      required: false,
      unique: true, // Prevent duplicate slugs
      index: true,  // Create index for faster lookups
    },
    parentId: {
      type: String,
      required: false,
    },
    parentName: {
      type: String,
      required: false,
    },
    id: {
      type: String,
      required: false,
    },
    icon: {
      type: String,
      required: false,
    },
    headerImage: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      lowercase: true,
      enum: ['show', 'hide'],
      default: 'show',
    },
  },
  {
    timestamps: true,
  }
);

// 🛡️ CORRUPTION PREVENTION SYSTEM - Pre-save hook
categorySchema.pre('save', async function(next) {
  try {
    // 1. PREVENT NAME CORRUPTION
    if (this.isModified('name') && this.name && typeof this.name === 'object') {
      const nameKeys = Object.keys(this.name);
      const hasCorruption = nameKeys.some(key => !isNaN(key) && key !== 'en' && key !== 'ar');
      
      if (hasCorruption) {
        console.warn(`🛡️ PREVENTING name corruption for category ${this._id}`);
        
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
        console.warn(`🛡️ PREVENTING description corruption for category ${this._id}`);
        
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
          this.name.en = 'Untitled Category';
        }
      }
    }

    // 4. VALIDATE SLUG UNIQUENESS
    if (this.isModified('slug') && this.slug) {
      try {
        await this.validateSlugUniqueness();
      } catch (error) {
        return next(error);
      }
    }

    next();
  } catch (error) {
    console.error('🚨 Category pre-save hook error:', error);
    next(error);
  }
});

// Add helpful methods for multilingual support
categorySchema.methods.getLocalizedName = function(language = 'en') {
  if (!this.name || typeof this.name !== 'object') {
    return this.name || 'Untitled Category';
  }
  return this.name[language] || this.name.en || this.name.ar || Object.values(this.name)[0] || 'Untitled Category';
};

// Add validation method for duplicate slug
categorySchema.methods.validateSlugUniqueness = async function() {
  if (!this.slug) return true;
  
  const existingCategory = await this.constructor.findOne({ 
    slug: this.slug, 
    _id: { $ne: this._id } // Exclude current document when updating
  });
  
  if (existingCategory) {
    throw new Error(`Category with slug '${this.slug}' already exists`);
  }
  
  return true;
};

categorySchema.methods.getLocalizedDescription = function(language = 'en') {
  if (!this.description || typeof this.description !== 'object') {
    return this.description || '';
  }
  return this.description[language] || this.description.en || this.description.ar || Object.values(this.description)[0] || '';
};

// Add indexes for better performance
categorySchema.index({ 'name.en': 1 });
categorySchema.index({ 'name.ar': 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ parentId: 1 });
categorySchema.index({ status: 1 });

// Add unique compound index to prevent duplicate names within same parent
categorySchema.index(
  { 'name.en': 1, parentId: 1 }, 
  { 
    unique: true, 
    name: 'unique_category_name_parent',
    partialFilterExpression: { status: 'show' } // Only apply to active categories
  }
);

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
