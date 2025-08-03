const mongoose = require('mongoose');

const storeCustomizationSchema = new mongoose.Schema(
  {
    home: {
      slider_width_status: {
        type: Boolean,
        default: true,
      },
      promotion_banner_status: {
        type: Boolean,
        default: true,
      },
      popular_products_status: {
        type: Boolean,
        default: true,
      },
      featured_status: {
        type: Boolean,
        default: true,
      },
      delivery_status: {
        type: Boolean,
        default: true,
      },
      discount_product_status: {
        type: Boolean,
        default: true,
      },
      daily_needs_status: {
        type: Boolean,
        default: true,
      },
      feature_promo_status: {
        type: Boolean,
        default: true,
      },
    },
    status: {
      type: String,
      enum: ['show', 'hide'],
      default: 'show',
    },
  },
  {
    timestamps: true,
  }
);

const StoreCustomization = mongoose.model('StoreCustomization', storeCustomizationSchema);
module.exports = StoreCustomization; 