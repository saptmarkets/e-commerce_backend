require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./models/Admin");
const bcrypt = require("bcryptjs");

const debugAdminLogin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000
    });
    console.log('MongoDB connected successfully!');

    // Search for admin accounts with different email variations
    const emailVariations = [
      'admin@gmail.com',
      'ADMIN@gmail.com',
      'Admin@gmail.com',
      'admin@GMAIL.com'
    ];

    console.log('\n=== SEARCHING FOR ADMIN ACCOUNTS ===');
    
    for (const email of emailVariations) {
      const admin = await Admin.findOne({ email: email });
      if (admin) {
        console.log(`✅ Found admin with email: ${email}`);
        console.log(`   Name: ${admin.name}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Status: ${admin.status}`);
        console.log(`   Password hash exists: ${admin.password ? 'Yes' : 'No'}`);
        console.log(`   Password length: ${admin.password ? admin.password.length : 0}`);
        
        // Test password if provided
        if (admin.password) {
          const testPassword = 'admin123'; // Common test password
          const isMatch = await bcrypt.compare(testPassword, admin.password);
          console.log(`   Test password 'admin123' matches: ${isMatch}`);
        }
      } else {
        console.log(`❌ No admin found with email: ${email}`);
      }
    }

    // Show all admin accounts
    console.log('\n=== ALL ADMIN ACCOUNTS ===');
    const allAdmins = await Admin.find({});
    console.log(`Total admins: ${allAdmins.length}`);
    allAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. Email: "${admin.email}", Name: "${admin.name}", Status: ${admin.status}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

debugAdminLogin(); 