const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: Object,
      required: true,
    },
    description: {
      type: Object,
      required: false,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    // New fields for multiple-image hero layout (2x2 sides)
    leftImageUrl1: {
      type: String,
      default: null,
    },
    leftImageUrl2: {
      type: String,
      default: null,
    },
    rightImageUrl1: {
      type: String,
      default: null,
    },
    rightImageUrl2: {
      type: String,
      default: null,
    },
    // Keep old fields for backward compatibility
    leftImageUrl: {
      type: String,
      default: null,
    },
    rightImageUrl: {
      type: String,
      default: null,
    },
    leftImageAnimation: {
      type: String,
      enum: ['slideUp', 'fadeIn', 'slideDown'],
      default: 'slideUp',
    },
    rightImageAnimation: {
      type: String,
      enum: ['slideUp', 'fadeIn', 'slideDown'],
      default: 'slideUp',
    },
    centerImageAnimation: {
      type: String,
      enum: ['slideRight', 'slideLeft', 'fadeIn'],
      default: 'slideRight',
    },
    // Text alignment settings for different languages
    textAlignment: {
      en: {
        type: String,
        enum: ['left', 'center', 'right'],
        default: 'left',
      },
      ar: {
        type: String,
        enum: ['left', 'center', 'right'],
        default: 'right',
      }
    },
    layoutType: {
      type: String,
      enum: ['single', 'triple'],
      default: 'single',
    },
    location: {
      type: String,
      required: true,
      enum: [
        'home-hero',
        'home-middle', 
        'products-hero',
        'category-top',
        'promotions-hero',
        'page-header',
        'sidebar-ads',
        'footer-banner'
      ],
    },
    linkUrl: {
      type: String,
      trim: true,
    },
    linkText: {
      type: Object,
      default: null,
    },
    openInNewTab: {
      type: Boolean,
      default: false,
    },
    ctaButton: {
      type: Boolean,
      default: false,
    },
    ctaButtonText: {
      type: Object,
      default: null,
    },
    ctaButtonUrl: {
      type: String,
      trim: true,
    },
    priority: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      lowercase: true,
      enum: ['active', 'inactive', 'schedule'],
      default: 'active',
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    // Analytics fields
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    // Targeting fields
    targetAudience: {
      type: [String],
      enum: ['all', 'new-customers', 'returning-customers', 'vip-customers'],
      default: ['all'],
    },
    // Device targeting
    targetDevices: {
      type: [String],
      enum: ['all', 'desktop', 'mobile', 'tablet'],
      default: ['all'],
    },
  },
  {
    timestamps: true,
  }
);

// 🛡️ CORRUPTION PREVENTION SYSTEM - Pre-save hook
bannerSchema.pre('save', async function(next) {
  try {
    // 1. PREVENT TITLE CORRUPTION
    if (this.isModified('title') && this.title && typeof this.title === 'object') {
      const titleKeys = Object.keys(this.title);
      const hasCorruption = titleKeys.some(key => !isNaN(key) && key !== 'en' && key !== 'ar');
      
      if (hasCorruption) {
        console.warn(`🛡️ PREVENTING title corruption for banner ${this._id}`);
        
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

    // 2. PREVENT DESCRIPTION CORRUPTION
    if (this.isModified('description') && this.description && typeof this.description === 'object') {
      const descKeys = Object.keys(this.description);
      const hasCorruption = descKeys.some(key => !isNaN(key) && key !== 'en' && key !== 'ar');
      
      if (hasCorruption) {
        console.warn(`🛡️ PREVENTING description corruption for banner ${this._id}`);
        
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

    // 3. PREVENT LINK TEXT CORRUPTION
    if (this.isModified('linkText') && this.linkText && typeof this.linkText === 'object') {
      const linkTextKeys = Object.keys(this.linkText);
      const hasCorruption = linkTextKeys.some(key => !isNaN(key) && key !== 'en' && key !== 'ar');
      
      if (hasCorruption) {
        console.warn(`🛡️ PREVENTING linkText corruption for banner ${this._id}`);
        
        // Extract clean values and reconstruct
        const cleanLinkText = {};
        if (this.linkText.en) cleanLinkText.en = this.linkText.en;
        if (this.linkText.ar) cleanLinkText.ar = this.linkText.ar;
        
        // If no valid language keys found, try to extract from corruption
        if (Object.keys(cleanLinkText).length === 0) {
          const corruptedValues = Object.values(this.linkText).filter(val => typeof val === 'string');
          if (corruptedValues.length > 0) {
            cleanLinkText.en = corruptedValues.join('');
          }
        }
        
        this.linkText = cleanLinkText;
      }
    }

    // 4. PREVENT CTA BUTTON TEXT CORRUPTION
    if (this.isModified('ctaButtonText') && this.ctaButtonText && typeof this.ctaButtonText === 'object') {
      const ctaKeys = Object.keys(this.ctaButtonText);
      const hasCorruption = ctaKeys.some(key => !isNaN(key) && key !== 'en' && key !== 'ar');
      
      if (hasCorruption) {
        console.warn(`🛡️ PREVENTING ctaButtonText corruption for banner ${this._id}`);
        
        // Extract clean values and reconstruct
        const cleanCtaButtonText = {};
        if (this.ctaButtonText.en) cleanCtaButtonText.en = this.ctaButtonText.en;
        if (this.ctaButtonText.ar) cleanCtaButtonText.ar = this.ctaButtonText.ar;
        
        // If no valid language keys found, try to extract from corruption
        if (Object.keys(cleanCtaButtonText).length === 0) {
          const corruptedValues = Object.values(this.ctaButtonText).filter(val => typeof val === 'string');
          if (corruptedValues.length > 0) {
            cleanCtaButtonText.en = corruptedValues.join('');
          }
        }
        
        this.ctaButtonText = cleanCtaButtonText;
      }
    }

    // 5. ENSURE PROPER MULTILINGUAL STRUCTURE
    if (this.title && typeof this.title === 'object') {
      // Ensure at least English exists
      if (!this.title.en && !this.title.ar) {
        // Try to find any string value to use as English
        const stringValues = Object.values(this.title).filter(val => typeof val === 'string');
        if (stringValues.length > 0) {
          this.title.en = stringValues[0];
        } else {
          this.title.en = 'Untitled Banner';
        }
      }
    }

    next();
  } catch (error) {
    console.error('🚨 Banner pre-save hook error:', error);
    next(error);
  }
});

// Add helpful methods for multilingual support
bannerSchema.methods.getLocalizedTitle = function(language = 'en') {
  if (!this.title || typeof this.title !== 'object') {
    return this.title || 'Untitled Banner';
  }
  return this.title[language] || this.title.en || this.title.ar || Object.values(this.title)[0] || 'Untitled Banner';
};

bannerSchema.methods.getLocalizedDescription = function(language = 'en') {
  if (!this.description || typeof this.description !== 'object') {
    return this.description || '';
  }
  return this.description[language] || this.description.en || this.description.ar || Object.values(this.description)[0] || '';
};

bannerSchema.methods.getLocalizedLinkText = function(language = 'en') {
  if (!this.linkText || typeof this.linkText !== 'object') {
    return this.linkText || '';
  }
  return this.linkText[language] || this.linkText.en || this.linkText.ar || Object.values(this.linkText)[0] || '';
};

bannerSchema.methods.getLocalizedCtaButtonText = function(language = 'en') {
  if (!this.ctaButtonText || typeof this.ctaButtonText !== 'object') {
    return this.ctaButtonText || '';
  }
  return this.ctaButtonText[language] || this.ctaButtonText.en || this.ctaButtonText.ar || Object.values(this.ctaButtonText)[0] || '';
};

// Add indexes for better performance
bannerSchema.index({ 'title.en': 1 });
bannerSchema.index({ 'title.ar': 1 });
bannerSchema.index({ location: 1 });
bannerSchema.index({ status: 1 });
bannerSchema.index({ priority: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

const Banner = mongoose.model("Banner", bannerSchema);

module.exports = Banner; 