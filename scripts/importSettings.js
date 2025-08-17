const { connectDB } = require("../config/db");
const Setting = require("../models/Setting");
const settingsData = require("../utils/settings.json");

const importSettings = async () => {
  try {
    await connectDB();
    
    // Preserve existing About Us customization data
    const existingStoreCustomization = await Setting.findOne({ name: "storeCustomizationSetting" });
    let preservedAboutUsData = null;
    
    if (existingStoreCustomization && existingStoreCustomization.setting.about_us) {
      console.log('Preserving existing About Us customization data...');
      preservedAboutUsData = existingStoreCustomization.setting.about_us;
    }
    
    // Delete existing settings
    await Setting.deleteMany({});
    console.log('Deleted existing settings');

    // Import new settings
    for (const setting of settingsData) {
      const newSetting = new Setting({
        name: setting.name,
        setting: setting.setting
      });
      
      // If this is store customization and we have preserved About Us data, merge it
      if (setting.name === "storeCustomizationSetting" && preservedAboutUsData) {
        console.log('Merging preserved About Us data...');
        newSetting.setting.about_us = {
          ...newSetting.setting.about_us, // Default structure
          ...preservedAboutUsData // Preserved custom data
        };
      }
      
      await newSetting.save();
      console.log(`${setting.name} imported successfully!`);
    }
    
    console.log('Settings import completed with About Us data preservation!');
    process.exit(0);
  } catch (error) {
    console.error('Error importing settings:', error);
    process.exit(1);
  }
};

importSettings(); 