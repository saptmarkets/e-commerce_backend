require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./models/Admin");
const bcrypt = require("bcryptjs");

const testAdminLogin = async () => {
  try {
    console.log('Connecting to MongoDB cluster...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000
    });
    console.log('✅ MongoDB connected successfully!');

    // Test admin login credentials
    const email = 'admin@gmail.com';
    const password = '12345678';

    console.log('\n=== TESTING ADMIN LOGIN ===');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    // Find admin by email
    const admin = await Admin.findOne({ email: email });
    
    if (!admin) {
      console.log('❌ Admin not found with email:', email);
      
      // Show all admin accounts in database
      const allAdmins = await Admin.find({}).select('email name role status');
      console.log('\n=== EXISTING ADMIN ACCOUNTS ===');
      console.log(`Total admins: ${allAdmins.length}`);
      allAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. Email: "${admin.email}", Name: "${admin.name}", Role: ${admin.role}, Status: ${admin.status}`);
      });
      return;
    }

    console.log('✅ Admin found!');
    console.log('Name:', admin.name);
    console.log('Role:', admin.role);
    console.log('Status:', admin.status);
    console.log('Password hash exists:', !!admin.password);
    console.log('Password hash length:', admin.password ? admin.password.length : 0);

    // Test password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    console.log('Password valid:', isPasswordValid);

    if (isPasswordValid) {
      console.log('✅ Login credentials are correct!');
    } else {
      console.log('❌ Password is incorrect');
      
      // Test with different common passwords
      const commonPasswords = ['admin123', 'password', 'admin', '123456', 'password123'];
      console.log('\n=== TESTING COMMON PASSWORDS ===');
      for (const testPassword of commonPasswords) {
        const isValid = await bcrypt.compare(testPassword, admin.password);
        console.log(`Password "${testPassword}": ${isValid ? '✅ MATCH' : '❌'}`);
      }
    }

    // Check if admin has proper access
    console.log('\n=== ADMIN ACCESS CHECK ===');
    console.log('Access list:', admin.access_list ? admin.access_list.length : 0, 'permissions');
    if (admin.access_list) {
      console.log('Access permissions:', admin.access_list);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

testAdminLogin(); 