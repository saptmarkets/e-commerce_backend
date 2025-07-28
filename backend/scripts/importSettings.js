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
      const newSetting = new Setting({
        name: setting.name,
        setting: setting.setting
      });
      await newSetting.save();
      console.log(`${setting.name} imported successfully!`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error importing settings:', error);
    process.exit(1);
  }
};

importSettings(); 