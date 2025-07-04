require("dotenv").config();
const { connectDB } = require("../config/db");
const Admin = require("../models/Admin");

const updateAdmin = async () => {
  try {
    await connectDB();
    
    const fullAccessList = [
      "dashboard",
      "products",
      "product",
      "categories",
      "attributes",
      "coupons",
      "promotions",
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

    const result = await Admin.updateOne(
      { email: "admin@gmail.com" },
      { 
        $set: {
          role: "Super Admin",
          status: "Active",
          access_list: fullAccessList
        }
      }
    );

    console.log('Admin update result:', result);
    console.log('Admin permissions updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin:', error);
    process.exit(1);
  }
}

updateAdmin(); 