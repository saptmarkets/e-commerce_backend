const { connectDB } = require("../config/db");
const Setting = require("../models/Setting");
const StoreCustomization = require("../models/StoreCustomization");

const checkSettings = async () => {
  try {
    await connectDB();
    
    console.log('\nChecking Settings collection:');
    const settings = await Setting.find({});
    console.log('Total settings found:', settings.length);
    settings.forEach(setting => {
      console.log('\nSetting name:', setting.name);
      console.log('Setting data:', JSON.stringify(setting, null, 2));
    });

    console.log('\nChecking StoreCustomization collection:');
    const storeCustomizations = await StoreCustomization.find({});
    console.log('Total store customizations found:', storeCustomizations.length);
    storeCustomizations.forEach(customization => {
      console.log('\nCustomization data:', JSON.stringify(customization, null, 2));
    });

    process.exit(0);
  } catch (error) {
    console.error('Error checking settings:', error);
    process.exit(1);
  }
};

checkSettings(); 