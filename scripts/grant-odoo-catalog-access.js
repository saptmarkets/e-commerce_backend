/*
  Grant all admins access to Odoo Catalog page ("odoo-catalog")
  Run once:
    node backend/scripts/grant-odoo-catalog-access.js
*/
require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

async function grantOdooCatalogAccess() {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Add "odoo-catalog" to all admin access_list arrays
    console.log("Adding 'odoo-catalog' access to all admins...");
    
    const result = await Admin.updateMany(
      {}, // Update all admins
      { 
        $addToSet: { 
          access_list: "odoo-catalog" 
        } 
      }
    );

    console.log(`✅ Successfully updated ${result.modifiedCount} admin records`);
    console.log(`Total admins checked: ${result.matchedCount}`);

    // Verify the update by showing a sample admin
    const sampleAdmin = await Admin.findOne({}).select('name email access_list');
    if (sampleAdmin) {
      console.log("\nSample admin access_list after update:");
      console.log(`Admin: ${sampleAdmin.name?.en || sampleAdmin.name} (${sampleAdmin.email})`);
      console.log(`Access List: ${JSON.stringify(sampleAdmin.access_list)}`);
    }

    console.log("\n🎉 Access granted! You can now access the Odoo Catalog page.");
    console.log("Please refresh your admin panel or log out and log back in.");

  } catch (error) {
    console.error("❌ Error granting access:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("Database connection closed");
    process.exit(0);
  }
}

// Run the script
grantOdooCatalogAccess(); 