const { connectDB } = require("../config/db");
const Setting = require("../models/Setting");
const settingsData = require("../utils/settings.json");

const importStoreCustomization = async () => {
  try {
    await connectDB();
    
    // Import store customization settings
    for (const setting of settingsData) {
      if (setting.name === "storeCustomizationSetting") {
        const newSetting = new Setting({
          name: "storeCustomizationSetting",
          setting: setting.setting
        });
        await newSetting.save();
        console.log('Store customization settings imported successfully!');
      }
    }
    process.exit(0);
  } catch (error) {
    console.error('Error importing store customization settings:', error);
    process.exit(1);
  }
};

importStoreCustomization(); 