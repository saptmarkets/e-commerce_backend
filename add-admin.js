require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./models/Admin");
const bcrypt = require("bcryptjs");

const addAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000
    });
    console.log('MongoDB connected successfully!');

    const email = 'admin@gmail.com';
    const password = '12345678';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email });
    if (existingAdmin) {
      console.log('Admin already exists. Updating password...');
      existingAdmin.password = await bcrypt.hash(password, 10);
      await existingAdmin.save();
      console.log('✅ Admin password updated successfully!');
    } else {
      // Create new admin with correct structure
      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = new Admin({
        name: {
          en: "Admin"
        },
        email: email,
        password: hashedPassword,
        role: "Super Admin",
        status: "Active",
        phone: "360-943-7332",
        image: "https://i.ibb.co/WpM5yZZ/9.png",
        joiningData: new Date(),
        access_list: [
          "dashboard",
          "products",
          "product",
          "categories",
          "attributes",
          "coupons",
          "orders",
          "order",
          "our-staff",
          "settings",
          "languages",
          "currencies",
          "store",
          "customization",
          "store-settings",
          "notifications",
          "edit-profile",
          "coming-soon",
          "customers",
          "customer-order",
          "promotions",
        ]
      });
      
      await newAdmin.save();
      console.log('✅ New admin account created successfully!');
    }

    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Email: admin@gmail.com');
    console.log('Password: 12345678');

  } catch (error) {
    console.log('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

addAdmin(); 