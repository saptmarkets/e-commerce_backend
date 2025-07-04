require("dotenv").config();
const { connectDB } = require("../config/db");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");

const resetAdmin = async () => {
  try {
    await connectDB();
    
    // First delete all existing admins
    await Admin.deleteMany({});
    console.log('Deleted existing admins');

    const fullAccessList = [
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
      "customer-order"
    ];

    // Create new admin with full permissions
    const newAdmin = new Admin({
      name: {
        en: "Super Admin"
      },
      email: "admin@gmail.com",
      password: bcrypt.hashSync("12345678"),
      phone: "123456789",
      role: "Super Admin",
      status: "Active",
      access_list: fullAccessList,
      joiningData: new Date()
    });

    const savedAdmin = await newAdmin.save();
    console.log('New admin created:', savedAdmin.email);
    console.log('Admin reset successful!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin:', error);
    process.exit(1);
  }
}

resetAdmin(); 