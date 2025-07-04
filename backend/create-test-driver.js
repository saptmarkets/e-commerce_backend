require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { connectDB } = require("./config/db");
const Admin = require("./models/Admin");

async function createTestDriver() {
  try {
    console.log("🔗 Connecting to database...");
    await connectDB();
    
    // Check if driver already exists
    const existingDriver = await Admin.findOne({ 
      email: "driver@saptmarkets.com" 
    });
    
    if (existingDriver) {
      console.log("✅ Test driver already exists!");
      console.log(`📧 Email: ${existingDriver.email}`);
      console.log(`🚗 Role: ${existingDriver.role}`);
      console.log(`📱 Status: ${existingDriver.status}`);
      
      // Update password to driver123 if needed
      const hashedPassword = await bcrypt.hash("driver123", 12);
      existingDriver.password = hashedPassword;
      await existingDriver.save();
      console.log("🔐 Password updated to 'driver123'");
      
      process.exit(0);
    }
    
    console.log("👷 Creating test driver account...");
    
    // Create test driver
    const hashedPassword = await bcrypt.hash("driver123", 12);
    
    const testDriver = new Admin({
      name: {
        en: "Test Driver"
      },
      email: "driver@saptmarkets.com",
      password: hashedPassword,
      phone: "+8801234567890",
      role: "Driver",
      status: "Active",
      joiningData: new Date(),
      deliveryInfo: {
        vehicleType: "bike",
        vehicleNumber: "DH-TEST-123",
        licenseNumber: "DL123456789",
        phoneNumber: "+8801234567890",
        emergencyContact: {
          name: "Emergency Contact",
          phone: "+8801234567891"
        },
        workingHours: {
          start: "09:00",
          end: "18:00"
        },
        maxDeliveryRadius: 10,
        currentLocation: {
          latitude: 23.8103,
          longitude: 90.4125,
          lastUpdated: new Date()
        },
        isOnDuty: false,
        availability: "available"
      },
      deliveryStats: {
        totalDeliveries: 0,
        completedToday: 0,
        averageRating: 5.0,
        totalRatings: 0,
        successRate: 100,
        averageDeliveryTime: 0,
        totalEarnings: 0,
        earningsToday: 0
      }
    });
    
    await testDriver.save();
    
    console.log("✅ Test driver created successfully!");
    console.log("📧 Email: driver@saptmarkets.com");
    console.log("🔐 Password: driver123");
    console.log("🚗 Vehicle: Bike (DH-TEST-123)");
    console.log("📱 Status: Active");
    console.log("");
    console.log("🎉 You can now login to the mobile app with:");
    console.log("   Email: driver@saptmarkets.com");
    console.log("   Password: driver123");
    
  } catch (error) {
    console.error("❌ Error creating test driver:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
}

createTestDriver(); 