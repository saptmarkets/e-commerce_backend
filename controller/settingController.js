//models
const Setting = require("../models/Setting");

//global setting controller
const addGlobalSetting = async (req, res) => {
  try {
    const newGlobalSetting = new Setting(req.body);
    await newGlobalSetting.save();
    res.send({
      message: "Global Setting Added Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getGlobalSetting = async (req, res) => {
  try {
    // console.log("getGlobalSetting");

    const globalSetting = await Setting.findOne({ name: "globalSetting" });
    res.send(globalSetting.setting);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateGlobalSetting = async (req, res) => {
  try {
    const { setting } = req.body;

    // Construct the $set object dynamically
    const setObject = Object.keys(setting).reduce((acc, key) => {
      acc[`setting.${key}`] = setting[key];
      return acc;
    }, {});

    const globalSetting = await Setting.findOneAndUpdate(
      { name: "globalSetting" },
      { $set: setObject },
      { new: true, upsert: true }
    );

    res.send({
      data: globalSetting,
      message: "Global Setting Update Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

//store setting controller
const addStoreSetting = async (req, res) => {
  try {
    const newStoreSetting = new Setting(req.body);
    await newStoreSetting.save();
    res.send({
      message: "Store Setting Added Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getStoreSetting = async (req, res) => {
  try {
    // console.log("getStoreSetting");

    const storeSetting = await Setting.findOne({ name: "storeSetting" });
    res.send(storeSetting.setting);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateStoreSetting = async (req, res) => {
  try {
    const { setting } = req.body;

    // Dynamically build the update fields
    const updateFields = Object.keys(setting).reduce((acc, key) => {
      acc[`setting.${key}`] = setting[key];
      return acc;
    }, {});
    // Update the online store setting document
    const storeSetting = await Setting.findOneAndUpdate(
      { name: "storeSetting" },
      { $set: updateFields },
      { new: true, upsert: true } // upsert to create the document if it doesn't exist
    );

    res.send({
      data: storeSetting,
      message: "Store Setting Update Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

//online store customization controller
const addStoreCustomizationSetting = async (req, res) => {
  try {
    const newStoreCustomizationSetting = new Setting(req.body);
    const storeCustomizationSetting = await newStoreCustomizationSetting.save();

    res.send({
      data: storeCustomizationSetting,
      message: "Online Store Customization Setting Added Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getStoreCustomizationSetting = async (req, res) => {
  try {
    const { key, keyTwo } = req.query;
    console.log("🔍 getStoreCustomizationSetting - Query params:", { key, keyTwo });

    let projection = {};
    if (key) {
      projection[`setting.${key}`] = 1;
    }
    if (keyTwo) {
      projection[`setting.${keyTwo}`] = 1;
    }

    // If neither key nor keyTwo is provided, fetch all settings
    if (!key && !keyTwo) {
      projection = { setting: 1 };
    }

    console.log("🔍 getStoreCustomizationSetting - Projection:", projection);

    const storeCustomizationSetting = await Setting.findOne(
      { name: "storeCustomizationSetting" },
      projection
    );

    if (!storeCustomizationSetting) {
      console.log("❌ getStoreCustomizationSetting - Settings not found");
      return res.status(404).send({ message: "Settings not found" });
    }

    console.log("✅ getStoreCustomizationSetting - Successfully fetched data");
    console.log("🔍 getStoreCustomizationSetting - About Us data:", JSON.stringify(storeCustomizationSetting.setting?.about_us, null, 2));

    res.send(storeCustomizationSetting.setting);
  } catch (err) {
    console.error("❌ getStoreCustomizationSetting - Error:", err.message);
    res.status(500).send({ message: err.message });
  }
};

const getStoreSeoSetting = async (req, res) => {
  // console.log("getStoreSeoSetting");
  try {
    const storeCustomizationSetting = await Setting.findOne(
      {
        name: "storeCustomizationSetting",
      },
      { "setting.seo": 1, _id: 0 }
    );
    // console.log("storeCustomizationSetting", storeCustomizationSetting);
    res.send(storeCustomizationSetting?.setting);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateStoreCustomizationSetting = async (req, res) => {
  try {
    const { setting } = req.body;

    // Log the incoming data for debugging
    console.log("🔍 updateStoreCustomizationSetting - Incoming data:", JSON.stringify(setting, null, 2));

    // Dynamically build the update fields
    const updateFields = Object.keys(setting).reduce((acc, key) => {
      acc[`setting.${key}`] = setting[key];
      return acc;
    }, {});

    console.log("🔍 updateStoreCustomizationSetting - Update fields:", JSON.stringify(updateFields, null, 2));
    
    // Update the online store setting document
    const storeCustomizationSetting = await Setting.findOneAndUpdate(
      { name: "storeCustomizationSetting" },
      { $set: updateFields },
      { new: true, upsert: true } // upsert to create the document if it doesn't exist
    );

    console.log("✅ updateStoreCustomizationSetting - Successfully updated");

    res.send({
      data: storeCustomizationSetting,
      message: "Online Store Customization Setting Update Successfully!",
    });
  } catch (err) {
    console.error("❌ updateStoreCustomizationSetting - Error:", err.message);
    res.status(500).send({
      message: err.message,
    });
  }
};

module.exports = {
  addGlobalSetting,
  getGlobalSetting,
  updateGlobalSetting,
  addStoreSetting,
  getStoreSetting,
  updateStoreSetting,
  getStoreSeoSetting,
  addStoreCustomizationSetting,
  getStoreCustomizationSetting,
  updateStoreCustomizationSetting,
};
