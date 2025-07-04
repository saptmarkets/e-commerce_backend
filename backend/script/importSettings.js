const { connectDB } = require("../config/db");
const Setting = require("../models/Setting");
const settingsData = require("../utils/settings.json");

const importSettings = async () => {
  try {
    await connectDB();
    
    // Delete existing settings
    await Setting.deleteMany({});
    console.log('Deleted existing settings');

    // Import new settings
    for (const setting of settingsData) {
      if (setting.name === "globalSetting") {
        const newSetting = new Setting({
          name: "globalSetting",
          setting: {
            number_of_image_per_product: "5",
            shop_name: setting.setting.shop_name || "saptmarkets",
            address: setting.setting.address || "123 Main Street",
            company_name: setting.setting.company_name || "saptmarkets Ltd",
            vat_number: setting.setting.vat_number || "47589",
            post_code: setting.setting.post_code || "2030",
            contact: setting.setting.contact || "019579034",
            email: setting.setting.email || "saptmarkets@gmail.com",
            website: setting.setting.website || "saptmarkets-admin.vercel.app",
            receipt_size: setting.setting.receipt_size || "57-mm",
            default_currency: setting.setting.default_currency || "€",
            default_time_zone: setting.setting.default_time_zone || "Europe/London",
            default_date_format: setting.setting.default_date_format || "MMM D, YYYY",
            from_email: setting.setting.from_email || "noreply@saptmarkets.com",
            email_to_customer: false,
            allow_auto_trans: false,
            translation_key: ""
          }
        });
        await newSetting.save();
        console.log('Global settings imported successfully!');
      }
    }
    process.exit(0);
  } catch (error) {
    console.error('Error importing settings:', error);
    process.exit(1);
  }
};

importSettings(); 