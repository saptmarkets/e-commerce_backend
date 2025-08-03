const mongoose = require('mongoose');

const homepageSectionSchema = new mongoose.Schema(
  {
    sectionId: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'hero',
        'why_choose_us',
        'categories',
        'special_prices',
        'combo_deals',
        'featured_products',
        'popular_products',
        'banner_section',
        'discount_products',
        'trust_features',
        'testimonials',
        'newsletter',
        'social_links'
      ]
    },
    name: {
      type: Object,
      default: {
        en: '',
        ar: ''
      }
    },
    description: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    settings: {
      type: Object,
      default: {}
    },
    content: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true,
  }
);

// Create index for sorting
homepageSectionSchema.index({ sortOrder: 1, isActive: 1 });

const HomepageSection = mongoose.model('HomepageSection', homepageSectionSchema);

module.exports = HomepageSection; 