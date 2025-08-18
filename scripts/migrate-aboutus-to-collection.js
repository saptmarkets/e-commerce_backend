const { connectDB } = require("../config/db");
const Setting = require("../models/Setting");
const AboutUs = require("../models/AboutUs");

const migrateAboutUsToCollection = async () => {
  try {
    await connectDB();
    console.log('🔄 Starting About Us migration to dedicated collection...');
    
    // Find existing About Us data in settings
    const existingSettings = await Setting.findOne({ name: "storeCustomizationSetting" });
    
    if (!existingSettings || !existingSettings.setting.about_us) {
      console.log('ℹ️  No existing About Us data found in settings - nothing to migrate');
      process.exit(0);
    }
    
    const aboutUsData = existingSettings.setting.about_us;
    console.log('✅ Found existing About Us data in settings');
    console.log(`📊 Data includes ${Object.keys(aboutUsData).length} fields`);
    
    // Check if AboutUs collection already exists
    const existingAboutUs = await AboutUs.findOne({ name: 'aboutUs' });
    
    if (existingAboutUs) {
      console.log('⚠️  AboutUs collection already exists - merging data...');
      
      // Merge existing data with new data (new data takes precedence)
      const mergedData = {
        ...existingAboutUs.data,
        ...aboutUsData
      };
      
      await AboutUs.findOneAndUpdate(
        { name: 'aboutUs' },
        { $set: { data: mergedData } },
        { new: true }
      );
      
      console.log('✅ Data merged successfully');
    } else {
      console.log('🆕 Creating new AboutUs collection...');
      
      // Create new AboutUs document
      await AboutUs.create({
        name: 'aboutUs',
        data: aboutUsData
      });
      
      console.log('✅ AboutUs collection created successfully');
    }
    
    // Remove about_us from settings (optional - uncomment if you want to clean up)
    // await Setting.findOneAndUpdate(
    //   { name: "storeCustomizationSetting" },
    //   { $unset: { "setting.about_us": "" } }
    // );
    // console.log('🧹 Removed about_us from settings (optional cleanup)');
    
    console.log('🎉 Migration completed successfully!');
    console.log('📝 About Us data is now stored in dedicated AboutUs collection');
    console.log('🔄 Future updates will go to AboutUs collection, not settings');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateAboutUsToCollection(); 