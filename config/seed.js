require('dotenv').config();
const { connectDB } = require('./db');
const Setting = require('../models/Setting');
const GlobalSetting = require('../models/GlobalSetting');
const StoreCustomization = require('../models/StoreCustomization');

const defaultSettings = {
  name: "Default Store",
  address: "123 Main Street",
  email: "store@example.com",
  phone: "+1234567890",
  status: "show",
  social: {
    facebook: "",
    twitter: "",
    instagram: "",
    pinterest: "",
    youtube: "",
  },
  meta_title: "saptmarkets - React eCommerce Template",
  meta_description: "saptmarkets is a React eCommerce template",
  meta_keywords: "react,ecommerce,template",
  meta_url: "https://saptmarkets.com",
};

const defaultGlobalSettings = {
  default_currency: "USD",
  default_currency_position: "left",
  default_date_format: "MM/DD/YYYY",
  default_time_zone: "UTC",
  default_language: "en",
  status: "show",
};

const defaultStoreCustomization = {
  home: {
    slider_width_status: true,
    promotion_banner_status: true,
    popular_products_status: true,
    featured_status: true,
    delivery_status: true,
    discount_product_status: true,
    daily_needs_status: true,
    feature_promo_status: true,
  },
  status: "show",
};

const seedSettings = async () => {
  try {
    await connectDB();
    
    // Check if settings exist
    const settingExists = await Setting.findOne();
    if (!settingExists) {
      await Setting.create(defaultSettings);
      console.log('Default store settings created');
    }

    const globalSettingExists = await GlobalSetting.findOne();
    if (!globalSettingExists) {
      await GlobalSetting.create(defaultGlobalSettings);
      console.log('Default global settings created');
    }

    const storeCustomizationExists = await StoreCustomization.findOne();
    if (!storeCustomizationExists) {
      await StoreCustomization.create(defaultStoreCustomization);
      console.log('Default store customization settings created');
    }

    console.log('Settings seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding settings:', error);
    process.exit(1);
  }
};

seedSettings(); 