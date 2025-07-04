const { connectDB } = require("../config/db");
const Setting = require("../models/Setting");
const settingsData = require("../utils/settings.json");

const importStoreSetting = async () => {
  try {
    await connectDB();
    
    // Import store settings
    for (const setting of settingsData) {
      if (setting.name === "storeSetting") {
        const newSetting = new Setting({
          name: "storeSetting",
          setting: {
            cod_status: setting.setting.cod_status || true,
            fb_pixel_status: setting.setting.fb_pixel_status || false,
            fb_pixel_key: setting.setting.fb_pixel_key || "",
            google_analytic_status: setting.setting.google_analytic_status || false,
            google_analytic_key: setting.setting.google_analytic_key || "",
            google_login_status: setting.setting.google_login_status || false,
            github_login_status: setting.setting.github_login_status || false,
            facebook_login_status: setting.setting.facebook_login_status || false,
            google_id: setting.setting.google_id || "",
            google_secret: setting.setting.google_secret || "",
            github_id: setting.setting.github_id || "",
            github_secret: setting.setting.github_secret || "",
            facebook_id: setting.setting.facebook_id || "",
            facebook_secret: setting.setting.facebook_secret || "",
            nextauth_secret: setting.setting.nextauth_secret || "",
            next_api_base_url: setting.setting.next_api_base_url || "http://localhost:5055/api",
            stripe_key: setting.setting.stripe_key || "",
            stripe_secret: setting.setting.stripe_secret || "",
            stripe_status: setting.setting.stripe_status || false,
            razorpay_status: setting.setting.razorpay_status || false,
            razorpay_id: setting.setting.razorpay_id || "",
            razorpay_secret: setting.setting.razorpay_secret || "",
            meta_url: setting.setting.meta_url || "https://saptmarkets-store-nine.vercel.app/",
            tawk_chat_property_id: setting.setting.tawk_chat_property_id || "",
            tawk_chat_status: setting.setting.tawk_chat_status || false,
            tawk_chat_widget_id: setting.setting.tawk_chat_widget_id || ""
          }
        });
        await newSetting.save();
        console.log('Store settings imported successfully!');
      }
    }
    process.exit(0);
  } catch (error) {
    console.error('Error importing store settings:', error);
    process.exit(1);
  }
};

importStoreSetting(); 