const { connectDB } = require("../config/db");
const Setting = require("../models/Setting");
const AboutUs = require("../models/AboutUs");
const settingsData = require("../utils/settings.json");

const importSettings = async () => {
  try {
    await connectDB();
    
    console.log('Starting settings import with AboutUs collection protection...');
    
    // Check if AboutUs collection exists and preserve data
    let existingAboutUsData = null;
    try {
      const existingAboutUs = await AboutUs.findOne({ name: 'aboutUs' });
      if (existingAboutUs && existingAboutUs.data) {
        console.log('✅ Found existing AboutUs collection data - preserving...');
        existingAboutUsData = existingAboutUs.data;
      }
    } catch (err) {
      console.log('ℹ️  AboutUs collection not found yet - will be created');
    }
    
    // Preserve existing About Us customization data from settings (legacy)
    const existingStoreCustomization = await Setting.findOne({ name: "storeCustomizationSetting" });
    let preservedAboutUsData = null;
    
    if (existingStoreCustomization && existingStoreCustomization.setting.about_us) {
      console.log('✅ Found legacy About Us data in settings - preserving...');
      preservedAboutUsData = existingStoreCustomization.setting.about_us;
    }
    
    // Delete existing settings (but NOT AboutUs collection)
    await Setting.deleteMany({});
    console.log('✅ Deleted existing settings (preserved AboutUs collection)');

    // Import new settings
    for (const setting of settingsData) {
      const newSetting = new Setting({
        name: setting.name,
        setting: setting.setting
      });
      
      await newSetting.save();
      console.log(`✅ ${setting.name} imported successfully!`);
    }
    
    // Handle AboutUs collection - create or update with preserved data
    if (existingAboutUsData || preservedAboutUsData) {
      const finalAboutUsData = {
        ...existingAboutUsData,
        ...preservedAboutUsData
      };
      
      await AboutUs.findOneAndUpdate(
        { name: 'aboutUs' },
        { $set: { data: finalAboutUsData } },
        { new: true, upsert: true }
      );
      console.log('✅ AboutUs collection updated with preserved data');
    } else {
      console.log('ℹ️  No existing About Us data found - AboutUs collection will be empty initially');
    }
    
    console.log('🎉 Settings import completed successfully!');
    console.log('📝 AboutUs collection is protected and separate from settings');
    console.log('🔄 Future About Us updates will go to AboutUs collection, not settings');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing settings:', error);
    process.exit(1);
  }
};

importSettings(); 