const { connectDB } = require("../config/db");
const Admin = require("../models/Admin");

const updateAdmin = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Full access list including both units and promotions
    const fullAccessList = [
      "dashboard",
      "products",
      "product",
      "categories",
      "attributes",
      "units",
      "promotions",
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

    // Update super admin with full access
    const superAdminResult = await Admin.updateOne(
      { email: "admin@gmail.com" },
      { 
        $set: {
          role: "Super Admin",
          status: "Active",
          access_list: fullAccessList
        }
      }
    );

    console.log('Super admin update result:', superAdminResult);
    
    // Update all other admins to include units and promotions
    const result = await Admin.updateMany(
      { email: { $ne: "admin@gmail.com" } },
      { 
        $addToSet: { 
          access_list: { 
            $each: ['units', 'promotions'] 
          } 
        } 
      }
    );
    
    console.log(`Updated ${result.nModified} regular admin records`);
    
    // Get all admins after update
    const admins = await Admin.find({});
    console.log('Admin access lists after update:');
    admins.forEach(admin => {
      console.log(`${admin.email} (${admin.role}): ${admin.access_list ? admin.access_list.join(', ') : 'No access list'}`);
    });
    
    console.log('Admin permissions updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin:', error);
    process.exit(1);
  }
}

// Run the function
updateAdmin(); 